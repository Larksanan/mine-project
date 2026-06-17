import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { FiChevronDown } from 'react-icons/fi';
import SelectItem, { SelectItemProps } from './SelectItem';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  children,
  placeholder = 'Select an option',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Get selected label
  const getSelectedLabel = () => {
    let selectedLabel = '';

    React.Children.forEach(children, child => {
      if (React.isValidElement(child) && child.type === SelectItem) {
        const itemProps = child.props as SelectItemProps;
        if (itemProps.value === value) {
          selectedLabel = itemProps.children?.toString() || '';
        }
      }
    });

    return selectedLabel || placeholder;
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className='relative'>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={twMerge(
          'w-full px-3 py-2.5 text-left',
          'border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-gray-100',
          'rounded-lg focus:outline-none',
          'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'flex items-center justify-between',
          'transition-all duration-200',
          className
        )}
      >
        <span
          className={getSelectedLabel() === placeholder ? 'text-gray-500' : ''}
        >
          {getSelectedLabel()}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className='w-4 h-4 text-gray-400' />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto'
          >
            {React.Children.map(children, child => {
              if (!React.isValidElement(child) || child.type !== SelectItem) {
                return child;
              }

              const itemProps = child.props as SelectItemProps;
              const isSelected = itemProps.value === value;

              return React.cloneElement(child, {
                selected: isSelected,
                onClick: () => handleSelect(itemProps.value),
              } as React.ComponentProps<typeof SelectItem>);
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Select;
