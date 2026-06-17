/* eslint-disable @typescript-eslint/no-explicit-any */

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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { AnalyticsData } from '@/types/analytics';

interface RevenueTabProps {
  analytics: AnalyticsData;
}

const RevenueTab = ({ analytics }: RevenueTabProps) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const formatCurrency = (value: number) => {
    return `LKR ${value.toLocaleString('en-LK')}`;
  };

  const totalRevenue = analytics.revenueAnalysis.monthlyRevenue.reduce(
    (sum: number, month: any) => sum + (month.revenue || 0),
    0
  );

  const averageMonthlyRevenue =
    analytics.revenueAnalysis.monthlyRevenue.length > 0
      ? totalRevenue / analytics.revenueAnalysis.monthlyRevenue.length
      : 0;

  return (
    <div className='space-y-6'>
      {/* Revenue Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200'
        >
          <p className='text-sm text-gray-600 mb-2'>Total Revenue</p>
          <p className='text-3xl font-bold text-blue-600'>
            {formatCurrency(totalRevenue)}
          </p>
          <p className='text-xs text-gray-500 mt-2'>This period</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-linear-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-200'
        >
          <p className='text-sm text-gray-600 mb-2'>Average Monthly</p>
          <p className='text-3xl font-bold text-green-600'>
            {formatCurrency(averageMonthlyRevenue)}
          </p>
          <p className='text-xs text-gray-500 mt-2'>Per month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-linear-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-200'
        >
          <p className='text-sm text-gray-600 mb-2'>Revenue Per Appointment</p>
          <p className='text-3xl font-bold text-purple-600'>
            {formatCurrency(
              analytics.overview.completedAppointments > 0
                ? totalRevenue / analytics.overview.completedAppointments
                : 0
            )}
          </p>
          <p className='text-xs text-gray-500 mt-2'>Average</p>
        </motion.div>
      </div>

      {/* Monthly Revenue Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
      >
        <h3 className='text-xl font-bold text-gray-900 mb-6'>
          Monthly Revenue Trend
        </h3>
        {analytics.revenueAnalysis.monthlyRevenue.length > 0 ? (
          <>
            <ResponsiveContainer width='100%' height={350}>
              <LineChart data={analytics.revenueAnalysis.monthlyRevenue}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                <XAxis
                  dataKey='month'
                  stroke='#6b7280'
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke='#6b7280'
                  style={{ fontSize: '12px' }}
                  tickFormatter={value => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
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
                  dataKey='revenue'
                  stroke='#3b82f6'
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name='Revenue'
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Growth Indicators */}
            <div className='mt-6 grid grid-cols-2 md:grid-cols-4 gap-4'>
              {analytics.revenueAnalysis.monthlyRevenue
                .slice(-4)
                .map((month: any, index: number) => (
                  <div
                    key={index}
                    className='bg-gray-50 rounded-lg p-4 border border-gray-200'
                  >
                    <p className='text-xs text-gray-600 mb-1'>
                      {month.month} {month.year}
                    </p>
                    <p className='text-lg font-bold text-gray-900'>
                      {formatCurrency(month.revenue)}
                    </p>
                    {month.growth !== undefined && (
                      <div
                        className={`flex items-center gap-1 text-xs mt-1 ${
                          month.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {month.growth >= 0 ? (
                          <FiTrendingUp className='w-3 h-3' />
                        ) : (
                          <FiTrendingDown className='w-3 h-3' />
                        )}
                        <span>{Math.abs(month.growth)}%</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className='h-64 flex items-center justify-center text-gray-400'>
            No revenue data available
          </div>
        )}
      </motion.div>

      {/* Revenue by Service */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
      >
        <h3 className='text-xl font-bold text-gray-900 mb-6'>
          Revenue by Service Type
        </h3>
        {analytics.revenueAnalysis.byService.length > 0 ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={analytics.revenueAnalysis.byService}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ service, percentage }) =>
                    `${service}: ${(percentage * 100).toFixed(1)}%`
                  }
                  outerRadius={100}
                  fill='#8884d8'
                  dataKey='revenue'
                >
                  {analytics.revenueAnalysis.byService.map(
                    (_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className='space-y-3'>
              {analytics.revenueAnalysis.byService.map(
                (service: any, index: number) => (
                  <div
                    key={index}
                    className='bg-gray-50 rounded-lg p-4 border border-gray-200'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className='font-medium text-gray-900'>
                          {service.service}
                        </span>
                      </div>
                      <span className='text-sm text-gray-600'>
                        {(service.percentage * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className='text-xl font-bold text-gray-900'>
                      {formatCurrency(service.revenue)}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {service.count} appointments
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <div className='h-64 flex items-center justify-center text-gray-400'>
            No service data available
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RevenueTab;
