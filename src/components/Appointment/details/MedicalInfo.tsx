import React from 'react';
import { motion } from 'framer-motion';
import { FiFileText } from 'react-icons/fi';
import { Appointment } from '@/types/appointment';

interface MedicalInfoProps {
  appointment: Appointment;
}

const MedicalInfo: React.FC<MedicalInfoProps> = ({ appointment }) => {
  if (
    !appointment.diagnosis &&
    !appointment.prescription &&
    !appointment.notes
  ) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
        <FiFileText className='w-5 h-5 text-green-600' />
        Medical Information
      </h2>

      <div className='space-y-4'>
        {appointment.diagnosis && (
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Diagnosis
            </label>
            <p className='text-gray-900'>{appointment.diagnosis}</p>
          </div>
        )}

        {appointment.prescription && (
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Prescription
            </label>
            <p className='text-gray-900'>{appointment.prescription}</p>
          </div>
        )}

        {appointment.notes && (
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Doctor&apos;s Notes
            </label>
            <p className='text-gray-900 whitespace-pre-wrap'>
              {appointment.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MedicalInfo;
