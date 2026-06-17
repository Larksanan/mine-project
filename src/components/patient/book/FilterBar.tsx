import { FiFilter } from 'react-icons/fi';

interface FilterBarProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onBookNewAppointment: () => void;
}

export const FilterBar = ({
  statusFilter,
  onStatusFilterChange,
  onBookNewAppointment,
}: FilterBarProps) => {
  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6'>
      <div className='flex items-center gap-4'>
        <FiFilter className='w-5 h-5 text-gray-400' />
        <select
          value={statusFilter}
          onChange={e => onStatusFilterChange(e.target.value)}
          className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        >
          <option value='all'>All Appointments</option>
          <option value='SCHEDULED'>Scheduled</option>
          <option value='CONFIRMED'>Confirmed</option>
          <option value='COMPLETED'>Completed</option>
          <option value='CANCELLED'>Cancelled</option>
          <option value='NO_SHOW'>No Show</option>
        </select>
        <button
          onClick={onBookNewAppointment}
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          Book New Appointment
        </button>
      </div>
    </div>
  );
};
