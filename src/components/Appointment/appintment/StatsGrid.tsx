import React from 'react';
import { motion } from 'framer-motion';
import { AppointmentStats } from '@/types/appointment';

interface StatsGridProps {
  stats: AppointmentStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const statItems = [
    { label: 'Total', value: stats.total, color: 'text-gray-900' },
    { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-600' },
    { label: 'Confirmed', value: stats.confirmed, color: 'text-green-600' },
    { label: 'Completed', value: stats.completed, color: 'text-gray-600' },
    { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600' },
    { label: 'No Show', value: stats.noShow, color: 'text-orange-600' },
    { label: 'Today', value: stats.today, color: 'text-purple-600' },
    { label: 'Upcoming', value: stats.upcoming, color: 'text-indigo-600' },
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8'>
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'
        >
          <div className='text-center'>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className='text-sm text-gray-600 mt-1'>{item.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
