import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

interface ErrorDisplayProps {
  error: string;
  onBack: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
      <div className='flex items-center gap-2 text-red-800'>
        <FiAlertCircle className='w-5 h-5' />
        <span className='font-medium'>Error: {error}</span>
      </div>
    </div>
  );
};

export default ErrorDisplay;
