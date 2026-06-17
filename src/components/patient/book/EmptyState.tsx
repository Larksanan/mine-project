import { FiCalendar } from 'react-icons/fi';

interface EmptyStateProps {
  statusFilter: string;
  onBookAppointment: () => void;
}

export const EmptyState = ({
  statusFilter,
  onBookAppointment,
}: EmptyStateProps) => {
  const getMessage = () => {
    if (statusFilter === 'all') {
      return "You haven't booked any appointments yet";
    }
    return `No ${statusFilter.toLowerCase()} appointments`;
  };

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
      <FiCalendar className='w-16 h-16 text-gray-400 mx-auto mb-4' />
      <h3 className='text-lg font-medium text-gray-900 mb-2'>
        No appointments found
      </h3>
      <p className='text-gray-600 mb-6'>{getMessage()}</p>
      <button
        onClick={onBookAppointment}
        className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
      >
        Book Your First Appointment
      </button>
    </div>
  );
};
