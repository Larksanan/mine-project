'use client';
import { motion } from 'framer-motion';
import { FiInfo } from 'react-icons/fi';

interface BulkActionsBarProps {
  selectionCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  deleting: boolean;
}

export default function BulkActionsBar({
  selectionCount,
  onClearSelection,
  onBulkDelete,
  deleting,
}: BulkActionsBarProps) {
  if (selectionCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'
    >
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
            <FiInfo className='w-4 h-4 text-blue-600' />
          </div>
          <div>
            <p className='font-medium text-blue-900'>
              {selectionCount} item{selectionCount !== 1 ? 's' : ''} selected
            </p>
            <p className='text-sm text-blue-700'>
              Perform actions on selected items
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={onClearSelection}
            className='px-3 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
          >
            Clear Selection
          </button>
          <button
            onClick={onBulkDelete}
            disabled={deleting}
            className='px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
          >
            {deleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
