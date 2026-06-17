import React from 'react';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiLoader,
} from 'react-icons/fi';

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <FiClock className='w-4 h-4' />,
          label: 'Scheduled',
        };
      case 'confirmed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <FiCheckCircle className='w-4 h-4' />,
          label: 'Confirmed',
        };
      case 'completed':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <FiCheckCircle className='w-4 h-4' />,
          label: 'Completed',
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <FiXCircle className='w-4 h-4' />,
          label: 'Cancelled',
        };
      case 'no-show':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <FiAlertCircle className='w-4 h-4' />,
          label: 'No Show',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <FiLoader className='w-4 h-4' />,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </div>
  );
};

export default StatusBadge;
