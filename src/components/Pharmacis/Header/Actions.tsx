'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiDownload } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const quickActions = [
  {
    label: 'New Order',
    icon: FiPlus,
    href: '/pharmacist/orders/new',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    label: 'Add Product',
    icon: FiPlus,
    href: '/pharmacist/products/new',
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    label: 'Export',
    icon: FiDownload,
    onClick: () => console.log('Export clicked'),
    color: 'bg-purple-600 hover:bg-purple-700',
  },
];

export default function HeaderActions() {
  const router = useRouter();

  return (
    <div className='hidden md:flex items-center space-x-2'>
      {quickActions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (action.href) {
              router.push(action.href);
            } else if (action.onClick) {
              action.onClick();
            }
          }}
          className={`${action.color} text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200`}
        >
          <action.icon className='w-4 h-4' />
          <span>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
