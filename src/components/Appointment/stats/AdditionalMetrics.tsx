import React from 'react';
import { FiClock, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import { AppointmentStats } from '@/types/appointment';
import MetricCard from './MetricCard';

interface AdditionalMetricsProps {
  stats: AppointmentStats;
}

const AdditionalMetrics: React.FC<AdditionalMetricsProps> = ({ stats }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
      <MetricCard
        title='Average Duration'
        value={formatDuration(stats.averageDuration)}
        subtitle='per appointment'
        icon={FiClock}
        iconBgColor='bg-indigo-100'
        iconColor='text-indigo-600'
        delay={0.4}
      />

      <MetricCard
        title='Cancelled'
        value={stats.cancelledAppointments}
        subtitle={`${(
          (stats.cancelledAppointments / stats.totalAppointments) *
          100
        ).toFixed(1)}% cancellation rate`}
        icon={FiTrendingUp}
        iconBgColor='bg-red-100'
        iconColor='text-red-600'
        delay={0.5}
      />

      <MetricCard
        title='Appointment Types'
        value={stats.appointmentTypes.length}
        subtitle='different types'
        icon={FiBarChart2}
        iconBgColor='bg-teal-100'
        iconColor='text-teal-600'
        delay={0.6}
      />
    </div>
  );
};

export default AdditionalMetrics;
