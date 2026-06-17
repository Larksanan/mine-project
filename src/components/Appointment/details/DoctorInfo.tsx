'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiAward } from 'react-icons/fi';

interface DoctorData {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  department?: string;
}

interface DoctorInfoProps {
  doctor: DoctorData | string | null | undefined;
}

export default function DoctorInfo({ doctor }: DoctorInfoProps) {
  // Handle null, undefined, or string (just ID)
  if (!doctor || typeof doctor === 'string') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
      >
        <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
          <FiUser className='w-5 h-5 text-blue-600' />
          Doctor Information
        </h2>
        <p className='text-sm text-gray-500'>No doctor information available</p>
      </motion.div>
    );
  }

  // Handle empty object or missing required fields
  if (!doctor.name) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
      >
        <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
          <FiUser className='w-5 h-5 text-blue-600' />
          Doctor Information
        </h2>
        <p className='text-sm text-gray-500'>Doctor details not available</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
        <FiUser className='w-5 h-5 text-blue-600' />
        Doctor Information
      </h2>

      <div className='space-y-4'>
        {/* Basic Information */}
        <div>
          <p className='text-lg font-semibold text-gray-900'>
            Dr. {doctor.name}
          </p>
          {(doctor.specialization || doctor.department) && (
            <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2'>
              {doctor.specialization && (
                <span className='flex items-center gap-1'>
                  <FiAward className='w-3 h-3' />
                  {doctor.specialization}
                </span>
              )}
              {doctor.department && (
                <span className='flex items-center gap-1'>
                  <FiBriefcase className='w-3 h-3' />
                  {doctor.department}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Contact Information */}
        {(doctor.email || doctor.phone) && (
          <div className='space-y-2'>
            {doctor.email && (
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <FiMail className='w-4 h-4 text-gray-400' />
                <span>{doctor.email}</span>
              </div>
            )}
            {doctor.phone && (
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <FiPhone className='w-4 h-4 text-gray-400' />
                <span>{doctor.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Professional Info */}
        {(doctor.specialization || doctor.department) && (
          <div className='pt-2 border-t border-gray-100'>
            <div className='text-sm text-gray-600 space-y-1'>
              {doctor.specialization && (
                <div>
                  <strong>Specialization:</strong> {doctor.specialization}
                </div>
              )}
              {doctor.department && (
                <div>
                  <strong>Department:</strong> {doctor.department}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
