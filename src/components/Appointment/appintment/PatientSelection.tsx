import React from 'react';
import { FiUser, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Patient } from '@/types/appointment';

interface PatientSelectionProps {
  patients: Patient[];
  filteredPatients: Patient[];
  searchTerm: string;
  showPatientDropdown: boolean;
  selectedPatientId: string;
  formErrors: Record<string, string>;
  onSearchChange: (value: string) => void;
  onShowDropdown: (show: boolean) => void;
  onPatientSelect: (patient: Patient) => void;
  calculateAge: (dateOfBirth: Date) => number;
  getSelectedPatient: () => Patient | undefined;
  onSearch?: () => void; // Optional search handler
}

const PatientSelection: React.FC<PatientSelectionProps> = ({
  filteredPatients,
  searchTerm,
  showPatientDropdown,
  selectedPatientId,
  formErrors,
  onSearchChange,
  onShowDropdown,
  onPatientSelect,
  calculateAge,
  getSelectedPatient,
  onSearch,
}) => {
  const selectedPatient = getSelectedPatient();

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch();
    } else {
      // Default search behavior - show dropdown if not already shown
      if (!showPatientDropdown && searchTerm) {
        onShowDropdown(true);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchClick();
    }
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
        {/* SEARCH FIELD WITH BUTTON */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Select Patient *
          </label>

          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />

              <input
                type='text'
                placeholder='Search patients by NIC'
                value={searchTerm}
                onChange={e => {
                  onSearchChange(e.target.value);
                  onShowDropdown(true);
                }}
                onFocus={() => onShowDropdown(true)}
                onKeyPress={handleKeyPress}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />

              {/* DROPDOWN */}
              {showPatientDropdown && filteredPatients.length > 0 && (
                <div className='absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto'>
                  {filteredPatients.map(patient => (
                    <div
                      key={patient._id}
                      onClick={() => {
                        onPatientSelect(patient);
                        onShowDropdown(false);
                      }}
                      className='px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0'
                    >
                      <div className='font-medium text-gray-900'>
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {patient.email} • {calculateAge(patient.dateOfBirth)}{' '}
                        years • {patient.gender.toLowerCase()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEARCH BUTTON */}
            <button
              type='button'
              onClick={handleSearchClick}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center gap-2'
            >
              <FiSearch className='w-4 h-4' />
              Search
            </button>
          </div>

          {/* VALIDATION ERROR */}
          {formErrors.patientId && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.patientId}</p>
          )}
        </div>

        {/* SELECTED PATIENT CARD */}
        {selectedPatientId && selectedPatient && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h3 className='font-medium text-blue-900 mb-2'>Selected Patient</h3>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-blue-700'>Name:</span>
                <p className='text-blue-900 font-medium'>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
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
                <span className='text-blue-700'>NIC:</span>
                <p className='text-blue-900'>{selectedPatient.nic}</p>
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
                  <p className='text-blue-900'>{selectedPatient.bloodType}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PatientSelection;
