/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { StockFilter } from '@/types/product';

interface FilterSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  stockFilter: StockFilter;
  setStockFilter: (filter: StockFilter) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
  categories: string[];
  filterVariants: any;
}

// eslint-disable-next-line no-undef
const FilterSection: React.FC<FilterSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  stockFilter,
  setStockFilter,
  showFilters,
  setShowFilters,
  clearFilters,
  categories,
  filterVariants,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'
    >
      <div className='flex flex-col lg:flex-row gap-4'>
        {/* Search Input */}
        <div className='flex-1 relative'>
          <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg' />
          <input
            type='text'
            placeholder='Search products by name, SKU, or manufacturer...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
          />
        </div>

        {/* Filter Buttons */}
        <div className='flex gap-2'>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50/50 backdrop-blur-sm transition-all duration-300'
          >
            <FiFilter />
            Filters
            {(selectedCategory || stockFilter !== 'all') && (
              <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
            )}
          </motion.button>

          {(selectedCategory || stockFilter !== 'all' || searchQuery) && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearFilters}
              className='flex items-center gap-2 px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50/50 backdrop-blur-sm transition-all duration-300'
            >
              <FiX />
              Clear
            </motion.button>
          )}
        </div>
      </div>

      {/* Expanded Filters Section */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            variants={filterVariants}
            initial='hidden'
            animate='visible'
            exit='hidden'
            className='mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6'
          >
            {/* Category Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-300'
              >
                <option value=''>All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value as StockFilter)}
                className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-300'
              >
                <option value='all'>All Products</option>
                <option value='inStock'>In Stock</option>
                <option value='lowStock'>Low Stock</option>
                <option value='outOfStock'>Out of Stock</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FilterSection;
