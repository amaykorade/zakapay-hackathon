import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ZakaPay
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Simple Split Payments - Easily split bills and invoices among multiple people. 
            Generate unique payment links and track payments in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-900 transition-colors shadow-lg"
            >
              Create Split Payment
            </Link>
            <Link
              href="/dashboard"
              className="bg-white text-gray-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Split Any Amount</h3>
            <p className="text-gray-600">
              Enter any amount and split it equally or custom among multiple people. 
              Perfect for group expenses, service payments, or shared costs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unique Payment Links</h3>
            <p className="text-gray-600">
              Each person gets their own secure payment link. No confusion, 
              no manual tracking - just send the link and get paid.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
            <p className="text-gray-600">
              Monitor payment status in real-time. See who has paid, 
              who hasn&apos;t, and get notified when all payments are complete.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-800 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Create Collection</h4>
              <p className="text-sm text-gray-600">Enter amount and number of payers</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-800 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Get Links</h4>
              <p className="text-sm text-gray-600">Receive unique payment links for each person</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-800 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Share Links</h4>
              <p className="text-sm text-gray-600">Send payment links to respective payers</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-800 font-bold">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Track Payments</h4>
              <p className="text-sm text-gray-600">Monitor real-time payment status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
