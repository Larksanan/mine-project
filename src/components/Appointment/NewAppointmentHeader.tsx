import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

interface NewAppointmentHeaderProps {
  onBack: () => void;
}

const NewAppointmentHeader: React.FC<NewAppointmentHeaderProps> = ({
  onBack,
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
          <h1 className='text-3xl font-bold text-gray-900'>New Appointment</h1>
          <p className='text-gray-600 mt-2'>
            Schedule a new appointment with a patient
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentHeader;
