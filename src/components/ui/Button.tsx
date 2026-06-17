import React from 'react';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<
  HTMLMotionProps<'button'>,
  'children'
> {
  children: React.ReactNode;
  color?:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'success'
    | 'warning'
    | 'default';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?:
    | 'solid'
    | 'outline'
    | 'ghost'
    | 'light'
    | 'link'
    | 'text'
    | 'gradient';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  isIconOnly?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'inner' | 'hover';
  animation?: 'none' | 'pulse' | 'bounce' | 'scale' | 'float';
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  color = 'primary',
  size = 'md',
  variant = 'solid',
  icon,
  iconPosition = 'left',
  isIconOnly = false,
  isLoading = false,
  loading = false,
  className,
  disabled = false,
  fullWidth = false,
  rounded = 'lg',
  shadow = 'none',
  animation = 'none',
  onClick,
  ...props
}) => {
  const loadingState = isLoading || loading;

  const baseClasses = twMerge(
    'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-[0.98]',
    fullWidth && 'w-full',
    isIconOnly && 'flex items-center justify-center aspect-square'
  );

  const sizeClasses = {
    xs: isIconOnly ? 'p-1' : 'px-2 py-1 text-xs',
    sm: isIconOnly ? 'p-1.5' : 'px-3 py-1.5 text-sm',
    md: isIconOnly ? 'p-2' : 'px-4 py-2.5',
    lg: isIconOnly ? 'p-2.5' : 'px-6 py-3',
    xl: isIconOnly ? 'p-3' : 'px-8 py-4 text-lg',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    inner: 'shadow-inner',
    hover: 'shadow-sm hover:shadow-lg',
  };

  const colorClasses = {
    primary: {
      solid: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      outline:
        'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      light: 'bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-500',
      gradient:
        'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500',
    },
    secondary: {
      solid: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline:
        'border-2 border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
      light: 'bg-gray-50 text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
      gradient:
        'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500',
    },
    danger: {
      solid: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      outline:
        'border-2 border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
      ghost: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
      light: 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500',
      gradient:
        'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500',
    },
    success: {
      solid: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      outline:
        'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
      ghost: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
      light:
        'bg-green-50 text-green-600 hover:bg-green-100 focus:ring-green-500',
      gradient:
        'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500',
    },
    warning: {
      solid:
        'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
      outline:
        'border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500',
      ghost: 'text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500',
      light:
        'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 focus:ring-yellow-500',
      gradient:
        'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800 focus:ring-yellow-500',
    },
    default: {
      solid:
        'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200',
      outline:
        'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
      ghost: 'text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
      light: 'bg-gray-50 text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
      gradient:
        'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600 focus:ring-gray-400',
    },
  };

  const textLinkClasses = {
    primary: 'text-blue-600 hover:text-blue-800 hover:underline',
    secondary: 'text-gray-600 hover:text-gray-800 hover:underline',
    danger: 'text-red-600 hover:text-red-800 hover:underline',
    success: 'text-green-600 hover:text-green-800 hover:underline',
    warning: 'text-yellow-600 hover:text-yellow-800 hover:underline',
    default: 'text-gray-700 hover:text-gray-900 hover:underline',
  };

  const animationVariants = {
    none: {},
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
    bounce: {
      y: [0, -5, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
    scale: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
    float: {
      y: [0, -8, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse' as const,
        ease: 'easeInOut',
      },
    },
  };

  // Special handling for text and link variants
  if (variant === 'text' || variant === 'link') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={twMerge(
          baseClasses,
          'bg-transparent p-0 border-0 focus:ring-0 focus:ring-offset-0',
          textLinkClasses[color],
          variant === 'link' && 'underline',
          className
        )}
        disabled={disabled || loadingState}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.button>
    );
  }

  const buttonContent = (
    <>
      {loadingState ? (
        <span className='flex items-center justify-center gap-2'>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className='inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full'
          />
          {!isIconOnly && 'Loading...'}
        </span>
      ) : (
        <span className='flex items-center justify-center gap-2'>
          {icon && iconPosition === 'left' && icon}
          {!isIconOnly && children}
          {icon && iconPosition === 'right' && icon}
        </span>
      )}
    </>
  );

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      animate={animation !== 'none' ? animationVariants[animation] : {}}
      className={twMerge(
        baseClasses,
        sizeClasses[size],
        roundedClasses[rounded],
        shadowClasses[shadow],
        colorClasses[color][variant as keyof typeof colorClasses.primary],
        className
      )}
      disabled={disabled || loadingState}
      onClick={onClick}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
};

export default Button;
