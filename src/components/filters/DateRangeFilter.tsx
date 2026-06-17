import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { FiCalendar } from 'react-icons/fi';

interface DateRangeFilterProps {
  startDate: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  label?: string;
  showEndDate?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Date Range',
  showEndDate = true,
}) => {
  return (
    <div className='space-y-2'>
      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
        {label}
      </label>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        <motion.div whileHover={{ scale: 1.02 }} className='relative'>
          <FiCalendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <input
            type='date'
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
            className={twMerge(
              'w-full pl-10 pr-3 py-2.5',
              'border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'rounded-lg focus:outline-none',
              'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200'
            )}
          />
          <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400'>
            From
          </span>
        </motion.div>

        {showEndDate && onEndDateChange && (
          <motion.div whileHover={{ scale: 1.02 }} className='relative'>
            <FiCalendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='date'
              value={endDate || ''}
              onChange={e => onEndDateChange(e.target.value)}
              className={twMerge(
                'w-full pl-10 pr-3 py-2.5',
                'border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800',
                'text-gray-900 dark:text-gray-100',
                'rounded-lg focus:outline-none',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'transition-all duration-200'
              )}
              min={startDate}
            />
            <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400'>
              To
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;
