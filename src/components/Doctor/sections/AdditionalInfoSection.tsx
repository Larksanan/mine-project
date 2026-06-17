/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface AdditionalInfoSectionProps {
  profile: any;
  formErrors: Record<string, string>;
  onArrayFieldChange: (
    field: 'languages' | 'services' | 'awards' | 'publications',
    index: number,
    value: string
  ) => void;
  onAddArrayField: (
    field: 'languages' | 'services' | 'awards' | 'publications'
  ) => void;
  onRemoveArrayField: (
    field: 'languages' | 'services' | 'awards' | 'publications',
    index: number
  ) => void;
}

const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  profile,
  formErrors,
  onArrayFieldChange,
  onAddArrayField,
  onRemoveArrayField,
}) => {
  return (
    <div className='space-y-6'>
      {/* Languages */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Languages <span className='text-red-500'>*</span>
        </label>
        {profile.languages.map((lang: string, index: number) => (
          <div key={index} className='flex gap-2 mb-2'>
            <input
              type='text'
              value={lang}
              onChange={e =>
                onArrayFieldChange('languages', index, e.target.value)
              }
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., English, Sinhala'
            />
            {profile.languages.length > 1 && (
              <button
                type='button'
                onClick={() => onRemoveArrayField('languages', index)}
                className='px-3 py-2 text-red-600 hover:text-red-800'
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type='button'
          onClick={() => onAddArrayField('languages')}
          className='mt-2 text-sm text-blue-600 hover:text-blue-800'
        >
          + Add Language
        </button>
        {formErrors.languages && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.languages}</p>
        )}
      </div>

      {/* Services */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Services Offered <span className='text-red-500'>*</span>
        </label>
        {profile.services.map((service: string, index: number) => (
          <div key={index} className='flex gap-2 mb-2'>
            <input
              type='text'
              value={service}
              onChange={e =>
                onArrayFieldChange('services', index, e.target.value)
              }
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., Consultation, Surgery'
            />
            {profile.services.length > 1 && (
              <button
                type='button'
                onClick={() => onRemoveArrayField('services', index)}
                className='px-3 py-2 text-red-600 hover:text-red-800'
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type='button'
          onClick={() => onAddArrayField('services')}
          className='mt-2 text-sm text-blue-600 hover:text-blue-800'
        >
          + Add Service
        </button>
        {formErrors.services && (
          <p className='mt-1 text-sm text-red-600'>{formErrors.services}</p>
        )}
      </div>

      {/* Awards (Optional) */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Awards (Optional)
        </label>
        {(profile.awards || []).map((award: string, index: number) => (
          <div key={index} className='flex gap-2 mb-2'>
            <input
              type='text'
              value={award}
              onChange={e =>
                onArrayFieldChange('awards', index, e.target.value)
              }
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., Best Doctor Award 2023'
            />
            <button
              type='button'
              onClick={() => onRemoveArrayField('awards', index)}
              className='px-3 py-2 text-red-600 hover:text-red-800'
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type='button'
          onClick={() => onAddArrayField('awards')}
          className='mt-2 text-sm text-blue-600 hover:text-blue-800'
        >
          + Add Award
        </button>
      </div>

      {/* Publications (Optional) */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Publications (Optional)
        </label>
        {(profile.publications || []).map((pub: string, index: number) => (
          <div key={index} className='flex gap-2 mb-2'>
            <input
              type='text'
              value={pub}
              onChange={e =>
                onArrayFieldChange('publications', index, e.target.value)
              }
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., Research paper title'
            />
            <button
              type='button'
              onClick={() => onRemoveArrayField('publications', index)}
              className='px-3 py-2 text-red-600 hover:text-red-800'
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type='button'
          onClick={() => onAddArrayField('publications')}
          className='mt-2 text-sm text-blue-600 hover:text-blue-800'
        >
          + Add Publication
        </button>
      </div>
    </div>
  );
};

export default AdditionalInfoSection;
