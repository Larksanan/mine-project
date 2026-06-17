import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionMedicationsProps {
  medications: Medication[];
}

const PrescriptionMedications: React.FC<PrescriptionMedicationsProps> = ({
  medications,
}) => {
  return (
    <div className='mb-6'>
      <div className='flex items-center gap-2 mb-4'>
        <Icon name='FiActivity' size='md' color='#10b981' />
        <h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
          Medications ({medications.length})
        </h4>
      </div>

      <div className='space-y-3'>
        {medications.map((medication, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className='flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors'
          >
            <div className='shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center'>
              <span className='text-blue-600 dark:text-blue-400 font-bold'>
                {index + 1}
              </span>
            </div>

            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-1'>
                <span className='font-semibold text-gray-900 dark:text-gray-100'>
                  {medication.name}
                </span>
                <span className='text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded'>
                  {medication.dosage}
                </span>
              </div>

              <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
                <span className='flex items-center gap-1'>
                  <Icon name='FiClock' size='sm' />
                  {medication.frequency}
                </span>
                <span className='text-gray-300 dark:text-gray-600'>•</span>
                <span className='flex items-center gap-1'>
                  <Icon name='FiCalendar' size='sm' />
                  {medication.duration}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PrescriptionMedications;
