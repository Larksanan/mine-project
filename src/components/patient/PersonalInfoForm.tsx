import React from 'react';
import { motion } from 'framer-motion';
import { FiUser } from 'react-icons/fi';
import { Patient } from '@/types/patient';
import { calculateAge } from '@/types/patient';

interface PersonalInfoFormProps {
  formData: Patient;
  formErrors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  formErrors,
  onChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiUser className='w-5 h-5 text-blue-600' />
        Personal Information
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            First Name *
          </label>
          <input
            type='text'
            name='firstName'
            value={formData.firstName}
            onChange={onChange}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.firstName && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.firstName}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Last Name *
          </label>
          <input
            type='text'
            name='lastName'
            value={formData.lastName}
            onChange={onChange}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.lastName && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.lastName}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Email Address *
          </label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={onChange}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.email ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.email && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.email}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Phone Number *
          </label>
          <input
            type='tel'
            name='phone'
            value={formData.phone}
            onChange={onChange}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.phone && (
            <p className='mt-1 text-sm text-red-600'>{formErrors.phone}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Date of Birth *
          </label>
          <input
            type='date'
            name='dateOfBirth'
            onChange={onChange}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {formErrors.dateOfBirth && (
            <p className='mt-1 text-sm text-red-600'>
              {formErrors.dateOfBirth}
            </p>
          )}
          {formData.dateOfBirth && (
            <p className='mt-1 text-sm text-gray-500'>
              Age: {calculateAge(formData.dateOfBirth)} years
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Gender *
          </label>
          <select
            name='gender'
            value={formData.gender}
            onChange={onChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='MALE'>Male</option>
            <option value='FEMALE'>Female</option>
            <option value='OTHER'>Other</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalInfoForm;
