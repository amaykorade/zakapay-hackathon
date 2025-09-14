'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function PayoutDashboard() {
  const { data: session } = useSession();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutReference, setPayoutReference] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchPayouts();
    }
  }, [session]);

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`/api/payouts?userId=${session.user.id}`);
      const data = await response.json();
      setPayouts(data);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (payout) => {
    if (!payoutMethod || !payoutReference) {
      alert('Please fill in payout method and reference');
      return;
    }

    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerId: payout.payerId,
          payoutMethod,
          payoutReference
        })
      });

      if (response.ok) {
        alert('Payout marked as completed!');
        setSelectedPayout(null);
        setPayoutMethod('');
        setPayoutReference('');
        fetchPayouts();
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Error processing payout');
    }
  };

  const formatAmount = (paise) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Payouts</h2>
        <p className="text-gray-600 mb-6">
          These are payments that need to be sent to your friends. 
          Once you send the money, mark it as completed.
        </p>

        {payouts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending payouts</h3>
            <p className="text-gray-600">All payments have been processed!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{payout.payerName}</h3>
                    <p className="text-sm text-gray-600">{payout.collectionTitle}</p>
                    {payout.payerEmail && (
                      <p className="text-sm text-gray-500">{payout.payerEmail}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {formatAmount(payout.amount)}
                    </div>
                    <button
                      onClick={() => setSelectedPayout(payout)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Process Payout
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Process Payout for {selectedPayout.payerName}
            </h3>
            <p className="text-gray-600 mb-4">
              Amount: <span className="font-bold">{formatAmount(selectedPayout.amount)}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="venmo">Venmo</option>
                  <option value="cash_app">Cash App</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference/Transaction ID
                </label>
                <input
                  type="text"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  placeholder="e.g., Transaction ID, Venmo username, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedPayout(null);
                  setPayoutMethod('');
                  setPayoutReference('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayout(selectedPayout)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
