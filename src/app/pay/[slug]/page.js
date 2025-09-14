'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Toast from '../../../components/Toast';

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [payer, setPayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentMode, setPaymentMode] = useState('single'); // 'single' or 'multi'
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [toast, setToast] = useState({ show: false, message: '' });

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
      
      // Initialize allocations with default payment methods
      const defaultMethods = [
        { id: 'stripe-card', name: 'Credit/Debit Card', type: 'CREDIT_CARD', provider: 'stripe' },
        { id: 'paypal', name: 'PayPal', type: 'DIGITAL_WALLET', provider: 'paypal' },
        { id: 'venmo', name: 'Venmo', type: 'DIGITAL_WALLET', provider: 'venmo' },
        { id: 'upi', name: 'UPI', type: 'UPI', provider: 'upi' }
      ];
      setPaymentMethods(defaultMethods);
      
      // Initialize allocations with equal distribution
      const totalAmount = data.shareAmount;
      const methodCount = defaultMethods.length;
      const baseAmount = Math.floor(totalAmount / methodCount);
      const remainder = totalAmount % methodCount;
      
      const initialAllocations = {};
      defaultMethods.forEach((method, index) => {
        initialAllocations[method.id] = baseAmount + (index < remainder ? 1 : 0);
      });
      setAllocations(initialAllocations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ show: true, message: 'Link copied!' });
    } catch (err) {
      console.error('Failed to copy: ', err);
      setToast({ show: true, message: 'Failed to copy link' });
    }
  };

  const closeToast = () => {
    setToast({ show: false, message: '' });
  };

  const cancelPayment = async () => {
    // Add confirmation dialog
    if (!confirm('Are you sure you want to cancel this payment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          payerId: payer.id, 
          collectionId: payer.collectionId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel payment');
      }

      setToast({ show: true, message: 'Payment cancelled successfully' });
      setPaymentStatus('cancelled');
    } catch (err) {
      console.error('Error cancelling payment:', err);
      setToast({ show: true, message: 'Failed to cancel payment' });
    }
  };

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    try {
      if (paymentMode === 'single') {
        // Single payment (existing functionality)
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
      } else {
        // Multi-card payment
        const response = await fetch('/api/payments/create-multi-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            payerSlug: params.slug,
            allocations: allocations,
            paymentMethods: paymentMethods
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create multi-card payment');
        }

        // Handle multi-card payment flow
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          // Process payments sequentially
          await processMultiCardPayments(data.paymentId);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
      setPaymentStatus('pending');
    }
  };

  const processMultiCardPayments = async (paymentId) => {
    try {
      const response = await fetch(`/api/payments/process-multi-card/${paymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process multi-card payments');
      }

      if (data.allCompleted) {
        setPaymentStatus('success');
      } else {
        setError('Some payments failed. Please try again.');
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('Multi-card payment error:', error);
      setError(error.message);
      setPaymentStatus('pending');
    }
  };

  const updateAllocation = (methodId, amount) => {
    setAllocations(prev => ({
      ...prev,
      [methodId]: Math.max(0, amount)
    }));
  };

  const getTotalAllocated = () => {
    return Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
  };

  const getRemainingAmount = () => {
    return payer ? payer.shareAmount - getTotalAllocated() : 0;
  };

  const formatAmount = (paise) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ZakaPay</h1>
          <p className="text-gray-600 text-lg">Secure Split Payment</p>
        </div>

        {/* Main Payment Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Payment Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white mb-1">{payer.collection.title}</h2>
            <p className="text-gray-200 text-sm">Payment Request</p>
            
            {/* Payment Status Indicator */}
            <div className="mt-3 flex items-center justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                payer.status === 'PAID' 
                  ? 'bg-green-100 text-green-800' 
                  : payer.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {payer.status === 'PAID' ? '✓ Paid' : 
                 payer.status === 'CANCELLED' ? '✗ Cancelled' : 
                 '⏳ Pending'}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6">
            {/* Amount Section */}
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                <p className="text-gray-600 text-sm font-medium mb-2">Your Payment Amount</p>
                <div className="text-4xl font-bold text-gray-900">{formatAmount(payer.shareAmount)}</div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm font-medium mb-1">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">{formatAmount(payer.collection.totalAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm font-medium mb-1">Split Between</p>
                <p className="text-lg font-bold text-gray-900">{payer.collection.numPayers} people</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-sm font-medium">
                Payment for: <span className="font-bold text-gray-900">{payer.name}</span>
                {payer.email && <span className="text-gray-500"> ({payer.email})</span>}
              </p>
            </div>

            {payer.status === 'PAID' ? (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Payment Completed!</h3>
                <p className="text-green-700 font-medium">Thank you for your payment</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Payment Mode Selection */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Payment Method</h3>
                    <p className="text-gray-600 font-medium">Select how you'd like to make your payment</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => setPaymentMode('single')}
                      className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                        paymentMode === 'single'
                          ? 'border-gray-800 bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-md bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          paymentMode === 'single' 
                            ? 'bg-white bg-opacity-20' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-lg font-bold">Single Payment</h4>
                          <p className="text-sm opacity-80">Pay with one card or method</p>
                        </div>
                        {paymentMode === 'single' && (
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMode('multi')}
                      className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                        paymentMode === 'multi'
                          ? 'border-gray-800 bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-md bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          paymentMode === 'multi' 
                            ? 'bg-white bg-opacity-20' 
                            : 'bg-gradient-to-r from-purple-500 to-purple-600'
                        }`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-lg font-bold">Split Payment</h4>
                          <p className="text-sm opacity-80">Use multiple cards or methods</p>
                        </div>
                        {paymentMode === 'multi' && (
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Multi-Card Allocation Interface */}
                {paymentMode === 'multi' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Allocate Your Payment</h3>
                      <p className="text-gray-600">Distribute your payment across different payment methods</p>
                    </div>
                    
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                method.provider === 'stripe' ? 'bg-blue-100' :
                                method.provider === 'paypal' ? 'bg-yellow-100' :
                                method.provider === 'venmo' ? 'bg-green-100' :
                                'bg-purple-100'
                              }`}>
                                {method.provider === 'stripe' ? (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                ) : method.provider === 'paypal' ? (
                                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.543-.676c-.95-1.08-2.293-1.634-4.012-1.634H8.24c-.524 0-.968.382-1.05.9L5.035 19.552h4.59c.524 0 .968-.382 1.05-.9l1.12-7.106h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437.292-1.867-.002-3.137-1.012-4.287z"/>
                                  </svg>
                                ) : method.provider === 'venmo' ? (
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.5 3h-15A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3zM12 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{method.name}</h4>
                                <p className="text-xs text-gray-500 capitalize">{method.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">
                                {formatAmount(allocations[method.id] || 0)}
                              </div>
                              <div className="text-sm font-semibold text-gray-700">
                                {payer?.shareAmount ? `${(((allocations[method.id] || 0) / payer.shareAmount) * 100).toFixed(1)}%` : '0%'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Amount (₹)
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">₹</span>
                              </div>
                              <input
                                type="number"
                                value={allocations[method.id] || 0}
                                onChange={(e) => updateAllocation(method.id, parseInt(e.target.value) || 0)}
                                className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium placeholder-gray-400 bg-white"
                                placeholder="0"
                                min="0"
                                max={payer?.shareAmount || 0}
                              />
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: payer?.shareAmount ? 
                                    `${Math.min(((allocations[method.id] || 0) / payer.shareAmount) * 100, 100)}%` : 
                                    '0%' 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Allocation Summary */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900">Payment Summary</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getRemainingAmount() === 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {getRemainingAmount() === 0 ? '✓ Complete' : 'Incomplete'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-gray-900">{formatAmount(getTotalAllocated())}</div>
                          <div className="text-sm font-semibold text-gray-700">Allocated</div>
                        </div>
                        <div>
                          <div className={`text-xl font-bold ${getRemainingAmount() === 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(getRemainingAmount())}
                          </div>
                          <div className="text-sm font-semibold text-gray-700">Remaining</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900">{formatAmount(payer?.shareAmount || 0)}</div>
                          <div className="text-sm font-semibold text-gray-700">Total</div>
                        </div>
                      </div>
                      
                      {getRemainingAmount() !== 0 && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-red-700">
                              Please allocate the exact amount: <span className="font-semibold">{formatAmount(payer?.shareAmount || 0)}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Button */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePayment}
                      disabled={paymentStatus === 'processing' || (paymentMode === 'multi' && getRemainingAmount() !== 0) || (payer && (payer.status === 'PAID' || payer.status === 'CANCELLED'))}
                      className="flex-1 bg-gradient-to-r from-gray-800 to-gray-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-gray-900 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {paymentStatus === 'processing' ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          Processing Payment...
                        </span>
                      ) : paymentStatus === 'success' ? (
                        'Payment Successful!'
                      ) : paymentStatus === 'cancelled' || (payer && payer.status === 'CANCELLED') ? (
                        'Payment Cancelled'
                      ) : payer && payer.status === 'PAID' ? (
                        'Payment Successful!'
                      ) : (
                        `Pay ${formatAmount(payer.shareAmount)}`
                      )}
                    </button>
                    
                    {(paymentStatus === 'pending' || (payer && payer.status === 'UNPAID')) && (
                      <button
                        onClick={cancelPayment}
                        className="px-6 py-4 bg-red-500 text-white rounded-xl font-bold text-lg hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                        title="Cancel this payment"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {(paymentStatus === 'success' || (payer && payer.status === 'PAID')) && (
                    <div className="mt-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h3>
                      <p className="text-green-700 font-medium">Your payment has been processed successfully</p>
                    </div>
                  )}

                  {(paymentStatus === 'cancelled' || (payer && payer.status === 'CANCELLED')) && (
                    <div className="mt-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 text-center">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-red-800 mb-2">Payment Cancelled</h3>
                      <p className="text-red-700 font-medium">This payment has been cancelled</p>
                    </div>
                  )}

                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Secure payment processing</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">Powered by ZakaPay</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        onClose={closeToast} 
      />
    </div>
  );
}
