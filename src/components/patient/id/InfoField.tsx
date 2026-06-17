import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface InfoFieldProps {
  label: string;

  value: string | number;

  icon?: ReactNode;

  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'muted';

  className?: string;
  animate?: boolean;
  tooltip?: string;
  loading?: boolean;
  onClick?: () => void;
  copyable?: boolean;
  format?: (value: string | number) => string;
}

export const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  className = '',
  animate = true,
  tooltip,
  loading = false,
  onClick,
  copyable = false,
  format,
}) => {
  // Format the value if formatter function provided
  const formattedValue = format ? format(value) : String(value);

  // Get styles based on variant
  const getVariantStyles = () => {
    const baseStyles = 'transition-colors duration-200';

    switch (variant) {
      case 'primary':
        return `${baseStyles} border-l-4 border-blue-500 pl-3 bg-blue-50`;
      case 'secondary':
        return `${baseStyles} border-l-4 border-purple-500 pl-3 bg-purple-50`;
      case 'success':
        return `${baseStyles} border-l-4 border-green-500 pl-3 bg-green-50`;
      case 'warning':
        return `${baseStyles} border-l-4 border-yellow-500 pl-3 bg-yellow-50`;
      case 'danger':
        return `${baseStyles} border-l-4 border-red-500 pl-3 bg-red-50`;
      case 'muted':
        return `${baseStyles} text-gray-500`;
      default:
        return baseStyles;
    }
  };

  // Get icon color based on variant
  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return 'text-blue-500';
      case 'secondary':
        return 'text-purple-500';
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'danger':
        return 'text-red-500';
      case 'muted':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(formattedValue);
      // You could add a toast notification here
      console.log('Copied to clipboard:', formattedValue);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const content = (
    <div
      className={`${getVariantStyles()} ${className} ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
      title={tooltip}
    >
      <div className='flex justify-between items-start mb-1'>
        <label className='text-sm font-medium text-gray-500'>{label}</label>
        {copyable && (
          <button
            onClick={handleCopy}
            className='text-xs text-gray-400 hover:text-gray-600 p-1'
            title='Copy to clipboard'
          >
            Copy
          </button>
        )}
      </div>

      {loading ? (
        <div className='flex items-center gap-2'>
          <div className='animate-pulse bg-gray-200 h-4 w-32 rounded'></div>
        </div>
      ) : (
        <div className='flex items-center gap-2'>
          {icon && (
            <div className={`${getIconColor()} shrink-0 w-4 h-4`}>{icon}</div>
          )}
          <p className='text-gray-900 wrap-break-word'>
            {formattedValue || 'N/A'}
          </p>
        </div>
      )}
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      className='w-full'
    >
      {content}
    </motion.div>
  );
};
export const InfoFieldGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}> = ({ children, columns = 2, gap = 'md' }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={`grid ${gridClasses[columns]} ${gapClasses[gap]}`}>
      {children}
    </div>
  );
};

// Pre-styled InfoField variants for common use cases
export const PrimaryInfoField = (props: Omit<InfoFieldProps, 'variant'>) => (
  <InfoField variant='primary' {...props} />
);

export const SuccessInfoField = (props: Omit<InfoFieldProps, 'variant'>) => (
  <InfoField variant='success' {...props} />
);

export const WarningInfoField = (props: Omit<InfoFieldProps, 'variant'>) => (
  <InfoField variant='warning' {...props} />
);

export const DangerInfoField = (props: Omit<InfoFieldProps, 'variant'>) => (
  <InfoField variant='danger' {...props} />
);

export const MutedInfoField = (props: Omit<InfoFieldProps, 'variant'>) => (
  <InfoField variant='muted' {...props} />
);
