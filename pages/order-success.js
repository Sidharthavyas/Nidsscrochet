import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, ShoppingBag, ArrowRight, Package } from 'lucide-react';

export default function OrderSuccess() {
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Generate a random order number for demo purposes
    const orderNum = 'ORD' + Date.now().toString().slice(-8);
    setOrderNumber(orderNum);
  }, []);

  return (
    <>
      <Head>
        <title>Order Successful - nidsscrochet</title>
        <meta name="description" content="Your order has been placed successfully" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Order Successful!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your purchase. Your order has been confirmed.
            </p>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium text-gray-900">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date().toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Confirmed</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll receive an order confirmation email shortly</li>
                <li>• We'll process your order within 1-2 business days</li>
                <li>• You'll receive tracking information once shipped</li>
                <li>• Expected delivery: 3-5 business days</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Link>

              <Link
                href="/account/orders"
                className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                View My Orders
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Help Section */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Need help with your order?
              </p>
              <div className="space-y-1">
                <a
                  href="tel:9029562156"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  📞 Call Us: 9029562156
                </a>
                <br />
                <a
                  href="https://www.instagram.com/nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  📷 Message on Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
