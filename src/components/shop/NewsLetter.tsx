// components/NewsLetter.tsx (updated without sonner)
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  email: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const NewsLetter = () => {
  const [formData, setFormData] = useState<FormData>({ email: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const alreadySubscribed = localStorage.getItem('newsletter_subscribed');
    const savedCoupon = localStorage.getItem('newsletter_coupon');
    if (alreadySubscribed === 'true') {
      setIsSubscribed(true);
      if (savedCoupon) setCouponCode(savedCoupon);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;
    setFormData({ email: value });
    if (notification) setNotification(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!formData.email) {
      showNotification('error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(formData.email)) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/allproduct/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          subscribedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showNotification('success', data.message || 'Successfully subscribed!');
        setFormData({ email: '' });
        setIsSubscribed(true);

        localStorage.setItem('newsletter_subscribed', 'true');
        localStorage.setItem('newsletter_email', formData.email);

        if (data.data?.couponCode) {
          setCouponCode(data.data.couponCode);
          localStorage.setItem('newsletter_coupon', data.data.couponCode);
        }
      } else {
        showNotification('error', data.message || 'Failed to subscribe');
      }
    } catch {
      showNotification('error', 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14'
      >
        <h1 className='md:text-4xl text-2xl font-medium text-green-600'>
          Thank You for Subscribing! 🎉
        </h1>
        <p className='md:text-base text-gray-500/80 pb-8'>
          You&apos;ve successfully subscribed to our newsletter.
        </p>
        {couponCode && (
          <div className='bg-linear-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-6 max-w-md'>
            <p className='text-orange-700 text-sm mb-2'>
              Your exclusive discount code:
            </p>
            <div className='bg-white rounded-lg p-3 border border-orange-300'>
              <code className='text-xl font-bold text-orange-600'>
                {couponCode}
              </code>
            </div>
            <p className='text-orange-600 text-xs mt-3'>
              Use this code at checkout for 20% off your first order!
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14'>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <div className='flex items-center gap-2'>
              {notification.type === 'success' ? '✓' : '✗'}
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className='md:text-4xl text-2xl font-medium bg-linear-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent'>
          Subscribe now & get 20% off
        </h1>
        <p className='md:text-base text-gray-500/80 pb-8 mt-2'>
          Join our newsletter for exclusive offers and updates!
        </p>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className='flex items-center justify-between max-w-2xl w-full md:h-14 h-12'
      >
        <input
          className='border border-gray-500/30 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition'
          type='email'
          value={formData.email}
          onChange={handleInputChange}
          placeholder='Enter your email id'
          disabled={loading}
          autoComplete='email'
        />
        <button
          type='submit'
          disabled={loading}
          className='md:px-12 px-8 h-full text-white bg-linear-to-r from-orange-600 to-pink-600 rounded-md rounded-l-none hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? (
            <div className='flex items-center gap-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
              Subscribing...
            </div>
          ) : (
            'Subscribe'
          )}
        </button>
      </form>

      <p className='text-xs text-gray-400 mt-4'>
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
};

export default NewsLetter;
