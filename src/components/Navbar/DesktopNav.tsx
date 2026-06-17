'use client';

import { motion } from 'framer-motion';
import NavItems from './NavItems';
import UserMenu from './UserMenu';
import NotificationBell from '../Notification';
import Link from 'next/link';

interface DesktopNavProps {
  isAuthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

export default function DesktopNav({ isAuthenticated, user }: DesktopNavProps) {
  return (
    <>
      {/* Desktop Navigation - Centered */}
      <div className='hidden lg:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2'>
        <NavItems />
      </div>

      {/* Desktop User Menu */}
      <div className='hidden lg:flex items-center space-x-4'>
        {isAuthenticated ? (
          <div className='flex items-center space-x-4'>
            <NotificationBell />
            <UserMenu user={user} />
          </div>
        ) : (
          <AuthButtons />
        )}
      </div>
    </>
  );
}

function AuthButtons() {
  return (
    <div className='flex items-center space-x-3'>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href='/auth/signin'
          className='px-6 py-3 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors'
        >
          Sign In
        </Link>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link
          href='/auth/signup'
          className='bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 block'
        >
          Get Started
        </Link>
      </motion.div>
    </div>
  );
}
