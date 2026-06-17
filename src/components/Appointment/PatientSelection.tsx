import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiSearch } from 'react-icons/fi';
import { Patient, AppointmentFormData } from '@/types/appointment';
import { calculateAge, formatBloodType } from '@/utils/appointmentUtils';

interface PatientSelectionProps {
  formData: AppointmentFormData;
  patients?: Patient[];
  filteredPatients: Patient[];
  searchTerm: string;
  showPatientDropdown: boolean;
  formErrors: Record<string, string>;
  onSearchChange: (value: string) => void;
  onPatientSelect: (patient: Patient) => void;
  onShowDropdown: (show: boolean) => void;
  getSelectedPatient: () => Patient | undefined;
}

const PatientSelection: React.FC<PatientSelectionProps> = ({
  searchTerm,
  formErrors,
  onSearchChange,
  onPatientSelect, // This prop was not being used!
  getSelectedPatient, // Use this to get the selected patient
}) => {
  const [searching, setSearching] = useState(false);

  // Get selected patient from parent component instead of local state
  const selectedPatient = getSelectedPatient();

  const handleNicSearch = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      setSearching(true);

      const response = await fetch(`/api/patients/search?nic=${searchTerm}`);

      if (!response.ok) {
        throw new Error('Patient not found');
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Call the parent's onPatientSelect to update formData.patientId
        onPatientSelect(result.data);
      } else {
        throw new Error('Patient not found with this NIC');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      alert('Patient not found with this NIC number');
    } finally {
      setSearching(false);
    }
  };

  const handleClearPatient = () => {
    // Clear the patient selection in parent component
    onPatientSelect({ _id: '' } as Patient);
    onSearchChange('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiUser className='w-5 h-5 text-blue-600' />
        Patient Information
      </h2>

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Search by NIC Number *
          </label>

          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                name='patientSearch'
                placeholder='Enter patient NIC number...'
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNicSearch();
                  }
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.patientId ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>

            <button
              type='button'
              onClick={handleNicSearch}
              disabled={searching}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50'
            >
              <FiSearch className='w-4 h-4' />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {formErrors.patientId && !selectedPatient && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.patientId}</p>
          )}
        </div>

        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className='bg-blue-50 border border-blue-200 rounded-lg p-4'
          >
            <div className='flex items-center justify-between mb-3'>
              <h3 className='font-medium text-blue-900'>Selected Patient</h3>
              <button
                type='button'
                onClick={handleClearPatient}
                className='text-blue-600 hover:text-blue-800 text-sm font-medium'
              >
                Change Patient
              </button>
            </div>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-blue-700'>Name:</span>
                <p className='text-blue-900 font-medium'>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
              </div>
              <div>
                <span className='text-blue-700'>NIC:</span>
                <p className='text-blue-900'>{selectedPatient.nic}</p>
              </div>
              <div>
                <span className='text-blue-700'>Email:</span>
                <p className='text-blue-900'>{selectedPatient.email}</p>
              </div>
              <div>
                <span className='text-blue-700'>Phone:</span>
                <p className='text-blue-900'>{selectedPatient.phone}</p>
              </div>
              <div>
                <span className='text-blue-700'>Age:</span>
                <p className='text-blue-900'>
                  {calculateAge(selectedPatient.dateOfBirth)} years
                </p>
              </div>
              <div>
                <span className='text-blue-700'>Gender:</span>
                <p className='text-blue-900 capitalize'>
                  {selectedPatient.gender.toLowerCase()}
                </p>
              </div>
              {selectedPatient.bloodType && (
                <div>
                  <span className='text-blue-700'>Blood Type:</span>
                  <p className='text-blue-900'>
                    {formatBloodType(selectedPatient.bloodType)}
                  </p>
                </div>
              )}
              {selectedPatient.height && (
                <div>
                  <span className='text-blue-700'>Height:</span>
                  <p className='text-blue-900'>{selectedPatient.height} cm</p>
                </div>
              )}
              {selectedPatient.weight && (
                <div>
                  <span className='text-blue-700'>Weight:</span>
                  <p className='text-blue-900'>{selectedPatient.weight} kg</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PatientSelection;
