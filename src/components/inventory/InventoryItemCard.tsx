'use client';
import { motion } from 'framer-motion';
import { InventoryItem } from '@/types/Inventory';

interface InventoryItemCardProps {
  item: InventoryItem;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
  onView: (itemId: string) => void;
  onEdit: (itemId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export default function InventoryItemCard({
  item,
  isSelected,
  onSelect,
  onView,
  onEdit,
  getStatusColor,
  getStatusText,
  formatCurrency,
  formatDate,
}: InventoryItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-all relative'
    >
      <div className='absolute top-4 right-4'>
        <input
          type='checkbox'
          checked={isSelected}
          onChange={() => onSelect(item._id)}
          className='h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300'
          aria-label={`Select ${item.name}`}
        />
      </div>

      <div className='flex justify-between items-start mb-4'>
        <div className='pr-8'>
          <h3 className='font-semibold text-gray-900 truncate'>{item.name}</h3>
          <p className='text-sm text-gray-500 mt-1'>{item.category}</p>
        </div>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}
        >
          {getStatusText(item.status)}
        </span>
      </div>

      <div className='space-y-3 mb-4'>
        <div className='flex justify-between text-sm'>
          <span className='text-gray-500'>SKU:</span>
          <span className='font-mono text-gray-900'>{item.sku}</span>
        </div>
        <div className='flex justify-between text-sm'>
          <span className='text-gray-500'>Quantity:</span>
          <span className='font-semibold text-gray-900'>{item.quantity}</span>
        </div>
        <div className='flex justify-between text-sm'>
          <span className='text-gray-500'>Price:</span>
          <span className='font-semibold text-green-600'>
            {formatCurrency(item.sellingPrice)}
          </span>
        </div>
        {item.expiryDate && (
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>Expires:</span>
            <span
              className={`font-medium ${
                new Date(item.expiryDate) < new Date()
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {formatDate(item.expiryDate)}
            </span>
          </div>
        )}
      </div>

      <div className='flex justify-between pt-4 border-t border-gray-200'>
        <button
          onClick={() => onEdit(item._id)}
          className='text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1'
          aria-label={`Edit ${item.name}`}
        >
          Edit
        </button>
        <button
          onClick={() => onView(item._id)}
          className='text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded px-2 py-1'
          aria-label={`View details for ${item.name}`}
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}
