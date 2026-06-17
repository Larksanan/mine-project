'use client';

import { create } from 'zustand';
import { ToastData } from '@/components/ui/Toast';

interface ToastState {
  toasts: (ToastData & { id: string })[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastCount = 0;

export const useToastStore = create<ToastState>(set => ({
  toasts: [],

  addToast: toast => {
    const id = `toast-${++toastCount}`;
    set(state => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },

  removeToast: id => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Hook for easy usage
export const useToast = () => {
  const { addToast, removeToast, clearAll } = useToastStore();

  return {
    success: (
      message: string,
      options?: Partial<Omit<ToastData, 'type' | 'message'>>
    ) => addToast({ message, type: 'success', ...options }),

    error: (
      message: string,
      options?: Partial<Omit<ToastData, 'type' | 'message'>>
    ) => addToast({ message, type: 'error', ...options }),

    info: (
      message: string,
      options?: Partial<Omit<ToastData, 'type' | 'message'>>
    ) => addToast({ message, type: 'info', ...options }),

    warning: (
      message: string,
      options?: Partial<Omit<ToastData, 'type' | 'message'>>
    ) => addToast({ message, type: 'warning', ...options }),

    custom: (toast: Omit<ToastData, 'id'>) => addToast(toast),

    dismiss: removeToast,

    dismissAll: clearAll,
  };
};
