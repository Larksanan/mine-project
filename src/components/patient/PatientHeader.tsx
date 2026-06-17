import React from 'react';
import { FiArrowLeft, FiUser, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { Patient } from '@/types/patient';
import { calculateAge, getGenderText } from '@/types/patient';

interface PatientHeaderProps {
  patient: Patient;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNewAppointment: () => void;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onBack,
  onEdit,
  onDelete,
  onNewAppointment,
}) => {
  return (
    <div className='mb-8'>
      <button
        onClick={onBack}
        className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
      >
        <FiArrowLeft className='w-5 h-5' />
        Back to Patients
      </button>

      <div className='flex justify-between items-start'>
        <div className='flex items-start gap-4'>
          <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
            <FiUser className='w-8 h-8 text-blue-600' />
          </div>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              {patient.firstName} {patient.lastName}
            </h1>
            <p className='text-gray-600 mt-1'>
              Patient ID: {patient._id.slice(-8)} •{' '}
              {calculateAge(patient.dateOfBirth)} years •{' '}
              {getGenderText(patient.gender)}
            </p>
          </div>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={onNewAppointment}
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <FiPlus className='w-4 h-4' />
            New Appointment
          </button>
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

export default PatientHeader;
