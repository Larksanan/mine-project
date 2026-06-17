'use client';
import { FiPackage } from 'react-icons/fi';

interface EmptyInventoryStateProps {
  hasFilters: boolean;
  pharmacyId: string;
  onClearFilters: () => void;
  onAddNewItem: () => void;
}

export default function EmptyInventoryState({
  hasFilters,
  onClearFilters,
  onAddNewItem,
}: EmptyInventoryStateProps) {
  return (
    <div className='text-center py-12'>
      <div className='w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
        <FiPackage className='w-8 h-8 md:w-12 md:h-12 text-gray-400' />
      </div>
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
        {hasFilters
          ? 'No items match your criteria'
          : 'No inventory items found'}
      </h3>
      <p className='text-gray-600 mb-6 max-w-md mx-auto'>
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : 'Get started by adding your first inventory item to this pharmacy.'}
      </p>
      {hasFilters ? (
        <button
          onClick={onClearFilters}
          className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          Clear Filters
        </button>
      ) : (
        <button
          onClick={onAddNewItem}
          className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          Add New Item
        </button>
      )}
    </div>
  );
}
