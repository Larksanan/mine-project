import React, { useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { DropdownContext } from './Dropdown';

interface DropdownMenuProps {
  children: React.ReactNode;
  align?: 'start' | 'end';
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  align = 'end',
}) => {
  const { isOpen, setIsOpen } = useContext(DropdownContext);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className={twMerge(
            'absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          <div className='py-1'>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DropdownMenu;
