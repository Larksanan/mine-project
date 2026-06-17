import { FiAlertCircle } from 'react-icons/fi';

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  return (
    <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
      <div className='flex items-center gap-2 text-red-800'>
        <FiAlertCircle className='w-5 h-5' />
        <span className='font-medium'>{error}</span>
      </div>
    </div>
  );
};
