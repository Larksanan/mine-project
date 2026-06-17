import React from 'react';
import { IReceptionistFormData } from '@/types/Receptionist';
import { FiPlus, FiX } from 'react-icons/fi';

interface AdditionalInfoSectionProps {
  formData: IReceptionistFormData;
  formErrors: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFieldChange: (field: string, value: any) => void;
  onArrayFieldChange: (
    field: 'skills' | 'languages',
    index: number,
    value: string
  ) => void;
  onAddArrayField: (field: 'skills' | 'languages') => void;
  onRemoveArrayField: (field: 'skills' | 'languages', index: number) => void;
}

const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  formData,
  formErrors,
  onFieldChange,
  onArrayFieldChange,
  onAddArrayField,
  onRemoveArrayField,
}) => {
  const commonSkills = [
    'Customer Service',
    'MS Office',
    'Data Entry',
    'Phone Etiquette',
    'Scheduling',
    'Medical Terminology',
    'EMR Systems',
    'Billing Software',
  ];

  const commonLanguages = ['English', 'Sinhala', 'Tamil', 'Hindi'];

  const addPredefinedSkill = (skill: string) => {
    const currentSkills = formData.skills || [''];
    if (!currentSkills.includes(skill)) {
      const emptyIndex = currentSkills.indexOf('');
      if (emptyIndex !== -1) {
        onArrayFieldChange('skills', emptyIndex, skill);
      } else {
        onFieldChange('skills', [...currentSkills, skill]);
      }
    }
  };

  const addPredefinedLanguage = (language: string) => {
    const currentLanguages = formData.languages || [''];
    if (!currentLanguages.includes(language)) {
      const emptyIndex = currentLanguages.indexOf('');
      if (emptyIndex !== -1) {
        onArrayFieldChange('languages', emptyIndex, language);
      } else {
        onFieldChange('languages', [...currentLanguages, language]);
      }
    }
  };

  return (
    <div className='space-y-8'>
      {/* Skills Section */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <div className='h-8 w-1 bg-purple-600 rounded'></div>
          <h3 className='text-lg font-medium text-gray-900'>Skills</h3>
        </div>

        {/* Quick Add Skills */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Quick Add Common Skills
          </label>
          <div className='flex flex-wrap gap-2'>
            {commonSkills.map(skill => (
              <button
                key={skill}
                type='button'
                onClick={() => addPredefinedSkill(skill)}
                disabled={(formData.skills || ['']).includes(skill)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  (formData.skills || ['']).includes(skill)
                    ? 'bg-green-50 border-green-300 text-green-700 cursor-not-allowed'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {(formData.skills || ['']).includes(skill) ? '✓ ' : '+ '}
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Skills */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Custom Skills
          </label>
          <div className='space-y-2'>
            {(formData.skills || ['']).map((skill, index) => (
              <div key={index} className='flex gap-2'>
                <input
                  type='text'
                  value={skill}
                  onChange={e =>
                    onArrayFieldChange('skills', index, e.target.value)
                  }
                  className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='e.g., Patient Management, MS Office'
                />
                {(formData.skills || ['']).length > 1 && (
                  <button
                    type='button'
                    onClick={() => onRemoveArrayField('skills', index)}
                    className='px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <FiX className='w-5 h-5' />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type='button'
            onClick={() => onAddArrayField('skills')}
            className='mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium'
          >
            <FiPlus className='w-4 h-4' />
            Add Skill
          </button>
        </div>
      </div>

      {/* Languages Section */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <div className='h-8 w-1 bg-indigo-600 rounded'></div>
          <h3 className='text-lg font-medium text-gray-900'>Languages</h3>
        </div>

        {/* Quick Add Languages */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Quick Add Common Languages
          </label>
          <div className='flex flex-wrap gap-2'>
            {commonLanguages.map(language => (
              <button
                key={language}
                type='button'
                onClick={() => addPredefinedLanguage(language)}
                disabled={(formData.languages || ['']).includes(language)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  (formData.languages || ['']).includes(language)
                    ? 'bg-green-50 border-green-300 text-green-700 cursor-not-allowed'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {(formData.languages || ['']).includes(language) ? '✓ ' : '+ '}
                {language}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Languages */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Custom Languages <span className='text-red-500'>*</span>
          </label>
          <div className='space-y-2'>
            {(formData.languages || ['']).map((lang: string, index: number) => (
              <div key={index} className='flex gap-2'>
                <input
                  type='text'
                  value={lang}
                  onChange={e =>
                    onArrayFieldChange('languages', index, e.target.value)
                  }
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.languages ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder='e.g., English, Sinhala, Tamil'
                />
                {(formData.languages || ['']).length > 1 && (
                  <button
                    type='button'
                    onClick={() => onRemoveArrayField('languages', index)}
                    className='px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <FiX className='w-5 h-5' />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type='button'
            onClick={() => onAddArrayField('languages')}
            className='mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium'
          >
            <FiPlus className='w-4 h-4' />
            Add Language
          </button>
          {formErrors.languages && (
            <p className='mt-2 text-sm text-red-600'>{formErrors.languages}</p>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <div className='h-8 w-1 bg-gray-600 rounded'></div>
          <h3 className='text-lg font-medium text-gray-900'>
            Additional Notes
          </h3>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={e => onFieldChange('notes', e.target.value)}
            rows={5}
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
            placeholder='Add any additional information about the receptionist, such as special certifications, previous work experience, or specific responsibilities...'
          />
          <p className='mt-1 text-xs text-gray-500'>
            {formData.notes?.length || 0} / 1000 characters
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoSection;
