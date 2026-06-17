import { IconType } from 'react-icons';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiPauseCircle,
  FiPlayCircle,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiActivity,
} from 'react-icons/fi';

export interface StatusConfig {
  icon: IconType;
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'processing';
  pulse?: boolean;
  glow?: boolean;
  bounce?: boolean;
  gradient?: boolean;
}

export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  ACTIVE: {
    icon: FiActivity,
    label: 'Active',
    variant: 'processing',
    pulse: true,
    glow: true,
    bounce: true,
  },
  PENDING: {
    icon: FiClock,
    label: 'Pending',
    variant: 'warning',
    pulse: true,
  },
  COMPLETED: {
    icon: FiCheckCircle,
    label: 'Completed',
    variant: 'success',
    glow: true,
  },
  CANCELLED: {
    icon: FiXCircle,
    label: 'Cancelled',
    variant: 'danger',
  },
  EXPIRED: {
    icon: FiAlertTriangle,
    label: 'Expired',
    variant: 'danger',
    pulse: true,
  },
  SUSPENDED: {
    icon: FiPauseCircle,
    label: 'Suspended',
    variant: 'warning',
    pulse: true,
  },
  APPROVED: {
    icon: FiCheck,
    label: 'Approved',
    variant: 'success',
    glow: true,
    gradient: true,
  },
  REJECTED: {
    icon: FiX,
    label: 'Rejected',
    variant: 'danger',
  },
  IN_PROGRESS: {
    icon: FiPlayCircle,
    label: 'In Progress',
    variant: 'processing',
    pulse: true,
    bounce: true,
  },
  ON_HOLD: {
    icon: FiAlertCircle,
    label: 'On Hold',
    variant: 'warning',
    pulse: true,
  },
  DRAFT: {
    icon: FiClock,
    label: 'Draft',
    variant: 'default',
  },
};

// Helper function to get status config
export const getStatusConfig = (status: string): StatusConfig => {
  const normalizedStatus = status.toUpperCase();
  return (
    STATUS_CONFIGS[normalizedStatus] || {
      icon: FiClock,
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      variant: 'default',
    }
  );
};

// Animation variants
export const badgeVariants = {
  initial: {
    scale: 0.8,
    opacity: 0,
    y: 10,
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.95,
  },
};

export const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
  },
};

export const bounceVariants = {
  bounce: {
    y: [0, -3, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
  },
};

export const glowVariants = {
  glow: {
    boxShadow: [
      '0 0 0 0 rgba(59, 130, 246, 0.5)',
      '0 0 0 6px rgba(59, 130, 246, 0)',
      '0 0 0 0 rgba(59, 130, 246, 0.5)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};
