/* eslint-disable @typescript-eslint/no-explicit-any */
// components/analytics/AppointmentsTab.tsx
'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AnalyticsData } from '@/types/analytics';

interface AppointmentsTabProps {
  analytics: AnalyticsData;
}

const AppointmentsTab = ({ analytics }: AppointmentsTabProps) => {
  const byDayData =
    (
      analytics.appointmentTrends.find(t => t.type === 'byDay') as {
        data: any[];
      }
    )?.data || [];
  const byTimeData =
    (
      analytics.appointmentTrends.find(t => t.type === 'byTime') as {
        data: any[];
      }
    )?.data || [];

  return (
    <div className='space-y-6'>
      {/* By Day Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
      >
        <h3 className='text-xl font-bold text-gray-900 mb-6'>
          Appointments by Day of Week
        </h3>
        {byDayData.length > 0 ? (
          <ResponsiveContainer width='100%' height={350}>
            <BarChart data={byDayData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
              <XAxis
                dataKey='day'
                stroke='#6b7280'
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke='#6b7280' style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar
                dataKey='count'
                fill='url(#colorGradient)'
                radius={[8, 8, 0, 0]}
                name='Appointments'
              />
              <defs>
                <linearGradient id='colorGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='#3b82f6' stopOpacity={1} />
                  <stop offset='100%' stopColor='#6366f1' stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className='h-64 flex items-center justify-center text-gray-400'>
            No appointment data available
          </div>
        )}
      </motion.div>

      {/* By Time Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
      >
        <h3 className='text-xl font-bold text-gray-900 mb-6'>
          Appointments by Time of Day
        </h3>
        {byTimeData.length > 0 ? (
          <ResponsiveContainer width='100%' height={350}>
            <BarChart data={byTimeData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
              <XAxis
                dataKey='time'
                stroke='#6b7280'
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke='#6b7280' style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar
                dataKey='count'
                fill='url(#colorGradient2)'
                radius={[8, 8, 0, 0]}
                name='Appointments'
              />
              <defs>
                <linearGradient id='colorGradient2' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='#10b981' stopOpacity={1} />
                  <stop offset='100%' stopColor='#059669' stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className='h-64 flex items-center justify-center text-gray-400'>
            No appointment data available
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AppointmentsTab;
