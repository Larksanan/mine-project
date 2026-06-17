'use client';

import React from 'react';
import {
  FiUser,
  FiCalendar,
  FiHeart,
  FiDollarSign,
  FiAlertTriangle,
} from 'react-icons/fi';
import { Patient, calculateAge } from '@/types/patient';
import { motion } from 'framer-motion';

type ActiveTab = 'overview' | 'appointments' | 'medical' | 'billing';

interface PatientTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  patient: Patient;
  stats?: {
    upcomingAppointments?: number;
    pendingMedications?: number;
    activeAllergies?: number;
  };
}

const PatientTabs: React.FC<PatientTabsProps> = ({
  activeTab,
  onTabChange,
  patient,
  stats = {},
}) => {
  const age = calculateAge(patient.dateOfBirth);
  const hasMedicalAlerts =
    (patient.allergies?.length || 0) > 0 ||
    (patient.medications?.length || 0) > 0;

  const tabs = [
    {
      id: 'overview' as ActiveTab,
      name: 'Overview',
      icon: <FiUser className='w-4 h-4' />,
      description: `Personal information • ${age} years old • ${patient.gender}`,
      alert: !patient.isActive,
    },
    {
      id: 'appointments' as ActiveTab,
      name: 'Appointments',
      icon: <FiCalendar className='w-4 h-4' />,
      description: 'Appointment history and scheduling',
      badge: stats.upcomingAppointments || 0,
    },
    {
      id: 'medical' as ActiveTab,
      name: 'Medical',
      icon: <FiHeart className='w-4 h-4' />,
      description: `Medical history • ${patient.allergies?.length || 0} allergies • ${patient.medications?.length || 0} medications`,
      alert: hasMedicalAlerts,
    },
    {
      id: 'billing' as ActiveTab,
      name: 'Billing',
      icon: <FiDollarSign className='w-4 h-4' />,
      description: 'Insurance and billing information',
      comingSoon: true,
    },
  ];

  return (
    <div className='border-b border-gray-200 bg-white'>
      <nav className='-mb-px flex space-x-8 overflow-x-auto'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.comingSoon && onTabChange(tab.id)}
            className={`
              group relative flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              ${tab.comingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              transition-colors duration-200
            `}
          >
            <div className='flex items-center gap-2'>
              <div className='relative'>
                {tab.icon}
                {tab.alert && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className='absolute -top-1 -right-1'
                  >
                    <FiAlertTriangle className='w-3 h-3 text-red-500' />
                  </motion.div>
                )}
              </div>

              <span>{tab.name}</span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full min-w-6
                    ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  {tab.badge}
                </motion.span>
              )}

              {tab.comingSoon && (
                <span className='inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded'>
                  Soon
                </span>
              )}
            </div>

            {/* Active indicator */}
            {activeTab === tab.id && (
              <motion.div
                className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500'
                layoutId='activeTab'
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Tab description */}
      <div className='px-1 py-2'>
        <p className='text-sm text-gray-600'>
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>
    </div>
  );
};

export default PatientTabs;
