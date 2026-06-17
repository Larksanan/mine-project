import React from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'default' | 'white';
  label?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    default: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div
      className={twMerge(
        'flex flex-col items-center justify-center gap-2',
        className
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={twMerge(
          'rounded-full',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      {label && (
        <span className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
          {label}
        </span>
      )}
    </div>
  );
};

export default Spinner;
