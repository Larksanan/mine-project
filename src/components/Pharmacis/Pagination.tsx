/* eslint-disable no-undef */
import { motion } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  const renderPageNumbers = () => {
    const pages = [];

    // Always show first page
    pages.push(1);

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis if needed
    if (start > 2) {
      pages.push('ellipsis-start');
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (end < totalPages - 1) {
      pages.push('ellipsis-end');
    }

    // Always show last page if different from first
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className='mt-8 flex justify-center gap-3'
    >
      {/* Previous Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className='flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50/50 backdrop-blur-sm transition-all duration-300'
      >
        Previous
      </motion.button>

      {/* Page Numbers */}
      <div className='flex items-center gap-2'>
        {renderPageNumbers().map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span key={`${page}-${index}`} className='px-2 text-gray-400'>
                ...
              </span>
            );
          }

          return (
            <motion.button
              key={page}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentPage(Number(page))}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                currentPage === page
                  ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </motion.button>
          );
        })}
      </div>

      {/* Next Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className='flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50/50 backdrop-blur-sm transition-all duration-300'
      >
        Next
      </motion.button>
    </motion.div>
  );
};

export default Pagination;
