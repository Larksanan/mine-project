/* eslint-disable no-undef */
import { FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface PatientFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  genderFilter: string;
  onGenderFilterChange: (value: string) => void;
  bloodTypeFilter: string;
  onBloodTypeFilterChange: (value: string) => void;
  ageFilter: string;
  onAgeFilterChange: (value: string) => void;
  maritalStatusFilter: string;
  onMaritalStatusFilterChange: (value: string) => void;
  isActiveFilter: boolean;
  onIsActiveFilterChange: (value: boolean) => void;
  sortBy?: string;
  sortOrder?: string;
  onSortChange?: (sortBy: string, sortOrder: string) => void;
  limit?: number;
  onLimitChange?: (value: number) => void;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const searchVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
  focus: {
    scale: 1.02,
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    transition: { duration: 0.2 },
  },
};

const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchTerm,
  onSearchChange,
  genderFilter,
  onGenderFilterChange,
  bloodTypeFilter,
  onBloodTypeFilterChange,
  ageFilter,
  onAgeFilterChange,
  maritalStatusFilter,
  onMaritalStatusFilterChange,
  isActiveFilter,
  onIsActiveFilterChange,
  sortBy = 'name',
  sortOrder = 'asc',
  onSortChange,
  limit = 10,
  onLimitChange,
}) => {
  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-6'
    >
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {/* Search input */}
        <motion.div
          variants={searchVariants}
          whileFocus='focus'
          className='relative col-span-1 md:col-span-2 lg:col-span-1'
        >
          <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <motion.input
            type='text'
            placeholder='Search patients...'
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            whileFocus={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className='w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none'
          />
        </motion.div>

        {/* Gender filter */}
        <motion.div variants={itemVariants}>
          <select
            value={genderFilter}
            onChange={e => onGenderFilterChange(e.target.value)}
            className='w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer hover:border-blue-300'
          >
            <option value='ALL'>All Genders</option>
            <option value='MALE'>Male</option>
            <option value='FEMALE'>Female</option>
            <option value='OTHER'>Other</option>
          </select>
        </motion.div>

        {/* Blood type filter */}
        <motion.div variants={itemVariants}>
          <select
            value={bloodTypeFilter}
            onChange={e => onBloodTypeFilterChange(e.target.value)}
            className='w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer hover:border-blue-300'
          >
            <option value='ALL'>All Blood Types</option>
            <option value='O+'>O+</option>
            <option value='O-'>O-</option>
            <option value='A+'>A+</option>
            <option value='A-'>A-</option>
            <option value='B+'>B+</option>
            <option value='B-'>B-</option>
            <option value='AB+'>AB+</option>
            <option value='AB-'>AB-</option>
          </select>
        </motion.div>

        {/* Age filter */}
        <motion.div variants={itemVariants}>
          <select
            value={ageFilter}
            onChange={e => onAgeFilterChange(e.target.value)}
            className='w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer hover:border-blue-300'
          >
            <option value='ALL'>All Ages</option>
            <option value='CHILD'>Children (&lt;18)</option>
            <option value='ADULT'>Adults (18-64)</option>
            <option value='SENIOR'>Seniors (65+)</option>
          </select>
        </motion.div>

        {/* Marital status filter */}
        <motion.div variants={itemVariants}>
          <select
            value={maritalStatusFilter}
            onChange={e => onMaritalStatusFilterChange(e.target.value)}
            className='w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer hover:border-blue-300'
          >
            <option value='ALL'>All Status</option>
            <option value='SINGLE'>Single</option>
            <option value='MARRIED'>Married</option>
            <option value='DIVORCED'>Divorced</option>
            <option value='WIDOWED'>Widowed</option>
          </select>
        </motion.div>

        {/* Active status filter */}
        <motion.div variants={itemVariants}>
          <select
            value={isActiveFilter ? 'ACTIVE' : 'INACTIVE'}
            onChange={e => onIsActiveFilterChange(e.target.value === 'ACTIVE')}
            className='w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer hover:border-blue-300'
          >
            <option value='ACTIVE'>Active Patients</option>
            <option value='INACTIVE'>Inactive Patients</option>
          </select>
        </motion.div>

        {/* Sort by */}
        {onSortChange && (
          <motion.div variants={itemVariants}>
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value, sortOrder)}
              className='w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer hover:border-blue-300'
            >
              <option value='name'>Sort by Name</option>
              <option value='age'>Sort by Age</option>
              <option value='recent'>Sort by Recent</option>
              <option value='gender'>Sort by Gender</option>
            </select>
          </motion.div>
        )}

        {/* Sort order */}
        {onSortChange && (
          <motion.div variants={itemVariants}>
            <select
              value={sortOrder}
              onChange={e => onSortChange(sortBy, e.target.value)}
              className='w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer hover:border-blue-300'
            >
              <option value='asc'>Ascending</option>
              <option value='desc'>Descending</option>
            </select>
          </motion.div>
        )}

        {/* Limit */}
        {onLimitChange && (
          <motion.div variants={itemVariants}>
            <select
              value={limit}
              onChange={e => onLimitChange(Number(e.target.value))}
              className='w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer hover:border-blue-300'
            >
              <option value='10'>10 per page</option>
              <option value='25'>25 per page</option>
              <option value='50'>50 per page</option>
              <option value='100'>100 per page</option>
            </select>
          </motion.div>
        )}
      </div>

      {/* Active filters summary */}
      <AnimatePresence>
        {(searchTerm ||
          genderFilter !== 'ALL' ||
          bloodTypeFilter !== 'ALL' ||
          ageFilter !== 'ALL' ||
          maritalStatusFilter !== 'ALL' ||
          !isActiveFilter) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className='mt-4 pt-4 border-t border-gray-200'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-gray-600'>Active filters:</span>
                <div className='flex flex-wrap gap-2'>
                  {searchTerm && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className='px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200'
                    >
                      Search: {searchTerm}
                    </motion.span>
                  )}
                  {genderFilter !== 'ALL' && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className='px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200'
                    >
                      Gender: {genderFilter}
                    </motion.span>
                  )}
                  {bloodTypeFilter !== 'ALL' && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className='px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200'
                    >
                      Blood: {bloodTypeFilter}
                    </motion.span>
                  )}
                  {ageFilter !== 'ALL' && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className='px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200'
                    >
                      Age: {ageFilter}
                    </motion.span>
                  )}
                  {maritalStatusFilter !== 'ALL' && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className='px-3 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-medium border border-pink-200'
                    >
                      Status: {maritalStatusFilter}
                    </motion.span>
                  )}
                  {!isActiveFilter && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className='px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium border border-gray-200'
                    >
                      Inactive only
                    </motion.span>
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onSearchChange('');
                  onGenderFilterChange('ALL');
                  onBloodTypeFilterChange('ALL');
                  onAgeFilterChange('ALL');
                  onMaritalStatusFilterChange('ALL');
                  onIsActiveFilterChange(true);
                }}
                className='text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path d='M6 18L18 6M6 6l12 12'></path>
                </svg>
                Clear all
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PatientFilters;
