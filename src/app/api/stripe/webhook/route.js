import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  console.log('Webhook received:', { 
    signature: signature ? 'present' : 'missing',
    bodyLength: body.length,
    bodyPreview: body.substring(0, 200) + '...'
  });

  let event;

  try {
    // For testing, parse the event directly without signature verification
    if (process.env.NODE_ENV === 'development') {
      event = JSON.parse(body);
      console.log('Webhook event type (dev mode):', event.type);
    } else {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('Webhook event type:', event.type);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    // In development, try to parse as JSON anyway
    if (process.env.NODE_ENV === 'development') {
      try {
        event = JSON.parse(body);
        console.log('Webhook event type (dev fallback):', event.type);
      } catch (parseErr) {
        console.error('Failed to parse webhook body:', parseErr.message);
        return NextResponse.json({ error: 'Invalid webhook body' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session) {
  console.log('Processing checkout.session.completed:', session.id);
  const { payerId, collectionId, payerSlug } = session.metadata;

  if (!payerId || !collectionId) {
    console.error('Missing metadata in checkout session:', session.metadata);
    return;
  }

  console.log('Updating payer:', payerId, 'in collection:', collectionId);

  // Update payer status to PAID
  await prisma.payer.update({
    where: { id: payerId },
    data: { status: 'PAID' }
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      provider: 'stripe',
      providerRef: session.payment_intent,
      amount: session.amount_total,
      status: 'SUCCEEDED',
      payerId: payerId,
      collectionId: collectionId,
    }
  });

  // Check if all payers in the collection are paid
  const unpaidPayers = await prisma.payer.count({
    where: {
      collectionId: collectionId,
      status: 'UNPAID'
    }
  });

  // Update collection status
  if (unpaidPayers === 0) {
    await prisma.collection.update({
      where: { id: collectionId },
      data: { status: 'COMPLETED' }
    });
  } else {
    await prisma.collection.update({
      where: { id: collectionId },
      data: { status: 'PARTIAL' }
    });
  }

  console.log(`Payment completed for payer ${payerId} in collection ${collectionId}`);
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Check if this is part of a multi-card payment
  const allocationId = paymentIntent.metadata?.allocationId;
  if (allocationId) {
    // Update the specific allocation
    await prisma.paymentAllocation.update({
      where: { id: allocationId },
      data: {
        status: 'SUCCEEDED',
        providerRef: paymentIntent.id
      }
    });

    // Check if all allocations for this payment are completed
    const parentPaymentId = paymentIntent.metadata?.paymentId;
    if (parentPaymentId) {
      const remainingAllocations = await prisma.paymentAllocation.count({
        where: {
          paymentId: parentPaymentId,
          status: 'PENDING'
        }
      });

      if (remainingAllocations === 0) {
        // All allocations completed, update parent payment and payer status
        await prisma.payment.update({
          where: { id: parentPaymentId },
          data: { status: 'SUCCEEDED' }
        });

        const parentPayment = await prisma.payment.findUnique({
          where: { id: parentPaymentId },
          include: { payer: true }
        });

        if (parentPayment) {
          await prisma.payer.update({
            where: { id: parentPayment.payerId },
            data: { status: 'PAID' }
          });

          // Update collection status
          const unpaidPayers = await prisma.payer.count({
            where: {
              collectionId: parentPayment.collectionId,
              status: 'UNPAID'
            }
          });

          if (unpaidPayers === 0) {
            await prisma.collection.update({
              where: { id: parentPayment.collectionId },
              data: { status: 'COMPLETED' }
            });
          } else {
            await prisma.collection.update({
              where: { id: parentPayment.collectionId },
              data: { status: 'PARTIAL' }
            });
          }
        }
      }
    }
  }
}

async function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  // Additional logic if needed
}
