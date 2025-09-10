import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const payer = await prisma.payer.findUnique({
      where: { payLinkSlug: slug },
      include: {
        collection: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!payer) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    // Check if payer has any successful payments
    const hasSuccessfulPayment = payer.payments.some(p => p.status === 'SUCCEEDED');
    if (hasSuccessfulPayment) {
      payer.status = 'PAID';
    }

    return NextResponse.json(payer);
  } catch (error) {
    console.error('Error fetching payer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
