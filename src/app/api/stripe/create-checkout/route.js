import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const { payerSlug } = await req.json();

    if (!payerSlug) {
      return NextResponse.json({ error: 'Payer slug is required' }, { status: 400 });
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: payer.collection.currency.toLowerCase(),
            product_data: {
              name: payer.collection.title,
              description: `Payment for ${payer.name} - Split payment`,
            },
            unit_amount: payer.shareAmount, // Amount in paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${payerSlug}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${payerSlug}?canceled=true`,
      metadata: {
        payerId: payer.id,
        collectionId: payer.collectionId,
        payerSlug: payerSlug,
      },
    });

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
