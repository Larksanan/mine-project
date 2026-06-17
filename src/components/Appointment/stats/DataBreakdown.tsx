import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { AppointmentStats } from '@/types/appointment';

interface DataBreakdownProps {
  stats: AppointmentStats;
}

const DataBreakdown: React.FC<DataBreakdownProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total revenue for appointment types
  const totalAppointmentsRevenue = stats.appointmentTypes?.reduce(
    (sum, type) => sum + type.revenue,
    0
  );

  // Calculate total weekly appointments
  const totalWeeklyAppointments = stats.weeklyTrend?.reduce(
    (sum, day) => sum + day.appointments,
    0
  );

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
      {/* Appointment Types Breakdown */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Appointment Types
          </h3>
          <div className='flex items-center gap-2 text-sm text-gray-500'>
            <FiCalendar className='w-4 h-4' />
            <span>Total: {formatCurrency(totalAppointmentsRevenue || 0)}</span>
          </div>
        </div>

        <div className='space-y-4'>
          {stats.appointmentTypes && stats.appointmentTypes.length > 0 ? (
            stats.appointmentTypes.map(type => {
              const percentage = totalAppointmentsRevenue
                ? (type.revenue / totalAppointmentsRevenue) * 100
                : 0;

              return (
                <div key={type.type} className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium text-gray-700 capitalize'>
                      {type.type.toLowerCase()}
                    </span>
                    <div className='flex items-center gap-4'>
                      <span className='text-sm text-gray-600'>
                        {type.count}
                      </span>
                      <span className='text-sm font-medium text-green-600'>
                        {formatCurrency(type.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-500'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-xs text-gray-500'>
                    <span>{percentage.toFixed(1)}% of revenue</span>
                    <span>
                      Avg:{' '}
                      {formatCurrency(
                        type.count > 0 ? type.revenue / type.count : 0
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='text-center py-8'>
              <FiCalendar className='w-12 h-12 text-gray-300 mx-auto mb-2' />
              <p className='text-gray-500'>
                No appointment type data available
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Weekly Trend */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Weekly Trend</h3>
          <div className='flex items-center gap-2 text-sm text-gray-500'>
            <FiTrendingUp className='w-4 h-4' />
            <span>Total: {totalWeeklyAppointments} appointments</span>
          </div>
        </div>

        <div className='space-y-4'>
          {stats.weeklyTrend && stats.weeklyTrend.length > 0 ? (
            stats.weeklyTrend.map(day => {
              const dayPercentage = totalWeeklyAppointments
                ? (day.appointments / totalWeeklyAppointments) * 100
                : 0;

              return (
                <div key={day.date} className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium text-gray-700'>
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className='flex items-center gap-4'>
                      <span className='text-sm text-gray-600'>
                        {day.appointments}
                      </span>
                      <span className='text-sm font-medium text-green-600'>
                        {formatCurrency(day.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-green-600 h-2 rounded-full transition-all duration-500'
                      style={{ width: `${dayPercentage}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-xs text-gray-500'>
                    <span>{dayPercentage.toFixed(1)}% of weekly total</span>
                    <span>
                      Avg:{' '}
                      {formatCurrency(
                        day.appointments > 0
                          ? day.revenue / day.appointments
                          : 0
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='text-center py-8'>
              <FiTrendingUp className='w-12 h-12 text-gray-300 mx-auto mb-2' />
              <p className='text-gray-500'>No weekly trend data available</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DataBreakdown;
