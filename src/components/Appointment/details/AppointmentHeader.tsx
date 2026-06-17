import React from 'react';
import { FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi';

interface AppointmentHeaderProps {
  appointmentDate: string;
  appointmentTime: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

const AppointmentHeader: React.FC<AppointmentHeaderProps> = ({
  appointmentDate,
  appointmentTime,
  onBack,
  onEdit,
  onDelete,
  formatDate,
  formatTime,
}) => {
  return (
    <div className='mb-8'>
      <button
        onClick={onBack}
        className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
      >
        <FiArrowLeft className='w-5 h-5' />
        Back to Appointments
      </button>

      <div className='flex justify-between items-start'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Appointment Details
          </h1>
          <p className='text-gray-600 mt-2'>
            {formatDate(appointmentDate)} at {formatTime(appointmentTime)}
          </p>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={onEdit}
            className='flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors'
          >
            <FiEdit className='w-4 h-4' />
            Edit
          </button>
          <button
            onClick={onDelete}
            className='flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors'
          >
            <FiTrash2 className='w-4 h-4' />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentHeader;
