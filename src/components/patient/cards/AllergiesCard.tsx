import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';
import { Patient } from '@/types/patient';

interface AllergiesCardProps {
  patient: Patient;
}

const AllergiesCard: React.FC<AllergiesCardProps> = ({ patient }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiAlertCircle className='w-5 h-5 text-red-600' />
        Allergies
      </h2>

      {patient.allergies && patient.allergies.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {patient.allergies.map((allergy, index) => (
            <span
              key={index}
              className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200'
            >
              {allergy}
            </span>
          ))}
        </div>
      ) : (
        <p className='text-gray-500'>No allergies recorded</p>
      )}
    </motion.div>
  );
};

export default AllergiesCard;
