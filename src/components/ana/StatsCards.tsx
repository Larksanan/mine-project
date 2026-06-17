'use client';

import { motion, easeOut } from 'framer-motion';
import {
  FaUsers,
  FaCalendarCheck,
  FaStar,
  FaMoneyBillWave,
  FaUserPlus,
  FaUserCheck,
} from 'react-icons/fa';
import { AnalyticsData } from '@/types/analytics';

interface StatsCardsProps {
  analytics: AnalyticsData;
}

const StatsCards = ({ analytics }: StatsCardsProps) => {
  const cards = [
    {
      title: 'Total Patients',
      value: analytics.overview.totalPatients,
      subtitle: `${analytics.overview.newPatients} new this month`,
      icon: FaUsers,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
    },
    {
      title: 'Total Appointments',
      value: analytics.overview.totalAppointments,
      subtitle: `${analytics.overview.completedAppointments} completed • ${analytics.overview.cancelledAppointments} cancelled`,
      icon: FaCalendarCheck,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
    },
    {
      title: 'Average Rating',
      value: analytics.overview.averageRating.toFixed(1),
      subtitle: `${analytics.overview.averageRating.toFixed(1)} stars`,
      icon: FaStar,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100',
    },
    {
      title: 'Total Revenue',
      value: `LKR ${analytics.overview.totalRevenue.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: 'This period',
      icon: FaMoneyBillWave,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
    },
    {
      title: 'New Patients',
      value: analytics.overview.newPatients,
      subtitle: 'First time visits',
      icon: FaUserPlus,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
    },
    {
      title: 'Returning Patients',
      value: analytics.overview.returningPatients,
      subtitle: 'Follow-up visits',
      icon: FaUserCheck,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      bgGradient: 'from-teal-50 to-teal-100',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: easeOut,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className='relative overflow-hidden'
          >
            <div className='bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100'>
              {/* Background Gradient */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${card.bgGradient} opacity-20 rounded-full -mr-16 -mt-16`}
              />

              {/* Content */}
              <div className='relative z-10'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-gray-500 mb-1'>
                      {card.title}
                    </p>
                    <h3 className='text-2xl font-bold text-gray-900'>
                      {card.value}
                    </h3>
                  </div>
                  <div
                    className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} shadow-md`}
                  >
                    <Icon className='w-6 h-6 text-white' />
                  </div>
                </div>

                <p className='text-xs text-gray-500 flex items-center gap-1'>
                  <span>{card.subtitle}</span>
                </p>
              </div>

              {/* Bottom Border Accent */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${card.gradient}`}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default StatsCards;
