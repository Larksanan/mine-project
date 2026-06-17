'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BiArrowBack,
  BiTrash,
  BiShoppingBag,
  BiCheckCircle,
  BiMap,
  BiHome,
  BiBuilding,
  BiPhone,
  BiEnvelope,
  BiUser,
} from 'react-icons/bi';
import { motion } from 'framer-motion';
import useCart from '@/context/CartContext';
import Image from 'next/image';

export default function MyCartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    cart: cartItems,
    totalPrice,
    currency,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Shipping address form
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    instructions: '',
  });

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
      removeFromCart(productId);
    }
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      clearCart();
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate form
      if (!shippingAddress.name.trim()) {
        throw new Error('Please enter your name');
      }
      if (!shippingAddress.email.trim()) {
        throw new Error('Please enter your email');
      }
      if (!shippingAddress.phone.trim()) {
        throw new Error('Please enter your phone number');
      }
      if (!shippingAddress.address.trim()) {
        throw new Error('Please enter your address');
      }
      if (!shippingAddress.city.trim()) {
        throw new Error('Please enter your city');
      }
      if (!shippingAddress.postalCode.trim()) {
        throw new Error('Please enter your postal code');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Get pharmacy ID from first item (if available)
      const pharmacyId = cartItems[0]?.pharmacy?.id;

      // Calculate totals
      const shipping = cartItems.length > 0 ? 5.99 : 0;
      const tax = totalPrice * 0.08;
      const total = totalPrice + shipping + tax;

      const checkoutData = {
        items: cartItems.map(item => ({
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          prescriptionRequired: item.requiresPrescription || false,
        })),
        total: parseFloat(total.toFixed(2)),
        pharmacyId: pharmacyId || undefined,
        paymentMethod: 'cash' as const,
        shippingAddress: {
          name: shippingAddress.name.trim(),
          email: shippingAddress.email.trim(),
          phone: shippingAddress.phone.trim(),
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          postalCode: shippingAddress.postalCode.trim(),
          instructions: shippingAddress.instructions.trim() || undefined,
        },
        prescriptionImages: [],
      };

      console.log('Sending checkout data:', checkoutData);

      const response = await fetch(`${apiUrl}/check_out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Checkout failed');
      }

      console.log('Checkout response:', data);

      // Clear cart and show success
      clearCart();
      setCheckoutSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(
          `/shop/order-success?orderId=${data.data.orderId}&orderNumber=${data.data.orderNumber}`
        );
      }, 2000);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Checkout failed');
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const shipping = cartItems.length > 0 ? 5.99 : 0;
  const tax = totalPrice * 0.08;
  const total = totalPrice + shipping + tax;

  if (checkoutSuccess) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className='bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center'
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <BiCheckCircle className='text-green-500 text-6xl mx-auto mb-4' />
          </motion.div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Order Placed Successfully!
          </h1>
          <p className='text-gray-600 mb-6'>
            Thank you for your order. Redirecting to order confirmation...
          </p>
          <div className='flex justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center'>
            <Link
              href='/shop/pharmacy'
              className='flex items-center text-gray-600 hover:text-blue-600 transition'
            >
              <BiArrowBack className='mr-2' size={20} />
              Back to Shop
            </Link>
            <h1 className='text-3xl font-bold text-gray-900 ml-4'>
              My Cart ({cartItems.length})
            </h1>
          </div>
          {cartItems.length > 0 && (
            <motion.button
              onClick={handleClearCart}
              className='text-red-600 hover:text-red-800 font-medium transition'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Cart
            </motion.button>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center'
          >
            <span className='text-2xl mr-3'>⚠️</span>
            <div>
              <p className='font-semibold'>Checkout Error</p>
              <p className='text-sm'>{error}</p>
            </div>
          </motion.div>
        )}

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-xl shadow-sm p-12 text-center'
          >
            <BiShoppingBag className='text-gray-400 text-7xl mx-auto mb-4' />
            <h2 className='text-2xl font-medium text-gray-900 mb-2'>
              Your cart is empty
            </h2>
            <p className='text-gray-600 mb-6'>
              Looks like you haven&apos;t added any items yet.
            </p>
            <Link
              href='/shop/pharmacy'
              className='inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium'
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Cart Items */}
            <div className='lg:col-span-2'>
              <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
                <div className='divide-y divide-gray-200'>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='flex items-center gap-6 p-6 hover:bg-gray-50 transition'
                    >
                      <div className='relative w-24 h-24 shrink-0'>
                        <Image
                          src={item.image || '/placeholder-product.jpg'}
                          alt={item.name}
                          fill
                          className='object-cover rounded-lg'
                          sizes='96px'
                          onError={e => {
                            e.currentTarget.src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className='flex-1'>
                        <div className='flex justify-between items-start mb-2'>
                          <div>
                            <Link
                              href={`/shop/pharmacy/${item._id}`}
                              className='text-lg font-medium text-gray-900 hover:text-blue-600 transition'
                            >
                              {item.name}
                            </Link>
                            {item.pharmacy && (
                              <p className='text-sm text-gray-600 mt-1'>
                                Pharmacy: {item.pharmacy.name}
                              </p>
                            )}
                            {item.requiresPrescription && (
                              <span className='inline-block mt-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium'>
                                ⚠️ Prescription Required
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className='text-gray-400 hover:text-red-500 transition p-2'
                            aria-label='Remove item'
                          >
                            <BiTrash size={20} />
                          </button>
                        </div>
                        <p className='text-blue-600 font-medium text-lg mb-3'>
                          {currency} {(item.price * item.quantity).toFixed(2)}
                        </p>
                        <div className='flex items-center gap-4'>
                          <div className='flex items-center border border-gray-300 rounded-lg overflow-hidden'>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item._id,
                                  item.quantity - 1
                                )
                              }
                              className='px-3 py-2 bg-gray-50 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition'
                              disabled={item.quantity <= 1}
                              aria-label='Decrease quantity'
                            >
                              -
                            </button>
                            <span className='px-4 py-2 bg-white min-w-12 text-center font-medium'>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item._id,
                                  item.quantity + 1
                                )
                              }
                              className='px-3 py-2 bg-gray-50 hover:bg-gray-200 text-gray-700 transition'
                              aria-label='Increase quantity'
                              disabled={
                                item.stockQuantity
                                  ? item.quantity >= item.stockQuantity
                                  : false
                              }
                            >
                              +
                            </button>
                          </div>
                          <p className='text-sm text-gray-600'>
                            {currency} {item.price.toFixed(2)} each
                          </p>
                          {item.stockQuantity && (
                            <p className='text-xs text-gray-500'>
                              (Max: {item.stockQuantity})
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary & Shipping Form */}
            <div className='lg:col-span-1'>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className='bg-white rounded-xl shadow-sm p-6 sticky top-6'
              >
                <h2 className='text-xl font-bold text-gray-900 mb-4'>
                  Order Summary
                </h2>
                <div className='space-y-3 mb-6'>
                  <div className='flex justify-between text-gray-700'>
                    <span>Subtotal</span>
                    <span className='font-medium'>
                      {currency} {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between text-gray-700'>
                    <span>Shipping</span>
                    <span className='font-medium'>
                      {currency} {shipping.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between text-gray-700'>
                    <span>Tax (8%)</span>
                    <span className='font-medium'>
                      {currency} {tax.toFixed(2)}
                    </span>
                  </div>
                  <div className='border-t border-gray-200 pt-3 flex justify-between'>
                    <span className='font-bold text-gray-900 text-lg'>
                      Total
                    </span>
                    <span className='font-bold text-blue-600 text-lg'>
                      {currency} {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shipping Information Form */}
                <h3 className='text-md font-bold text-gray-900 mb-4 border-t pt-4'>
                  Shipping Information
                </h3>
                <div className='space-y-3'>
                  {/* Name */}
                  <div className='relative'>
                    <BiUser className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input
                      className='pl-10 px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full'
                      type='text'
                      placeholder='Full Name *'
                      value={shippingAddress.name}
                      onChange={e =>
                        setShippingAddress({
                          ...shippingAddress,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className='relative'>
                    <BiEnvelope className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input
                      className='pl-10 px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full'
                      type='email'
                      placeholder='Email *'
                      value={shippingAddress.email}
                      onChange={e =>
                        setShippingAddress({
                          ...shippingAddress,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className='relative'>
                    <BiPhone className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input
                      className='pl-10 px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full'
                      type='tel'
                      placeholder='Phone Number *'
                      value={shippingAddress.phone}
                      onChange={e =>
                        setShippingAddress({
                          ...shippingAddress,
                          phone: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Address */}
                  <div className='relative'>
                    <BiHome className='absolute left-3 top-3 text-gray-400' />
                    <textarea
                      className='pl-10 px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full resize-none'
                      rows={3}
                      placeholder='Street Address *'
                      value={shippingAddress.address}
                      onChange={e =>
                        setShippingAddress({
                          ...shippingAddress,
                          address: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* City & Postal Code */}
                  <div className='flex gap-3'>
                    <div className='relative flex-1'>
                      <BiBuilding className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                      <input
                        className='pl-10 px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full'
                        type='text'
                        placeholder='City *'
                        value={shippingAddress.city}
                        onChange={e =>
                          setShippingAddress({
                            ...shippingAddress,
                            city: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className='relative flex-1'>
                      <BiMap className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                      <input
                        className='pl-10 px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full'
                        type='text'
                        placeholder='Postal Code *'
                        value={shippingAddress.postalCode}
                        onChange={e =>
                          setShippingAddress({
                            ...shippingAddress,
                            postalCode: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Delivery Instructions */}
                  <textarea
                    className='px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full resize-none'
                    rows={2}
                    placeholder='Delivery Instructions (Optional)'
                    value={shippingAddress.instructions}
                    onChange={e =>
                      setShippingAddress({
                        ...shippingAddress,
                        instructions: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Prescription Warning */}
                {cartItems.some(item => item.requiresPrescription) && (
                  <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800 font-medium'>
                      📋 Prescription Required
                    </p>
                    <p className='text-xs text-yellow-700 mt-1'>
                      Some items require a valid prescription. You may be
                      contacted for verification.
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                <motion.button
                  type='button'
                  onClick={handleCheckout}
                  disabled={loading || cartItems.length === 0}
                  className={`mt-6 w-full ${
                    loading || cartItems.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white py-3 px-4 rounded-lg transition font-semibold text-lg flex items-center justify-center gap-2`}
                  whileHover={loading ? {} : { scale: 1.02 }}
                  whileTap={loading ? {} : { scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <BiCheckCircle className='text-xl' />
                      Place Order
                    </>
                  )}
                </motion.button>

                <div className='mt-4 text-center text-sm text-gray-600'>
                  🔒 Secure checkout • Cash on delivery
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
