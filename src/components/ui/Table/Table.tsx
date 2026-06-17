/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TableProps {
  children: React.ReactNode;
  'aria-label': string;
  bottomContent?: React.ReactNode;
  className?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

const Table: React.FC<TableProps> = ({
  children,
  'aria-label': ariaLabel,
  bottomContent,
  className,
  shadow = 'none',
  radius = 'lg',
  bordered = true,
  striped = false,
  hoverable = true,
}) => {
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  return (
    <div
      className={twMerge(
        'overflow-hidden bg-white dark:bg-gray-800',
        radiusClasses[radius],
        shadowClasses[shadow],
        bordered && 'border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className='overflow-x-auto'>
        <table
          aria-label={ariaLabel}
          className={twMerge('w-full border-collapse', 'text-sm text-left')}
        >
          {/* Add context for striped and hoverable */}
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                ...(child.props as Record<string, unknown>),
                striped,
                hoverable,
              } as any);
            }
            return child;
          })}
        </table>
      </div>
      {bottomContent && (
        <div className='border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'>
          {bottomContent}
        </div>
      )}
    </div>
  );
};

export default Table;

// TableHeader Component
interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <thead
      className={twMerge(
        'bg-gray-50 dark:bg-gray-900/50',
        'border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {children}
    </thead>
  );
};

// TableBody Component
interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  emptyContent?: React.ReactNode | string;
  striped?: boolean;
  hoverable?: boolean;
}

export const TableBody: React.FC<TableBodyProps> = ({
  children,
  className,
  isLoading,
  emptyContent = 'No data available',
  striped,
  hoverable,
}) => {
  // Show loading state
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td colSpan={100} className='px-6 py-12 text-center'>
            <div className='flex flex-col items-center justify-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4' />
              <p className='text-gray-600 dark:text-gray-400'>Loading...</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  // Show empty state
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={100}
            className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'
          >
            {emptyContent}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody
      className={twMerge(
        'divide-y divide-gray-200 dark:divide-gray-700',
        striped &&
          '[&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-gray-900/30',
        className
      )}
    >
      {React.Children.map(children, (child, _index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...(child.props as Record<string, unknown>),
            hoverable,
          } as any);
        }
        return child;
      })}
    </tbody>
  );
};

// TableRow Component
interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className,
  onClick,
  hoverable = true,
}) => {
  return (
    <tr
      className={twMerge(
        'transition-colors',
        hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

// TableCell Component
interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className,
  align = 'left',
  width,
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={twMerge(
        'px-6 py-4',
        'text-gray-900 dark:text-gray-100',
        alignClasses[align],
        className
      )}
      style={{ width }}
    >
      {children}
    </td>
  );
};

// TableColumn Component (for headers)
interface TableColumnProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  allowsSorting?: boolean;
  width?: string;
}

export const TableColumn: React.FC<TableColumnProps> = ({
  children,
  className,
  align = 'left',
  allowsSorting,
  width,
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th
      className={twMerge(
        'px-6 py-3',
        'text-xs font-semibold uppercase tracking-wider',
        'text-gray-700 dark:text-gray-300',
        alignClasses[align],
        allowsSorting &&
          'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800',
        className
      )}
      style={{ width }}
    >
      <div className='flex items-center gap-2'>
        {children}
        {allowsSorting && (
          <svg
            className='w-4 h-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
            />
          </svg>
        )}
      </div>
    </th>
  );
};

// Export all components
export { Table };
