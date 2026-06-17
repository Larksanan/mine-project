import React from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  hoverable?: boolean;
  pressable?: boolean;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'outline' | 'ghost' | 'filled';
  border?: boolean;
  animateOnHover?: boolean;
  animationDuration?: number;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  shadow = 'md',
  radius = 'lg',
  hoverable = false,
  pressable = false,
  elevated = false,
  padding = 'md',
  variant = 'default',
  border = true,
  animateOnHover = true,
  animationDuration = 0.2,
  onClick,
}) => {
  // Shadow classes
  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  // Radius classes
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  // Padding classes
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800',
    outline: border ? 'border border-gray-200 dark:border-gray-700' : '',
    ghost: 'bg-transparent',
    filled: 'bg-gray-50 dark:bg-gray-900',
  };

  // Base classes
  const baseClasses = twMerge(
    'transition-all duration-200',
    variantClasses[variant],
    border &&
      variant === 'default' &&
      'border border-gray-200 dark:border-gray-700'
  );

  // Interactive classes
  const interactiveClasses = twMerge(
    hoverable && 'hover:shadow-lg hover:-translate-y-0.5',
    pressable && 'cursor-pointer active:scale-[0.98]',
    elevated && 'shadow-lg hover:shadow-xl'
  );

  // Build the card content
  const cardContent = (
    <div
      className={twMerge(
        baseClasses,
        shadowClasses[shadow],
        radiusClasses[radius],
        paddingClasses[padding],
        interactiveClasses,
        className
      )}
      onClick={onClick}
      style={{ transitionDuration: `${animationDuration}s` }}
    >
      {children}
    </div>
  );

  // Animation variants for pressable cards
  const pressableAnimations = {
    hover: {
      y: -4,
      scale: 1.02,
      boxShadow:
        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    tap: { scale: 0.98 },
  };

  // Animation variants for hoverable cards
  const hoverableAnimations = {
    hover: {
      y: -2,
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  };

  // Return the appropriate card with animations
  if (pressable && animateOnHover) {
    return (
      <motion.div
        whileHover={pressableAnimations.hover}
        whileTap={pressableAnimations.tap}
        transition={{ duration: animationDuration }}
      >
        {cardContent}
      </motion.div>
    );
  }

  if (hoverable && animateOnHover) {
    return (
      <motion.div
        whileHover={hoverableAnimations.hover}
        transition={{ duration: animationDuration }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

// Card subcomponents
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  divider = true,
}) => {
  return (
    <div
      className={twMerge(
        'px-6 py-4',
        divider && 'border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CardBody: React.FC<CardBodyProps> = ({
  children,
  className,
  padding = 'md',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={twMerge(paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  divider = true,
  justify = 'end',
}) => {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div
      className={twMerge(
        'px-6 py-4 flex items-center gap-2',
        divider && 'border-t border-gray-200 dark:border-gray-700',
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
};

// Export Card with subcomponents
const CompoundCard = Object.assign(Card, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

export default CompoundCard;
