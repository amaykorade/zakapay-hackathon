import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        payers: {
          select: {
            id: true,
            name: true,
            email: true,
            shareAmount: true,
            status: true,
            payLinkSlug: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            payers: true,
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to include payment links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const collectionsWithLinks = collections.map(collection => ({
      id: collection.id,
      title: collection.title,
      totalAmount: collection.totalAmount,
      currency: collection.currency,
      numPayers: collection.numPayers,
      status: collection.status,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      creator: collection.creator,
      links: collection.payers.map(payer => ({
        name: payer.name,
        email: payer.email,
        shareAmount: payer.shareAmount,
        status: payer.status,
        link: `${baseUrl}/pay/${payer.payLinkSlug}`
      }))
    }));

    return NextResponse.json(collectionsWithLinks);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      title, 
      totalAmount, 
      numPayers, 
      payerNames = [], 
      payerEmails = [], 
      creatorEmail,
      paymentMode = 'split',
      allocations = {},
      paymentMethods = []
    } = body || {};

    if (!title || !totalAmount || !numPayers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Amounts in paise; ensure integers
    const totalPaise = Number(totalAmount);
    if (!Number.isInteger(totalPaise) || totalPaise <= 0) {
      return NextResponse.json({ error: 'totalAmount must be positive integer (paise)' }, { status: 400 });
    }

    const n = Number(numPayers);
    if (!Number.isInteger(n) || n <= 0 || n > 100) {
      return NextResponse.json({ error: 'numPayers must be integer between 1 and 100' }, { status: 400 });
    }

    // Split equally; distribute remainder to first few
    const baseShare = Math.floor(totalPaise / n);
    const remainder = totalPaise % n;

    const creator = creatorEmail
      ? await prisma.user.upsert({
          where: { email: creatorEmail },
          update: {},
          create: { email: creatorEmail, name: creatorEmail.split('@')[0] },
        })
      : null;

    // Create collection first
    const created = await prisma.collection.create({
      data: {
        title: String(title).slice(0, 100),
        totalAmount: totalPaise,
        numPayers: n,
        currency: 'INR',
        creatorId: creator?.id || null,
      },
    });

    let payersData = [];

    if (paymentMode === 'self-pay') {
      // For self-pay mode, create a single payer (the creator) with the full amount
      const slug = await createUniquePayerSlug();
      payersData = [{
        name: creator?.name || 'Self Payment',
        email: creator?.email || creatorEmail,
        shareAmount: totalPaise,
        payLinkSlug: slug,
        collectionId: created.id,
      }];

      // Create the payer
      await prisma.payer.createMany({ data: payersData });

      // Create multi-card payment if allocations are provided
      if (Object.keys(allocations).length > 0) {
        const payer = await prisma.payer.findFirst({ where: { collectionId: created.id } });
        
        // Create parent payment record
        const parentPayment = await prisma.payment.create({
          data: {
            provider: 'multi-card',
            amount: totalPaise,
            status: 'PENDING',
            payerId: payer.id,
            collectionId: created.id,
            isMultiCard: true,
          }
        });

        // Create payment allocations
        for (const [methodId, amount] of Object.entries(allocations)) {
          if (amount > 0) {
            const method = paymentMethods.find(m => m.id === methodId);
            if (method) {
              // Create or find payment method
              let paymentMethod = await prisma.paymentMethod.findFirst({
                where: {
                  name: method.name,
                  provider: method.provider
                }
              });

              if (!paymentMethod) {
                paymentMethod = await prisma.paymentMethod.create({
                  data: {
                    name: method.name,
                    type: method.type,
                    provider: method.provider,
                  }
                });
              }

              // Create payment allocation
              await prisma.paymentAllocation.create({
                data: {
                  paymentId: parentPayment.id,
                  paymentMethodId: paymentMethod.id,
                  amount: Math.round(amount * 100), // Convert to paise
                  status: 'PENDING',
                }
              });
            }
          }
        }
      }
    } else {
      // Regular split payment mode
      payersData = await Promise.all(
        Array.from({ length: n }).map(async (_, i) => {
          const share = baseShare + (i < remainder ? 1 : 0);
          const name = payerNames[i] || `Payer ${i + 1}`;
          const email = payerEmails[i] || null;
          const slug = await createUniquePayerSlug();
          return {
            name,
            email,
            shareAmount: share,
            payLinkSlug: slug,
            collectionId: created.id,
          };
        })
      );

      await prisma.payer.createMany({ data: payersData });
    }

    // Fetch the created payers
    const payers = await prisma.payer.findMany({ 
      where: { collectionId: created.id }, 
      orderBy: { createdAt: 'asc' } 
    });

    const collection = { created, payers };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const links = collection.payers.map((p) => ({
      name: p.name,
      email: p.email,
      shareAmount: p.shareAmount,
      status: p.status,
      link: `${baseUrl}/pay/${p.payLinkSlug}`,
    }));

    return NextResponse.json({
      collectionId: collection.created.id,
      title,
      totalAmount: totalPaise,
      numPayers: n,
      currency: 'INR',
      links,
    });
  } catch (err) {
    console.error('Create collection error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createUniquePayerSlug() {
  // Try up to 5 times to avoid collisions
  for (let i = 0; i < 5; i++) {
    const candidate = generateSlugCandidate('pay');
    const existing = await prisma.payer.findUnique({ where: { payLinkSlug: candidate } });
    if (!existing) return candidate;
  }
  // Fallback with timestamp
  return generateSlugCandidate(`pay-${Date.now()}`);
}

function generateSlugCandidate(prefix = "pay") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}