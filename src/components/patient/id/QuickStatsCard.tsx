import React from 'react';
import { motion } from 'framer-motion';

interface QuickStatsCardProps {
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
  formatDate: (date?: string) => string;
}

export const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  lastVisit,
  createdAt,
  updatedAt,
  formatDate,
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className='bg-linear-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm border border-blue-100 p-6'
  >
    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Quick Stats</h3>
    <div className='space-y-2 text-sm'>
      <StatRow label='Last Visit' value={formatDate(lastVisit)} />
      <StatRow label='Registered' value={formatDate(createdAt)} />
      <StatRow label='Last Updated' value={formatDate(updatedAt)} />
    </div>
  </motion.div>
);

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className='flex justify-between'>
    <span className='text-gray-600'>{label}:</span>
    <span className='font-medium text-gray-900'>{value}</span>
  </div>
);
