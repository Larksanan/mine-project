import React from 'react';
import { IDoctorProfile } from '@/types/doctors';

interface CredentialsSectionProps {
  profile: IDoctorProfile;
  formErrors: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onProfileChange: (field: keyof IDoctorProfile, value: any) => void;
  onArrayFieldChange: (
    field: 'qualifications',
    index: number,
    value: string
  ) => void;
  onAddArrayField: (field: 'qualifications') => void;
  onRemoveArrayField: (field: 'qualifications', index: number) => void;
}

const CredentialsSection: React.FC<CredentialsSectionProps> = ({
  profile,
  formErrors,
  onProfileChange,
  onArrayFieldChange,
  onAddArrayField,
  onRemoveArrayField,
}) => {
  return (
    <div className='space-y-6'>
      {/* License Number */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          License Number <span className='text-red-500'>*</span>
        </label>
        <input
          type='text'
          value={profile.licenseNumber}
          onChange={e =>
            onProfileChange('licenseNumber', e.target.value.toUpperCase())
          }
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.licenseNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder='Enter license number'
          required
        />
        {formErrors.licenseNumber && (
          <p className='mt-1 text-sm text-red-600'>
            {formErrors.licenseNumber}
          </p>
        )}
      </div>

      {/* License Expiry */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          License Expiry Date <span className='text-red-500'>*</span>
        </label>
        <input
          type='date'
          value={
            profile.licenseExpiry
              ? new Date(profile.licenseExpiry).toISOString().split('T')[0]
              : ''
          }
          onChange={e => onProfileChange('licenseExpiry', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.licenseExpiry ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {formErrors.licenseExpiry && (
          <p className='mt-1 text-sm text-red-600'>
            {formErrors.licenseExpiry}
          </p>
        )}
      </div>

      {/* Qualifications */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Qualifications <span className='text-red-500'>*</span>
        </label>
        {profile.qualifications.map((qual, index) => (
          <div key={index} className='flex gap-2 mb-2'>
            <input
              type='text'
              value={qual}
              onChange={e =>
                onArrayFieldChange('qualifications', index, e.target.value)
              }
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., MBBS, MD'
            />
            {profile.qualifications.length > 1 && (
              <button
                type='button'
                onClick={() => onRemoveArrayField('qualifications', index)}
                className='px-3 py-2 text-red-600 hover:text-red-800'
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type='button'
          onClick={() => onAddArrayField('qualifications')}
          className='mt-2 text-sm text-blue-600 hover:text-blue-800'
        >
          + Add Qualification
        </button>
        {formErrors.qualifications && (
          <p className='mt-1 text-sm text-red-600'>
            {formErrors.qualifications}
          </p>
        )}
      </div>
    </div>
  );
};

export default CredentialsSection;
