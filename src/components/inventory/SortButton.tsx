/* eslint-disable no-undef */
// components/inventory/SortButton.tsx
'use client';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

interface SortButtonProps {
  field: 'name' | 'quantity' | 'sellingPrice' | 'updatedAt';
  currentSortBy: 'name' | 'quantity' | 'sellingPrice' | 'updatedAt';
  currentSortOrder: 'asc' | 'desc';
  onClick: (field: 'name' | 'quantity' | 'sellingPrice' | 'updatedAt') => void;
  children: React.ReactNode;
}

export default function SortButton({
  field,
  currentSortBy,
  currentSortOrder,
  onClick,
  children,
}: SortButtonProps) {
  return (
    <button
      onClick={() => onClick(field)}
      className='flex items-center gap-1 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'
      aria-label={`Sort by ${field} in ${currentSortBy === field && currentSortOrder === 'asc' ? 'descending' : 'ascending'} order`}
    >
      {children}
      {currentSortBy === field &&
        (currentSortOrder === 'asc' ? (
          <FiChevronUp className='w-4 h-4' />
        ) : (
          <FiChevronDown className='w-4 h-4' />
        ))}
    </button>
  );
}
