'use client';

import { FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface SuccessNotificationProps {
  show: boolean;
  message?: string;
}

export default function SuccessNotification({
  show,
  message = 'Product added successfully! Redirecting...',
}: SuccessNotificationProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className='fixed top-4 right-4 z-50'
    >
      <div className='bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3'>
        <FiCheck className='text-xl' />
        <span>{message}</span>
      </div>
    </motion.div>
  );
}
