// components/analytics/PatientsTab.tsx
'use client';

import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { AnalyticsData } from '@/types/analytics';

interface PatientsTabProps {
  analytics: AnalyticsData;
}

const PatientsTab = ({ analytics }: PatientsTabProps) => {
  const COLORS = {
    male: '#3b82f6',
    female: '#ec4899',
    other: '#8b5cf6',
    under18: '#10b981',
    age18to35: '#f59e0b',
    age36to60: '#ef4444',
    over60: '#6366f1',
  };

  const genderData = [
    {
      name: 'Male',
      value: analytics.patientDemographics.genderDistribution.male,
    },
    {
      name: 'Female',
      value: analytics.patientDemographics.genderDistribution.female,
    },
    {
      name: 'Other',
      value: analytics.patientDemographics.genderDistribution.other,
    },
  ].filter(item => item.value > 0);

  const ageData = [
    {
      name: 'Under 18',
      value: analytics.patientDemographics.ageGroups.under18,
    },
    {
      name: '18-35',
      value: analytics.patientDemographics.ageGroups.age18to35,
    },
    {
      name: '36-60',
      value: analytics.patientDemographics.ageGroups.age36to60,
    },
    { name: 'Over 60', value: analytics.patientDemographics.ageGroups.over60 },
  ].filter(item => item.value > 0);

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Gender Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
        >
          <h3 className='text-xl font-bold text-gray-900 mb-6'>
            Gender Distribution
          </h3>
          {genderData.length > 0 ? (
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {genderData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        COLORS[entry.name.toLowerCase() as keyof typeof COLORS]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className='h-64 flex items-center justify-center text-gray-400'>
              No data available
            </div>
          )}
        </motion.div>

        {/* Age Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className='bg-white rounded-xl shadow-lg p-6 border border-gray-200'
        >
          <h3 className='text-xl font-bold text-gray-900 mb-6'>
            Age Distribution
          </h3>
          {ageData.length > 0 ? (
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={ageData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {ageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Under 18'
                          ? COLORS.under18
                          : entry.name === '18-35'
                            ? COLORS.age18to35
                            : entry.name === '36-60'
                              ? COLORS.age36to60
                              : COLORS.over60
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className='h-64 flex items-center justify-center text-gray-400'>
              No data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Demographics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200'
      >
        <h3 className='text-xl font-bold text-gray-900 mb-4'>
          Demographics Summary
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='bg-white rounded-lg p-4 shadow-sm'>
            <p className='text-sm text-gray-600 mb-1'>Male Patients</p>
            <p className='text-2xl font-bold text-blue-600'>
              {analytics.patientDemographics.genderDistribution.male}
            </p>
          </div>
          <div className='bg-white rounded-lg p-4 shadow-sm'>
            <p className='text-sm text-gray-600 mb-1'>Female Patients</p>
            <p className='text-2xl font-bold text-pink-600'>
              {analytics.patientDemographics.genderDistribution.female}
            </p>
          </div>
          <div className='bg-white rounded-lg p-4 shadow-sm'>
            <p className='text-sm text-gray-600 mb-1'>Under 18</p>
            <p className='text-2xl font-bold text-green-600'>
              {analytics.patientDemographics.ageGroups.under18}
            </p>
          </div>
          <div className='bg-white rounded-lg p-4 shadow-sm'>
            <p className='text-sm text-gray-600 mb-1'>Over 60</p>
            <p className='text-2xl font-bold text-indigo-600'>
              {analytics.patientDemographics.ageGroups.over60}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientsTab;
