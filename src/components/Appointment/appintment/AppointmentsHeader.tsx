import React from 'react';
import { FiRefreshCw, FiPlus } from 'react-icons/fi';

interface AppointmentsHeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
  onNewAppointment: () => void;
}

export default function AppointmentsHeader({
  onRefresh,
  refreshing,
  onNewAppointment,
}: AppointmentsHeaderProps) {
  return (
    <div className='mb-8'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Appointments</h1>
          <p className='text-gray-600 mt-2'>
            Manage and track patient appointments
          </p>
        </div>
        <div className='flex gap-3'>
          <button
            suppressHydrationWarning
            onClick={onRefresh}
            disabled={refreshing}
            className='flex items-center gap-2 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors'
          >
            <FiRefreshCw
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
          <button
            suppressHydrationWarning
            onClick={onNewAppointment}
            className='flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
          >
            <FiPlus className='w-5 h-5' />
            New Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
