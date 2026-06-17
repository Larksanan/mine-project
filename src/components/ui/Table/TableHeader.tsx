import React from 'react';

interface TableHeaderProps {
  children: React.ReactNode;
}

const TableHeader: React.FC<TableHeaderProps> = ({ children }) => {
  return (
    <thead className='bg-gray-50 dark:bg-gray-800'>
      <tr>{children}</tr>
    </thead>
  );
};

export default TableHeader;
