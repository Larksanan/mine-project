import { motion } from 'framer-motion';
import useCartContext, { type CartContextType } from '@/context/CartContext';

interface OrderSummaryProps {
  hasRxItems: boolean;
}

export default function OrderSummary({ hasRxItems }: OrderSummaryProps) {
  const { cart } = useCartContext() as CartContextType;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-2xl shadow-xl p-6 sticky top-4'
    >
      <h2 className='text-2xl font-bold text-gray-900 mb-6'>Order Summary</h2>

      <div className='space-y-3 mb-6 pb-6 border-b'>
        <div className='flex justify-between text-gray-700'>
          <span>Subtotal ({cart.length} items)</span>
          <span className='font-semibold'>LKR{subtotal.toFixed(2)}</span>
        </div>
        <div className='flex justify-between text-gray-700'>
          <span>Tax (10%)</span>
          <span className='font-semibold'>LKR{tax.toFixed(2)}</span>
        </div>
        <div className='flex justify-between text-gray-700'>
          <span>Shipping</span>
          <span className='font-semibold'>
            {shipping === 0 ? (
              <span className='text-green-600'>FREE</span>
            ) : (
              `LKR${shipping.toFixed(2)}`
            )}
          </span>
        </div>
      </div>

      <div className='flex justify-between items-center text-2xl font-bold text-gray-900 mb-6 bg-blue-50 p-4 rounded-xl'>
        <span>Total</span>
        <span className='text-blue-600'>LKR{total.toFixed(2)}</span>
      </div>

      {hasRxItems && (
        <div className='bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4'>
          <p className='text-xs text-yellow-900 font-bold'>
            ⚠️ Prescription items included
          </p>
        </div>
      )}
    </motion.div>
  );
}
