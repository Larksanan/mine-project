'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
  FiX,
} from 'react-icons/fi';
import { motion, AnimatePresence, Variants } from 'framer-motion';

export interface ToastData {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ToastType = ToastData['type'];

export type ToastOptions = Partial<Omit<ToastData, 'type' | 'message'>>;

interface ToastProps extends ToastData {
  onClose: () => void;
}

const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 100,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

// MAIN COMPONENT - Exported as named export
export const Toast = ({
  message,
  type,
  duration = 5000,
  action,
  onClose,
}: ToastProps) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  const config = {
    success: {
      bgColor:
        'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-100',
      iconColor: 'text-green-500 dark:text-green-400',
      icon: FiCheckCircle,
    },
    error: {
      bgColor:
        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-100',
      iconColor: 'text-red-500 dark:text-red-400',
      icon: FiAlertCircle,
    },
    info: {
      bgColor:
        'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-100',
      iconColor: 'text-blue-500 dark:text-blue-400',
      icon: FiInfo,
    },
    warning: {
      bgColor:
        'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-100',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      icon: FiAlertTriangle,
    },
  }[type];

  const Icon = config.icon;

  return (
    <motion.div
      variants={toastVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      className={`relative border rounded-lg shadow-lg ${config.bgColor} min-w-75 max-w-125 pointer-events-auto`}
      role='alert'
      aria-live='polite'
      aria-atomic='true'
    >
      <div className='p-4'>
        <div className='flex items-start gap-3'>
          <Icon className={`w-5 h-5 ${config.iconColor} shrink-0 mt-0.5`} />

          <div className='flex-1 min-w-0'>
            <p className={`font-medium text-sm ${config.textColor}`}>
              {message}
            </p>

            {action && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  action.onClick();
                  handleClose();
                }}
                className={`mt-2 text-sm font-semibold ${config.textColor} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded`}
              >
                {action.label}
              </button>
            )}
          </div>

          <button
            type='button'
            onClick={handleClose}
            className={`opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded ${config.textColor}`}
            aria-label='Close notification'
          >
            <FiX className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className={`h-1 ${config.iconColor.replace('text-', 'bg-')} rounded-b-lg`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: (ToastData & { id: string })[];
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className='fixed top-6 right-6 z-100 flex flex-col gap-3 pointer-events-none'>
      <AnimatePresence mode='popLayout'>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className='pointer-events-auto'
            style={{ zIndex: 100 + index }}
          >
            <Toast {...toast} onClose={() => onRemove(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<(ToastData & { id: string })[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType, options?: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type, ...options }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const ToastContainerWrapper = useCallback(
    () => <ToastContainer toasts={toasts} onRemove={removeToast} />,
    [toasts, removeToast]
  );

  return {
    showToast,
    ToastContainer: ToastContainerWrapper,
  };
};

export default Toast;
