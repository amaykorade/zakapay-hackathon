import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const { payerSlug, allocations, paymentMethods } = await req.json();

    if (!payerSlug || !allocations || !paymentMethods) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get payer details
    const payer = await prisma.payer.findUnique({
      where: { payLinkSlug: payerSlug },
      include: { collection: true }
    });

    if (!payer) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    if (payer.status === 'PAID') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 400 });
    }

    // Validate allocations
    const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
    if (totalAllocated !== payer.shareAmount) {
      return NextResponse.json({ 
        error: `Total allocation (${totalAllocated}) must equal share amount (${payer.shareAmount})` 
      }, { status: 400 });
    }

    // Create parent payment record
    const parentPayment = await prisma.payment.create({
      data: {
        provider: 'multi-card',
        amount: payer.shareAmount,
        status: 'PENDING',
        payerId: payer.id,
        collectionId: payer.collectionId,
        isMultiCard: true,
      }
    });

    // Create payment allocations
    const paymentAllocations = [];
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
          const allocation = await prisma.paymentAllocation.create({
            data: {
              paymentId: parentPayment.id,
              paymentMethodId: paymentMethod.id,
              amount: amount,
              status: 'PENDING',
            }
          });

          paymentAllocations.push(allocation);
        }
      }
    }

    return NextResponse.json({
      paymentId: parentPayment.id,
      allocations: paymentAllocations,
      message: 'Multi-card payment created successfully'
    });

  } catch (error) {
    console.error('Multi-card payment creation error:', error);
    return NextResponse.json({ error: 'Failed to create multi-card payment' }, { status: 500 });
  }
}
