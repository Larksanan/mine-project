/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
'use client';

import { motion } from 'framer-motion';
import {
  FiUser,
  FiCamera,
  FiEdit3,
  FiSave,
  FiX,
  FiPhone,
} from 'react-icons/fi';
import { FaIdCard } from 'react-icons/fa6';
import RoleBadge from './RoleBadge';
import { UserProfile } from '@/types/profile';

interface ProfileHeaderProps {
  user: UserProfile;
  isEditing: boolean;
  formData: any;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileHeader({
  user,
  isEditing,
  formData,
  onEditToggle,
  onSave,
  onCancel,
  onInputChange,
}: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
    >
      <div className='h-32 bg-linear-to-r from-blue-600 to-blue-700'></div>

      <div className='px-6 pb-6'>
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-12'>
          {/* Avatar and Basic Info */}
          <div className='flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4'>
            <motion.div
              className='relative'
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {user.image ? (
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className='h-24 w-24 rounded-full border-4 border-white bg-white shadow-lg'
                  src={user.image}
                  alt={user.name || 'User'}
                />
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className='h-24 w-24 rounded-full border-4 border-white bg-linear-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg'
                >
                  <FiUser className='h-12 w-12 text-white' />
                </motion.div>
              )}
              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className='absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors'
                >
                  <FiCamera className='h-4 w-4' />
                </motion.button>
              )}
            </motion.div>

            <motion.div
              className='space-y-2'
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className='flex items-center space-x-3'>
                {isEditing ? (
                  <motion.input
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={onInputChange}
                    className='text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                    minLength={2}
                    maxLength={100}
                  />
                ) : (
                  <h1 className='text-2xl font-bold text-gray-900'>
                    {user.name}
                  </h1>
                )}
                <RoleBadge role={user.role || 'USER'} />
              </div>
              <motion.p
                className='text-gray-600 flex items-center'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {user.email}
                {user.phone && (
                  <span className='ml-4 flex items-center'>
                    <FiPhone className='h-4 w-4 mr-1' />
                    {user.phone}
                  </span>
                )}
                {user.nic && (
                  <span className='ml-4 flex items-center'>
                    <FaIdCard className='h-4 w-4 mr-1' />
                    {user.nic}
                  </span>
                )}
              </motion.p>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            className='mt-4 sm:mt-0'
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isEditing ? (
              <motion.div
                className='flex space-x-3'
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  <FiX className='h-4 w-4' />
                  <span>Cancel</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSave}
                  className='flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
                >
                  <FiSave className='h-4 w-4' />
                  <span>Save Changes</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                }}
                whileTap={{ scale: 0.95 }}
                onClick={onEditToggle}
                className='flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
              >
                <FiEdit3 className='h-4 w-4' />
                <span>Edit Profile</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
