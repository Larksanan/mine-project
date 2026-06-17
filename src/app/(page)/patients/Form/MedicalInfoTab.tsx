'use client';

import React, { useState } from 'react';
import {
  FiFileText,
  FiAlertTriangle,
  FiTrendingUp,
  FiPlus,
  FiTrash2,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { IPatientFormData } from '@/types/patients';

interface MedicalInfoTabProps {
  formData: IPatientFormData;
  formErrors: Record<string, string>;
  onFormDataChange: (updates: Partial<IPatientFormData>) => void;
}

// Common allergies for Sri Lankan context (English only)
const commonAllergies = [
  'Penicillin',
  'Aspirin',
  'Ibuprofen',
  'Sulfa drugs',
  'Tetracycline',
  'Codeine',
  'Latex',
  'Eggs',
  'Peanuts',
  'Shellfish',
  'Dairy products',
  'Soy',
  'Wheat/Gluten',
  'Pollen',
  'Dust mites',
  'Mold',
  'Animal dander',
  'Bee stings',
  'Seafood',
  'Tree nuts',
  'Sesame seeds',
  'Kiwi fruit',
  'NSAIDs',
  'Antibiotics',
];

// Common chronic conditions in Sri Lanka
const commonConditions = [
  'Diabetes Mellitus',
  'Hypertension',
  'Asthma',
  'Heart disease',
  'Thyroid disorders',
  'Arthritis',
  'Chronic kidney disease',
  'Liver disease',
  'Cancer',
  'Epilepsy',
  'Mental health conditions',
  'HIV/AIDS',
  'Tuberculosis',
  'Hepatitis B/C',
  'Autoimmune diseases',
];

// Common medications in Sri Lanka (English only)
const commonMedications = [
  'Metformin 500mg',
  'Metformin 850mg',
  'Gliclazide 80mg',
  'Glibenclamide 5mg',
  'Insulin - Regular',
  'Insulin - NPH',
  'Amlodipine 5mg',
  'Losartan 50mg',
  'Enalapril 5mg',
  'Atorvastatin 10mg',
  'Simvastatin 20mg',
  'Aspirin 75mg',
  'Clopidogrel 75mg',
  'Warfarin 5mg',
  'Salbutamol inhaler',
  'Beclomethasone inhaler',
  'Paracetamol 500mg',
  'Ibuprofen 400mg',
  'Diclofenac 50mg',
  'Omeprazole 20mg',
  'Thyroxine 50mcg',
  'Levothyroxine 100mcg',
  'Diazepam 5mg',
  'Fluoxetine 20mg',
];

export default function MedicalInfoTab({
  formData,
  formErrors,
  onFormDataChange,
}: MedicalInfoTabProps) {
  const [showCommonAllergies, setShowCommonAllergies] = useState(false);
  const [showCommonConditions, setShowCommonConditions] = useState(false);
  const [showCommonMeds, setShowCommonMeds] = useState(false);

  const handleArrayInputChange = (
    field: 'allergies' | 'medications',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    onFormDataChange({ [field]: newArray });
  };

  const addArrayField = (field: 'allergies' | 'medications') => {
    onFormDataChange({ [field]: [...formData[field], ''] });
  };

  const removeArrayField = (
    field: 'allergies' | 'medications',
    index: number
  ) => {
    if (formData[field].length > 1) {
      onFormDataChange({
        [field]: formData[field].filter((_, i) => i !== index),
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    onFormDataChange({ [name]: value });
  };

  const handleCommonSelection = (
    type: 'allergy' | 'medication',
    item: string
  ) => {
    if (type === 'allergy') {
      // Check if already exists
      if (!formData.allergies.includes(item)) {
        onFormDataChange({ allergies: [...formData.allergies, item] });
      }
    } else {
      if (!formData.medications.includes(item)) {
        onFormDataChange({ medications: [...formData.medications, item] });
      }
    }
  };

  const handleCommonConditionSelect = (condition: string) => {
    const currentHistory = formData.medicalHistory || '';
    if (!currentHistory.includes(condition)) {
      const newHistory = currentHistory
        ? `${currentHistory}, ${condition}`
        : condition;
      onFormDataChange({ medicalHistory: newHistory });
    }
  };

  return (
    <div className='space-y-6'>
      {/* Medical History */}
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
          <FiFileText size={20} />
          Medical History
        </h3>

        <div className='mb-4'>
          <div className='flex justify-between items-center mb-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Common Chronic Conditions
            </label>
            <button
              type='button'
              onClick={() => setShowCommonConditions(!showCommonConditions)}
              className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'
            >
              {showCommonConditions ? <FiChevronUp /> : <FiChevronDown />}
              {showCommonConditions ? 'Hide' : 'Show'} common conditions
            </button>
          </div>

          {showCommonConditions && (
            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-700 mb-2'>
                Select common conditions to add:
              </p>
              <div className='flex flex-wrap gap-2'>
                {commonConditions.map((condition, index) => (
                  <button
                    key={index}
                    type='button'
                    onClick={() => handleCommonConditionSelect(condition)}
                    className='px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded-full hover:bg-blue-50 transition-colors'
                  >
                    + {condition}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <textarea
          name='medicalHistory'
          value={formData.medicalHistory}
          onChange={handleInputChange}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.medicalHistory ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder='Enter any relevant medical history, past surgeries, chronic conditions, family history, etc. Example: "Diagnosed with Type 2 Diabetes in 2015, Hypertension since 2018, family history of heart disease."'
        />
        {formErrors.medicalHistory && (
          <p className='mt-1 text-sm text-red-600'>
            {formErrors.medicalHistory}
          </p>
        )}
      </div>

      {/* Allergies */}
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
          <FiAlertTriangle size={20} />
          Allergies & Sensitivities
        </h3>

        <div className='mb-4'>
          <div className='flex justify-between items-center mb-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Common Allergies
            </label>
            <button
              type='button'
              onClick={() => setShowCommonAllergies(!showCommonAllergies)}
              className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'
            >
              {showCommonAllergies ? <FiChevronUp /> : <FiChevronDown />}
              {showCommonAllergies ? 'Hide' : 'Show'} common allergies
            </button>
          </div>

          {showCommonAllergies && (
            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-700 mb-2'>
                Select common allergies to add:
              </p>
              <div className='flex flex-wrap gap-2'>
                {commonAllergies.map((allergy, index) => (
                  <button
                    key={index}
                    type='button'
                    onClick={() => handleCommonSelection('allergy', allergy)}
                    className='px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded-full hover:bg-blue-50 transition-colors'
                  >
                    + {allergy}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {formData.allergies.map((allergy, index) => (
          <div key={index} className='flex gap-2 items-center'>
            <input
              type='text'
              value={allergy}
              onChange={e =>
                handleArrayInputChange('allergies', index, e.target.value)
              }
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors[`allergies.${index}`]
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder={`Allergy ${index + 1} (e.g., Penicillin, Peanuts, Latex)`}
            />
            {formData.allergies.length > 1 && (
              <button
                type='button'
                onClick={() => removeArrayField('allergies', index)}
                className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors'
                title='Remove allergy'
              >
                <FiTrash2 size={18} />
              </button>
            )}
          </div>
        ))}

        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => addArrayField('allergies')}
            className='inline-flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors'
          >
            <FiPlus size={18} />
            Add Allergy
          </button>

          {formData.allergies.length === 0 && (
            <button
              type='button'
              onClick={() =>
                onFormDataChange({ allergies: ['No Known Allergies (NKA)'] })
              }
              className='inline-flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-800 border border-green-300 rounded-lg hover:bg-green-50 transition-colors'
            >
              <FiInfo size={18} />
              Mark as No Known Allergies
            </button>
          )}
        </div>
      </div>

      {/* Current Medications */}
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
          <FiTrendingUp size={20} />
          Current Medications
        </h3>

        <div className='mb-4'>
          <div className='flex justify-between items-center mb-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Common Medications
            </label>
            <button
              type='button'
              onClick={() => setShowCommonMeds(!showCommonMeds)}
              className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'
            >
              {showCommonMeds ? <FiChevronUp /> : <FiChevronDown />}
              {showCommonMeds ? 'Hide' : 'Show'} common medications
            </button>
          </div>

          {showCommonMeds && (
            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-700 mb-2'>
                Select common medications to add:
              </p>
              <div className='flex flex-wrap gap-2'>
                {commonMedications.map((medication, index) => (
                  <button
                    key={index}
                    type='button'
                    onClick={() =>
                      handleCommonSelection('medication', medication)
                    }
                    className='px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded-full hover:bg-blue-50 transition-colors'
                  >
                    + {medication}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {formData.medications.map((medication, index) => (
          <div key={index} className='flex gap-2 items-center'>
            <input
              type='text'
              value={medication}
              onChange={e =>
                handleArrayInputChange('medications', index, e.target.value)
              }
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors[`medications.${index}`]
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder={`Medication ${index + 1} (e.g., Metformin 500mg twice daily, Amlodipine 5mg once daily)`}
            />
            {formData.medications.length > 1 && (
              <button
                type='button'
                onClick={() => removeArrayField('medications', index)}
                className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors'
                title='Remove medication'
              >
                <FiTrash2 size={18} />
              </button>
            )}
          </div>
        ))}

        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => addArrayField('medications')}
            className='inline-flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors'
          >
            <FiPlus size={18} />
            Add Medication
          </button>

          {formData.medications.length === 0 && (
            <button
              type='button'
              onClick={() =>
                onFormDataChange({ medications: ['No Regular Medications'] })
              }
              className='inline-flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-800 border border-green-300 rounded-lg hover:bg-green-50 transition-colors'
            >
              <FiInfo size={18} />
              Mark as No Regular Medications
            </button>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center gap-2'>
          <FiInfo size={20} />
          Additional Medical Information
        </h3>
        <textarea
          name='additionalMedicalInfo'
          value={formData.additionalMedicalInfo || ''}
          onChange={handleInputChange}
          rows={3}
          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='Any other relevant medical information, lifestyle factors, dietary restrictions, exercise habits, smoking/alcohol consumption, etc.'
        />
      </div>

      {/* Information Box */}
      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
        <div className='flex items-start gap-2'>
          <FiInfo className='text-yellow-600 mt-0.5' />
          <div className='text-sm text-yellow-700'>
            <p className='font-medium mb-1'>Important Medical Information</p>
            <ul className='list-disc pl-5 space-y-1'>
              <li>Be specific about medication dosages and frequencies</li>
              <li>
                Include both prescription and over-the-counter medications
              </li>
              <li>
                Mention the severity of allergies (mild, moderate, severe)
              </li>
              <li>Include the year of diagnosis for chronic conditions</li>
              <li>Note any recent surgeries or hospitalizations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
