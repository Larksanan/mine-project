/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BiTrash, BiPlus, BiMinus, BiShoppingBag } from 'react-icons/bi';
import { MdArrowBack, MdLocalShipping } from 'react-icons/md';
import { FiTag, FiShield } from 'react-icons/fi';
import { AiOutlineSafety } from 'react-icons/ai';
import useCartContext, { type CartContextType } from '@/context/CartContext';

export default function MyCartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, clearCart } =
    useCartContext() as CartContextType;

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping - discount;

  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase().trim();

    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }

    if (code === 'SAVE10') {
      setDiscount(subtotal * 0.1);
      setPromoApplied(true);
      setPromoError('');
    } else if (code === 'SAVE20') {
      setDiscount(subtotal * 0.2);
      setPromoApplied(true);
      setPromoError('');
    } else if (code === 'FREESHIP') {
      setDiscount(shipping);
      setPromoApplied(true);
      setPromoError('');
    } else if (code === 'WELCOME15') {
      setDiscount(subtotal * 0.15);
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
      setPromoApplied(false);
      setDiscount(0);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setDiscount(0);
    setPromoApplied(false);
    setPromoError('');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      return;
    }
    router.push('/shop/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  if (!mounted) {
    return (
      <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-12 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600 font-semibold'>Loading cart...</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className='bg-white rounded-2xl shadow-2xl p-12 text-center max-w-2xl mx-auto'
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <BiShoppingBag className='mx-auto text-gray-300 text-9xl mb-6' />
            </motion.div>
            <h2 className='text-4xl font-bold text-gray-800 mb-4'>
              Your Cart is Empty
            </h2>
            <p className='text-gray-600 text-lg mb-8 max-w-md mx-auto'>
              Looks like you haven&apos;t added any items to your cart yet.
              Start shopping to find great products!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/shop/pharmacy')}
              className='bg-linear-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2'
            >
              <BiShoppingBag className='text-2xl' />
              Start Shopping
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  const hasRxItems = cart.some(item => item.requiresPrescription);

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <Link
            href='/shop/pharmacy'
            className='inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-4 transition-colors group'
          >
            <MdArrowBack className='mr-2 text-xl group-hover:-translate-x-1 transition-transform' />
            Continue Shopping
          </Link>
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>
                Shopping Cart
              </h1>
              <p className='text-gray-600 text-lg'>
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in your
                cart
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className='text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-2 transition-colors hover:bg-red-50 px-4 py-2 rounded-lg'
              >
                <BiTrash className='text-lg' />
                Clear All Items
              </button>
            )}
          </div>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-4'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-white rounded-2xl shadow-xl overflow-hidden'
            >
              <AnimatePresence mode='popLayout'>
                {cart.map((item, _index) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className='border-b last:border-b-0'
                  >
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-6 hover:bg-gray-50 transition-colors'>
                      {/* Product Image */}
                      <Link
                        href={`/shop/pharmacy/${item._id}`}
                        className='relative w-full sm:w-28 h-40 sm:h-28 shrink-0 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow'
                      >
                        <Image
                          src={item.image || '/placeholder-product.jpg'}
                          alt={item.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 640px) 100vw, 112px'
                          onError={e => {
                            e.currentTarget.src = '/placeholder-product.jpg';
                          }}
                        />
                        {item.requiresPrescription && (
                          <div className='absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg'>
                            Rx
                          </div>
                        )}
                      </Link>

                      {/* Product Info */}
                      <div className='flex-1 min-w-0 w-full'>
                        <Link
                          href={`/shop/pharmacy/${item._id}`}
                          className='block group'
                        >
                          <h3 className='text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2'>
                            {item.name}
                          </h3>
                        </Link>
                        <p className='text-sm text-gray-600 mb-2'>
                          LKR.{item.price.toFixed(2)} each
                        </p>
                        {item.requiresPrescription && (
                          <span className='inline-block text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold'>
                            📋 Prescription Required
                          </span>
                        )}
                      </div>

                      {/* Quantity & Price Section */}
                      <div className='flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 w-full sm:w-auto'>
                        {/* Quantity Controls */}
                        <div className='flex items-center border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm'>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item._id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            disabled={item.quantity <= 1}
                            className='px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                            aria-label='Decrease quantity'
                          >
                            <BiMinus className='text-lg' />
                          </button>
                          <span className='px-4 sm:px-6 py-2 font-bold text-gray-900 min-w-12.5 sm:min-w-15 text-center text-lg'>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item._id, item.quantity + 1)
                            }
                            className='px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors'
                            aria-label='Increase quantity'
                          >
                            <BiPlus className='text-lg' />
                          </button>
                        </div>

                        {/* Item Total & Remove */}
                        <div className='flex items-center gap-3 sm:gap-4'>
                          <p className='text-xl font-bold text-blue-600 min-w-20 text-right'>
                            LKR.{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeFromCart(item._id)}
                            className='text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors'
                            title='Remove item'
                          >
                            <BiTrash className='text-2xl' />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='grid grid-cols-1 sm:grid-cols-3 gap-4'
            >
              <div className='bg-white rounded-xl p-4 shadow-md flex items-center gap-3'>
                <FiShield className='text-3xl text-green-600' />
                <div>
                  <p className='font-bold text-gray-900 text-sm'>
                    Secure Checkout
                  </p>
                  <p className='text-xs text-gray-600'>SSL Encrypted</p>
                </div>
              </div>
              <div className='bg-white rounded-xl p-4 shadow-md flex items-center gap-3'>
                <MdLocalShipping className='text-3xl text-blue-600' />
                <div>
                  <p className='font-bold text-gray-900 text-sm'>
                    Fast Delivery
                  </p>
                  <p className='text-xs text-gray-600'>2-3 Business Days</p>
                </div>
              </div>
              <div className='bg-white rounded-xl p-4 shadow-md flex items-center gap-3'>
                <AiOutlineSafety className='text-3xl text-purple-600' />
                <div>
                  <p className='font-bold text-gray-900 text-sm'>
                    Quality Guaranteed
                  </p>
                  <p className='text-xs text-gray-600'>Authentic Products</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl shadow-xl p-6 sm:p-8 sticky top-4'
            >
              <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-6'>
                Order Summary
              </h2>

              {/* Promo Code */}
              <div className='mb-6'>
                <label className='block text-sm font-bold text-gray-700 mb-3 items-center gap-2'>
                  <FiTag className='text-blue-600' />
                  Have a Promo Code?
                </label>
                {!promoApplied ? (
                  <div className='space-y-2'>
                    <div className='flex gap-2'>
                      <input
                        type='text'
                        value={promoCode}
                        onChange={e => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoError('');
                        }}
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            handleApplyPromo();
                          }
                        }}
                        placeholder='Enter code'
                        className='flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase'
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleApplyPromo}
                        className='px-4 sm:px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold transition-colors shadow-md'
                      >
                        Apply
                      </motion.button>
                    </div>
                    {promoError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='text-xs text-red-600 font-semibold'
                      >
                        ❌ {promoError}
                      </motion.p>
                    )}
                    <p className='text-xs text-gray-500'>
                      Try: <span className='font-bold'>SAVE10</span>,{' '}
                      <span className='font-bold'>SAVE20</span>,{' '}
                      <span className='font-bold'>WELCOME15</span>, or{' '}
                      <span className='font-bold'>FREESHIP</span>
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className='bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center justify-between'
                  >
                    <div>
                      <p className='text-sm font-bold text-green-800 flex items-center gap-2'>
                        ✅ {promoCode} Applied
                      </p>
                      <p className='text-xs text-green-700 mt-1'>
                        You saved ${discount.toFixed(2)}!
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className='text-green-700 hover:text-green-900 font-bold text-sm'
                    >
                      Remove
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className='space-y-4 mb-6 border-t border-b py-6'>
                <div className='flex justify-between text-gray-700'>
                  <span className='font-medium'>Subtotal</span>
                  <span className='font-bold'>LKR.{subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-gray-700'>
                  <span className='font-medium'>Tax (10%)</span>
                  <span className='font-bold'>LKR.{tax.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-gray-700'>
                  <span className='font-medium flex items-center gap-2'>
                    <MdLocalShipping className='text-xl' />
                    Shipping
                  </span>
                  <span className='font-bold'>
                    {shipping === 0 ? (
                      <span className='text-green-600'>FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='flex justify-between text-green-600'
                  >
                    <span className='font-medium'>Discount</span>
                    <span className='font-bold'>
                      -LKR.{discount.toFixed(2)}
                    </span>
                  </motion.div>
                )}
              </div>

              <div className='flex justify-between items-center text-2xl font-bold text-gray-900 mb-6 bg-blue-50 p-4 rounded-xl'>
                <span>Total</span>
                <span className='text-blue-600'>LKR.{total.toFixed(2)}</span>
              </div>

              {/* Prescription Warning */}
              {hasRxItems && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className='bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6'
                >
                  <p className='text-sm text-yellow-900 font-bold mb-2 flex items-center gap-2'>
                    ⚠️ Prescription Required
                  </p>
                  <p className='text-xs text-yellow-800 leading-relaxed'>
                    Some items require a valid prescription. You&apos;ll be
                    asked to upload it during checkout.
                  </p>
                </motion.div>
              )}

              {/* Checkout Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                className='w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-5 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
              >
                <span>Proceed to Checkout</span>
                <MdArrowBack className='rotate-180 text-xl' />
              </motion.button>

              {/* Free Shipping Progress */}
              {subtotal < 50 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className='mt-6'
                >
                  <p className='text-sm text-center text-gray-700 font-semibold mb-3'>
                    🚚 Add{' '}
                    <span className='text-blue-600 font-bold'>
                      ${(50 - subtotal).toFixed(2)}
                    </span>{' '}
                    more for FREE shipping!
                  </p>
                  <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((subtotal / 50) * 100, 100)}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className='bg-linear-to-r from-blue-500 to-blue-600 h-full rounded-full shadow-md'
                    />
                  </div>
                  <p className='text-xs text-center text-gray-600 mt-2'>
                    {Math.round((subtotal / 50) * 100)}% to free shipping
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
