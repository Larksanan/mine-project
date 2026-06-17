'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SearchInput from '@/components/ui/SearchInput';
import FilterButton from '@/components/ui/FilterButton';
import FilterSection from '@/components/ui/FilterSection';
import ClearFiltersButton from '@/components/ui/ClearFiltersButton';
import {
  StatusFilter,
  PatientFilter,
  DateRangeFilter,
} from '@/components/filters';

import { PrescriptionFilters } from '@/types/Prescription';
import { IPatientFormData } from '@/types/patients';

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: PrescriptionFilters;
  setFilters: (filters: PrescriptionFilters) => void;
  clearFilters: () => void;
  uniquePatients: IPatientFormData[];
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  clearFilters,
  uniquePatients,
}) => {
  const hasActiveFilters = React.useMemo(() => {
    return (
      searchTerm ||
      filters.status ||
      filters.patient ||
      filters.dateRange.start ||
      filters.dateRange.end
    );
  }, [searchTerm, filters]);

  const handleStatusChange = (status: string) => {
    setFilters({ ...filters, status });
  };

  const handlePatientChange = (patient: string) => {
    setFilters({ ...filters, patient });
  };

  const handleStartDateChange = (start: string) => {
    setFilters({
      ...filters,
      dateRange: { ...filters.dateRange, start },
    });
  };

  const handleEndDateChange = (end: string) => {
    setFilters({
      ...filters,
      dateRange: { ...filters.dateRange, end },
    });
  };

  return (
    <div className='mb-6 space-y-4'>
      {/* Search and Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex flex-col sm:flex-row gap-3'
      >
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder='Search prescriptions by patient name, diagnosis, or medication...'
        />

        <div className='flex items-center gap-2'>
          <FilterButton
            onClick={() => setShowFilters(!showFilters)}
            active={showFilters}
            hasActiveFilters={!!hasActiveFilters}
          />

          {hasActiveFilters && (
            <ClearFiltersButton onClick={clearFilters} variant='ghost' />
          )}
        </div>
      </motion.div>

      {/* Filter Section */}
      <FilterSection isOpen={showFilters}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className='grid grid-cols-1 md:grid-cols-3 gap-6'
        >
          <StatusFilter value={filters.status} onChange={handleStatusChange} />

          <PatientFilter
            value={filters.patient}
            onChange={handlePatientChange}
            patients={uniquePatients}
          />

          <DateRangeFilter
            startDate={filters.dateRange.start}
            endDate={filters.dateRange.end}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            label='Start Date Range'
          />
        </motion.div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'
          >
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Active filters applied
              </span>
              <ClearFiltersButton
                onClick={clearFilters}
                label='Clear All Filters'
                variant='outline'
                showIcon={false}
              />
            </div>
          </motion.div>
        )}
      </FilterSection>
    </div>
  );
};

export default SearchFilters;
