'use client';

import React from 'react';
import {
  FiCalendar,
  FiUser,
  FiClock,
  FiEdit,
  FiActivity,
  FiInfo,
} from 'react-icons/fi';
import { Patient } from '@/types/patient';
import { motion } from 'framer-motion';

interface PatientMetadataCardProps {
  patient: Patient;
  compact?: boolean;
}

const PatientMetadataCard: React.FC<PatientMetadataCardProps> = ({
  patient,
  compact = false,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Invalid date';
    }
  };

  const formatCompactDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        const months = Math.floor(diffInDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      }
    } catch {
      return 'Unknown';
    }
  };

  const getRecordAge = () => {
    if (!patient.createdAt) return 'Unknown';

    const created = new Date(patient.createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - created.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 30) {
      return 'New';
    } else if (diffInDays < 365) {
      return 'Recent';
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years}+ years`;
    }
  };

  const metadataItems = [
    {
      icon: <FiCalendar className='w-4 h-4' />,
      label: 'Created',
      value: patient.createdAt ? formatDate(patient.createdAt) : 'Unknown',
      timeAgo: patient.createdAt ? getTimeAgo(patient.createdAt) : null,
    },
    {
      icon: <FiEdit className='w-4 h-4' />,
      label: 'Last Updated',
      value: patient.updatedAt ? formatDate(patient.updatedAt) : 'Unknown',
      timeAgo: patient.updatedAt ? getTimeAgo(patient.updatedAt) : null,
    },
    ...(patient.createdBy
      ? [
          {
            icon: <FiUser className='w-4 h-4' />,
            label: 'Created By',
            value: patient.createdBy.name,
            subValue: patient.createdBy.role,
          },
        ]
      : []),
    {
      icon: <FiClock className='w-4 h-4' />,
      label: 'Status',
      value: patient.isActive ? 'Active' : 'Inactive',
      status: patient.isActive ? 'active' : 'inactive',
    },
    {
      icon: <FiActivity className='w-4 h-4' />,
      label: 'Record Age',
      value: getRecordAge(),
    },
  ];

  // Compact version for sidebar/small spaces
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className='bg-white rounded-lg border border-gray-200 p-4'
      >
        <div className='flex items-center justify-between mb-3'>
          <h4 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
            <FiInfo className='w-4 h-4 text-gray-400' />
            Metadata
          </h4>
          <span
            className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${
                patient.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }
            `}
          >
            {patient.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className='space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span className='text-gray-500'>Created:</span>
            <span className='text-gray-900 font-medium'>
              {patient.createdAt
                ? formatCompactDate(patient.createdAt)
                : 'Unknown'}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-500'>Updated:</span>
            <span className='text-gray-900 font-medium'>
              {patient.updatedAt
                ? formatCompactDate(patient.updatedAt)
                : 'Unknown'}
            </span>
          </div>
          {patient.createdBy && (
            <div className='flex justify-between'>
              <span className='text-gray-500'>By:</span>
              <span className='text-gray-900 font-medium'>
                {patient.createdBy.name}
              </span>
            </div>
          )}
          <div className='flex justify-between'>
            <span className='text-gray-500'>Age:</span>
            <span className='text-gray-900 font-medium'>{getRecordAge()}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className='mt-4 pt-3 border-t border-gray-100'>
          <div className='grid grid-cols-3 gap-2 text-xs'>
            <div className='text-center'>
              <p className='font-semibold text-gray-900'>
                {patient.allergies?.length || 0}
              </p>
              <p className='text-gray-500'>Allergies</p>
            </div>
            <div className='text-center'>
              <p className='font-semibold text-gray-900'>
                {patient.medications?.length || 0}
              </p>
              <p className='text-gray-500'>Meds</p>
            </div>
            <div className='text-center'>
              <p className='font-semibold text-gray-900'>
                {patient.insurance ? 1 : 0}
              </p>
              <p className='text-gray-500'>Insurance</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full version
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
    >
      <div className='px-6 py-4 border-b border-gray-100'>
        <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
          <FiActivity className='w-5 h-5 text-gray-400' />
          Patient Metadata
        </h3>
        <p className='text-sm text-gray-500 mt-1'>
          System information and audit trail
        </p>
      </div>

      <div className='p-6 space-y-4'>
        {metadataItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className='flex items-start gap-3'
          >
            <div className='shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600'>
              {item.icon}
            </div>

            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-900'>{item.label}</p>

              <div className='mt-1'>
                <p className='text-sm text-gray-600'>{item.value}</p>

                {item.timeAgo && (
                  <p className='text-xs text-gray-400 mt-1'>{item.timeAgo}</p>
                )}

                {item.subValue && (
                  <p className='text-xs text-gray-500 mt-1'>{item.subValue}</p>
                )}

                {item.status && (
                  <span
                    className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1
                      ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    `}
                  >
                    {item.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer with quick stats */}
      <div className='px-6 py-4 bg-gray-50 border-t border-gray-100'>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-sm font-medium text-gray-700'>Quick Stats</span>
          <span className='text-xs text-gray-500'>Patient Summary</span>
        </div>

        <div className='grid grid-cols-4 gap-4 text-xs'>
          <div className='text-center'>
            <div className='w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-1'>
              <span className='font-semibold text-blue-600'>
                {patient.allergies?.length || 0}
              </span>
            </div>
            <p className='text-gray-500'>Allergies</p>
          </div>

          <div className='text-center'>
            <div className='w-8 h-8 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-1'>
              <span className='font-semibold text-green-600'>
                {patient.medications?.length || 0}
              </span>
            </div>
            <p className='text-gray-500'>Meds</p>
          </div>

          <div className='text-center'>
            <div className='w-8 h-8 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-1'>
              <span className='font-semibold text-purple-600'>
                {patient.insurance ? 1 : 0}
              </span>
            </div>
            <p className='text-gray-500'>Insurance</p>
          </div>

          <div className='text-center'>
            <div className='w-8 h-8 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-1'>
              <span className='font-semibold text-orange-600'>
                {patient.emergencyContact ? 1 : 0}
              </span>
            </div>
            <p className='text-gray-500'>Emergency</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientMetadataCard;
