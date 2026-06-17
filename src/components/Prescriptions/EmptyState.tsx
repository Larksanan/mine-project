'use client';

import React from 'react';
import { FiFileText, FiPlus } from 'react-icons/fi';

interface EmptyStateProps {
  hasFilters: boolean;
  onNewPrescription: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilters,
  onNewPrescription,
}) => (
  <div className='text-center py-12'>
    <FiFileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
    <h3 className='text-lg font-medium text-gray-900 mb-2'>
      {hasFilters ? 'No matching prescriptions found' : 'No prescriptions yet'}
    </h3>
    <p className='text-gray-500 mb-6'>
      {hasFilters
        ? 'Try adjusting your search or filters'
        : 'Get started by creating your first prescription'}
    </p>
    {!hasFilters && (
      <button
        onClick={onNewPrescription}
        className='inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md'
      >
        <FiPlus className='w-4 h-4' />
        New Prescription
      </button>
    )}
  </div>
);

export default EmptyState;
