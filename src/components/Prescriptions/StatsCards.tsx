'use client';

import React from 'react';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Prescription } from '@/types/Prescription';

interface StatsCardsProps {
  prescriptions: Prescription[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ prescriptions }) => {
  const stats = [
    {
      title: 'Total',
      value: prescriptions.length,
      icon: FiFileText,
      color: 'text-gray-900',
      iconColor: 'text-gray-400',
    },
    {
      title: 'Active',
      value: prescriptions.filter(p => p.status === 'ACTIVE').length,
      icon: FiClock,
      color: 'text-blue-600',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Completed',
      value: prescriptions.filter(p => p.status === 'COMPLETED').length,
      icon: FiCheckCircle,
      color: 'text-green-600',
      iconColor: 'text-green-400',
    },
    {
      title: 'Cancelled',
      value: prescriptions.filter(p => p.status === 'CANCELLED').length,
      icon: FiXCircle,
      color: 'text-red-600',
      iconColor: 'text-red-400',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
      {stats.map((stat, index) => (
        <div
          key={index}
          className='bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
