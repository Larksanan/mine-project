import React from 'react';
import { FiArrowLeft, FiUser, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Patient } from '@/types/patient';
import { calculateAge, getGenderText } from '@/types/patient';

interface PatientHeaderProps {
  patient: Patient;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onBack,
  onEdit,
  onDelete,
  deleting = false,
}) => {
  const age = calculateAge(patient.dateOfBirth);
  const genderText = getGenderText(patient.gender);

  return (
    <div className='bg-white shadow-sm border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {/* Header Row */}
        <div className='flex items-center justify-between mb-4'>
          <button
            onClick={onBack}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
          >
            <FiArrowLeft className='w-5 h-5' />
            <span>Back to Patients</span>
          </button>

          <div className='flex items-center gap-2'>
            <button
              onClick={onEdit}
              className='px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
            >
              <FiEdit className='w-4 h-4' />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className='px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50'
            >
              <FiTrash2 className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Patient Info */}
        <div className='flex items-center gap-4'>
          <div className='h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center'>
            <FiUser className='h-8 w-8 text-blue-600' />
          </div>

          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              {patient.firstName} {patient.lastName}
            </h1>
            <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
              <span>
                {age} years • {genderText}
              </span>
              <span>{patient.phone}</span>
              <span>{patient.email}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  patient.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {patient.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
