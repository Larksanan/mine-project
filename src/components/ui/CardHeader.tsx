import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {children}
    </div>
  );
};

export default CardHeader;
