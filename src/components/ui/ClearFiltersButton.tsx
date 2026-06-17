import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { FiX } from 'react-icons/fi';

interface ClearFiltersButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'text' | 'outline' | 'ghost';
}

const ClearFiltersButton: React.FC<ClearFiltersButtonProps> = ({
  onClick,
  label = 'Clear All',
  className,
  showIcon = true,
  variant = 'text',
}) => {
  const variantClasses = {
    text: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
    outline:
      'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 px-3 py-2 rounded-lg',
    ghost: 'hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={twMerge(
        'flex items-center gap-2 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variantClasses[variant],
        className
      )}
    >
      {showIcon && <FiX className='w-4 h-4' />}
      <span>{label}</span>
    </motion.button>
  );
};

export default ClearFiltersButton;
