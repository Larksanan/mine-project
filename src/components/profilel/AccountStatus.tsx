'use client';

import { motion } from 'framer-motion';
import { FiCalendar, FiCheckCircle } from 'react-icons/fi';

interface AccountStatusProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AccountStatus({ user }: AccountStatusProps) {
  const statusItems = [
    {
      label: 'Member Since',
      value: new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      icon: FiCalendar,
      color: 'text-gray-900',
    },
    {
      label: 'Status',
      value: 'Active',
      icon: FiCheckCircle,
      color: 'text-green-600',
      badge: 'bg-green-100 text-green-800',
    },
    {
      label: 'Email Verified',
      value: 'Verified',
      icon: FiCheckCircle,
      color: 'text-green-600',
      badge: 'bg-green-100 text-green-800',
    },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
      className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
    >
      <motion.h2
        className='text-lg font-semibold text-gray-900 mb-4'
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Account Status
      </motion.h2>

      <div className='space-y-3'>
        {statusItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className='flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <span className='text-sm text-gray-600 flex items-center'>
              <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
              {item.label}
            </span>
            {item.badge ? (
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.badge}`}
              >
                {item.value}
              </motion.span>
            ) : (
              <span className='text-sm font-medium text-gray-900'>
                {item.value}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
