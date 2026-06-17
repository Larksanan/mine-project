'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  title = 'Confirm Delete',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
}: DeleteConfirmationModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50'
          />

          {/* Modal */}
          <div className='fixed inset-0 overflow-y-auto z-50'>
            <div className='flex min-h-full items-center justify-center p-4'>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className='relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden'
              >
                {/* Close button */}
                <button
                  onClick={onCancel}
                  className='absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all z-10'
                >
                  <FiX className='w-5 h-5' />
                </button>

                {/* Content */}
                <div className='p-6'>
                  {/* Icon and Title */}
                  <div className='flex items-center gap-4'>
                    <div className='shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                      <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 260,
                          damping: 20,
                          delay: 0.1,
                        }}
                      >
                        <FiAlertTriangle className='w-6 h-6 text-red-600' />
                      </motion.div>
                    </div>
                    <h3 className='text-xl font-bold text-slate-900'>
                      {title}
                    </h3>
                  </div>

                  {/* Message */}
                  <div className='mt-4'>
                    <p className='text-sm text-slate-600 leading-relaxed'>
                      {message}
                    </p>
                  </div>

                  {/* Warning message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className='mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl'
                  >
                    <p className='text-xs text-amber-800 font-medium'>
                      <span className='font-bold'>Warning:</span> This action
                      cannot be undone. All data associated with this item will
                      be permanently deleted.
                    </p>
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className='mt-6 flex items-center justify-end gap-3'
                  >
                    <motion.button
                      type='button'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onCancel}
                      disabled={isLoading}
                      className='px-5 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {cancelText}
                    </motion.button>
                    <motion.button
                      type='button'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onConfirm}
                      disabled={isLoading}
                      className='px-5 py-2.5 bg-linear-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className='animate-spin h-4 w-4 text-white'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        confirmText
                      )}
                    </motion.button>
                  </motion.div>
                </div>

                {/* Decorative gradient line */}
                <div className='absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-red-500 via-red-400 to-red-500' />
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
