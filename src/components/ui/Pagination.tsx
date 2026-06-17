import React from 'react';
import { twMerge } from 'tailwind-merge';

interface PaginationProps {
  page: number;
  total: number;
  onChange: (page: number) => void;
  isCompact?: boolean;
  showControls?: boolean;
  color?: 'primary' | 'default';
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  total,
  onChange,
  showControls = true,
  color = 'primary',
}) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  const getVisiblePages = () => {
    if (total <= 7) return pages;

    if (page <= 4) {
      return [...pages.slice(0, 5), '...', total];
    }

    if (page >= total - 3) {
      return [1, '...', ...pages.slice(total - 5)];
    }

    return [1, '...', page - 1, page, page + 1, '...', total];
  };

  const buttonClasses = (isActive: boolean) =>
    twMerge(
      'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
      isActive
        ? color === 'primary'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    );

  return (
    <nav className='flex items-center space-x-1'>
      {showControls && (
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className='px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Previous
        </button>
      )}

      <div className='flex items-center space-x-1'>
        {getVisiblePages().map((p, index) => (
          <React.Fragment key={index}>
            {p === '...' ? (
              <span className='px-3 py-2 text-gray-500'>...</span>
            ) : (
              <button
                onClick={() => onChange(p as number)}
                className={buttonClasses(page === p)}
              >
                {p}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {showControls && (
        <button
          onClick={() => onChange(Math.min(total, page + 1))}
          disabled={page === total}
          className='px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Next
        </button>
      )}
    </nav>
  );
};

export default Pagination;
