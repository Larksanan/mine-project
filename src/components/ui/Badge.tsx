import React from 'react';
import { motion, Variants, easeOut } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'default'
    | 'processing';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  pulse?: boolean;
  glow?: boolean;
  bounce?: boolean;
  gradient?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  animationVariants?: Variants;
  animationType?: 'spring' | 'tween' | 'inertia';
  delay?: number;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = 'full',
  pulse = false,
  glow = false,
  bounce = false,
  gradient = false,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  interactive = false,
  animationVariants,
  animationType = 'spring',
  delay = 0,
}) => {
  // Size classes
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-sm',
    md: 'px-3 py-1',
    lg: 'px-4 py-1.5 text-base',
  };

  // Rounded classes
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  // Variant classes
  const variantClasses = {
    success: gradient
      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-200 dark:border-emerald-800'
      : 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    warning: gradient
      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-yellow-200 dark:border-amber-800'
      : 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    danger: gradient
      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-200 dark:border-rose-800'
      : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
    info: gradient
      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-blue-200 dark:border-cyan-800'
      : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    default: gradient
      ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white border-gray-200 dark:border-slate-800'
      : 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800',
    processing: gradient
      ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white border-purple-200 dark:border-violet-800'
      : 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
  };

  // Animation transition based on type
  const getTransition = () => {
    switch (animationType) {
      case 'spring':
        return { type: 'spring' as const, stiffness: 300, damping: 20, delay };
      case 'tween':
        return { duration: 0.3, ease: easeOut, delay };
      case 'inertia':
        return { type: 'inertia' as const, velocity: 50, delay };
      default:
        return { type: 'spring' as const, stiffness: 300, damping: 20, delay };
    }
  };

  // Default animation variants
  const defaultVariants: Variants = {
    initial: {
      scale: 0.8,
      opacity: 0,
      y: 5,
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: getTransition(),
    },
    hover: interactive
      ? {
          scale: 1.05,
          y: -1,
          transition: { duration: 0.2 },
        }
      : {},
    tap: interactive
      ? {
          scale: 0.95,
          transition: { duration: 0.1 },
        }
      : {},
  };

  // Pulse animation
  const pulseAnimation = pulse
    ? {
        scale: [1, 1.1, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      }
    : {};

  // Bounce animation
  const bounceAnimation = bounce
    ? {
        y: [0, -3, 0],
        transition: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: 'reverse' as const,
        },
      }
    : {};

  // Glow animation
  const glowAnimation = glow
    ? {
        boxShadow: [
          '0 0 0 0 rgba(99, 102, 241, 0.4)',
          '0 0 0 6px rgba(99, 102, 241, 0)',
          '0 0 0 0 rgba(99, 102, 241, 0.4)',
        ],
        transition: {
          duration: 2,
          repeat: Infinity,
        },
      }
    : {};

  // Combine animations
  const combinedVariants = {
    ...defaultVariants,
    animate: {
      ...defaultVariants.animate,
      ...pulseAnimation,
      ...bounceAnimation,
      ...glowAnimation,
    },
  };

  // Pulse indicator (static CSS version)
  const pulseIndicator = pulse && (
    <span className='absolute -top-1 -right-1 flex h-3 w-3'>
      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75'></span>
      <span className='relative inline-flex rounded-full h-3 w-3 bg-current'></span>
    </span>
  );

  const badgeContent = (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 font-medium border relative',
        sizeClasses[size],
        roundedClasses[rounded],
        variantClasses[variant],
        interactive && 'cursor-pointer transition-all duration-200',
        pulse && 'relative',
        className
      )}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
      {pulseIndicator}
    </span>
  );

  const motionProps = {
    initial: 'initial',
    animate: 'animate',
    whileHover: interactive ? 'hover' : undefined,
    whileTap: interactive ? 'tap' : undefined,
    variants: animationVariants || combinedVariants,
  };

  if (onClick) {
    return (
      <motion.button
        type='button'
        onClick={onClick}
        className='focus:outline-none'
        {...motionProps}
      >
        {badgeContent}
      </motion.button>
    );
  }

  return <motion.span {...motionProps}>{badgeContent}</motion.span>;
};

export default Badge;
