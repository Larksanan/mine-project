/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';

import {
  FiUser,
  FiMessageSquare,
  FiBell,
  FiPackage,
  FiDroplet,
  FiSettings,
  FiShield,
  FiLogOut,
} from 'react-icons/fi';

interface MobileUserSectionProps {
  isAuthenticated: boolean;
  user: any;
  onItemClick: () => void;
}

export default function MobileUserSection({
  isAuthenticated,
  user,
  onItemClick,
}: MobileUserSectionProps) {
  const { signOut } = useAuth();

  const userMenuItems = [
    { name: 'Profile', href: '/profile', icon: FiUser },
    { name: 'Messages', href: '/messages', icon: FiMessageSquare },
    { name: 'Notifications', href: '/notifications', icon: FiBell },
    { name: 'Pharmacy', href: '/pharmacy', icon: FiPackage },
    { name: 'Lab Tests', href: '/laboratory', icon: FiDroplet },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      onItemClick();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className='pt-4 pb-3 border-t border-white/20'>
      {isAuthenticated ? (
        <div className='space-y-4'>
          {/* User Info */}
          <div className='flex items-center px-4'>
            <UserAvatar user={user} size='lg' />
            <div className='ml-4 flex-1'>
              <div className='text-base font-semibold text-gray-900'>
                {user?.name || 'User'}
              </div>
              <div className='text-sm text-gray-600'>{user?.email}</div>
              {user?.role && (
                <div className='mt-1'>
                  <RoleBadge role={user.role} />
                </div>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className='space-y-1'>
            {userMenuItems.map(item => (
              <motion.div key={item.name} whileHover={{ x: 5 }}>
                <Link
                  href={item.href}
                  className='flex items-center space-x-3 px-4 py-4 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors'
                  onClick={onItemClick}
                >
                  <item.icon className='h-5 w-5' />
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            ))}

            {user?.role === 'ADMIN' && (
              <motion.div whileHover={{ x: 5 }}>
                <Link
                  href='/dashboard/admin'
                  className='flex items-center space-x-3 px-4 py-4 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors'
                  onClick={onItemClick}
                >
                  <FiShield className='h-5 w-5' />
                  <span>Admin Panel</span>
                </Link>
              </motion.div>
            )}

            <motion.button
              onClick={handleSignOut}
              whileHover={{ x: 5 }}
              className='flex items-center space-x-3 w-full px-4 py-4 text-base font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-colors text-left'
            >
              <FiLogOut className='h-5 w-5' />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className='space-y-3 px-2'>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Link
              href='/auth/signin'
              className='flex items-center justify-center w-full px-4 py-4 text-base font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-2xl transition-colors'
              onClick={onItemClick}
            >
              Sign In
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href='/auth/signup'
              className='flex items-center justify-center w-full px-4 py-4 text-base font-semibold text-white bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl'
              onClick={onItemClick}
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}
