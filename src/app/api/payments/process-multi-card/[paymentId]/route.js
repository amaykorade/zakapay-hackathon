import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import stripe from '../../../../../lib/stripe';

export async function POST(req, { params }) {
  try {
    const { paymentId } = params;

    // Get the parent payment with allocations
    const parentPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        paymentAllocations: {
          include: {
            paymentMethod: true
          }
        },
        payer: {
          include: {
            collection: true
          }
        }
      }
    });

    if (!parentPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (parentPayment.status === 'SUCCEEDED') {
      return NextResponse.json({ 
        allCompleted: true, 
        message: 'Payment already completed' 
      });
    }

    // Process each allocation
    const results = [];
    let allSuccessful = true;

    for (const allocation of parentPayment.paymentAllocations) {
      try {
        let result;
        
        switch (allocation.paymentMethod.provider) {
          case 'stripe':
            result = await processStripePayment(allocation, parentPayment);
            break;
          case 'paypal':
            result = await processPayPalPayment(allocation, parentPayment);
            break;
          case 'venmo':
            result = await processVenmoPayment(allocation, parentPayment);
            break;
          case 'upi':
            result = await processUPIPayment(allocation, parentPayment);
            break;
          default:
            throw new Error(`Unsupported payment provider: ${allocation.paymentMethod.provider}`);
        }

        // Update allocation status
        await prisma.paymentAllocation.update({
          where: { id: allocation.id },
          data: {
            status: result.success ? 'SUCCEEDED' : 'FAILED',
            providerRef: result.providerRef
          }
        });

        results.push({
          allocationId: allocation.id,
          method: allocation.paymentMethod.name,
          success: result.success,
          error: result.error
        });

        if (!result.success) {
          allSuccessful = false;
        }

      } catch (error) {
        console.error(`Error processing allocation ${allocation.id}:`, error);
        
        await prisma.paymentAllocation.update({
          where: { id: allocation.id },
          data: { status: 'FAILED' }
        });

        results.push({
          allocationId: allocation.id,
          method: allocation.paymentMethod.name,
          success: false,
          error: error.message
        });

        allSuccessful = false;
      }
    }

    // Update parent payment status
    const finalStatus = allSuccessful ? 'SUCCEEDED' : 'FAILED';
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: finalStatus }
    });

    // If all payments succeeded, update payer status
    if (allSuccessful) {
      await prisma.payer.update({
        where: { id: parentPayment.payerId },
        data: { status: 'PAID' }
      });

      // Check if all payers in the collection are paid
      const unpaidPayers = await prisma.payer.count({
        where: {
          collectionId: parentPayment.collectionId,
          status: 'UNPAID'
        }
      });

      // Update collection status
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

    return NextResponse.json({
      allCompleted: allSuccessful,
      results: results,
      message: allSuccessful ? 'All payments processed successfully' : 'Some payments failed'
    });

  } catch (error) {
    console.error('Multi-card payment processing error:', error);
    return NextResponse.json({ error: 'Failed to process multi-card payments' }, { status: 500 });
  }
}

// Payment processor functions
async function processStripePayment(allocation, parentPayment) {
  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: allocation.amount,
      currency: parentPayment.payer.collection.currency.toLowerCase(),
      metadata: {
        allocationId: allocation.id,
        paymentId: parentPayment.id,
        payerId: parentPayment.payerId
      }
    });

    // For now, we'll simulate success - in real implementation, you'd handle the payment flow
    return {
      success: true,
      providerRef: paymentIntent.id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function processPayPalPayment(allocation, parentPayment) {
  // Placeholder for PayPal integration
  return {
    success: false,
    error: 'PayPal integration not implemented yet'
  };
}

async function processVenmoPayment(allocation, parentPayment) {
  // Placeholder for Venmo integration
  return {
    success: false,
    error: 'Venmo integration not implemented yet'
  };
}

async function processUPIPayment(allocation, parentPayment) {
  // Placeholder for UPI integration
  return {
    success: false,
    error: 'UPI integration not implemented yet'
  };
}
