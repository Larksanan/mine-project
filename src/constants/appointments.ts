import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { StatusConfig, StatusType } from '@/types/appointment';

export const STATUS_COLORS: Record<StatusType, StatusConfig> = {
  SCHEDULED: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: FiClock,
  },
  CONFIRMED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: FiCheckCircle,
  },
  COMPLETED: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: FiCheckCircle,
  },
  CANCELLED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: FiXCircle,
  },
  NO_SHOW: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: FiAlertCircle,
  },
};
