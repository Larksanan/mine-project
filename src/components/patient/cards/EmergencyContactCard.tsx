import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiPhone } from 'react-icons/fi';
import { Patient } from '@/types/patient';

interface EmergencyContactCardProps {
  patient: Patient;
}

const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  patient,
}) => {
  if (!patient.emergencyContact) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiAlertCircle className='w-5 h-5 text-red-600' />
        Emergency Contact
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <div className='flex justify-between mb-2'>
            <span className='text-gray-500'>Name:</span>
            <span className='text-gray-900 font-medium'>
              {patient.emergencyContact.name}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-500'>Relationship:</span>
            <span className='text-gray-900 capitalize'>
              {patient.emergencyContact.relationship.toLowerCase()}
            </span>
          </div>
        </div>
        <div>
          <div className='flex items-center gap-2 text-gray-900'>
            <FiPhone className='w-4 h-4 text-gray-400' />
            <span>{patient.emergencyContact.phone}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmergencyContactCard;
