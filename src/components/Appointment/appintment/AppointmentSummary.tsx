import React from 'react';
import { motion } from 'framer-motion';
import { AppointmentFormData } from '@/types/appointment';

interface AppointmentSummaryProps {
  formData: AppointmentFormData;
}

const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
  formData,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-lg font-semibold text-gray-900 mb-4'>
        Appointment Summary
      </h2>

      <div className='space-y-3 text-sm'>
        <div className='flex justify-between'>
          <span className='text-gray-500'>Status:</span>
          <span className='font-medium text-blue-600'>Scheduled</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-500'>Duration:</span>
          <span className='font-medium'>{formData.duration} minutes</span>
        </div>
        {formData.appointmentDate && (
          <div className='flex justify-between'>
            <span className='text-gray-500'>Date:</span>
            <span className='font-medium'>
              {new Date(formData.appointmentDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
        {formData.appointmentTime && (
          <div className='flex justify-between'>
            <span className='text-gray-500'>Time:</span>
            <span className='font-medium'>
              {new Date(
                `2000-01-01T${formData.appointmentTime}`
              ).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentSummary;
