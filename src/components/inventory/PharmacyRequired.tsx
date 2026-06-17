'use client';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';

interface PharmacyRequiredProps {
  onSelectPharmacy: () => void;
  onGoToDashboard: () => void;
}

export default function PharmacyRequired({
  onSelectPharmacy,
  onGoToDashboard,
}: PharmacyRequiredProps) {
  return (
    <div className='min-h-screen bg-gray-50 p-6 flex items-center justify-center'>
      <div className='bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center'>
        <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <FiAlertTriangle className='w-8 h-8 text-red-600' />
        </div>
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Pharmacy Required
        </h2>
        <p className='text-gray-600 mb-6'>
          Please select a pharmacy to view its inventory.
        </p>
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={onSelectPharmacy}
            className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            Select Pharmacy
          </button>
          <button
            onClick={onGoToDashboard}
            className='flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
          >
            <FiHome className='w-4 h-4' />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
