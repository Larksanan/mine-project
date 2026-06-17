import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { AppointmentFormData } from '@/types/appointment';

interface AppointmentDetailsProps {
  formData: AppointmentFormData;
  formErrors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  getMinDate: () => string;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  formData,
  formErrors,
  onChange,
  getMinDate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiCalendar className='w-5 h-5 text-green-600' />
        Appointment Details
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Date *
          </label>
          <input
            type='date'
            name='appointmentDate'
            value={formData.appointmentDate}
            onChange={onChange}
            min={getMinDate()}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.appointmentDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.appointmentDate && (
            <p className='mt-1 text-sm text-red-600'>
              {formErrors.appointmentDate}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Time *
          </label>
          <input
            type='time'
            name='appointmentTime'
            value={formData.appointmentTime}
            onChange={onChange}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.appointmentTime ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.appointmentTime && (
            <p className='mt-1 text-sm text-red-600'>
              {formErrors.appointmentTime}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Duration *
          </label>
          <select
            name='duration'
            value={formData.duration}
            onChange={onChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Appointment Type *
          </label>
          <select
            name='type'
            value={formData.type}
            onChange={onChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='CONSULTATION'>Consultation</option>
            <option value='FOLLOW_UP'>Follow-up</option>
            <option value='CHECKUP'>Checkup</option>
            <option value='EMERGENCY'>Emergency</option>
            <option value='OTHER'>Other</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default AppointmentDetails;
