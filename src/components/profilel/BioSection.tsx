/* eslint-disable no-undef */
'use client';

import { motion } from 'framer-motion';
import { UserProfile } from '@/types/profile';

interface BioSectionProps {
  user: UserProfile;
  isEditing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  errors: Record<string, string>;
}

export default function BioSection({
  user,
  isEditing,
  formData,
  onInputChange,
  errors,
}: BioSectionProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
    >
      <motion.h2
        className='text-lg font-semibold text-gray-900 mb-4'
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        About
      </motion.h2>

      {isEditing ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <textarea
            name='bio'
            value={formData.bio}
            onChange={onInputChange}
            rows={4}
            className={`w-full text-gray-900 bg-white border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              errors.bio ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder='Tell us about yourself...'
          />
          {errors.bio && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-red-600 text-xs mt-1'
            >
              {errors.bio}
            </motion.p>
          )}
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className='text-gray-700 leading-relaxed'
        >
          {user.bio || formData.bio || 'No bio provided.'}
        </motion.p>
      )}
    </motion.div>
  );
}
