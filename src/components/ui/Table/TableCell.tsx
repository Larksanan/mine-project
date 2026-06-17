import React from 'react';

interface TableCellProps {
  children: React.ReactNode;
}

const TableCell: React.FC<TableCellProps> = ({ children }) => {
  return (
    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'>
      {children}
    </td>
  );
};

export default TableCell;
