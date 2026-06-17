'use client';

import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const AnalyticsHeader = ({
  timeRange,
  onTimeRangeChange,
}: AnalyticsHeaderProps) => {
  const timeRanges = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: '1year', label: 'Last Year' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='mb-8'
    >
      <div className='bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm'>
              <FiTrendingUp className='w-8 h-8' />
            </div>
            <div>
              <h1 className='text-3xl font-bold mb-1'>Analytics Dashboard</h1>
              <p className='text-blue-100'>
                Track your performance and patient insights
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {timeRanges.map(range => (
              <button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  timeRange === range.value
                    ? 'bg-white text-blue-600 shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsHeader;
