'use client';
import { motion } from 'framer-motion';
import { InventoryItem } from '@/types/Inventory';

interface ExpandedItemDetailsProps {
  item: InventoryItem;
  formatDate: (dateString: string) => string;
}

export default function ExpandedItemDetails({
  item,
  formatDate,
}: ExpandedItemDetailsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className='border-t border-gray-200 bg-gray-50'
    >
      <div className='p-4 md:p-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
          <div>
            <h4 className='text-sm font-medium text-gray-500 mb-2'>
              Supplier Info
            </h4>
            <p className='text-sm text-gray-900'>
              {item.supplier || 'No supplier specified'}
            </p>
          </div>
          <div>
            <h4 className='text-sm font-medium text-gray-500 mb-2'>
              Batch & Expiry
            </h4>
            <div className='text-sm text-gray-900'>
              <div>{item.batchNumber || 'No batch number'}</div>
              {item.expiryDate && (
                <div
                  className={`mt-1 ${
                    new Date(item.expiryDate) < new Date()
                      ? 'text-red-600 font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  Expires: {formatDate(item.expiryDate)}
                  {new Date(item.expiryDate) < new Date() && (
                    <span className='ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full'>
                      Expired
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className='text-sm font-medium text-gray-500 mb-2'>Location</h4>
            <p className='text-sm text-gray-900'>
              {item.location || 'Not specified'}
            </p>
          </div>
          <div>
            <h4 className='text-sm font-medium text-gray-500 mb-2'>
              Reorder Info
            </h4>
            <p className='text-sm text-gray-900'>
              <span className='block'>Level: {item.reorderLevel || 5}</span>
              <span className='block'>Qty: {item.reorderQuantity || 25}</span>
            </p>
          </div>
        </div>
        {item.notes && (
          <div className='mt-4 pt-4 border-t border-gray-200'>
            <h4 className='text-sm font-medium text-gray-500 mb-2'>Notes</h4>
            <p className='text-sm text-gray-900 whitespace-pre-line'>
              {item.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
