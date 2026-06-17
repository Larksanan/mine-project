import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { FiFilter } from 'react-icons/fi';

interface FilterButtonProps {
  onClick: () => void;
  active?: boolean;
  hasActiveFilters?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'solid' | 'ghost';
}

const FilterButton: React.FC<FilterButtonProps> = ({
  onClick,
  active = false,
  hasActiveFilters = false,
  label = 'Filters',
  className,
  size = 'md',
  variant = 'outline',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3',
  };

  const variantClasses = {
    outline:
      'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800',
    solid: 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent',
    ghost: 'hover:bg-gray-50 dark:hover:bg-gray-800',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={twMerge(
        'flex items-center gap-2 rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        active && 'ring-2 ring-blue-500 ring-offset-2',
        className
      )}
    >
      <motion.div
        animate={active ? { rotate: 180 } : { rotate: 0 }}
        transition={{ duration: 0.2 }}
      >
        <FiFilter className='w-4 h-4' />
      </motion.div>
      <span>{label}</span>
      {hasActiveFilters && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className='w-2 h-2 bg-blue-500 rounded-full'
        />
      )}
    </motion.button>
  );
};

export default FilterButton;
