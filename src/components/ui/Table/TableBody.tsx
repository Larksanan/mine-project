import React from 'react';

interface TableBodyProps {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items?: any[];
  isLoading?: boolean;
  emptyContent?: string;
}

const TableBody: React.FC<TableBodyProps> = ({
  children,
  items,
  isLoading,
  emptyContent,
}) => {
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td colSpan={100} className='px-6 py-12 text-center'>
            <div className='flex justify-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (items && items.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={100}
            className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'
          >
            {emptyContent || 'No data found'}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
      {children}
    </tbody>
  );
};

export default TableBody;
