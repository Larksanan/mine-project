import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { FiSearch } from 'react-icons/fi';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  debounce?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  size = 'md',
  debounce = 300,
}) => {
  const [internalValue, setInternalValue] = React.useState(value ?? '');

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  React.useEffect(() => {
    setInternalValue(value ?? '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounce);
  };

  const sizeClasses = {
    sm: 'py-2 text-sm',
    md: 'py-2.5',
    lg: 'py-3 text-lg',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileFocus={{ scale: 1.02 }}
      className='relative flex-1'
    >
      <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
        <FiSearch className='w-4 h-4' />
      </div>
      <input
        type='text'
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={twMerge(
          'w-full pl-10 pr-4',
          sizeClasses[size],
          'border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-gray-100',
          'rounded-lg focus:outline-none',
          'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-all duration-200',
          className
        )}
      />
      {internalValue && (
        <button
          type='button'
          onClick={() => {
            setInternalValue('');
            onChange('');
          }}
          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        >
          ×
        </button>
      )}
    </motion.div>
  );
};

export default SearchInput;
