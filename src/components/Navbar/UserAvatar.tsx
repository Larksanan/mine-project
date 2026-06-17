'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiUser } from 'react-icons/fi';

interface UserAvatarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export default function UserAvatar({
  user,
  size = 'md',
  showDetails = false,
}: UserAvatarProps) {
  const sizes = {
    sm: { container: 'h-8 w-8', icon: 'h-4 w-4' },
    md: { container: 'h-10 w-10', icon: 'h-5 w-5' },
    lg: { container: 'h-12 w-12', icon: 'h-6 w-6' },
  };

  const currentSize = sizes[size];

  return (
    <div className='flex items-center space-x-3'>
      {user?.image ? (
        <motion.div
          className={`relative ${currentSize.container} rounded-full border-2 border-white shadow-md overflow-hidden`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Image
            src={user.image}
            alt={user.name || 'User'}
            fill
            sizes={`${size === 'sm' ? '32px' : size === 'md' ? '40px' : '48px'}`}
            className='object-cover'
          />
        </motion.div>
      ) : (
        <motion.div
          className={`${currentSize.container} rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white shadow-md`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <FiUser className={`${currentSize.icon} text-white`} />
        </motion.div>
      )}

      {showDetails && (
        <div className='text-left'>
          <div className='text-sm font-semibold text-gray-900'>
            {user?.name || 'User'}
          </div>
          <div className='text-xs text-gray-500'>
            {user?.role?.toLowerCase()}
          </div>
        </div>
      )}
    </div>
  );
}
