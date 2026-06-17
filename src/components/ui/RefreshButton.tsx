import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { FiRefreshCw } from 'react-icons/fi';

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  className?: string;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  loading = false,
  label = 'Refresh Data',
  className,
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={loading}
      className={twMerge(
        'inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm',
        'text-sm font-medium text-gray-700 bg-white hover:bg-gray-50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        className
      )}
    >
      <motion.div
        animate={loading ? { rotate: 360 } : {}}
        transition={
          loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}
        }
      >
        <FiRefreshCw
          className={twMerge('w-4 h-4 mr-2', loading && 'animate-spin')}
        />
      </motion.div>
      {label}
    </motion.button>
  );
};

export default RefreshButton;
