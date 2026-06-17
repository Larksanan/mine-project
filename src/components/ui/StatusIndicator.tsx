import React from 'react';
import { motion, useSpring, useTransform, useScroll } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy' | 'idle';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glow?: boolean;
  withLabel?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  pulse = true,
  glow = false,
  withLabel = false,
  className,
}) => {
  const { scrollY } = useScroll();
  const scale = useSpring(1, { stiffness: 100, damping: 10 });
  const rotate = useTransform(scrollY, [0, 1000], [0, 360]);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    idle: 'bg-blue-500',
  };

  const statusLabels = {
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',
    idle: 'Idle',
  };

  const pulseAnimation = pulse
    ? {
        scale: [1, 1.5, 1],
        opacity: [1, 0.5, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      }
    : {};

  const glowAnimation = glow
    ? {
        boxShadow: [
          `0 0 0 0 ${
            status === 'online'
              ? 'rgba(34, 197, 94, 0.7)'
              : status === 'away'
                ? 'rgba(234, 179, 8, 0.7)'
                : status === 'busy'
                  ? 'rgba(239, 68, 68, 0.7)'
                  : 'rgba(156, 163, 175, 0.7)'
          }`,
          `0 0 0 6px ${
            status === 'online'
              ? 'rgba(34, 197, 94, 0)'
              : status === 'away'
                ? 'rgba(234, 179, 8, 0)'
                : status === 'busy'
                  ? 'rgba(239, 68, 68, 0)'
                  : 'rgba(156, 163, 175, 0)'
          }`,
        ],
        transition: {
          duration: 2,
          repeat: Infinity,
        },
      }
    : {};

  return (
    <motion.div
      className={twMerge('inline-flex items-center gap-2', className)}
      style={{ rotate }}
    >
      <motion.span
        animate={{ ...pulseAnimation, ...glowAnimation }}
        className={twMerge(
          'rounded-full border-2 border-white dark:border-gray-800',
          sizeClasses[size],
          statusClasses[status]
        )}
        style={{ scale }}
      />
      {withLabel && (
        <span className='text-sm text-gray-600 dark:text-gray-400'>
          {statusLabels[status]}
        </span>
      )}
    </motion.div>
  );
};

export default StatusIndicator;
