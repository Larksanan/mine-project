'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AnalyticsData } from '@/types/analytics';

interface OverviewTabProps {
  analytics: AnalyticsData;
}

const OverviewTab = ({ analytics }: OverviewTabProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className='space-y-6'>
      {/* Monthly Stats Chart */}
      <motion.div
        variants={cardVariants}
        initial='hidden'
        animate='visible'
        className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
      >
        <h3 className='text-xl font-bold text-gray-900 mb-6'>
          Monthly Performance
        </h3>
        <ResponsiveContainer width='100%' height={350}>
          <LineChart data={analytics.monthlyStats}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='month'
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
            <Line
              type='monotone'
              dataKey='appointments'
              stroke='#3b82f6'
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name='Appointments'
            />
            <Line
              type='monotone'
              dataKey='patients'
              stroke='#10b981'
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name='Patients'
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <motion.div
          variants={cardVariants}
          initial='hidden'
          animate='visible'
          className='bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200'
        >
          <h3 className='text-lg font-bold text-gray-900 mb-4'>
            Appointment Status
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Completed</span>
              <span className='text-2xl font-bold text-green-600'>
                {analytics.overview.completedAppointments}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-green-500 h-2 rounded-full'
                style={{
                  width: `${
                    (analytics.overview.completedAppointments /
                      analytics.overview.totalAppointments) *
                      100 || 0
                  }%`,
                }}
              />
            </div>
            <div className='flex justify-between items-center mt-4'>
              <span className='text-gray-600'>Cancelled</span>
              <span className='text-2xl font-bold text-red-600'>
                {analytics.overview.cancelledAppointments}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-red-500 h-2 rounded-full'
                style={{
                  width: `${
                    (analytics.overview.cancelledAppointments /
                      analytics.overview.totalAppointments) *
                      100 || 0
                  }%`,
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial='hidden'
          animate='visible'
          transition={{ delay: 0.2 }}
          className='bg-linear-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-200'
        >
          <h3 className='text-lg font-bold text-gray-900 mb-4'>
            Patient Distribution
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>New Patients</span>
              <span className='text-2xl font-bold text-purple-600'>
                {analytics.overview.newPatients}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-purple-500 h-2 rounded-full'
                style={{
                  width: `${
                    (analytics.overview.newPatients /
                      analytics.overview.totalPatients) *
                      100 || 0
                  }%`,
                }}
              />
            </div>
            <div className='flex justify-between items-center mt-4'>
              <span className='text-gray-600'>Returning Patients</span>
              <span className='text-2xl font-bold text-indigo-600'>
                {analytics.overview.returningPatients}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-indigo-500 h-2 rounded-full'
                style={{
                  width: `${
                    (analytics.overview.returningPatients /
                      analytics.overview.totalPatients) *
                      100 || 0
                  }%`,
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OverviewTab;
