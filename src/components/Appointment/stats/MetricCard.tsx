import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: IconType;
  iconBgColor: string;
  iconColor: string;
  delay?: number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  delay = 0,
  trend,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className='text-2xl font-bold text-gray-900 mt-2'>{value}</p>
          {trend && (
            <p
              className={`text-sm mt-1 flex items-center ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.value}
            </p>
          )}
          {subtitle && <p className='text-sm text-gray-600 mt-1'>{subtitle}</p>}
        </div>
        <div
          className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
