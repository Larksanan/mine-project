import React from 'react';
import { motion, Variants } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import * as Icons from 'react-icons/fi';

interface IconProps {
  name: keyof typeof Icons;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  color?: string;
  className?: string;
  animated?: boolean;
  spin?: boolean;
  bounce?: boolean;
  pulse?: boolean;
  shake?: boolean;
  float?: boolean;
  hoverEffect?: boolean;
  hoverScale?: number;
  hoverRotate?: number;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'outline' | 'ghost' | 'gradient';
  rounded?: boolean;
  background?: boolean;
  containerClassName?: string;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color,
  className,
  animated = false,
  spin = false,
  bounce = false,
  pulse = false,
  shake = false,
  float = false,
  hoverEffect = false,
  hoverScale = 1.2,
  hoverRotate = 10,
  onClick,
  disabled = false,
  loading = false,
  variant = 'ghost',
  rounded = false,
  background = false,
  containerClassName,
}) => {
  const IconComponent = Icons[name];

  // Size classes
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
    '3xl': 'w-12 h-12',
  };

  // Variant classes
  const variantClasses = {
    solid: 'bg-gray-800 text-white dark:bg-gray-700',
    outline:
      'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    ghost: '',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
  };

  // Background container classes
  const bgSizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
    '2xl': 'p-4',
    '3xl': 'p-5',
  };

  // Animation variants
  const spinVariants: Variants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const bounceVariants: Variants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  };

  const pulseVariants: Variants = {
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  };

  const shakeVariants: Variants = {
    animate: {
      x: [0, -3, 3, -3, 3, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 2,
      },
    },
  };

  const floatVariants: Variants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const hoverVariants: Variants = {
    hover: {
      scale: hoverScale,
      rotate: hoverRotate,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.9,
    },
  };

  // Combine animations
  const getAnimationVariants = (): Variants => {
    const variants: Variants = {
      initial: { scale: 1, rotate: 0 },
      hover: hoverEffect ? hoverVariants.hover : {},
      tap: hoverEffect ? hoverVariants.tap : {},
    };

    if (spin)
      variants.animate = { ...variants.animate, ...spinVariants.animate };
    if (bounce)
      variants.animate = { ...variants.animate, ...bounceVariants.animate };
    if (pulse)
      variants.animate = { ...variants.animate, ...pulseVariants.animate };
    if (shake)
      variants.animate = { ...variants.animate, ...shakeVariants.animate };
    if (float)
      variants.animate = { ...variants.animate, ...floatVariants.animate };

    // Fallback for simple animated prop
    if (animated && !spin && !bounce && !pulse && !shake && !float) {
      variants.animate = {
        y: [0, -5, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };
    }

    return variants;
  };

  const iconContent = (
    <IconComponent
      className={twMerge(
        sizeClasses[size],
        variant !== 'ghost' && background && variantClasses[variant],
        rounded && background && 'rounded-lg',
        loading && 'opacity-50',
        disabled && 'opacity-30 cursor-not-allowed',
        className
      )}
      style={color ? { color } : undefined}
    />
  );

  const motionProps = {
    initial: 'initial',
    animate:
      spin || bounce || pulse || shake || float || animated
        ? 'animate'
        : undefined,
    whileHover: hoverEffect ? 'hover' : undefined,
    whileTap: hoverEffect ? 'tap' : undefined,
    variants: getAnimationVariants(),
    className: twMerge(
      'inline-flex items-center justify-center',
      background && bgSizeClasses[size],
      background && rounded && 'rounded-full',
      onClick && !disabled && 'cursor-pointer',
      containerClassName
    ),
    onClick: disabled ? undefined : onClick,
  };

  // Loading state
  if (loading) {
    return (
      <motion.div {...motionProps}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={twMerge(
            'border-2 border-current border-t-transparent rounded-full',
            sizeClasses[size]
          )}
        />
      </motion.div>
    );
  }

  // Wrap in motion div if we have animations or click handler
  if (
    animated ||
    spin ||
    bounce ||
    pulse ||
    shake ||
    float ||
    hoverEffect ||
    onClick
  ) {
    return <motion.div {...motionProps}>{iconContent}</motion.div>;
  }

  // Simple icon with background
  if (background && variant !== 'ghost') {
    return (
      <div
        className={twMerge(
          'inline-flex items-center justify-center',
          bgSizeClasses[size],
          variantClasses[variant],
          rounded && 'rounded-lg',
          onClick && !disabled && 'cursor-pointer',
          disabled && 'opacity-30 cursor-not-allowed',
          containerClassName
        )}
      >
        {iconContent}
      </div>
    );
  }

  return iconContent;
};

// Helper function to get all available icon names
export const getAvailableIcons = (): string[] => {
  return Object.keys(Icons);
};

// Pre-configured icon presets
export const IconPresets = {
  Loading: (props: Partial<IconProps>) => (
    <Icon name='FiLoader' spin {...props} />
  ),
  Success: (props: Partial<IconProps>) => (
    <Icon name='FiCheckCircle' color='#10B981' bounce {...props} />
  ),
  Error: (props: Partial<IconProps>) => (
    <Icon name='FiXCircle' color='#EF4444' shake {...props} />
  ),
  Warning: (props: Partial<IconProps>) => (
    <Icon name='FiAlertTriangle' color='#F59E0B' pulse {...props} />
  ),
  Info: (props: Partial<IconProps>) => (
    <Icon name='FiInfo' color='#3B82F6' {...props} />
  ),
  Edit: (props: Partial<IconProps>) => (
    <Icon name='FiEdit' hoverEffect hoverRotate={0} {...props} />
  ),
  Delete: (props: Partial<IconProps>) => (
    <Icon name='FiTrash2' hoverEffect {...props} />
  ),
  Add: (props: Partial<IconProps>) => (
    <Icon name='FiPlus' hoverEffect {...props} />
  ),
  Search: (props: Partial<IconProps>) => (
    <Icon name='FiSearch' animated {...props} />
  ),
  Notification: (props: Partial<IconProps>) => (
    <Icon name='FiBell' pulse {...props} />
  ),
};

export default Icon;
