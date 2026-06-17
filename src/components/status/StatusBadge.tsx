/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from 'framer-motion';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { getStatusConfig, badgeVariants } from './StatusConfig';

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  animateOnScroll?: boolean;
  viewport?: {
    once?: boolean;
    amount?: number;
  };
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  onClick,
  className,
  animateOnScroll = false,
  viewport = { once: true, amount: 0.5 },
}) => {
  const { scrollYProgress } = useScroll();
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.1]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 1]);

  const config = getStatusConfig(status);

  // Enhanced variants for specific statuses
  const enhancedVariants = {
    ...badgeVariants,
    animate: config.pulse
      ? {
          ...badgeVariants.animate,
          scale: [1, 1.05, 1],
          transition: {
            type: 'spring' as const,
            stiffness: 100,
            damping: 30,
            repeat: Infinity,
            repeatType: 'reverse' as const,
            duration: 1.5,
          },
        }
      : config.bounce
        ? {
            ...badgeVariants.animate,
            y: [0, -3, 0],
            transition: {
              type: 'spring' as const,
              stiffness: 100,
              damping: 30,
              repeat: Infinity,
              repeatType: 'reverse' as const,
              duration: 0.8,
            },
          }
        : {
            ...badgeVariants.animate,
            transition: {
              type: 'spring' as const,
              stiffness: 100,
              damping: 30,
            },
          },
  };

  const iconElement = showIcon && (
    <Icon
      name={config.icon as any}
      size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'}
      animated={config.pulse}
      pulse={config.pulse}
      bounce={config.bounce}
    />
  );

  const badgeContent = (
    <motion.div
      initial={animateOnScroll ? enhancedVariants.initial : false}
      whileInView={animateOnScroll ? enhancedVariants.animate : undefined}
      viewport={animateOnScroll ? viewport : undefined}
    >
      <Badge
        variant={config.variant}
        size={size}
        icon={iconElement}
        pulse={config.pulse}
        glow={config.glow}
        bounce={config.bounce}
        gradient={config.gradient}
        className={className}
        onClick={onClick}
        interactive={!!onClick}
      >
        {config.label}
      </Badge>
    </motion.div>
  );

  if (animateOnScroll) {
    return (
      <motion.div
        style={{
          scale,
          opacity,
          transition: 'all 0.3s ease',
        }}
      >
        {badgeContent}
      </motion.div>
    );
  }

  return badgeContent;
};

// Animated StatusBadge with scroll effects
export const AnimatedStatusBadge: React.FC<StatusBadgeProps> = props => {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  return (
    <motion.div
      style={{ x, rotate }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <StatusBadge {...props} />
    </motion.div>
  );
};

// StatusBadge with AnimatePresence
export const StatusBadgeWithPresence: React.FC<
  StatusBadgeProps & { isVisible: boolean }
> = ({ isVisible, ...props }) => {
  return (
    <AnimatePresence mode='wait'>
      {isVisible && (
        <motion.div
          initial='initial'
          animate='animate'
          exit='exit'
          variants={badgeVariants as any}
        >
          <StatusBadge {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusBadge;
