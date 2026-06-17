'use client';

import { motion } from 'framer-motion';

export default function QuickActions() {
  const actions = [
    { label: 'Change Password', color: 'text-gray-700' },
    { label: 'Notification Settings', color: 'text-gray-700' },
    { label: 'Privacy Settings', color: 'text-gray-700' },
    { label: 'Delete Account', color: 'text-red-600' },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7 }}
      className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
    >
      <motion.h2
        className='text-lg font-semibold text-gray-900 mb-4'
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Quick Actions
      </motion.h2>

      <div className='space-y-1'>
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{
              x: 5,
              backgroundColor:
                action.color === 'text-red-600' ? '#fef2f2' : '#f9fafb',
            }}
            className={`w-full text-left px-3 py-2 text-sm ${action.color} rounded-md transition-colors`}
          >
            {action.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
