import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isClearable?: boolean;
  startContent?: React.ReactNode;
  onClear?: () => void;
  onValueChange?: (value: string) => void;
}

const Input: React.FC<InputProps> = ({
  isClearable = false,
  startContent,
  onClear,
  onValueChange,
  className,
  value,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value || '');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInternalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  const handleClear = () => {
    setInternalValue('');
    onValueChange?.('');
    onClear?.();
  };

  return (
    <div className='relative'>
      {startContent && (
        <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
          {startContent}
        </div>
      )}
      <input
        value={internalValue}
        onChange={handleChange}
        className={twMerge(
          'w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-all duration-200',
          startContent && 'pl-10',
          isClearable && internalValue && 'pr-10',
          className
        )}
        {...props}
      />
      {isClearable && internalValue && (
        <button
          type='button'
          onClick={handleClear}
          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Input;
