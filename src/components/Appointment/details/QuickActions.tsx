import React from 'react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiClock as FiClockIcon,
  FiXCircle,
  FiRefreshCw,
} from 'react-icons/fi';

interface QuickActionsProps {
  currentStatus: string;
  updating: boolean;
  onStatusUpdate: (status: string) => void;
  onRefresh: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  currentStatus,
  updating,
  onStatusUpdate,
  onRefresh,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-lg font-semibold text-gray-900 mb-4'>
        Quick Actions
      </h2>

      <div className='space-y-2'>
        <button
          onClick={() => onStatusUpdate('CONFIRMED')}
          disabled={updating || currentStatus === 'CONFIRMED'}
          className='w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors'
        >
          <FiCheckCircle className='w-4 h-4' />
          Confirm
        </button>

        <button
          onClick={() => onStatusUpdate('IN_PROGRESS')}
          disabled={updating || currentStatus === 'IN_PROGRESS'}
          className='w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors'
        >
          <FiClockIcon className='w-4 h-4' />
          Start Session
        </button>

        <button
          onClick={() => onStatusUpdate('COMPLETED')}
          disabled={updating || currentStatus === 'COMPLETED'}
          className='w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors'
        >
          <FiCheckCircle className='w-4 h-4' />
          Complete
        </button>

        <button
          onClick={() => onStatusUpdate('CANCELLED')}
          disabled={updating || currentStatus === 'CANCELLED'}
          className='w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors'
        >
          <FiXCircle className='w-4 h-4' />
          Cancel
        </button>

        <button
          onClick={onRefresh}
          disabled={updating}
          className='w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors'
        >
          <FiRefreshCw
            className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>
    </motion.div>
  );
};

export default QuickActions;
