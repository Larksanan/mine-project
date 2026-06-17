import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';
import { Patient } from '@/types/appointment';

interface PatientInfoCardProps {
  patient: Patient;
  calculateAge: (dateOfBirth: Date) => number;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  patient,
  calculateAge,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiUser className='w-5 h-5 text-purple-600' />
        Patient Information
      </h2>

      <div className='space-y-4'>
        <div>
          <p className='text-lg font-semibold text-gray-900'>
            {patient.firstName} {patient.lastName}
          </p>
          <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
            <span className='flex items-center gap-1'>
              <FiCalendar className='w-4 h-4' />
              {calculateAge(patient.dateOfBirth)} years
            </span>
            <span className='capitalize'>{patient.gender.toLowerCase()}</span>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <FiMail className='w-4 h-4 text-gray-400' />
            <span>{patient.email}</span>
          </div>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <FiPhone className='w-4 h-4 text-gray-400' />
            <span>{patient.phone}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientInfoCard;
