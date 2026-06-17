import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiDroplet } from 'react-icons/fi';
import { Patient } from '@/types/appointment';

interface PatientInfoProps {
  patient: Patient;
  calculateAge: (dateOfBirth: Date) => number;
}

const PatientInfo: React.FC<PatientInfoProps> = ({ patient, calculateAge }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiUser className='w-5 h-5 text-purple-600' />
        Patient Information
      </h2>

      <div className='space-y-4'>
        {/* Basic Information */}
        <div>
          <p className='text-lg font-semibold text-gray-900'>
            {patient.firstName} {patient.lastName}
          </p>
          <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2'>
            <span>Age: {calculateAge(patient.dateOfBirth)} years</span>
            <span className='capitalize'>{patient.gender.toLowerCase()}</span>
            {patient.bloodType && (
              <span className='flex items-center gap-1'>
                <FiDroplet className='w-3 h-3' />
                {patient.bloodType}
              </span>
            )}
            <span>NIC: {patient.nic}</span>
          </div>
        </div>

        {/* Contact Information */}
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

        {/* Quick Medical Info */}
        <div className='pt-2 border-t border-gray-100'>
          <div className='text-sm text-gray-600 space-y-1'>
            {patient.allergies && patient.allergies.length > 0 && (
              <div>
                <strong>Allergies:</strong> {patient.allergies.join(', ')}
              </div>
            )}
            {patient.medications && patient.medications.length > 0 && (
              <div>
                <strong>Medications:</strong> {patient.medications.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientInfo;
