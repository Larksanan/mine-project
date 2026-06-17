import React from 'react';
import { FaSort } from 'react-icons/fa';

interface TableColumnProps {
  children: React.ReactNode;
  key: string;
  allowsSorting?: boolean;
}

const TableColumn: React.FC<TableColumnProps> = ({
  children,
  allowsSorting,
}) => {
  return (
    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
      <div className='flex items-center space-x-1'>
        <span>{children}</span>
        {allowsSorting && <FaSort className='w-3 h-3 text-gray-400' />}
      </div>
    </th>
  );
};

export default TableColumn;
