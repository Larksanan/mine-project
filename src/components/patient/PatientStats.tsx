/* eslint-disable no-redeclare */
/* eslint-disable no-import-assign */
import React from 'react';
import { FiUser, FiUsers, FiCalendar } from 'react-icons/fi';
import type { PatientStats } from '@/types/patient';

interface PatientStatsProps {
  stats: PatientStats;
}

const PatientStats: React.FC<PatientStatsProps> = ({ stats }) => {
  const statCards = [
    {
      label: 'Total Patients',
      value: stats.total,
      icon: FiUsers,
      color: 'blue',
    },
    {
      label: 'Male',
      value: stats.male,
      icon: FiUser,
      color: 'blue',
    },
    {
      label: 'Female',
      value: stats.female,
      icon: FiUser,
      color: 'pink',
    },
    {
      label: 'Other',
      value: stats.other,
      icon: FiUser,
      color: 'purple',
    },
    {
      label: 'Adults',
      value: stats.adults,
      icon: FiCalendar,
      color: 'green',
    },
    {
      label: 'Children',
      value: stats.children,
      icon: FiCalendar,
      color: 'yellow',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      pink: 'bg-pink-100 text-pink-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8'>
      {statCards.map(stat => (
        <div
          key={stat.label}
          className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'
        >
          <div className='flex items-center gap-3'>
            <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
              <stat.icon className='w-6 h-6' />
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {stat.value}
              </div>
              <div className='text-sm text-gray-500'>{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientStats;
