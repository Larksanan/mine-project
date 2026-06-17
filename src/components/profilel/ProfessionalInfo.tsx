'use client';

import { motion } from 'framer-motion';
import { FiBriefcase, FiAward } from 'react-icons/fi';

interface ProfessionalInfoProps {
  isEditing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
  // eslint-disable-next-line no-undef
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
}

export default function ProfessionalInfo({
  isEditing,
  formData,
  onInputChange,
  errors,
}: ProfessionalInfoProps) {
  const professionalItems = [
    {
      icon: FiBriefcase,
      label: 'Department',
      value: formData.department,
      name: 'department',
      placeholder: 'Enter department',
    },
    {
      icon: FiAward,
      label: 'Specialization',
      value: formData.specialization,
      name: 'specialization',
      placeholder: 'Enter specialization',
    },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
    >
      <motion.h2
        className='text-lg font-semibold text-gray-900 mb-4'
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Professional Information
      </motion.h2>

      <div className='space-y-4'>
        {professionalItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              errors[item.name]
                ? 'bg-red-50 border border-red-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              className='p-2 bg-green-50 rounded-lg'
            >
              <item.icon className='h-5 w-5 text-green-600' />
            </motion.div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-500'>{item.label}</p>
              {isEditing ? (
                <div>
                  <motion.input
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    type='text'
                    name={item.name}
                    value={item.value}
                    onChange={onInputChange}
                    className={`w-full text-gray-900 bg-white border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors[item.name] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={item.placeholder}
                  />
                  {errors[item.name] && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-red-600 text-xs mt-1'
                    >
                      {errors[item.name]}
                    </motion.p>
                  )}
                </div>
              ) : (
                <p className='text-gray-900'>{item.value || 'Not specified'}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
