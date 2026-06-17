'use client';

import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toastVariants } from '@/animations/variants';
import { ToastData } from '@/types/booking';

interface ToastProps extends ToastData {
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[type];

  const iconColor = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  }[type];

  return (
    <motion.div
      variants={toastVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      className={`fixed top-6 right-6 z-50 border rounded-lg p-4 shadow-lg ${bgColor} min-w-75`}
    >
      <div className='flex items-center gap-3'>
        {type === 'success' && (
          <FiCheckCircle className={`w-5 h-5 ${iconColor}`} />
        )}
        {type === 'error' && (
          <FiAlertCircle className={`w-5 h-5 ${iconColor}`} />
        )}
        {type === 'info' && <FiInfo className={`w-5 h-5 ${iconColor}`} />}
        <span className='font-medium'>{message}</span>
        <button
          type='button'
          onClick={onClose}
          className='ml-auto opacity-70 hover:opacity-100'
        >
          <FiX className='w-4 h-4' />
        </button>
      </div>
    </motion.div>
  );
};
