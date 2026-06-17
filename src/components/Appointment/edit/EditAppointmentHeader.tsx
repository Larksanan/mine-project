import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

interface EditAppointmentHeaderProps {
  onBack: () => void;
  patientName: string;
  originalDate: string;
  originalTime: string;
}

const EditAppointmentHeader: React.FC<EditAppointmentHeaderProps> = ({
  onBack,
  patientName,
  originalDate,
  originalTime,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className='mb-8'>
      <button
        onClick={onBack}
        className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
      >
        <FiArrowLeft className='w-5 h-5' />
        Back to Appointment Details
      </button>

      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Edit Appointment</h1>
        <p className='text-gray-600 mt-2'>
          For {patientName} • Originally scheduled for{' '}
          {formatDate(originalDate)} at {formatTime(originalTime)}
        </p>
      </div>
    </div>
  );
};

export default EditAppointmentHeader;
