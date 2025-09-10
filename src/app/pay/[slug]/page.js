'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [payer, setPayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  useEffect(() => {
    if (params.slug) {
      fetchPayerData(params.slug);
    }
  }, [params.slug]);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      setPaymentStatus('success');
    } else if (canceled === 'true') {
      setError('Payment was canceled. You can try again.');
    }
  }, [searchParams]);

  const fetchPayerData = async (slug) => {
    try {
      const response = await fetch(`/api/payers/${slug}`);
      if (!response.ok) {
        throw new Error('Payer not found');
      }
      const data = await response.json();
      setPayer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payerSlug: params.slug }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
      setPaymentStatus('pending');
    }
  };

  const formatAmount = (paise) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Link Not Found</h1>
          <p className="text-gray-600">This payment link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (!payer) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ZakaPay</h1>
          <p className="text-gray-600">Split Payment Request</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-gray-900 mb-2">{payer.collection.title}</h2>
            <p className="text-sm text-gray-600">You owe: <span className="font-bold text-lg">{formatAmount(payer.shareAmount)}</span></p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Your share:</span>
              <span className="font-semibold">{formatAmount(payer.shareAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total amount:</span>
              <span className="font-semibold">{formatAmount(payer.collection.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Split between:</span>
              <span className="font-semibold">{payer.collection.numPayers} people</span>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Payment for: <span className="font-medium">{payer.name}</span>
              {payer.email && <span className="text-gray-500"> ({payer.email})</span>}
            </p>

            {payer.status === 'PAID' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-green-600 text-4xl mb-2">✓</div>
                <p className="text-green-800 font-semibold">Payment Completed</p>
                <p className="text-green-600 text-sm">Thank you for your payment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handlePayment}
                  disabled={paymentStatus === 'processing'}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {paymentStatus === 'processing' ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : paymentStatus === 'success' ? (
                    'Payment Successful!'
                  ) : (
                    `Pay ${formatAmount(payer.shareAmount)}`
                  )}
                </button>

                {paymentStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-green-600 text-4xl mb-2">✓</div>
                    <p className="text-green-800 font-semibold">Payment Successful!</p>
                    <p className="text-green-600 text-sm">Your payment has been processed.</p>
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center">
                  <p>Secure payment processing</p>
                  <p>Powered by ZakaPay</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
