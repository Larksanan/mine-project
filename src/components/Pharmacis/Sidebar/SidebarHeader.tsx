'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import HealthLogo from '@/components//Logo.static';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function SidebarHeader({
  isCollapsed,
  onToggle,
}: SidebarHeaderProps) {
  const handleLogoClick = () => {
    window.location.href = '/Pharmacist/dashboard';
  };

  return (
    <div className='flex items-center justify-between p-4 border-b border-gray-200'>
      <motion.button
        onClick={handleLogoClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className='flex items-center space-x-3 hover:opacity-80 transition-opacity'
        animate={{ width: isCollapsed ? 'auto' : '100%' }}
      >
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className='text-xl font-bold text-gray-900 whitespace-nowrap'
          >
            <HealthLogo />
          </motion.span>
        )}
      </motion.button>

      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(243, 244, 246, 1)' }}
        whileTap={{ scale: 0.9 }}
        className='p-2 rounded-lg transition-colors'
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <FiChevronRight className='w-4 h-4 text-gray-600' />
        ) : (
          <FiChevronLeft className='w-4 h-4 text-gray-600' />
        )}
      </motion.button>
    </div>
  );
}
