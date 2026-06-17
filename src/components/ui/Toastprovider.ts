'use client';

import React from 'react';
import { ToastData } from '@/components/ui/Toast';
import { useToastStore } from '@/components/ui/use-toast';

const Toast = ({
  message,
  type,
  onClose,
}: ToastData & { onClose: () => void }) => {
  return React.createElement(
    'div',
    {
      className: `p-4 rounded-md shadow-lg flex justify-between items-center min-w-[300px] ${
        type === 'success'
          ? 'bg-green-500 text-white'
          : type === 'error'
            ? 'bg-red-500 text-white'
            : type === 'warning'
              ? 'bg-yellow-500 text-white'
              : 'bg-blue-500 text-white'
      }`,
    },
    React.createElement('span', null, message),
    React.createElement(
      'button',
      { onClick: onClose, className: 'ml-4 font-bold' },
      '×'
    )
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: (ToastData & { id: string })[];
  onRemove: (id: string) => void;
}) => {
  return React.createElement(
    'div',
    {
      className: 'fixed bottom-4 right-4 z-50 flex flex-col gap-2',
    },
    toasts.map(toast =>
      React.createElement(Toast, {
        key: toast.id,
        ...toast,
        onClose: () => onRemove(toast.id),
      })
    )
  );
};

export const ToastProvider = () => {
  const { toasts, removeToast } = useToastStore();
  return React.createElement(ToastContainer, { toasts, onRemove: removeToast });
};
