'use client';

import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

interface MessageBannerProps {
  type: 'error' | 'success';
  message: string;
  onDismiss?: () => void;
}

export default function MessageBanner({
  type,
  message,
  onDismiss,
}: MessageBannerProps) {
  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: FiAlertCircle,
      iconColor: 'text-red-400',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: FiCheckCircle,
      iconColor: 'text-green-400',
    },
  };

  const { bg, border, text, icon: Icon, iconColor } = styles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`${bg} border ${border} rounded-lg p-4 mb-6`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Icon className={`h-5 w-5 ${iconColor} mr-3`} />
          </motion.div>
          <p className={`${text} text-sm`}>{message}</p>
        </div>
        {onDismiss && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDismiss}
            className={`${text} hover:opacity-70 transition-opacity`}
          >
            <FiX className='h-4 w-4' />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
