// components/inventory/InventoryItemRow.tsx
'use client';
import { motion } from 'framer-motion';
import {
  FiChevronUp,
  FiChevronDown,
  FiEye,
  FiEdit,
  FiTrash2,
} from 'react-icons/fi';
import { InventoryItem } from '@/types/Inventory';
import ExpandedItemDetails from './ExpandedItemDetails';

interface InventoryItemRowProps {
  item: InventoryItem;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (itemId: string) => void;
  onToggleExpand: (itemId: string) => void;
  onView: (itemId: string) => void;
  onEdit: (itemId: string) => void;
  onDelete: (item: InventoryItem) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export default function InventoryItemRow({
  item,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onView,
  onEdit,
  onDelete,
  getStatusColor,
  getStatusText,
  formatCurrency,
  formatDate,
}: InventoryItemRowProps) {
  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className='hover:bg-gray-50 transition-colors group'
      >
        <td className='px-4 md:px-6 py-4 whitespace-nowrap'>
          <input
            type='checkbox'
            checked={isSelected}
            onChange={() => onSelect(item._id)}
            className='h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300'
            aria-label={`Select ${item.name}`}
          />
        </td>
        <td className='px-4 md:px-6 py-4'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => onToggleExpand(item._id)}
              className='text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1'
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <FiChevronUp className='w-4 h-4' />
              ) : (
                <FiChevronDown className='w-4 h-4' />
              )}
            </button>
            <div>
              <div className='text-sm font-medium text-gray-900'>
                {item.name}
              </div>
              {item.description && (
                <div className='text-sm text-gray-500 truncate max-w-xs'>
                  {item.description}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className='px-4 md:px-6 py-4 whitespace-nowrap'>
          <div className='text-sm text-gray-900 font-mono'>{item.sku}</div>
          {item.barcode && (
            <div className='text-xs text-gray-500'>📊 {item.barcode}</div>
          )}
        </td>
        <td className='px-4 md:px-6 py-4 whitespace-nowrap'>
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            {item.category}
          </span>
        </td>
        <td className='px-4 md:px-6 py-4 whitespace-nowrap'>
          <div className='text-sm font-medium text-gray-900'>
            {item.quantity}
          </div>
          <div className='text-xs text-gray-500'>
            Low at: {item.lowStockThreshold}
          </div>
        </td>
        <td className='px-4 md:px-6 py-4 whitespace-nowrap'>
          <div className='text-sm font-medium text-gray-900'>
            {formatCurrency(item.sellingPrice)}
          </div>
          <div className='text-xs text-gray-500'>
            Cost: {formatCurrency(item.costPrice)}
          </div>
        </td>
        <td className='px-4 md:px-6 py-4 whitespace-nowrap'>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}
          >
            {getStatusText(item.status)}
          </span>
        </td>
        <td className='px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
          {formatDate(item.updatedAt)}
        </td>
        <td className='px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
          <div className='flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
            <button
              onClick={() => onView(item._id)}
              className='text-blue-600 hover:text-blue-900 p-2 transition-colors rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              title='View Details'
              aria-label={`View details for ${item.name}`}
            >
              <FiEye className='w-4 h-4' />
            </button>
            <button
              onClick={() => onEdit(item._id)}
              className='text-green-600 hover:text-green-900 p-2 transition-colors rounded-lg hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500'
              title='Edit Item'
              aria-label={`Edit ${item.name}`}
            >
              <FiEdit className='w-4 h-4' />
            </button>
            <button
              onClick={() => onDelete(item)}
              className='text-red-600 hover:text-red-900 p-2 transition-colors rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
              title='Delete Item'
              aria-label={`Delete ${item.name}`}
            >
              <FiTrash2 className='w-4 h-4' />
            </button>
          </div>
        </td>
      </motion.tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className='p-0'>
            <ExpandedItemDetails item={item} formatDate={formatDate} />
          </td>
        </tr>
      )}
    </>
  );
}
