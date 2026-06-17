/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
'use client';

import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { UserProfile } from '@/types/profile';

interface ContactInfoProps {
  user: UserProfile;
  isEditing: boolean;
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
}

export default function ContactInfo({
  user,
  isEditing,
  formData,
  onInputChange,
  errors,
}: ContactInfoProps) {
  const contactItems = [
    {
      icon: FiMail,
      label: 'Email',
      value: user.email,
      editable: false,
      name: 'email',
      type: 'email',
      placeholder: 'Enter email address',
    },
    {
      icon: FiPhone,
      label: 'Phone',
      value: formData.phone,
      editable: true,
      name: 'phone',
      type: 'tel',
      placeholder: 'Enter phone number',
    },
    {
      icon: FiMapPin,
      label: 'Address',
      value: formData.address,
      editable: true,
      name: 'address',
      type: 'text',
      placeholder: 'Enter your address',
    },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
    >
      <motion.h2
        className='text-lg font-semibold text-gray-900 mb-4'
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Contact Information
      </motion.h2>

      <div className='space-y-4'>
        {contactItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              errors[item.name]
                ? 'bg-red-50 border border-red-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className='flex items-center space-x-3 flex-1'>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className='p-2 bg-blue-50 rounded-lg'
              >
                <item.icon className='h-5 w-5 text-blue-600' />
              </motion.div>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-500'>
                  {item.label}
                </p>
                {isEditing && item.editable ? (
                  <div>
                    <motion.input
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      type={item.type}
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
                  <p className='text-gray-900'>
                    {item.value || 'Not provided'}
                  </p>
                )}
                {!item.editable && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Email cannot be changed
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
