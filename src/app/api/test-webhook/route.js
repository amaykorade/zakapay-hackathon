import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  return NextResponse.json({
    message: 'Webhook received',
    hasSignature: !!signature,
    bodyLength: body.length,
    timestamp: new Date().toISOString()
  });
}
