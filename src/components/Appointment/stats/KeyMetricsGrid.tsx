import React from 'react';
import { FiCalendar, FiUsers, FiClock, FiDollarSign } from 'react-icons/fi';
import { AppointmentStats } from '@/types/appointment';
import MetricCard from './MetricCard';

interface KeyMetricsGridProps {
  stats: AppointmentStats;
}

const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-Uk', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
      <MetricCard
        title='Total Appointments'
        value={stats.totalAppointments}
        trend={{
          value: `${stats.monthlyAppointments} this month`,
          isPositive: true,
        }}
        icon={FiCalendar}
        iconBgColor='bg-blue-100'
        iconColor='text-blue-600'
        delay={0}
      />

      <MetricCard
        title='Completed'
        value={stats.completedAppointments}
        subtitle={`${(
          (stats.completedAppointments / stats.totalAppointments) *
          100
        ).toFixed(1)}% completion rate`}
        icon={FiUsers}
        iconBgColor='bg-green-100'
        iconColor='text-green-600'
        delay={0.1}
      />

      <MetricCard
        title="Today's Appointments"
        value={stats.todayAppointments}
        subtitle={`${stats.pendingAppointments} pending`}
        icon={FiClock}
        iconBgColor='bg-orange-100'
        iconColor='text-orange-600'
        delay={0.2}
      />

      <MetricCard
        title='Total Revenue'
        value={formatCurrency(stats.totalRevenue)}
        trend={{
          value: `${formatCurrency(stats.monthlyRevenue)} this month`,
          isPositive: true,
        }}
        icon={FiDollarSign}
        iconBgColor='bg-purple-100'
        iconColor='text-purple-600'
        delay={0.3}
      />
    </div>
  );
};

export default KeyMetricsGrid;
