import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ChipProps {
  children: React.ReactNode;
  color?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'default'
    | 'primary'
    | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'flat';
  className?: string;
}

const Chip: React.FC<ChipProps> = ({
  children,
  color = 'default',
  size = 'md',
  variant = 'solid',
  className,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const colorClasses = {
    solid: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-gray-600 text-white',
      success: 'bg-green-600 text-white',
      warning: 'bg-yellow-600 text-white',
      danger: 'bg-red-600 text-white',
      default: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    },
    outline: {
      primary: 'border border-blue-600 text-blue-600',
      secondary: 'border border-gray-600 text-gray-600',
      success: 'border border-green-600 text-green-600',
      warning: 'border border-yellow-600 text-yellow-600',
      danger: 'border border-red-600 text-red-600',
      default: 'border border-gray-300 text-gray-700',
    },
    flat: {
      primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      secondary:
        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      success:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    },
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full font-medium capitalize',
        sizeClasses[size],
        colorClasses[variant][color],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Chip;
