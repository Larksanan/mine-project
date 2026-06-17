/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { IDoctorFormData, IDoctorProfile } from '@/types/doctors';

interface BasicInfoSectionProps {
  formData: IDoctorFormData;
  users: any[];
  loadingUsers: boolean;
  formErrors: Record<string, string>;
  specializations: string[];
  departments: string[];
  onProfileChange: (field: keyof IDoctorProfile, value: any) => void;
  onUserIdChange: (userId: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  users,
  loadingUsers,
  formErrors,
  specializations,
  departments,
  onProfileChange,
  onUserIdChange,
}) => {
  return (
    <div className='space-y-6'>
      {/* User Selection */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Select User <span className='text-red-500'>*</span>
        </label>
        {loadingUsers ? (
          <div className='text-sm text-gray-500'>Loading users...</div>
        ) : (
          <select
            value={formData.userId}
            onChange={e => onUserIdChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.userId ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value=''>Select a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
        )}
        {formErrors.userId && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.userId}</p>
        )}
      </div>

      {/* Specialization */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Specialization <span className='text-red-500'>*</span>
        </label>
        <select
          value={formData.profile.specialization}
          onChange={e => onProfileChange('specialization', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.specialization ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        >
          <option value=''>Select specialization</option>
          {specializations.map(spec => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
        {formErrors.specialization && (
          <p className='mt-1 text-sm text-red-600'>
            {formErrors.specialization}
          </p>
        )}
      </div>

      {/* Department */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Department <span className='text-red-500'>*</span>
        </label>
        <select
          value={formData.profile.department}
          onChange={e => onProfileChange('department', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.department ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        >
          <option value=''>Select department</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        {formErrors.department && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.department}</p>
        )}
      </div>

      {/* Experience */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Years of Experience <span className='text-red-500'>*</span>
        </label>
        <input
          type='number'
          min='0'
          max='60'
          value={formData.profile.experience}
          onChange={e =>
            onProfileChange('experience', parseInt(e.target.value) || 0)
          }
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.experience ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {formErrors.experience && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.experience}</p>
        )}
      </div>

      {/* Consultation Fee */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Consultation Fee (LKR) <span className='text-red-500'>*</span>
        </label>
        <input
          type='number'
          min='0'
          step='0.01'
          value={formData.profile.consultationFee}
          onChange={e =>
            onProfileChange('consultationFee', parseFloat(e.target.value) || 0)
          }
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.consultationFee ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {formErrors.consultationFee && (
          <p className='mt-1 text-sm text-red-600'>
            {formErrors.consultationFee}
          </p>
        )}
      </div>

      {/* Hospital Affiliation */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Hospital Affiliation
        </label>
        <input
          type='text'
          value={formData.profile.hospitalAffiliation || ''}
          onChange={e => onProfileChange('hospitalAffiliation', e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='Enter hospital name'
        />
      </div>
    </div>
  );
};

export default BasicInfoSection;
