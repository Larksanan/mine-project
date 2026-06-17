import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit2, FiUser, FiCalendar } from 'react-icons/fi';
import { slideInFromLeft, slideInFromRight } from '@/animations/variants';
import { PatientData } from '@/types/patient';

interface PatientHeaderProps {
  patient: PatientData;
  onBack: () => void;
  onEdit: () => void;
  calculateAge: (dateOfBirth?: string) => string;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onBack,
  onEdit,
  calculateAge,
}) => {
  return (
    <div className='mb-6'>
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'
      >
        <FiArrowLeft className='w-5 h-5' />
        <span>Back to Patients</span>
      </motion.button>

      <div className='flex items-center justify-between'>
        <motion.div
          variants={slideInFromLeft}
          initial='initial'
          animate='animate'
        >
          <h1 className='text-3xl font-bold text-gray-900'>
            {patient.firstName} {patient.lastName}
          </h1>
          <div className='flex items-center gap-4 mt-2 text-gray-600'>
            <span className='flex items-center gap-1'>
              <FiUser className='w-4 h-4' />
              NIC: {patient.nic}
            </span>
            <span className='flex items-center gap-1'>
              <FiCalendar className='w-4 h-4' />
              Age: {calculateAge(patient.dateOfBirth)}
            </span>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                patient.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {patient.isActive ? 'Active' : 'Inactive'}
            </motion.span>
          </div>
        </motion.div>

        <motion.button
          variants={slideInFromRight}
          initial='initial'
          animate='animate'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md'
        >
          <FiEdit2 className='w-5 h-5' />
          Edit Patient
        </motion.button>
      </div>
    </div>
  );
};
