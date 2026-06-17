import React from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterType: string;
  onTypeChange: (value: string) => void;
  selectedDate: string;
  onDateChange: (value: string) => void;
}

export default function SearchFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterType,
  onTypeChange,
  selectedDate,
  onDateChange,
}: SearchFiltersProps) {
  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
      <div className='flex flex-col lg:flex-row gap-4'>
        {/* Search */}
        <div className='flex-1 relative'>
          <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
          <input
            suppressHydrationWarning
            type='text'
            placeholder='Search patients, reason, or email...'
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-2'>
          <select
            suppressHydrationWarning
            value={filterStatus}
            onChange={e => onStatusChange(e.target.value)}
            className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value='all'>All Status</option>
            <option value='scheduled'>Scheduled</option>
            <option value='confirmed'>Confirmed</option>
            <option value='completed'>Completed</option>
            <option value='cancelled'>Cancelled</option>
            <option value='no-show'>No Show</option>
          </select>

          <select
            suppressHydrationWarning
            value={filterType}
            onChange={e => onTypeChange(e.target.value)}
            className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value='all'>All Types</option>
            <option value='consultation'>Consultation</option>
            <option value='follow-up'>Follow-up</option>
            <option value='check-up'>Check-up</option>
            <option value='emergency'>Emergency</option>
            <option value='other'>Other</option>
          </select>

          <input
            suppressHydrationWarning
            type='date'
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />

          <button
            suppressHydrationWarning
            className='flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <FiFilter className='w-5 h-5' />
            More Filters
          </button>
        </div>
      </div>
    </div>
  );
}
