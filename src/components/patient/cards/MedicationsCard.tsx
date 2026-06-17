import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import { Patient } from '@/types/patient';

interface MedicationsCardProps {
  patient: Patient;
}

const MedicationsCard: React.FC<MedicationsCardProps> = ({ patient }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
          <FiPlus className='w-5 h-5 text-blue-600' />
          Current Medications
        </h2>
        <button className='text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1'>
          <FiPlus className='w-4 h-4' />
          Add Medication
        </button>
      </div>

      {patient.medications && patient.medications.length > 0 ? (
        <div className='space-y-3'>
          {patient.medications.map((medication, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200'
            >
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <FiPlus className='w-4 h-4 text-blue-600' />
                </div>
                <div>
                  <span className='font-medium text-gray-900'>
                    {medication}
                  </span>
                  <div className='text-sm text-gray-500'>Active</div>
                </div>
              </div>
              <div className='flex gap-2'>
                <button className='text-blue-600 hover:text-blue-700 text-sm'>
                  Edit
                </button>
                <button className='text-red-600 hover:text-red-700 text-sm'>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-6'>
          <FiPlus className='mx-auto h-8 w-8 text-gray-400 mb-2' />
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No medications
          </h3>
          <p className='text-gray-500 mb-4'>
            No current medications recorded for this patient.
          </p>
          <button className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
            <FiPlus className='w-4 h-4' />
            Add First Medication
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MedicationsCard;
