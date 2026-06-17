'use client';
import {
  FiSearch,
  FiX,
  FiDownload,
  FiUpload,
  FiBarChart,
} from 'react-icons/fi';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterCategory: string;
  onCategoryChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  categories: string[];
  statuses: Array<{ value: string; label: string }>;
  onClearFilters: () => void;
  onExport: () => void;
  onImport: () => void;
  onViewReports: () => void;
}

export default function SearchAndFilters({
  searchTerm,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterStatus,
  onStatusChange,
  categories,
  statuses,
  onClearFilters,
  onExport,
  onImport,
  onViewReports,
}: SearchAndFiltersProps) {
  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6'>
      <div className='flex flex-col lg:flex-row gap-4'>
        <div className='flex-1 relative'>
          <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
          <input
            type='text'
            placeholder='Search items by name, SKU, category, or barcode...'
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className='w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            aria-label='Search inventory items'
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          <select
            value={filterCategory}
            onChange={e => onCategoryChange(e.target.value)}
            className='px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base'
            aria-label='Filter by category'
          >
            <option value='all'>All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => onStatusChange(e.target.value)}
            className='px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base'
            aria-label='Filter by status'
          >
            <option value='all'>All Status</option>
            {statuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <button
            onClick={onClearFilters}
            className='flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base'
            aria-label='Clear all filters'
          >
            <FiX className='w-4 h-4' />
            Clear
          </button>
        </div>
      </div>

      <div className='flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200'>
        <button
          onClick={onExport}
          className='flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 text-sm'
          aria-label='Export inventory'
        >
          <FiDownload className='w-4 h-4' />
          Export
        </button>
        <button
          onClick={onImport}
          className='flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
          aria-label='Import inventory'
        >
          <FiUpload className='w-4 h-4' />
          Import
        </button>
        <button
          onClick={onViewReports}
          className='flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm'
          aria-label='View reports'
        >
          <FiBarChart className='w-4 h-4' />
          Reports
        </button>
      </div>
    </div>
  );
}
