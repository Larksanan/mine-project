import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

interface PageHeaderProps {
  onBack: () => void;
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ onBack, title, subtitle }) => {
  return (
    <div className='mb-8'>
      <button
        onClick={onBack}
        className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
      >
        <FiArrowLeft className='w-5 h-5' />
        Back to Appointments
      </button>

      <div className='flex justify-between items-start'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>{title}</h1>
          <p className='text-gray-600 mt-2'>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
