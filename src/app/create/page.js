'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateCollection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    totalAmount: '',
    numPayers: 2,
    payerNames: ['', ''],
    payerEmails: ['', ''],
    creatorEmail: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayerChange = (index, field, value) => {
    const newPayers = [...formData.payerNames];
    const newEmails = [...formData.payerEmails];
    
    if (field === 'name') {
      newPayers[index] = value;
    } else if (field === 'email') {
      newEmails[index] = value;
    }
    
    setFormData(prev => ({
      ...prev,
      payerNames: newPayers,
      payerEmails: newEmails
    }));
  };

  const handleNumPayersChange = (e) => {
    const num = parseInt(e.target.value) || 2;
    const newNames = Array.from({ length: num }, (_, i) => formData.payerNames[i] || `Payer ${i + 1}`);
    const newEmails = Array.from({ length: num }, (_, i) => formData.payerEmails[i] || '');
    
    setFormData(prev => ({
      ...prev,
      numPayers: num,
      payerNames: newNames,
      payerEmails: newEmails
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          totalAmount: Math.round(parseFloat(formData.totalAmount) * 100) // Convert to paise
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create collection');
      }

      setSuccess(data);
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (paise) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Split Payment</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Split a bill or invoice among multiple people. Generate unique payment links and track payments in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white mb-2">Payment Details</h2>
                <p className="text-blue-100">Enter the details for your split payment</p>
              </div>

              <div className="p-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-800 font-medium">Error: {error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Details */}
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-3">
                        Payment Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., Service Payment, Group Dinner, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="totalAmount" className="block text-sm font-semibold text-gray-700 mb-3">
                          Total Amount (₹) *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-lg font-medium">₹</span>
                          </div>
                          <input
                            type="number"
                            id="totalAmount"
                            name="totalAmount"
                            value={formData.totalAmount}
                            onChange={handleInputChange}
                            required
                            min="0.01"
                            step="0.01"
                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                            placeholder="1000.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="numPayers" className="block text-sm font-semibold text-gray-700 mb-3">
                          Number of Payers *
                        </label>
                        <input
                          type="number"
                          id="numPayers"
                          name="numPayers"
                          value={formData.numPayers}
                          onChange={handleNumPayersChange}
                          required
                          min="1"
                          max="100"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="creatorEmail" className="block text-sm font-semibold text-gray-700 mb-3">
                        Your Email (optional)
                      </label>
                      <input
                        type="email"
                        id="creatorEmail"
                        name="creatorEmail"
                        value={formData.creatorEmail}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* Payer Details */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Payer Details
                    </h3>
                    <div className="space-y-6">
                      {Array.from({ length: formData.numPayers }).map((_, index) => (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                              {index + 1}
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900">Payer {index + 1}</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name *
                              </label>
                              <input
                                type="text"
                                value={formData.payerNames[index] || ''}
                                onChange={(e) => handlePayerChange(index, 'name', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                                placeholder={`Payer ${index + 1}`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email (optional)
                              </label>
                              <input
                                type="email"
                                value={formData.payerEmails[index] || ''}
                                onChange={(e) => handlePayerChange(index, 'email', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                                placeholder="payer@email.com"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          Creating Payment...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Split Payment
                        </span>
                      )}
                    </button>
                    
                    <Link
                      href="/dashboard"
                      className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-center"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Success Panel */}
          {success && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Success!
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Collection Created!</h4>
                    <p className="text-gray-600">Redirecting to dashboard in 3 seconds...</p>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Payment Links:</h5>
                    {success.links?.map((link, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{link.name}</p>
                            <p className="text-sm text-gray-600">{formatAmount(link.shareAmount)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            link.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {link.status}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(link.link);
                            // You could add a toast notification here
                          }}
                          className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Copy Link
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Link
                      href="/dashboard"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-center block"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Panel */}
          {!success && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">How it works</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Create Collection</h4>
                        <p className="text-sm text-gray-600">Enter amount and number of payers</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Get Links</h4>
                        <p className="text-sm text-gray-600">Receive unique payment links for each person</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Share Links</h4>
                        <p className="text-sm text-gray-600">Send payment links to respective payers</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Track Payments</h4>
                        <p className="text-sm text-gray-600">Monitor real-time payment status</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h5>
                    <p className="text-sm text-blue-800">
                      You can always view and manage your collections from the dashboard after creating them.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
