'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickActionsProps {
  isCollapsed: boolean;
}

const quickActions = [
  {
    name: 'Add Pharmacy',
    href: '/Pharmacist/add-new-pharmacy',
    variant: 'primary' as const,
  },
  {
    name: 'Add Product',
    href: '/Pharmacist/shop/add-product',
    variant: 'secondary' as const,
  },
];

export default function QuickActions({ isCollapsed }: QuickActionsProps) {
  return (
    <AnimatePresence>
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className='p-4 border-t border-gray-200'
        >
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-sm font-semibold text-gray-900 mb-3'
          >
            Quick Actions
          </motion.h3>
          <div className='space-y-2'>
            {quickActions.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={action.href}
                  className={`block w-full text-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    action.variant === 'primary'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {action.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
