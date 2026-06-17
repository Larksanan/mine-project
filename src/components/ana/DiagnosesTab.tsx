// components/analytics/DiagnosesTab.tsx
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
  Cell,
} from 'recharts';
import { FiActivity } from 'react-icons/fi';
import { AnalyticsData } from '@/types/analytics';

interface DiagnosesTabProps {
  analytics: AnalyticsData;
}

const DiagnosesTab = ({ analytics }: DiagnosesTabProps) => {
  const COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#6366f1',
  ];

  const totalDiagnoses = analytics.commonDiagnoses.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div className='space-y-6'>
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200'
      >
        <div className='flex items-center gap-4'>
          <div className='p-4 bg-blue-500 rounded-xl'>
            <FiActivity className='w-8 h-8 text-white' />
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Total Diagnoses</p>
            <p className='text-4xl font-bold text-blue-600'>{totalDiagnoses}</p>
            <p className='text-xs text-gray-500 mt-1'>
              Across {analytics.commonDiagnoses.length} different conditions
            </p>
          </div>
        </div>
      </motion.div>

      {/* Common Diagnoses Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
      >
        <h3 className='text-xl font-bold text-gray-900 mb-6'>
          Most Common Diagnoses
        </h3>
        {analytics.commonDiagnoses.length > 0 ? (
          <ResponsiveContainer width='100%' height={400}>
            <BarChart
              data={analytics.commonDiagnoses}
              layout='vertical'
              margin={{ left: 120 }}
            >
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
              <XAxis
                type='number'
                stroke='#6b7280'
                style={{ fontSize: '12px' }}
              />
              <YAxis
                type='category'
                dataKey='diagnosis'
                stroke='#6b7280'
                style={{ fontSize: '12px' }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey='count' name='Count' radius={[0, 8, 8, 0]}>
                {analytics.commonDiagnoses.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className='h-64 flex items-center justify-center text-gray-400'>
            No diagnosis data available
          </div>
        )}
      </motion.div>

      {/* Detailed Diagnosis Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
      >
        <h3 className='text-xl font-bold text-gray-900 mb-6'>
          Diagnosis Details
        </h3>
        {analytics.commonDiagnoses.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {analytics.commonDiagnoses.map((diagnosis, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className='bg-linear-to-br from-gray-50 to-white rounded-lg p-4 border-l-4 shadow-sm hover:shadow-md transition-all duration-200'
                style={{ borderLeftColor: COLORS[index % COLORS.length] }}
              >
                <div className='flex items-start justify-between mb-3'>
                  <h4 className='font-semibold text-gray-900 text-sm leading-tight flex-1'>
                    {diagnosis.diagnosis}
                  </h4>
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ml-2'
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-xs text-gray-600'>Cases</span>
                    <span className='text-lg font-bold text-gray-900'>
                      {diagnosis.count}
                    </span>
                  </div>

                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='h-2 rounded-full transition-all duration-500'
                      style={{
                        width: `${(diagnosis.percentage * 100).toFixed(1)}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>

                  <div className='flex justify-between items-center'>
                    <span className='text-xs text-gray-600'>Percentage</span>
                    <span className='text-sm font-semibold text-gray-700'>
                      {(diagnosis.percentage * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className='h-32 flex items-center justify-center text-gray-400'>
            No diagnosis data available
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-white rounded-lg shadow-md p-4 border border-gray-200'
        >
          <p className='text-xs text-gray-600 mb-1'>Most Common</p>
          <p className='text-sm font-bold text-gray-900 truncate'>
            {analytics.commonDiagnoses[0]?.diagnosis || 'N/A'}
          </p>
          <p className='text-xs text-blue-600 mt-1'>
            {analytics.commonDiagnoses[0]?.count || 0} cases
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className='bg-white rounded-lg shadow-md p-4 border border-gray-200'
        >
          <p className='text-xs text-gray-600 mb-1'>Unique Diagnoses</p>
          <p className='text-2xl font-bold text-gray-900'>
            {analytics.commonDiagnoses.length}
          </p>
          <p className='text-xs text-green-600 mt-1'>Different conditions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-lg shadow-md p-4 border border-gray-200'
        >
          <p className='text-xs text-gray-600 mb-1'>Average per Diagnosis</p>
          <p className='text-2xl font-bold text-gray-900'>
            {analytics.commonDiagnoses.length > 0
              ? (totalDiagnoses / analytics.commonDiagnoses.length).toFixed(1)
              : 0}
          </p>
          <p className='text-xs text-purple-600 mt-1'>Cases</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className='bg-white rounded-lg shadow-md p-4 border border-gray-200'
        >
          <p className='text-xs text-gray-600 mb-1'>Top 3 Diagnoses</p>
          <p className='text-2xl font-bold text-gray-900'>
            {analytics.commonDiagnoses
              .slice(0, 3)
              .reduce((sum, d) => sum + d.count, 0)}
          </p>
          <p className='text-xs text-orange-600 mt-1'>Total cases</p>
        </motion.div>
      </div>
    </div>
  );
};

export default DiagnosesTab;
