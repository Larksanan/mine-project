/* eslint-disable react-hooks/purity */
import { motion } from 'framer-motion';
import { MdCheckCircle } from 'react-icons/md';

interface SuccessScreenProps {
  email: string;
  total: number;
  onContinueShopping: () => void;
  onViewOrders: () => void;
}

export default function SuccessScreen({
  email,
  total,
  onContinueShopping,
  onViewOrders,
}: SuccessScreenProps) {
  return (
    <div className='min-h-screen bg-linear-to-br from-green-50 to-blue-50 py-12 flex items-center justify-center'>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='max-w-2xl mx-auto px-4'
      >
        <div className='bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center'>
          {/* Animated Checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className='relative inline-block mb-6'
          >
            <div className='absolute inset-0 bg-green-100 rounded-full animate-ping'></div>
            <MdCheckCircle className='relative text-green-500 text-7xl md:text-9xl' />
          </motion.div>

          {/* Success Message */}
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            Order Placed Successfully!
          </h2>
          <p className='text-gray-600 text-lg mb-2'>
            Thank you for your purchase! Your order has been confirmed.
          </p>
          <p className='text-gray-600 mb-6'>
            Order total:{' '}
            <span className='font-bold text-blue-600'>${total.toFixed(2)}</span>
          </p>

          {/* Order Details */}
          <div className='bg-gray-50 rounded-xl p-6 mb-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-left'>
              <div>
                <p className='text-sm font-semibold text-gray-500'>
                  Confirmation Email
                </p>
                <p className='text-gray-900 font-medium'>{email}</p>
              </div>
              <div>
                <p className='text-sm font-semibold text-gray-500'>
                  Estimated Delivery
                </p>
                <p className='text-gray-900 font-medium'>3-5 Business Days</p>
              </div>
              <div className='md:col-span-2'>
                <p className='text-sm font-semibold text-gray-500'>
                  Order Number
                </p>
                <p className='text-gray-900 font-mono font-bold'>
                  ORD-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className='mb-8 p-4 bg-blue-50 rounded-lg'>
            <p className='text-sm text-blue-800'>
              We&#39;ve sent an order confirmation and receipt to your email. If
              you have any questions, please contact our customer support.
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onContinueShopping}
              className='bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors'
            >
              Continue Shopping
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onViewOrders}
              className='bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors'
            >
              View Orders
            </motion.button>
          </div>

          {/* Additional Links */}
          <div className='mt-8 pt-6 border-t border-gray-200'>
            <p className='text-sm text-gray-500'>
              Need help?{' '}
              <a
                href='/contact'
                className='text-blue-600 hover:text-blue-700 font-semibold'
              >
                Contact Support
              </a>{' '}
              or call us at{' '}
              <span className='font-semibold text-gray-700'>
                +94 233 1270 61s
              </span>
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='mt-8 text-center'
        >
          <p className='text-sm text-gray-500'>
            You will be redirected to the home page in{' '}
            <span className='font-bold text-gray-700'>30 seconds</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
