import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';

interface StatsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: 'week' | 'month' | 'year') => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const StatsHeader: React.FC<StatsHeaderProps> = ({
  timeRange,
  onTimeRangeChange,
  onRefresh,
  refreshing,
}) => {
  return (
    <div className='mb-8'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Appointment Statistics
          </h1>
          <p className='text-gray-600 mt-2'>
            Overview of your appointment performance and trends
          </p>
        </div>
        <div className='flex gap-3'>
          <select
            value={timeRange}
            onChange={e =>
              onTimeRangeChange(e.target.value as 'week' | 'month' | 'year')
            }
            className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='week'>This Week</option>
            <option value='month'>This Month</option>
            <option value='year'>This Year</option>
          </select>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className='flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
          >
            <FiRefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsHeader;
