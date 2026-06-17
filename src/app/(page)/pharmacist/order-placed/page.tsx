'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FiCheckCircle,
  FiShoppingBag,
  FiHome,
  FiPackage,
} from 'react-icons/fi';

function OrderPlacedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // Clear cart or perform other post-order actions
    localStorage.removeItem('pharmacy-cart');
  }, []);

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-6'>
      <div className='max-w-md w-full'>
        <div className='bg-white rounded-lg shadow-sm p-8 text-center'>
          {/* Success Icon */}
          <div className='flex justify-center mb-6'>
            <div className='bg-green-100 p-4 rounded-full'>
              <FiCheckCircle className='text-6xl text-green-600' />
            </div>
          </div>

          {/* Success Message */}
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            Order Placed Successfully!
          </h1>
          <p className='text-gray-600 mb-2'>
            Thank you for your order. Your order has been received and is being
            processed.
          </p>

          {orderId && (
            <p className='text-lg font-semibold text-blue-600 mb-6'>
              Order ID: #{orderId}
            </p>
          )}

          {/* Order Details */}
          <div className='bg-gray-50 rounded-lg p-4 mb-6 text-left'>
            <h3 className='font-semibold text-gray-900 mb-3'>
              What happens next?
            </h3>
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='bg-blue-100 p-2 rounded-full'>
                  <FiCheckCircle className='text-blue-600 text-sm' />
                </div>
                <span className='text-sm text-gray-700'>
                  Order confirmation sent to your email
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='bg-purple-100 p-2 rounded-full'>
                  <FiPackage className='text-purple-600 text-sm' />
                </div>
                <span className='text-sm text-gray-700'>
                  Our pharmacist will verify your prescription
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='bg-green-100 p-2 rounded-full'>
                  <FiShoppingBag className='text-green-600 text-sm' />
                </div>
                <span className='text-sm text-gray-700'>
                  Order will be prepared for pickup/delivery
                </span>
              </div>
            </div>
          </div>

          {/* Estimated Timeline */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
            <h4 className='font-semibold text-yellow-800 mb-2'>
              Estimated Timeline
            </h4>
            <p className='text-sm text-yellow-700'>
              Prescription orders typically take 30-60 minutes to process.
              You&apos;ll receive a notification when your order is ready.
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col gap-3'>
            <button
              onClick={() => router.push('/Pharmacist/orders')}
              className='w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              View Order Status
            </button>
            <button
              onClick={() => router.push('/Pharmacist/shop')}
              className='w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2'
            >
              <FiShoppingBag />
              Continue Shopping
            </button>
            <button
              onClick={() => router.push('/')}
              className='w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2'
            >
              <FiHome />
              Back to Home
            </button>
          </div>

          {/* Support Info */}
          <div className='mt-6 pt-6 border-t border-gray-200'>
            <p className='text-sm text-gray-600'>
              Need help? Contact us at{' '}
              <a
                href='tel:+94123456789'
                className='text-blue-600 hover:underline'
              >
                +94 123 456 789
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPlacedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderPlacedContent />
    </Suspense>
  );
}
