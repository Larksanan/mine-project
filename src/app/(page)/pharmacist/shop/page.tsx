/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiPlus, FiPackage, FiX, FiAlertCircle } from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import { useProducts, useStockStatus } from '@/hooks/useProducts';
import { getProductId } from '@/validation/productValidation';
import {
  containerVariants,
  itemVariants,
  filterVariants,
  pageTransition,
} from '@/animations/variants';
import ProductCard from '@/components/Pharmacis/ProductCard';
import FilterSection from '@/components/Pharmacis/FilterSection';
import Pagination from '@/components/Pharmacis/Pagination';
import { useState } from 'react';

export default function PharmacistShopPage() {
  const router = useRouter();
  const {
    products,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    deleteLoading,
    categories,
    handleDelete,
    clearFilters,
    retryFetch,
  } = useProducts();

  const { getStockStatus } = useStockStatus();
  const [showFilters, setShowFilters] = useState(false);

  // Show loading state
  if (loading) return <Loading />;

  // Show error state
  if (error) return <ErrorComponent message={error} />;

  return (
    <div className='min-h-screen to-indigo-100 p-4 sm:p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <motion.div {...pageTransition} className='mb-8'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text'>
                Product Inventory
              </h1>
              <p className='text-gray-600 mt-2'>
                Manage your pharmacy products efficiently
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/pharmacist/shop/add-product')}
              className='flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl'
            >
              <FiPlus className='text-xl' />
              Add Product
            </motion.button>
          </div>

          {/* Search and Filters */}
          <FilterSection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            clearFilters={clearFilters}
            categories={categories}
            filterVariants={filterVariants}
          />
        </motion.div>

        {/* Error Alert */}
        {error && <ErrorAlert error={error} retryFetch={retryFetch} />}

        {/* Products Grid */}
        <ProductsGrid
          products={products}
          getStockStatus={getStockStatus}
          handleDelete={handleDelete}
          deleteLoading={deleteLoading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          stockFilter={stockFilter}
          clearFilters={clearFilters}
          router={router}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

// Helper Components
const ErrorAlert = ({
  error,
  retryFetch,
}: {
  error: string;
  retryFetch: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className='mb-6'
  >
    <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3'>
      <FiAlertCircle className='text-red-500 text-xl' />
      <div className='flex-1'>
        <p className='text-red-800 text-sm'>{error}</p>
      </div>
      <button
        onClick={retryFetch}
        className='text-red-600 hover:text-red-800 text-sm font-medium'
      >
        Retry
      </button>
    </div>
  </motion.div>
);

const ProductsGrid = ({
  products,
  getStockStatus,
  handleDelete,
  deleteLoading,
  searchQuery,
  selectedCategory,
  stockFilter,
  clearFilters,
  router,
}: any) => {
  if (products.length === 0) {
    return (
      <EmptyState
        {...{
          searchQuery,
          selectedCategory,
          stockFilter,
          clearFilters,
          router,
        }}
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    >
      <AnimatePresence>
        {products.map((product: any) => (
          <ProductCard
            key={getProductId(product)}
            product={product}
            stockStatus={getStockStatus(product)}
            handleDelete={handleDelete}
            deleteLoading={deleteLoading}
            router={router}
            itemVariants={itemVariants}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

const EmptyState = ({
  searchQuery,
  selectedCategory,
  stockFilter,
  clearFilters,
  router,
}: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-12 text-center'
  >
    <FiPackage className='mx-auto text-6xl text-gray-300 mb-4' />
    <h3 className='text-xl font-semibold text-gray-900 mb-2'>
      No products found
    </h3>
    <p className='text-gray-600 mb-6'>
      {searchQuery || selectedCategory || stockFilter !== 'all'
        ? 'Try adjusting your filters to see more results'
        : 'Start by adding your first product to the inventory'}
    </p>
    <div className='flex gap-3 justify-center'>
      {(searchQuery || selectedCategory || stockFilter !== 'all') && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearFilters}
          className='inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300'
        >
          <FiX />
          Clear Filters
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/Pharmacist/shop/add-product')}
        className='inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300'
      >
        <FiPlus />
        Add Product
      </motion.button>
    </div>
  </motion.div>
);
