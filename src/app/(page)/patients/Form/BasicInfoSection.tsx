import React from 'react';
import { IPatientFormData } from '@/types/patients';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiUsers,
  FiTarget,
  FiActivity,
  FiDroplet,
  FiBriefcase,
  FiGlobe,
  FiDatabase,
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  nic: string;
}

interface BasicInfoSectionProps {
  formData: IPatientFormData;
  users: User[];
  loadingUsers: boolean;
  formErrors: Record<string, string>;
  onFormDataChange: (updates: Partial<IPatientFormData>) => void;
  onUserIdChange: (userId: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  users = [], // Default to empty array
  loadingUsers,
  formErrors,
  onFormDataChange,
  onUserIdChange,
}) => {
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const maritalStatuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'Tamil' },
    { code: 'si', name: 'Sinhala' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    onFormDataChange({ [name]: value });
  };

  const handleUserSelect = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      onUserIdChange(selectedUser.id);
      onFormDataChange({
        userId: selectedUser.id,
        email: selectedUser.email,
        nic: selectedUser.nic,
      });
    }
  };

  const calculateAge = () => {
    if (!formData.dateOfBirth) return null;
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const calculateBMI = () => {
    if (!formData.height || !formData.weight || formData.height === 0)
      return null;
    const heightInMeters = formData.height / 100;
    const bmi = formData.weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const getBMICategory = () => {
    const bmi = calculateBMI();
    if (!bmi) return null;

    const bmiNum = parseFloat(bmi);
    if (bmiNum < 18.5) return 'Underweight';
    if (bmiNum < 25) return 'Normal weight';
    if (bmiNum < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className='space-y-6'>
      {/* User Selection - OPTIONAL */}
      <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2 mb-4'>
          <FiDatabase size={20} />
          Link to Existing User (Optional)
        </h3>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Select User
          </label>
          {loadingUsers ? (
            <div className='flex items-center gap-2 text-gray-500'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              Loading users...
            </div>
          ) : !users || users.length === 0 ? (
            <p className='text-sm text-gray-500'>No users available</p>
          ) : (
            <>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiUser size={16} className='text-gray-400' />
                </div>
                <select
                  value={formData.userId || ''}
                  onChange={e => handleUserSelect(e.target.value)}
                  className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.userId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value=''>Select a user to link (optional)</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email} (NIC: {user.nic})
                    </option>
                  ))}
                </select>
              </div>
              {formErrors.userId && (
                <p className='mt-1 text-sm text-red-600'>{formErrors.userId}</p>
              )}
              {formData.userId && (
                <div className='mt-2 p-2 bg-green-50 border border-green-200 rounded'>
                  <p className='text-sm text-green-700'>
                    ✓ User selected. Email will be auto-filled.
                  </p>
                </div>
              )}
            </>
          )}
          <div className='mt-2 text-xs text-gray-500'>
            <p>
              • Linking a user allows the patient to log in with their account
            </p>
            <p>
              • If no user is selected, a patient-only record will be created
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Basic Info Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
            <FiUser size={20} />
            Basic Information
          </h3>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              First Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='firstName'
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='Jebarsan'
            />
            {formErrors.firstName && (
              <p className='mt-1 text-sm text-red-600'>
                {formErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Last Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='thtacroos'
            />
            {formErrors.lastName && (
              <p className='mt-1 text-sm text-red-600'>{formErrors.lastName}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiMail size={16} className='text-gray-400' />
              </div>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                disabled={!!formData.userId}
                className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                } ${formData.userId ? 'bg-gray-50' : ''}`}
                placeholder='john.doe@example.com'
              />
            </div>
            {formErrors.email && (
              <p className='mt-1 text-sm text-red-600'>{formErrors.email}</p>
            )}
            {formData.userId && (
              <p className='mt-1 text-xs text-blue-600'>
                Email is linked to selected user account
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Phone <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiPhone size={16} className='text-gray-400' />
              </div>
              <input
                type='tel'
                name='phone'
                value={formData.phone}
                onChange={handleInputChange}
                required
                className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='+94 77 123 4567'
              />
            </div>
            {formErrors.phone && (
              <p className='mt-1 text-sm text-red-600'>{formErrors.phone}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              NIC
            </label>
            <input
              type='text'
              name='nic'
              value={formData.nic}
              onChange={handleInputChange}
              disabled={!!formData.userId}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase ${
                formErrors.nic ? 'border-red-500' : 'border-gray-300'
              } ${formData.userId ? 'bg-gray-50' : ''}`}
              placeholder='123456789V'
            />
            <div>
              {formErrors.nic ? (
                <p className='mt-1 text-sm text-red-600'>{formErrors.nic}</p>
              ) : (
                <p className='mt-1 text-sm text-gray-500'>
                  Format: 123456789V or 123456789012
                </p>
              )}
              {formData.userId && (
                <p className='mt-1 text-xs text-blue-600'>
                  NIC is linked to selected user account
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Demographics Section */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
            <FiUsers size={20} />
            Demographics
          </h3>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Date of Birth <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiCalendar size={16} className='text-gray-400' />
              </div>
              <input
                type='date'
                name='dateOfBirth'
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {formErrors.dateOfBirth && (
              <p className='mt-1 text-sm text-red-600'>
                {formErrors.dateOfBirth}
              </p>
            )}
            {formData.dateOfBirth && (
              <p className='mt-1 text-sm text-gray-600'>
                Age: {calculateAge()} years
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Gender <span className='text-red-500'>*</span>
            </label>
            <select
              name='gender'
              value={formData.gender}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.gender ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value=''>Select gender</option>
              <option value='MALE'>Male</option>
              <option value='FEMALE'>Female</option>
              <option value='OTHER'>Other</option>
            </select>
            {formErrors.gender && (
              <p className='mt-1 text-sm text-red-600'>{formErrors.gender}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Height (cm)
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiTarget size={16} className='text-gray-400' />
                </div>
                <input
                  type='number'
                  name='height'
                  value={formData.height || ''}
                  onChange={handleInputChange}
                  min='0'
                  max='300'
                  className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='175'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Weight (kg)
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiActivity size={16} className='text-gray-400' />
                </div>
                <input
                  type='number'
                  name='weight'
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  min='0'
                  max='500'
                  className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='70'
                />
              </div>
            </div>
          </div>

          {formData.height && formData.weight && (
            <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-800'>
                BMI: {calculateBMI()} ({getBMICategory()})
              </p>
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Blood Type
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiDroplet size={16} className='text-gray-400' />
              </div>
              <select
                name='bloodType'
                value={formData.bloodType}
                onChange={handleInputChange}
                className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>Select blood type</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Marital Status
            </label>
            <select
              name='maritalStatus'
              value={formData.maritalStatus}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Select status</option>
              {maritalStatuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Occupation
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiBriefcase size={16} className='text-gray-400' />
              </div>
              <input
                type='text'
                name='occupation'
                value={formData.occupation}
                onChange={handleInputChange}
                className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='Software Engineer'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Preferred Language
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FiGlobe size={16} className='text-gray-400' />
              </div>
              <select
                name='preferredLanguage'
                value={formData.preferredLanguage}
                onChange={handleInputChange}
                className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
