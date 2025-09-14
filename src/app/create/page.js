'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '../../components/AuthGuard';

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
    payerAmounts: [0, 0], // Custom amounts for each payer
    splitType: 'equal', // 'equal' or 'custom'
    creatorEmail: '',
    paymentMode: 'split', // 'split' or 'self-pay'
    paymentMethods: [],
    allocations: {}
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentModeChange = (mode) => {
    setFormData(prev => ({
      ...prev,
      paymentMode: mode,
      numPayers: mode === 'self-pay' ? 1 : prev.numPayers
    }));

    // Initialize payment methods for self-pay mode
    if (mode === 'self-pay') {
       const defaultMethods = [
         { id: 'stripe-card', name: 'Credit/Debit Card', type: 'CREDIT_CARD', provider: 'stripe' },
         { id: 'paypal', name: 'PayPal', type: 'DIGITAL_WALLET', provider: 'paypal' },
         { id: 'vemo', name: 'Vemo', type: 'DIGITAL_WALLET', provider: 'vemo' },
         { id: 'upi', name: 'UPI', type: 'UPI', provider: 'upi' }
       ];
      
      setFormData(prev => ({
        ...prev,
        paymentMethods: defaultMethods,
        allocations: {}
      }));
    }
  };

  const updateAllocation = (methodId, amount) => {
    setFormData(prev => ({
      ...prev,
      allocations: {
        ...prev.allocations,
        [methodId]: Math.max(0, amount)
      }
    }));
  };

  const autoFillRemaining = () => {
    const remaining = getRemainingAmount();
    if (remaining > 0) {
      // Find the first payment method with zero allocation
      const firstEmptyMethod = formData.paymentMethods.find(method => !formData.allocations[method.id] || formData.allocations[method.id] === 0);
      if (firstEmptyMethod) {
        updateAllocation(firstEmptyMethod.id, remaining);
      }
    }
  };

  const getTotalAllocated = () => {
    return Object.values(formData.allocations).reduce((sum, amount) => sum + amount, 0);
  };

  const getRemainingAmount = () => {
    const totalAmount = parseFloat(formData.totalAmount) || 0;
    return totalAmount - getTotalAllocated();
  };

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.totalAmount && formData.paymentMode;
      case 2:
        if (formData.paymentMode === 'self-pay') {
          return getRemainingAmount() === 0;
        }
        if (formData.paymentMode === 'split') {
          const namesValid = formData.payerNames.every(name => name.trim());
          if (formData.splitType === 'custom') {
            const amountsValid = Math.abs(getCustomRemainingAmount()) < 0.01; // Allow small rounding differences
            return namesValid && amountsValid;
          }
          return namesValid;
        }
        return true;
      case 3:
        return true;
      default:
        return false;
    }
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
    const newAmounts = Array.from({ length: num }, (_, i) => formData.payerAmounts[i] || 0);
    
    setFormData(prev => ({
      ...prev,
      numPayers: num,
      payerNames: newNames,
      payerEmails: newEmails,
      payerAmounts: newAmounts
    }));
  };

  const handleSplitTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      splitType: type,
      payerAmounts: type === 'equal' ? 
        Array.from({ length: prev.numPayers }, () => 0) : 
        prev.payerAmounts
    }));
  };

  const handlePayerAmountChange = (index, amount) => {
    const newAmounts = [...formData.payerAmounts];
    newAmounts[index] = parseFloat(amount) || 0;
    setFormData(prev => ({
      ...prev,
      payerAmounts: newAmounts
    }));
  };

  const getEqualAmount = () => {
    return formData.totalAmount ? parseFloat(formData.totalAmount) / formData.numPayers : 0;
  };

  const getCustomTotal = () => {
    return formData.payerAmounts.reduce((sum, amount) => sum + amount, 0);
  };

  const getCustomRemainingAmount = () => {
    const total = parseFloat(formData.totalAmount) || 0;
    const customTotal = getCustomTotal();
    return total - customTotal;
  };

  const autoFillRemainingCustom = () => {
    const remaining = getCustomRemainingAmount();
    if (remaining > 0) {
      const newAmounts = [...formData.payerAmounts];
      const firstEmptyIndex = newAmounts.findIndex(amount => amount === 0);
      if (firstEmptyIndex !== -1) {
        newAmounts[firstEmptyIndex] = remaining;
        setFormData(prev => ({
          ...prev,
          payerAmounts: newAmounts
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
       // Validate self-pay mode allocations
       if (formData.paymentMode === 'self-pay') {
         if (getRemainingAmount() !== 0) {
           throw new Error('Please allocate the exact amount across payment methods');
         }
       }

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
         body: JSON.stringify({
           ...formData,
           totalAmount: Math.round(parseFloat(formData.totalAmount) * 100), // Convert to paise
           payerAmounts: formData.splitType === 'custom' ? 
             formData.payerAmounts.map(amount => Math.round(amount * 100)) : 
             null,
           paymentMode: formData.paymentMode,
           allocations: formData.paymentMode === 'self-pay' ? Object.fromEntries(
             Object.entries(formData.allocations).map(([key, value]) => [key, Math.round(value * 100)])
           ) : null,
           paymentMethods: formData.paymentMode === 'self-pay' ? formData.paymentMethods : null
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

  const formatRupeeAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Payment</h1>
          <p className="text-gray-600">Choose how you want to handle your payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Step Progress */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-600 px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-white">Payment Details</h2>
                  <div className="text-gray-100 text-sm">
                    Step {currentStep} of {totalSteps}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-white h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
                
                {/* Step Indicators */}
                <div className="flex justify-between mt-3">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step <= currentStep 
                          ? 'bg-white text-gray-800' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {step}
                      </div>
                      <div className="text-xs text-gray-200 mt-1">
                        {step === 1 ? 'Basic' : step === 2 ? 'Setup' : 'Review'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Step 1: Basic Details */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Basic Information</h3>
                        <p className="text-sm text-gray-600">Tell us about your payment</p>
                      </div>

                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Title *
                        </label>
                         <input
                           type="text"
                           id="title"
                           name="title"
                           value={formData.title}
                           onChange={handleInputChange}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 font-medium placeholder-gray-400 bg-white"
                           placeholder="e.g., Dinner with friends, Rent split, etc."
                           required
                         />
                      </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                             Total Amount *
                           </label>
                           <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <span className="text-gray-600 font-medium">₹</span>
                             </div>
                             <input
                               type="number"
                               id="totalAmount"
                               name="totalAmount"
                               value={formData.totalAmount}
                               onChange={handleInputChange}
                               className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 font-medium placeholder-gray-400 bg-white"
                               placeholder="0.00"
                               min="0"
                               step="0.01"
                               required
                             />
                           </div>
                           {formData.totalAmount && (
                             <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                               <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium text-gray-700">Formatted Amount:</span>
                                 <span className="text-base font-bold text-gray-900">
                                   {formatRupeeAmount(formData.totalAmount)}
                                 </span>
                               </div>
                             </div>
                           )}
                         </div>

                         <div>
                           <label htmlFor="numPayers" className="block text-sm font-medium text-gray-700 mb-2">
                             Number of People *
                           </label>
                           <input
                             type="number"
                             id="numPayers"
                             name="numPayers"
                             value={formData.numPayers}
                             onChange={handleNumPayersChange}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 font-medium placeholder-gray-400 bg-white"
                             min="1"
                             max="20"
                             required
                           />
                         </div>
                       </div>

                       <div>
                         <label htmlFor="creatorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                           Your Email (optional)
                         </label>
                         <input
                           type="email"
                           id="creatorEmail"
                           name="creatorEmail"
                           value={formData.creatorEmail}
                           onChange={handleInputChange}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 font-medium placeholder-gray-400 bg-white"
                           placeholder="your@email.com"
                         />
                       </div>
                    </div>
                  )}


                  {/* Step 2: Payment Mode Selection */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Payment Setup</h3>
                        <p className="text-sm text-gray-600">Choose how you want to handle the payment</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => handlePaymentModeChange('split')}
                          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                            formData.paymentMode === 'split'
                              ? 'border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 shadow-lg'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:shadow-md bg-white'
                          }`}
                        >
                          <div className="text-center">
                            <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <h4 className="text-base font-bold mb-1">Split with Friends</h4>
                            <p className="text-xs text-gray-500">Perfect for group expenses</p>
                          </div>
                          {formData.paymentMode === 'split' && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePaymentModeChange('self-pay')}
                          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                            formData.paymentMode === 'self-pay'
                              ? 'border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 shadow-lg'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:shadow-md bg-white'
                          }`}
                        >
                          <div className="text-center">
                            <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                             <h4 className="text-base font-bold mb-1">Pay with Multiple Cards</h4>
                             <p className="text-xs text-gray-500">Use multiple payment methods</p>
                             <div className="mt-2 space-y-1">
                               <div className="flex items-center text-xs text-gray-600">
                                 <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                 </svg>
                                 No account required
                               </div>
                               <div className="flex items-center text-xs text-gray-600">
                                 <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                 </svg>
                                 Secure payment processing
                               </div>
                               <div className="flex items-center text-xs text-gray-600">
                                 <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                 </svg>
                                 Multiple secure checkouts
                               </div>
                             </div>
                          </div>
                          {formData.paymentMode === 'self-pay' && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>

                      {/* Multi-card allocation for self-pay mode */}
                      {formData.paymentMode === 'self-pay' && (
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">Allocate Payment</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {formData.paymentMethods.map((method) => (
                              <div key={method.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                               <div className="flex items-center justify-between mb-2">
                                 <div className="flex items-center space-x-2">
                                   <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                     method.provider === 'stripe' ? 'bg-blue-100' :
                                     method.provider === 'paypal' ? 'bg-yellow-100' :
                                     method.provider === 'vemo' ? 'bg-green-100' :
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
                                     ) : method.provider === 'vemo' ? (
                                       <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                         <path d="M19.5 3h-15A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3zM12 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/>
                                       </svg>
                                     ) : (
                                       <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                       </svg>
                                     )}
                                   </div>
                                   <span className="font-medium text-gray-900">{method.name}</span>
                                 </div>
                                 <span className="text-base font-bold text-gray-900">
                                   {formatRupeeAmount(formData.allocations[method.id] || 0)}
                                 </span>
                               </div>
                                 <input
                                   type="number"
                                   value={formData.allocations[method.id] || 0}
                                   onChange={(e) => updateAllocation(method.id, parseFloat(e.target.value) || 0)}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium placeholder-gray-400 bg-white"
                                   placeholder="0.00"
                                   min="0"
                                   step="0.01"
                                   max={formData.totalAmount || 0}
                                 />
                              </div>
                            ))}
                          </div>
                           <div className="bg-gray-100 p-3 rounded-lg">
                             <div className="flex justify-between text-sm">
                               <span className="font-medium text-gray-700">Total Allocated:</span>
                               <span className="font-bold text-gray-900 text-base">{formatRupeeAmount(getTotalAllocated())}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                               <span className="font-medium text-gray-700">Remaining:</span>
                               <span className={`font-bold text-base ${getRemainingAmount() === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {formatRupeeAmount(getRemainingAmount())}
                               </span>
                             </div>
                             <div className="flex justify-between text-sm mt-1 pt-2 border-t border-gray-300">
                               <span className="font-semibold text-gray-800">Total Amount:</span>
                               <span className="font-bold text-gray-900 text-lg">{formatRupeeAmount(formData.totalAmount)}</span>
                             </div>
                             {getRemainingAmount() > 0 && (
                               <div className="mt-3 pt-2 border-t border-gray-300">
                                 <button
                                   type="button"
                                   onClick={autoFillRemaining}
                                   className="w-full px-3 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
                                 >
                                   Auto-fill remaining {formatRupeeAmount(getRemainingAmount())}
                                 </button>
                               </div>
                             )}
                             
                             {/* Payment Method Info */}
                             <div className="mt-3 pt-2 border-t border-gray-300">
                               <div className="bg-blue-50 rounded-lg p-3">
                                 <div className="flex items-start space-x-2">
                                   <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   </svg>
                                   <div>
                                     <h5 className="text-sm font-medium text-blue-900">How Multi-Card Payment Works</h5>
                                     <p className="text-xs text-blue-700 mt-1">
                                       You&apos;ll be redirected to secure payment pages for each card. No need to create accounts - just enter your card details when prompted.
                                     </p>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>
                        </div>
                      )}

                      {/* Payer details for split mode */}
                      {formData.paymentMode === 'split' && (
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">Add People</h4>
                          
                          {/* Split Type Selection */}
                          <div className="space-y-3">
                            <h5 className="text-md font-medium text-gray-700">How would you like to split the amount?</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => handleSplitTypeChange('equal')}
                                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                  formData.splitType === 'equal'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="text-2xl mb-1">⚖️</div>
                                  <div className="font-medium">Equal Split</div>
                                  <div className="text-xs opacity-75">Divide equally</div>
                                </div>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleSplitTypeChange('custom')}
                                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                  formData.splitType === 'custom'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="text-2xl mb-1">✏️</div>
                                  <div className="font-medium">Custom Split</div>
                                  <div className="text-xs opacity-75">Set custom amounts</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {Array.from({ length: formData.numPayers }).map((_, index) => (
                              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                 <div className="flex items-center justify-between mb-3">
                                   <h5 className="font-medium text-gray-900">Person {index + 1}</h5>
                                   <span className="text-base font-bold text-gray-900">
                                     {formData.splitType === 'equal' 
                                       ? (formData.totalAmount ? formatRupeeAmount(parseFloat(formData.totalAmount) / formData.numPayers) : '₹0.00')
                                       : formatRupeeAmount(formData.payerAmounts[index] || 0)
                                     }
                                   </span>
                                 </div>
                                <div className={`grid gap-3 ${formData.splitType === 'custom' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                                   <input
                                     type="text"
                                     value={formData.payerNames[index] || ''}
                                     onChange={(e) => handlePayerChange(index, 'name', e.target.value)}
                                     className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-400 bg-white"
                                     placeholder="Full name"
                                   />
                                   <input
                                     type="email"
                                     value={formData.payerEmails[index] || ''}
                                     onChange={(e) => handlePayerChange(index, 'email', e.target.value)}
                                     className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-400 bg-white"
                                     placeholder="Email (optional)"
                                   />
                                   {formData.splitType === 'custom' && (
                                     <div className="relative">
                                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                         <span className="text-gray-600 font-medium">₹</span>
                                       </div>
                                       <input
                                         type="number"
                                         value={formData.payerAmounts[index] || ''}
                                         onChange={(e) => handlePayerAmountChange(index, e.target.value)}
                                         className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-400 bg-white"
                                         placeholder="0.00"
                                         min="0"
                                         step="0.01"
                                         max={formData.totalAmount || 0}
                                       />
                                     </div>
                                   )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Custom Split Summary */}
                          {formData.splitType === 'custom' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold text-blue-900">Split Summary</h5>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  Math.abs(getCustomRemainingAmount()) < 0.01 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {Math.abs(getCustomRemainingAmount()) < 0.01 ? '✓ Complete' : 'Incomplete'}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-lg font-bold text-blue-900">{formatRupeeAmount(getCustomTotal())}</div>
                                  <div className="text-sm font-semibold text-blue-700">Allocated</div>
                                </div>
                                <div>
                                  <div className={`text-lg font-bold ${Math.abs(getCustomRemainingAmount()) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatRupeeAmount(getCustomRemainingAmount())}
                                  </div>
                                  <div className="text-sm font-semibold text-blue-700">Remaining</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-blue-900">{formatRupeeAmount(formData.totalAmount)}</div>
                                  <div className="text-sm font-semibold text-blue-700">Total</div>
                                </div>
                              </div>
                              
                              {Math.abs(getCustomRemainingAmount()) > 0.01 && (
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                  <button
                                    type="button"
                                    onClick={autoFillRemainingCustom}
                                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    Auto-fill remaining {formatRupeeAmount(getCustomRemainingAmount())}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Review & Submit */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Review & Create</h3>
                        <p className="text-sm text-gray-600">Review your payment details before creating</p>
                      </div>

                       <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                         <div className="flex justify-between items-center">
                           <span className="font-semibold text-gray-900">Payment Title:</span>
                           <span className="text-gray-700">{formData.title}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="font-semibold text-gray-900">Total Amount:</span>
                           <span className="text-gray-900 font-bold text-lg">{formatRupeeAmount(formData.totalAmount)}</span>
                         </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">Payment Mode:</span>
                          <span className="text-gray-700">
                            {formData.paymentMode === 'split' ? 'Split with Friends' : 'Pay with Multiple Cards'}
                          </span>
                        </div>
                        {formData.paymentMode === 'split' && (
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Number of People:</span>
                            <span className="text-gray-700">{formData.numPayers}</span>
                          </div>
                        )}
                        {formData.creatorEmail && (
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Your Email:</span>
                            <span className="text-gray-700">{formData.creatorEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                   )}

                   {/* Step Navigation */}
                   <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                     <button
                       type="button"
                       onClick={prevStep}
                       disabled={currentStep === 1}
                       className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                     >
                       Previous
                     </button>
                     
                     <div className="flex space-x-2">
                       {[1, 2, 3].map((step) => (
                         <div
                           key={step}
                           className={`w-3 h-3 rounded-full ${
                             step <= currentStep ? 'bg-gray-800' : 'bg-gray-300'
                           }`}
                         />
                       ))}
                     </div>
                     
                     {currentStep < totalSteps ? (
                       <button
                         type="button"
                         onClick={nextStep}
                         disabled={!canProceedToNext()}
                         className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                       >
                         Next
                       </button>
                     ) : (
                       <button
                         type="submit"
                         disabled={loading || (formData.paymentMode === 'self-pay' && getRemainingAmount() !== 0)}
                         className="px-8 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                       >
                         {loading ? 'Creating...' : 'Create Payment'}
                       </button>
                     )}
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
                          className="w-full text-gray-800 hover:text-gray-900 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Copy Link
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Link
                      href="/dashboard"
                      className="w-full bg-gradient-to-r from-gray-800 to-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-gray-900 hover:to-gray-700 transition-all duration-200 text-center block"
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
                <div className="bg-gradient-to-r from-gray-800 to-gray-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">How it works</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Create Collection</h4>
                        <p className="text-sm text-gray-600">Enter amount and number of payers</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Get Links</h4>
                        <p className="text-sm text-gray-600">Receive unique payment links for each person</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Share Links</h4>
                        <p className="text-sm text-gray-600">Send payment links to respective payers</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Track Payments</h4>
                        <p className="text-sm text-gray-600">Monitor real-time payment status</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-2">💡 Pro Tip</h5>
                    <p className="text-sm text-gray-800">
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
    </AuthGuard>
  );
}
