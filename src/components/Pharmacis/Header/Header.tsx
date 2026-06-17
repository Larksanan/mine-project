'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FiMenu, FiMessageSquare } from 'react-icons/fi';
import HeaderSearch from './Search';
import NotificationBell from '@/components/Notification';
import HeaderUserMenu from './UserMenu';
import HeaderActions from './Actions';
import { useHeaderAnimation } from '@/hooks/useAnimation';
import { useHeaderState } from '@/hooks/useState';

interface PharmacistHeaderProps {
  onMenuToggle?: () => void;
  title?: string;
  showSearch?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

export default function PharmacistHeader({
  onMenuToggle,
  title = 'Dashboard',
  showSearch = true,
  user,
}: PharmacistHeaderProps) {
  const { isSearchOpen, setIsSearchOpen, isUserMenuOpen, setIsUserMenuOpen } =
    useHeaderState();

  const { scrollProgress } = useHeaderAnimation();

  // Define variants locally with proper typing
  const headerVariants: Variants = {
    hidden: {
      y: -100,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <motion.header
      variants={headerVariants}
      initial='hidden'
      animate='visible'
      className='sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm'
    >
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Left Section: Menu Button & Title */}
          <div className='flex items-center space-x-4'>
            <motion.button
              onClick={onMenuToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className='p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden'
              aria-label='Toggle menu'
            >
              <FiMenu className='w-5 h-5 text-gray-600' />
            </motion.button>

            <div className='flex items-center space-x-3'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className='hidden lg:block'
              >
                <div className='h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>P</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-xl font-semibold text-gray-900'
              >
                {title}
              </motion.h1>

              {/* Scroll Progress Indicator */}
              <motion.div
                className='h-1 bg-linear-to-r from-blue-500 to-purple-600 rounded-full'
                style={{ width: scrollProgress }}
              />
            </div>
          </div>

          {/* Middle Section: Search */}
          {showSearch && (
            <div className='flex-1 max-w-2xl mx-4 hidden lg:block'>
              <HeaderSearch
                isOpen={isSearchOpen}
                onOpenChange={setIsSearchOpen}
              />
            </div>
          )}

          {/* Right Section: Actions */}
          <div className='flex items-center space-x-2'>
            {/* Search Button (Mobile) */}
            {showSearch && (
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className='p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden'
                aria-label='Search'
              >
                <FiMenu className='w-5 h-5 text-gray-600' />
              </motion.button>
            )}

            {/* Messages */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className='p-2 rounded-lg hover:bg-gray-100 transition-colors relative'
              aria-label='Messages'
            >
              <FiMessageSquare className='w-5 h-5 text-gray-600' />
              <span className='absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse' />
            </motion.button>

            {/* Notifications */}
            <NotificationBell />
            {/* User Menu */}
            <HeaderUserMenu
              user={user}
              isOpen={isUserMenuOpen}
              onOpenChange={setIsUserMenuOpen}
            />

            {/* Quick Actions */}
            <HeaderActions />
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='py-3 lg:hidden'
          >
            <HeaderSearch
              isOpen={isSearchOpen}
              onOpenChange={setIsSearchOpen}
              autoFocus
            />
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
