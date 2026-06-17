'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiClock } from 'react-icons/fi';

interface HeaderSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  autoFocus?: boolean;
}

const recentSearches = [
  'Aspirin 500mg',
  'Patient: John Doe',
  'Order #12345',
  'Pharmacy Inventory',
  'Prescription Renewal',
];

export default function HeaderSearch({
  isOpen,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenChange,
  autoFocus = false,
}: HeaderSearchProps) {
  const [query, setQuery] = useState('');
  const [showRecent, setShowRecent] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('Searching for:', query);
      // Implement search logic here
    }
  };

  return (
    <div className='relative'>
      <form onSubmit={handleSearch} className='relative'>
        <motion.div
          initial={false}
          animate={{ scale: isOpen ? 1 : 0.95 }}
          className='relative'
        >
          <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
          <input
            type='text'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowRecent(true)}
            placeholder='Search patients, medications, orders...'
            className='w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            autoFocus={autoFocus}
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => setQuery('')}
                type='button'
                className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors'
                aria-label='Clear search'
              >
                <FiX className='w-4 h-4 text-gray-500' />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </form>

      {/* Recent Searches Dropdown */}
      <AnimatePresence>
        {showRecent && query === '' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50'
          >
            <div className='px-4 py-2'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-gray-700'>
                  Recent Searches
                </span>
                <button className='text-xs text-blue-600 hover:text-blue-800'>
                  Clear All
                </button>
              </div>
              <div className='space-y-1'>
                {recentSearches.map((search, index) => (
                  <motion.button
                    key={search}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(243, 244, 246, 1)' }}
                    onClick={() => setQuery(search)}
                    className='flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left'
                  >
                    <FiClock className='w-4 h-4 text-gray-400' />
                    <span className='text-sm text-gray-700'>{search}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
