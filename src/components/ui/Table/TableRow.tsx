import React from 'react';

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const TableRow: React.FC<TableRowProps> = ({
  children,
  className,
  onClick,
}) => {
  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export default TableRow;
