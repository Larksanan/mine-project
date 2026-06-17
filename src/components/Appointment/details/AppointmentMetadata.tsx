import React from 'react';
import { motion } from 'framer-motion';

interface AppointmentMetadataProps {
  appointmentId: string;
  createdAt: string;
  updatedAt: string;
}

const AppointmentMetadata: React.FC<AppointmentMetadataProps> = ({
  appointmentId,
  createdAt,
  updatedAt,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className='bg-gray-50 border border-gray-200 rounded-xl p-6'
    >
      <h3 className='font-semibold text-gray-900 mb-3'>Appointment Details</h3>

      <div className='space-y-2 text-sm'>
        <div className='flex justify-between'>
          <span className='text-gray-500'>Created</span>
          <span className='text-gray-900'>
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className='flex justify-between'>
          <span className='text-gray-500'>Last Updated</span>
          <span className='text-gray-900'>
            {new Date(updatedAt).toLocaleDateString()}
          </span>
        </div>

        <div className='flex justify-between'>
          <span className='text-gray-500'>Appointment ID</span>
          <span className='text-gray-900 font-mono text-xs'>
            {appointmentId.slice(-8)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default AppointmentMetadata;
