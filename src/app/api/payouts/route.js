import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/payouts - Get all pending payouts for a user
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get collections created by this user
    const collections = await prisma.collection.findMany({
      where: { creatorId: userId },
      include: {
        payers: {
          where: { status: 'PAID' },
          include: {
            payments: {
              where: { status: 'SUCCEEDED' }
            }
          }
        }
      }
    });

    // Calculate total amount owed to each payer
    const payouts = [];
    collections.forEach(collection => {
      collection.payers.forEach(payer => {
        const totalPaid = payer.payments.reduce((sum, payment) => sum + payment.amount, 0);
        if (totalPaid > 0) {
          payouts.push({
            payerId: payer.id,
            payerName: payer.name,
            payerEmail: payer.email,
            amount: totalPaid,
            collectionTitle: collection.title,
            collectionId: collection.id,
            status: 'PENDING' // You can add payout status tracking
          });
        }
      });
    });

    return NextResponse.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/payouts - Mark payout as completed
export async function POST(req) {
  try {
    const { payerId, payoutMethod, payoutReference } = await req.json();

    if (!payerId || !payoutMethod) {
      return NextResponse.json({ error: 'Payer ID and payout method are required' }, { status: 400 });
    }

    // Here you would typically:
    // 1. Create a payout record in your database
    // 2. Send money via the chosen method
    // 3. Update the status

    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Payout marked as completed',
      payoutReference: payoutReference || `PAYOUT-${Date.now()}`
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
