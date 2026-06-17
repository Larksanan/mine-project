import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiFileText } from 'react-icons/fi';
import { Appointment } from '@/types/appointment';

interface AppointmentInfoProps {
  appointment: Appointment;
  getTypeText: (type: string) => string;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

const AppointmentInfo: React.FC<AppointmentInfoProps> = ({
  appointment,
  getTypeText,
  getStatusText,
  getStatusColor,
  formatDate,
  formatTime,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
        <FiCalendar className='w-5 h-5 text-blue-600' />
        Appointment Information
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Date & Time
          </label>
          <div className='flex items-center gap-2 text-gray-900'>
            <FiCalendar className='w-4 h-4 text-gray-400' />
            <span>{formatDate(appointment.appointmentDate)}</span>
          </div>
          <div className='flex items-center gap-2 text-gray-600 mt-1'>
            <FiClock className='w-4 h-4 text-gray-400' />
            <span>{formatTime(appointment.appointmentTime)}</span>
            <span className='text-sm text-gray-500'>
              ({appointment.duration} minutes)
            </span>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Type & Status
          </label>
          <div className='flex items-center gap-2 text-gray-900 mb-1'>
            <FiFileText className='w-4 h-4 text-gray-400' />
            <span>{getTypeText(appointment.type)}</span>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}
          >
            {getStatusText(appointment.status)}
          </span>
        </div>

        <div className='md:col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Reason for Visit
          </label>
          <p className='text-gray-900'>{appointment.reason}</p>
        </div>

        {appointment.symptoms && (
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Symptoms
            </label>
            <p className='text-gray-900'>{appointment.symptoms}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentInfo;
