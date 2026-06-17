'use client';

import { motion } from 'framer-motion';
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiActivity,
} from 'react-icons/fi';

interface AnalyticsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AnalyticsTabs = ({ activeTab, onTabChange }: AnalyticsTabsProps) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiGrid },
    { id: 'patients', label: 'Patients', icon: FiUsers },
    { id: 'appointments', label: 'Appointments', icon: FiCalendar },
    { id: 'revenue', label: 'Revenue', icon: FiDollarSign },
    { id: 'diagnoses', label: 'Diagnoses', icon: FiActivity },
  ];

  return (
    <div className='mb-6'>
      <div className='bg-white rounded-xl shadow-md p-2 border border-gray-200'>
        <div className='flex flex-wrap gap-2'>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId='activeTab'
                    className='absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-600 rounded-lg'
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10`} />
                <span className='relative z-10'>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTabs;
