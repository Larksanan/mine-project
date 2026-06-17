// components/inventory/DeleteConfirmationModal.tsx
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { InventoryItem } from '@/types/Inventory';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: (itemId: string) => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  item,
  deleting,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className='bg-white rounded-xl p-6 max-w-md w-full'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                <FiAlertTriangle className='w-5 h-5 text-red-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Delete Item
              </h3>
            </div>

            <p className='text-gray-600 mb-6'>
              Are you sure you want to delete{' '}
              <strong className='font-semibold'>{item.name}</strong>? This
              action cannot be undone and will permanently remove this item from
              the inventory.
            </p>

            <div className='flex gap-3 justify-end'>
              <button
                onClick={onClose}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                aria-label='Cancel deletion'
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(item._id)}
                disabled={deleting}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                aria-label='Confirm deletion'
              >
                {deleting ? (
                  <span className='flex items-center gap-2'>
                    <FiRefreshCw className='w-4 h-4 animate-spin' />
                    Deleting...
                  </span>
                ) : (
                  'Delete Item'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
