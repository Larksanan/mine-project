import { useRef, useEffect, useState } from 'react';
import {
  FiSearch,
  FiUser,
  FiAlertCircle,
  FiMapPin,
  FiHeart,
  FiCalendar,
  FiShield,
  FiActivity,
  FiEye,
  FiX,
} from 'react-icons/fi';

// Import your types and utilities
import {
  Patient,
  calculateAge,
  formatPhoneNumber,
  getAgeGroup,
  getGenderText,
  isInsuranceExpiring,
  formatDate,
} from '@/types/patient';

interface PatientSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onShowDropdown: (show: boolean) => void;
  onPatientSelect: (patient: Patient) => void;
  filteredPatients: Patient[];
  showPatientDropdown: boolean;
  isLoading?: boolean;
  error?: string;
  onAddNewPatient?: () => void;
}

const PatientSearch = ({
  searchTerm,
  onSearchChange,
  onShowDropdown,
  onPatientSelect,
  filteredPatients,
  showPatientDropdown,
  isLoading = false,
  error,
  onAddNewPatient,
}: PatientSearchProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetail, setShowPatientDetail] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        onShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onShowDropdown]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    onPatientSelect(patient);
    onShowDropdown(false);
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientDetail(true);
    onShowDropdown(false);
  };

  const closePatientDetail = () => {
    setShowPatientDetail(false);
    setSelectedPatient(null);
  };

  const formatBloodType = (bloodType: string): string => {
    return bloodType.replace('+', '⁺').replace('-', '⁻');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatAddress = (address?: any): string => {
    if (!address?.street) return 'No address provided';
    return [address.street, address.city, address.state]
      .filter(Boolean)
      .join(', ');
  };

  const hasMedicalInfo = (patient: Patient): boolean => {
    return !!(
      patient.allergies?.length ||
      patient.medications?.length ||
      patient.bloodType
    );
  };

  const getPatientStatus = (
    patient: Patient
  ): { label: string; color: string } => {
    if (patient.isActive === false) {
      return {
        label: 'Inactive',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      };
    }

    const lastUpdated = new Date(patient.updatedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (lastUpdated > thirtyDaysAgo) {
      return {
        label: 'Active',
        color: 'bg-green-100 text-green-800 border-green-200',
      };
    }

    return {
      label: 'No Recent Activity',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
    };
  };

  const renderPatientBadges = (patient: Patient) => {
    const status = getPatientStatus(patient);
    const badges = [];

    // Status badge
    badges.push(
      <span
        key='status'
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}
      >
        {status.label}
      </span>
    );

    // Blood type badge
    if (patient.bloodType) {
      badges.push(
        <span
          key='blood'
          className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200'
        >
          <FiHeart className='w-3 h-3 mr-1' />
          {formatBloodType(patient.bloodType)}
        </span>
      );
    }

    // Allergies badge
    if (patient.allergies?.length) {
      badges.push(
        <span
          key='allergies'
          className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200'
        >
          ⚠️ {patient.allergies.length}
        </span>
      );
    }

    // Insurance badge
    if (patient.insurance) {
      const isExpiring = isInsuranceExpiring(patient.insurance);
      badges.push(
        <span
          key='insurance'
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
            isExpiring
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-blue-100 text-blue-800 border-blue-200'
          }`}
        >
          <FiShield className='w-3 h-3 mr-1' />
          {isExpiring ? 'Expiring' : 'Insured'}
        </span>
      );
    }

    return badges;
  };

  const getPatientDetails = (patient: Patient) => {
    const age = calculateAge(patient.dateOfBirth);
    const ageGroup = getAgeGroup(patient.dateOfBirth);
    const gender = getGenderText(patient.gender);

    return {
      primary: `${patient.firstName} ${patient.lastName}`,
      contact: `${formatPhoneNumber(patient.phone)} • ${patient.email}`,
      demographics: `${age} years (${ageGroup.toLowerCase()}) • ${gender} • NIC: ${patient.nic}`,
      address: formatAddress(patient.address),
      hasMedicalInfo: hasMedicalInfo(patient),
    };
  };

  // Patient Detail Modal Component
  const PatientDetailModal = ({ patient }: { patient: Patient }) => {
    const age = calculateAge(patient.dateOfBirth);

    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
        <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
          {/* Header */}
          <div className='flex justify-between items-start p-6 border-b border-gray-200'>
            <div className='flex items-center space-x-4'>
              <div className='w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl'>
                {patient.firstName.charAt(0)}
                {patient.lastName.charAt(0)}
              </div>
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className='text-gray-600'>{patient.email}</p>
                <div className='flex flex-wrap gap-2 mt-2'>
                  {renderPatientBadges(patient)}
                </div>
              </div>
            </div>
            <button
              onClick={closePatientDetail}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <FiX className='w-6 h-6' />
            </button>
          </div>

          {/* Patient Details */}
          <div className='p-6 space-y-6'>
            {/* Personal Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Personal Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Full Name
                  </label>
                  <p className='text-gray-900'>
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    NIC
                  </label>
                  <p className='text-gray-900'>{patient.nic}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Date of Birth
                  </label>
                  <p className='text-gray-900'>
                    {formatDate(patient.dateOfBirth)} ({age} years)
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Gender
                  </label>
                  <p className='text-gray-900'>
                    {getGenderText(patient.gender)}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Phone
                  </label>
                  <p className='text-gray-900'>
                    {formatPhoneNumber(patient.phone)}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Email
                  </label>
                  <p className='text-gray-900'>{patient.email}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            {patient.address && (
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Address
                </h3>
                <div className='flex items-start space-x-2 text-gray-900'>
                  <FiMapPin className='w-5 h-5 text-gray-400 mt-0.5 shrink-0' />
                  <p>{formatAddress(patient.address)}</p>
                </div>
              </div>
            )}

            {/* Medical Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Medical Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {patient.bloodType && (
                  <div>
                    <label className='text-sm font-medium text-gray-600'>
                      Blood Type
                    </label>
                    <p className='text-gray-900'>
                      {formatBloodType(patient.bloodType)}
                    </p>
                  </div>
                )}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div>
                    <label className='text-sm font-medium text-gray-600'>
                      Allergies
                    </label>
                    <div className='flex flex-wrap gap-1'>
                      {patient.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800'
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {patient.medications && patient.medications.length > 0 && (
                  <div className='md:col-span-2'>
                    <label className='text-sm font-medium text-gray-600'>
                      Current Medications
                    </label>
                    <div className='flex flex-wrap gap-1'>
                      {patient.medications.map((medication, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                        >
                          {medication}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {patient.emergencyContact && (
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Emergency Contact
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-600'>
                      Name
                    </label>
                    <p className='text-gray-900'>
                      {patient.emergencyContact.name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-600'>
                      Relationship
                    </label>
                    <p className='text-gray-900'>
                      {patient.emergencyContact.relationship}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-600'>
                      Phone
                    </label>
                    <p className='text-gray-900'>
                      {patient.emergencyContact.phone
                        ? formatPhoneNumber(patient.emergencyContact.phone)
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-600'>
                      Email
                    </label>
                    <p className='text-gray-900'>
                      {patient.emergencyContact.email || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex justify-end space-x-3 p-6 border-t border-gray-200'>
            <button
              onClick={closePatientDetail}
              className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
            >
              Close
            </button>
            <button
              onClick={() => {
                onPatientSelect(patient);
                closePatientDetail();
              }}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Select Patient
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      <div>
        <label
          htmlFor='patient-search'
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          Select Patient *
        </label>

        <div className='flex gap-2 relative'>
          <div className='relative flex-1'>
            <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              ref={inputRef}
              id='patient-search'
              type='text'
              placeholder='Search by NIC, name, email, or phone...'
              value={searchTerm}
              onChange={e => {
                onSearchChange(e.target.value);
                onShowDropdown(true);
              }}
              onFocus={() => onShowDropdown(true)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  e.preventDefault();
                }
              }}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed'
              disabled={isLoading}
              aria-describedby={error ? 'search-error' : undefined}
            />
            {isLoading && (
              <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              </div>
            )}
          </div>

          <button
            type='button'
            onClick={() => {
              onShowDropdown(true);
            }}
            disabled={isLoading || !searchTerm.trim()}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center gap-2 whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            <FiSearch className='w-4 h-4' />
            {isLoading ? 'Searching...' : 'Search'}
          </button>

          {/* Dropdown */}
          {showPatientDropdown && (
            <div
              ref={dropdownRef}
              className='absolute z-20 w-full mt-12 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-auto'
              role='listbox'
              aria-labelledby='patient-search'
            >
              {isLoading ? (
                <div className='px-4 py-6 text-center text-gray-500'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto'></div>
                  <p className='mt-2'>Searching patients...</p>
                </div>
              ) : filteredPatients.length > 0 ? (
                <>
                  {filteredPatients.map(patient => {
                    const details = getPatientDetails(patient);
                    return (
                      <div
                        key={patient._id}
                        className='px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors group'
                        role='option'
                        aria-selected='false'
                      >
                        <div className='flex items-start gap-3'>
                          <div className='shrink-0 w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm mt-1'>
                            {patient.firstName.charAt(0)}
                            {patient.lastName.charAt(0)}
                          </div>

                          <div className='flex-1 min-w-0'>
                            {/* Header with name and badges */}
                            <div className='flex items-start justify-between mb-2'>
                              <div>
                                <div className='font-semibold text-gray-900 group-hover:text-blue-900'>
                                  {details.primary}
                                </div>
                                <div className='text-sm text-gray-600 mt-1'>
                                  {details.contact}
                                </div>
                              </div>
                              <div className='flex flex-wrap gap-1 justify-end'>
                                {renderPatientBadges(patient)}
                              </div>
                            </div>

                            {/* Demographics */}
                            <div className='flex items-center text-sm text-gray-600 mb-2'>
                              <FiCalendar className='w-4 h-4 mr-1 text-gray-400' />
                              {details.demographics}
                            </div>

                            {/* Address */}
                            <div className='flex items-center text-sm text-gray-600 mb-2'>
                              <FiMapPin className='w-4 h-4 mr-1 text-gray-400' />
                              {details.address}
                            </div>

                            {/* Medical info indicator */}
                            {details.hasMedicalInfo && (
                              <div className='flex items-center text-xs text-green-600'>
                                <FiActivity className='w-3 h-3 mr-1' />
                                Medical information available
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className='flex gap-2 mt-3'>
                              <button
                                onClick={() => handlePatientSelect(patient)}
                                className='px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors'
                              >
                                Select
                              </button>
                              <button
                                onClick={() => handleViewDetails(patient)}
                                className='px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1'
                              >
                                <FiEye className='w-3 h-3' />
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add new patient option */}
                  {onAddNewPatient && searchTerm.trim() && (
                    <div className='border-t border-gray-200 p-3 bg-gray-50'>
                      <button
                        type='button'
                        onClick={onAddNewPatient}
                        className='w-full text-center text-blue-600 hover:text-blue-800 font-medium text-sm py-2 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors'
                      >
                        + Add new patient: &quot;{searchTerm}&quot;
                      </button>
                    </div>
                  )}
                </>
              ) : searchTerm ? (
                <div className='px-4 py-6 text-center text-gray-500'>
                  <FiAlertCircle className='w-8 h-8 mx-auto text-gray-400 mb-2' />
                  <p className='font-medium text-gray-900'>No patients found</p>
                  <p className='text-sm mt-1'>
                    Try adjusting your search terms
                  </p>
                  {onAddNewPatient && (
                    <button
                      type='button'
                      onClick={onAddNewPatient}
                      className='mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm'
                    >
                      Add New Patient
                    </button>
                  )}
                </div>
              ) : (
                <div className='px-4 py-6 text-center text-gray-500'>
                  <FiUser className='w-8 h-8 mx-auto text-gray-400 mb-2' />
                  <p className='font-medium text-gray-900'>
                    Search for patients
                  </p>
                  <p className='text-sm mt-1'>
                    Enter NIC, name, email, or phone number
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id='search-error'
            className='mt-1 text-sm text-red-600 flex items-center gap-1'
          >
            <FiAlertCircle className='w-4 h-4' />
            {error}
          </p>
        )}

        {/* Search tips */}
        {!searchTerm && (
          <div className='mt-2 text-xs text-gray-500'>
            <p>
              Search by: NIC number, full name, email address, or phone number
            </p>
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      {showPatientDetail && selectedPatient && (
        // eslint-disable-next-line react-hooks/static-components
        <PatientDetailModal patient={selectedPatient} />
      )}
    </div>
  );
};

export default PatientSearch;
