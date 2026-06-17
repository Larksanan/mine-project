'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiChevronDown,
  FiPackage,
  FiFileText,
  FiCreditCard,
} from 'react-icons/fi';

interface HeaderUserMenuProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultUser = {
  name: 'Pharmacist User',
  email: 'pharmacist@example.com',
  role: 'Senior Pharmacist',
};

const userMenuItems = [
  { label: 'Profile', icon: FiUser, href: '/pharmacist/profile' },
  { label: 'My Pharmacy', icon: FiPackage, href: '/pharmacist/pharmacy' },
  {
    label: 'Prescriptions',
    icon: FiFileText,
    href: '/pharmacist/prescriptions',
  },
  { label: 'Billing', icon: FiCreditCard, href: '/pharmacist/billing' },
  { label: 'Settings', icon: FiSettings, href: '/pharmacist/settings' },
  { label: 'Help & Support', icon: FiHelpCircle, href: '/help' },
];

export default function HeaderUserMenu({
  user = defaultUser,
  isOpen,
  onOpenChange,
}: HeaderUserMenuProps) {
  const currentUser = { ...defaultUser, ...user };

  return (
    <div className='relative'>
      <motion.button
        onClick={() => onOpenChange(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className='flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors'
        aria-label='User menu'
      >
        <div className='relative'>
          <div className='h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
            <span className='text-white font-semibold text-sm'>
              {currentUser.name.charAt(0)}
            </span>
          </div>
          <div className='absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white' />
        </div>

        <div className='hidden md:block text-left'>
          <div className='text-sm font-medium text-gray-900'>
            {currentUser.name}
          </div>
          <div className='text-xs text-gray-500'>{currentUser.role}</div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className='w-4 h-4 text-gray-400' />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className='absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50'
          >
            {/* User Info */}
            <div className='p-4 bg-linear-to-r from-blue-50 to-purple-50'>
              <div className='flex items-center space-x-3'>
                <div className='h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                  <span className='text-white font-semibold'>
                    {currentUser.name.charAt(0)}
                  </span>
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='font-semibold text-gray-900 truncate'>
                    {currentUser.name}
                  </div>
                  <div className='text-sm text-gray-600 truncate'>
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <div className='mt-2 px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 inline-block'>
                {currentUser.role}
              </div>
            </div>

            {/* Menu Items */}
            <div className='p-2'>
              {userMenuItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{
                    x: 5,
                    backgroundColor: 'rgba(243, 244, 246, 1)',
                  }}
                  className='flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:text-blue-600 transition-colors'
                  onClick={() => onOpenChange(false)}
                >
                  <item.icon className='w-4 h-4' />
                  <span>{item.label}</span>
                </motion.a>
              ))}

              {/* Sign Out */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: userMenuItems.length * 0.05 }}
                whileHover={{ x: 5, backgroundColor: 'rgba(254, 242, 242, 1)' }}
                className='flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:text-red-700 mt-2'
              >
                <FiLogOut className='w-4 h-4' />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
