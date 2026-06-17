import React from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2 } from 'react-icons/fi';

interface ChartPlaceholderProps {
  timeRange: string;
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ timeRange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'
    >
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Performance Overview
      </h3>
      <div className='h-64 flex items-center justify-center bg-gray-50 rounded-lg'>
        <div className='text-center'>
          <FiBarChart2 className='w-12 h-12 text-gray-400 mx-auto mb-2' />
          <p className='text-gray-500'>
            Chart visualization would be implemented here
          </p>
          <p className='text-sm text-gray-400'>Showing data for {timeRange}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ChartPlaceholder;
