import React from 'react';
import Icon from '@/components/ui/Icon';
import { motion } from 'framer-motion';

interface PrescriptionDatesProps {
  startDate: string;
  endDate?: string;
  createdAt: string;
}

const PrescriptionDates: React.FC<PrescriptionDatesProps> = ({
  startDate,
  endDate,
  createdAt,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-LK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className='mb-6'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className='flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'
        >
          <div className='shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center'>
            <Icon name='FiCalendar' size='md' color='#10b981' />
          </div>
          <div>
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
              Start Date
            </p>
            <p className='font-semibold text-gray-900 dark:text-gray-100'>
              {formatDate(startDate)}
            </p>
          </div>
        </motion.div>

        {endDate && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className='flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'
          >
            <div className='shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center'>
              <Icon name='FiCalendar' size='md' color='#3b82f6' />
            </div>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                End Date
              </p>
              <p className='font-semibold text-gray-900 dark:text-gray-100'>
                {formatDate(endDate)}
              </p>
            </div>
          </motion.div>
        )}

        {endDate && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className='flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'
          >
            <div className='shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center'>
              <Icon name='FiClock' size='md' color='#8b5cf6' />
            </div>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                Duration
              </p>
              <p className='font-semibold text-gray-900 dark:text-gray-100'>
                {calculateDuration(startDate, endDate)} days
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          whileHover={{ scale: 1.02 }}
          className='md:col-span-3 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-2'
        >
          <Icon name='FiInfo' size='sm' className='text-gray-400' />
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Created on {formatDate(createdAt)}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PrescriptionDates;
