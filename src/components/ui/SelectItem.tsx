import React from 'react';
import { twMerge } from 'tailwind-merge';
import { FiCheck } from 'react-icons/fi';

export interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const SelectItem: React.FC<SelectItemProps> = ({
  children,
  selected = false,
  onClick,
  className,
}) => {
  return (
    <button
      type='button'
      onClick={onClick}
      className={twMerge(
        'w-full px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700',
        'flex items-center justify-between',
        'transition-colors duration-150',
        selected &&
          'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        className
      )}
    >
      <span>{children}</span>
      {selected && <FiCheck className='w-4 h-4' />}
    </button>
  );
};

export default SelectItem;
