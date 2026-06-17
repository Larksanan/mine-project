import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface FilterSectionProps {
  children: React.ReactNode;
  isOpen: boolean;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const FilterSection: React.FC<FilterSectionProps> = ({
  children,
  isOpen,
  className,
  padding = 'md',
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={twMerge(
            'mt-4 bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'rounded-lg shadow-sm',
            paddingClasses[padding],
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterSection;
