import React from 'react';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiEye,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
} from 'react-icons/fi';
import { Patient } from '@/types/patient';
import { calculateAge, formatDate, getGenderText } from '@/types/patient';

interface PatientTableRowProps {
  patient: Patient;
  index: number;
  deletingId: string | null;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PatientTableRow: React.FC<PatientTableRowProps> = ({
  patient,
  index,
  deletingId,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className='hover:bg-gray-50'
    >
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className='flex items-center'>
          <div className='shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center'>
            <FiUser className='w-5 h-5 text-blue-600' />
          </div>
          <div className='ml-4'>
            <div className='text-sm font-medium text-gray-900'>
              {patient.firstName} {patient.lastName}
            </div>
            <div className='text-sm text-gray-500'>
              ID: {patient._id.slice(-8)}
            </div>
          </div>
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className='text-sm text-gray-900 flex items-center gap-1 mb-1'>
          <FiMail className='w-4 h-4 text-gray-400' />
          {patient.email}
        </div>
        <div className='text-sm text-gray-500 flex items-center gap-1'>
          <FiPhone className='w-4 h-4 text-gray-400' />
          {patient.phone}
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className='text-sm text-gray-900'>
          {calculateAge(patient.dateOfBirth)} years
        </div>
        <div className='text-sm text-gray-500 capitalize'>
          {getGenderText(patient.gender).toLowerCase()}
        </div>
      </td>
      <td className='px-6 py-4'>
        <div className='text-sm text-gray-900 space-y-1'>
          {patient.allergies && patient.allergies.length > 0 && (
            <div>
              <span className='text-red-600 font-medium'>Allergies:</span>{' '}
              {patient.allergies.join(', ')}
            </div>
          )}
          {patient.medications && patient.medications.length > 0 && (
            <div>
              <span className='text-blue-600 font-medium'>Meds:</span>{' '}
              {patient.medications.join(', ')}
            </div>
          )}
          {(!patient.allergies || patient.allergies.length === 0) &&
            (!patient.medications || patient.medications.length === 0) && (
              <span className='text-gray-400'>No medical info</span>
            )}
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className='text-sm text-gray-900'>
          {formatDate(patient.createdAt)}
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
        <div className='flex justify-end gap-2'>
          <button
            onClick={() => onView(patient._id)}
            className='text-blue-600 hover:text-blue-900 p-1 transition-colors'
            title='View Details'
          >
            <FiEye className='w-4 h-4' />
          </button>
          <button
            onClick={() => onEdit(patient._id)}
            className='text-green-600 hover:text-green-900 p-1 transition-colors'
            title='Edit Patient'
          >
            <FiEdit className='w-4 h-4' />
          </button>
          <button
            onClick={() => onDelete(patient._id)}
            disabled={deletingId === patient._id}
            className='text-red-600 hover:text-red-900 p-1 disabled:opacity-50 transition-colors'
            title='Delete Patient'
          >
            {deletingId === patient._id ? (
              <FiRefreshCw className='w-4 h-4 animate-spin' />
            ) : (
              <FiTrash2 className='w-4 h-4' />
            )}
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

export default PatientTableRow;
