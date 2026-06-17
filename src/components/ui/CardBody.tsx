import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CardBody: React.FC<CardBodyProps> = ({
  children,
  className,
  padding = 'md',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={twMerge(paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

export default CardBody;
