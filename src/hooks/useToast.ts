import { useState, useCallback } from 'react';
import { ToastData } from '@/types/booking';

export const useToast = () => {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: ToastData['type']) => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const success = useCallback(
    (message: string) => {
      showToast(message, 'success');
    },
    [showToast]
  );

  const error = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  const info = useCallback(
    (message: string) => {
      showToast(message, 'info');
    },
    [showToast]
  );

  return {
    toast,
    showToast,
    hideToast,
    success,
    error,
    info,
  };
};
