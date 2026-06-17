import { motion } from 'framer-motion';
import { MdArrowBack } from 'react-icons/md';
import { useRouter } from 'next/navigation';

interface CheckoutHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export default function CheckoutHeader({
  title = 'Checkout',
  subtitle = 'Complete your purchase securely',
  showBackButton = true,
}: CheckoutHeaderProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='mb-8'
    >
      {showBackButton && (
        <button
          onClick={() => router.back()}
          className='inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-4 transition-colors group'
        >
          <MdArrowBack className='mr-2 transition-transform group-hover:-translate-x-1' />
          Back to Cart
        </button>
      )}

      {/* Main Title */}
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-4'>
        <div>
          <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-2'>
            {title}
          </h1>
          <p className='text-gray-600'>{subtitle}</p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            <span className='text-sm font-semibold text-green-700'>
              Secure Checkout
            </span>
          </div>
          <div className='hidden sm:flex items-center gap-1 text-gray-500'>
            <span className='text-xs'>🔒</span>
            <span className='text-xs'>SSL Encrypted</span>
          </div>
        </div>
      </div>

      <div className='mt-6'>
        <div className='flex items-center text-sm text-gray-500'>
          <div className='flex items-center'>
            <div className='w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold'>
              1
            </div>
            <span className='ml-2 font-medium text-gray-700'>Cart</span>
          </div>
          <div className='w-12 h-0.5 bg-gray-300 mx-2'></div>
          <div className='flex items-center'>
            <div className='w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold'>
              2
            </div>
            <span className='ml-2 font-medium text-gray-700'>Information</span>
          </div>
          <div className='w-12 h-0.5 bg-gray-300 mx-2'></div>
          <div className='flex items-center'>
            <div className='w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold'>
              3
            </div>
            <span className='ml-2 font-medium text-gray-700'>Payment</span>
          </div>
          <div className='w-12 h-0.5 bg-gray-300 mx-2'></div>
          <div className='flex items-center'>
            <div className='w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold'>
              4
            </div>
            <span className='ml-2'>Confirmation</span>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className='mt-4 p-4 bg-blue-50 rounded-xl'>
        <p className='text-sm text-blue-800 flex items-start gap-2'>
          <span className='text-blue-600 font-bold text-lg'>💡</span>
          <span>
            Have questions? Call our support team at{' '}
            <a
              href='tel:+94112345678'
              className='font-semibold hover:text-blue-700'
            >
              +94 233 127 061
            </a>{' '}
            or{' '}
            <a
              href='mailto:jebarsanthacroos@gmail.com'
              className='font-semibold hover:text-blue-700'
            >
              email us
            </a>
          </span>
        </p>
      </div>
    </motion.div>
  );
}

export function CompactCheckoutHeader() {
  const router = useRouter();

  return (
    <div className='mb-6'>
      <div className='flex items-center justify-between'>
        <button
          onClick={() => router.back()}
          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <MdArrowBack className='text-xl text-gray-600' />
        </button>
        <h1 className='text-xl font-bold text-gray-900'>Checkout</h1>
        <div className='w-10'></div>
      </div>
      <div className='mt-4 flex items-center justify-center gap-2'>
        <div className='flex items-center gap-1'>
          <div className='w-2 h-2 bg-green-500 rounded-full'></div>
          <span className='text-xs font-medium text-green-700'>Secure</span>
        </div>
        <span className='text-gray-400'>•</span>
        <span className='text-xs text-gray-500'>SSL Encrypted</span>
      </div>
    </div>
  );
}
