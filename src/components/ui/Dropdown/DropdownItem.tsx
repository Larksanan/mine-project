// ============================================
// DropdownItem.tsx
// ============================================
import React, { useContext } from 'react';
import { twMerge } from 'tailwind-merge';
import { DropdownContext } from './Dropdown';

interface DropdownItemProps {
  children: React.ReactNode;
  color?: 'default' | 'danger';
  onPress?: () => void;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  color = 'default',
  onPress,
}) => {
  const { setIsOpen } = useContext(DropdownContext);

  const handleClick = () => {
    onPress?.();
    setIsOpen(false);
  };

  return (
    <button
      onClick={handleClick}
      className={twMerge(
        'w-full text-left px-4 py-2.5 text-sm transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        color === 'danger'
          ? 'text-red-600 hover:text-red-700 dark:text-red-400'
          : 'text-gray-700 dark:text-gray-200'
      )}
    >
      {children}
    </button>
  );
};

export default DropdownItem;
