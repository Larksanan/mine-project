import React from 'react';
import Icon from '@/components/ui/Icon';
import { motion } from 'framer-motion';

interface PrescriptionNotesProps {
  notes?: string;
}

const PrescriptionNotes: React.FC<PrescriptionNotesProps> = ({ notes }) => {
  if (!notes) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'
    >
      <div className='flex items-center gap-3 mb-3'>
        <div className='shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center'>
          <Icon name='FiFileText' size='sm' color='#f59e0b' />
        </div>
        <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
          Doctor&#39;s Notes
        </h4>
      </div>

      <div className='bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-4'>
        <p className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
          {notes}
        </p>
      </div>
    </motion.div>
  );
};

export default PrescriptionNotes;
