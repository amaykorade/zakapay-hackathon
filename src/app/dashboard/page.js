'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }
      const data = await response.json();
      setCollections(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (paise) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PENDING': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return '✅';
      case 'PARTIAL': return '⏳';
      case 'PENDING': return '⏸️';
      case 'CANCELLED': return '❌';
      default: return '⏸️';
    }
  };

  // Collection Card Component
  const CollectionCard = ({ collection }) => {
    const paidCount = collection.links?.filter(l => l.status === 'PAID').length || 0;
    const totalCount = collection.numPayers;
    const progressPercentage = (paidCount / totalCount) * 100;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1 mr-2">{collection.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(collection.status)}`}>
              {collection.status}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div>
              <p className="text-gray-600">Amount</p>
              <p className="font-bold text-gray-900">{formatAmount(collection.totalAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">People</p>
              <p className="font-bold text-gray-900">{collection.numPayers}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-3 py-2 bg-gray-50">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{paidCount}/{totalCount} paid</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                collection.status === 'COMPLETED' ? 'bg-green-500' :
                collection.status === 'PARTIAL' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Payment Links */}
        <div className="p-3">
          <div className="space-y-1.5">
            {collection.links?.slice(0, 2).map((link, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{link.name}</p>
                  <p className="text-xs text-gray-600">{formatAmount(link.shareAmount)}</p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    link.status === 'PAID' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {link.status}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(link.link)}
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                    title="Copy link"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {collection.links?.length > 2 && (
              <p className="text-xs text-gray-500 text-center py-1">
                +{collection.links.length - 2} more
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
            <span className="font-mono">{collection.id.slice(0, 6)}...</span>
          </div>
        </div>
      </div>
    );
  };

  // Calculate statistics
  const totalCollections = collections.length;
  const completedCollections = collections.filter(c => c.status === 'COMPLETED').length;
  const totalAmount = collections.reduce((sum, c) => sum + c.totalAmount, 0);
  const paidAmount = collections.reduce((sum, c) => {
    const paidPayers = c.links?.filter(l => l.status === 'PAID').length || 0;
    const totalPayers = c.numPayers;
    return sum + (c.totalAmount * paidPayers / totalPayers);
  }, 0);

  // Filter collections based on active tab
  const getFilteredCollections = () => {
    switch (activeTab) {
      case 'pending':
        return collections.filter(c => c.status === 'PENDING');
      case 'partial':
        return collections.filter(c => c.status === 'PARTIAL');
      case 'completed':
        return collections.filter(c => c.status === 'COMPLETED');
      case 'cancelled':
        return collections.filter(c => c.status === 'CANCELLED');
      default:
        return collections;
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'all', label: 'All Payments', count: totalCollections, icon: '📊', color: 'gray' },
    { id: 'pending', label: 'Pending', count: collections.filter(c => c.status === 'PENDING').length, icon: '⏳', color: 'gray' },
    { id: 'partial', label: 'Partial', count: collections.filter(c => c.status === 'PARTIAL').length, icon: '⚡', color: 'yellow' },
    { id: 'completed', label: 'Completed', count: collections.filter(c => c.status === 'COMPLETED').length, icon: '✅', color: 'green' },
    { id: 'cancelled', label: 'Cancelled', count: collections.filter(c => c.status === 'CANCELLED').length, icon: '❌', color: 'red' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage your split payment collections</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{totalCollections}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-lg font-bold text-gray-900">{completedCollections}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">{formatAmount(totalAmount)}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Collected</p>
                <p className="text-lg font-bold text-gray-900">{formatAmount(paidAmount)}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-600 text-white font-semibold rounded-lg hover:from-gray-900 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Collection
            </Link>
            <button
              onClick={fetchCollections}
              className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Payment Tabs */}
        {collections.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No collections yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first split payment collection to get started. It only takes a few clicks!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-600 text-white font-semibold rounded-lg hover:from-gray-900 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Collection
            </Link>
          </div>
        ) : (
          <div>
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? `bg-white text-gray-900 shadow-sm border border-gray-200`
                        : `text-gray-600 hover:text-gray-900 hover:bg-gray-50`
                    }`}
                  >
                    <span className="mr-2 text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        activeTab === tab.id
                          ? `bg-gray-100 text-gray-700`
                          : `bg-gray-200 text-gray-600`
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {getFilteredCollections().length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} payments
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'all' 
                      ? 'Create your first payment collection to get started!'
                      : `You don't have any ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} payments yet.`
                    }
                  </p>
                  {activeTab === 'all' && (
                    <Link
                      href="/create"
                      className="inline-flex items-center px-6 py-3 mt-4 bg-gradient-to-r from-gray-800 to-gray-600 text-white font-semibold rounded-lg hover:from-gray-900 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Payment
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {getFilteredCollections().map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
