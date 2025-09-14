import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { payerId, collectionId } = body;

    console.log('Cancel payment request:', { payerId, collectionId });

    if (!payerId || !collectionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the payer exists and is unpaid
    const payer = await prisma.payer.findFirst({
      where: {
        id: payerId,
        collectionId: collectionId,
        status: 'UNPAID'
      },
      include: {
        collection: true
      }
    });

    if (!payer) {
      console.log('Payer not found:', { payerId, collectionId });
      return NextResponse.json({ error: 'Payer not found or already processed' }, { status: 404 });
    }

    console.log('Found payer:', payer);

    // Update payer status to CANCELLED
    const updatedPayer = await prisma.payer.update({
      where: { id: payerId },
      data: { status: 'CANCELLED' }
    });

    // Check if all payers are now either PAID or CANCELLED
    const remainingPayers = await prisma.payer.findMany({
      where: {
        collectionId: collectionId,
        status: 'UNPAID'
      }
    });

    // If no pending payers remain, update collection status
    if (remainingPayers.length === 0) {
      const paidPayers = await prisma.payer.findMany({
        where: {
          collectionId: collectionId,
          status: 'PAID'
        }
      });

      let newCollectionStatus = 'CANCELLED';
      if (paidPayers.length > 0) {
        newCollectionStatus = 'PARTIAL';
      }

      await prisma.collection.update({
        where: { id: collectionId },
        data: { status: newCollectionStatus }
      });
    }

    return NextResponse.json({ 
      message: 'Payment cancelled successfully',
      payer: updatedPayer
    });

  } catch (error) {
    console.error('Error cancelling payment:', error);
    return NextResponse.json({ error: 'Failed to cancel payment' }, { status: 500 });
  }
}
