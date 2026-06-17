import { Appointment } from '@/types/appointment';

interface StatsSummaryProps {
  appointments: Appointment[];
}

export const StatsSummary = ({ appointments }: StatsSummaryProps) => {
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(apt => apt.status === 'scheduled').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
  };

  return (
    <div className='mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Summary</h3>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='text-center'>
          <p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
          <p className='text-sm text-gray-600'>Total</p>
        </div>
        <div className='text-center'>
          <p className='text-2xl font-bold text-blue-600'>{stats.scheduled}</p>
          <p className='text-sm text-gray-600'>Scheduled</p>
        </div>
        <div className='text-center'>
          <p className='text-2xl font-bold text-green-600'>{stats.completed}</p>
          <p className='text-sm text-gray-600'>Completed</p>
        </div>
        <div className='text-center'>
          <p className='text-2xl font-bold text-red-600'>{stats.cancelled}</p>
          <p className='text-sm text-gray-600'>Cancelled</p>
        </div>
      </div>
    </div>
  );
};
