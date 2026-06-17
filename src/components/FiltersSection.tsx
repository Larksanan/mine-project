'use client';

import { motion } from 'framer-motion';
import { FiFilter, FiChevronDown, FiSearch } from 'react-icons/fi';
import { filterVariants } from '@/animations/variants';

interface FiltersSectionProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: {
    searchTerm: string;
    selectedSpecialization: string;
    selectedDepartment: string;
    minExperience: number;
    maxFee: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFilterChange: (filter: string, value: any) => void;
  specializations: string[];
  departments: string[];
  onClearFilters: () => void;
}

export const FiltersSection = ({
  showFilters,
  onToggleFilters,
  filters,
  onFilterChange,
  specializations,
  departments,
}: FiltersSectionProps) => {
  return (
    <div className='space-y-6 mb-8'>
      {/* Main Search */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className='relative'
      >
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <FiSearch className='h-5 w-5 text-gray-400' />
        </div>
        <input
          type='text'
          placeholder='Search doctors, specializations, or hospitals...'
          value={filters.searchTerm}
          onChange={e => onFilterChange('searchTerm', e.target.value)}
          className='block w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300'
        />
      </motion.div>

      {/* Filters Toggle */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={onToggleFilters}
          className='flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
        >
          <FiFilter className='w-4 h-4' />
          <span>Filters</span>
          <FiChevronDown
            className={`w-4 h-4 transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`}
          />
        </button>
      </motion.div>

      {/* Advanced Filters */}
      <motion.div
        variants={filterVariants}
        initial='hidden'
        animate={showFilters ? 'visible' : 'hidden'}
        exit='exit'
        className='overflow-hidden'
      >
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Specialization
            </label>
            <select
              value={filters.selectedSpecialization}
              onChange={e =>
                onFilterChange('selectedSpecialization', e.target.value)
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value=''>All</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Department
            </label>
            <select
              value={filters.selectedDepartment}
              onChange={e =>
                onFilterChange('selectedDepartment', e.target.value)
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value=''>All</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Min Experience: {filters.minExperience}+ years
            </label>
            <input
              type='range'
              min='0'
              max='50'
              value={filters.minExperience}
              onChange={e =>
                onFilterChange('minExperience', parseInt(e.target.value))
              }
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Max Fee: LKR {filters.maxFee.toLocaleString()}
            </label>
            <input
              type='range'
              min='0'
              max='50000'
              step='1000'
              value={filters.maxFee}
              onChange={e => onFilterChange('maxFee', parseInt(e.target.value))}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
