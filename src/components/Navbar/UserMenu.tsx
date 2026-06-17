'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import UserAvatar from './UserAvatar';
import UserMenuItems from './UserMenuItems';

interface UserMenuProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userMenuVariants: Variants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1], // cubic-bezier equivalent of easeOutExpo
      },
    },
  };

  return (
    <motion.div className='relative' ref={userMenuRef}>
      <motion.button
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className='flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20 shadow-sm hover:shadow-md transition-all duration-300'
      >
        <UserAvatar user={user} showDetails />
        <motion.div
          animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className='h-4 w-4 text-gray-400' />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isUserMenuOpen && (
          <motion.div
            variants={userMenuVariants}
            initial='closed'
            animate='open'
            exit='closed'
            className='absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50'
          >
            <UserMenuItems
              user={user}
              onItemClick={() => setIsUserMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
