'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  FiHome,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiMessageSquare,
  FiSettings,
  FiMenu,
  FiX,
  FiUser,
  FiHeart,
  FiClipboard,
  FiActivity,
} from 'react-icons/fi';

const navigation = [
  { name: 'Dashboard', href: '/patient', icon: FiHome },
  { name: 'My Profile', href: '/patient/profile', icon: FiUser },
  { name: 'Appointments', href: '/patient/appointments', icon: FiCalendar },
  { name: 'Medical Records', href: '/patient/records', icon: FiFileText },
  { name: 'Health Data', href: '/patient/health', icon: FiHeart },
  { name: 'Billing & Payments', href: '/patient/billing', icon: FiDollarSign },
  { name: 'Messages', href: '/patient/messages', icon: FiMessageSquare },
  { name: 'Prescriptions', href: '/patient/prescriptions', icon: FiClipboard },
];

// Animation variants
const sidebarVariants: Variants = {
  hidden: { x: -300, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    x: -300,
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const navItemVariants: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

export function PatientSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar backdrop with animation */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key='backdrop'
            variants={backdropVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='fixed inset-0 z-40 bg-gray-600/75 backdrop-blur-sm lg:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu button with animation */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSidebarOpen(true)}
        className='lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors'
      >
        <FiMenu className='h-6 w-6 text-gray-600' />
      </motion.button>

      {/* Sidebar - Desktop always visible, Mobile conditionally visible */}
      <AnimatePresence mode='wait'>
        {/* Desktop sidebar - always render but hidden on mobile */}
        <motion.div
          key='sidebar'
          variants={sidebarVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg
            lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? 'block' : 'hidden lg:block'}
          `}
        >
          <div className='flex items-center justify-between h-16 px-4 border-b border-gray-200'>
            <motion.div
              className='flex items-center'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <div className='shrink-0 w-8 h-8 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md'>
                <FiActivity className='text-white text-sm' />
              </div>
              <span className='ml-3 text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                Patient Portal
              </span>
            </motion.div>
            <motion.button
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(false)}
              className='lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors'
            >
              <FiX className='h-6 w-6' />
            </motion.button>
          </div>

          {/* Rest of the sidebar content... */}
          <nav className='mt-8 px-4'>
            <motion.div
              className='space-y-2'
              variants={sidebarVariants}
              initial='hidden'
              animate='visible'
            >
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + '/');

                return (
                  <motion.div key={item.name} variants={navItemVariants}>
                    <Link
                      href={item.href}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all
                        ${
                          isActive
                            ? 'bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon
                        className={`
                          mr-3 h-5 w-5 shrink-0 transition-all
                          ${isActive ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-gray-500'}
                        `}
                      />
                      {item.name}
                      {isActive && (
                        <motion.div
                          layoutId='activeIndicator'
                          className='ml-auto w-1.5 h-1.5 rounded-full bg-blue-600'
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring' }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Settings */}
            <motion.div
              className='mt-12 pt-8 border-t border-gray-200'
              variants={navItemVariants}
              initial='hidden'
              animate='visible'
              transition={{ delay: 0.6 }}
            >
              <Link
                href='/patient/settings'
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all
                  ${
                    pathname === '/patient/settings' ||
                    pathname?.startsWith('/patient/settings/')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <FiSettings className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500' />
                Settings
              </Link>
            </motion.div>
          </nav>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default PatientSidebar;
