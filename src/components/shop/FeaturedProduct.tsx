/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Loading from '@/components/ui/Loading';
import ErrorDisplay from '@/components/Error';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart,
  FiHeart,
  FiShare2,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

interface FeaturedProduct {
  _id: string;
  image: string;
  title: string;
  description: string;
  isActive?: boolean;
  link?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  category?: string;
  tags?: string[];
}

export default function FeaturedProductSection() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<FeaturedProduct[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const productsPerPage = 6;

  useEffect(() => {
    fetchFeaturedProduct();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, products]);

  const fetchFeaturedProduct = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/allproduct/FeaturedProduct');

      if (!response.ok) {
        throw new Error(
          `Failed to fetch featured products: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const activeProducts = data.data.filter(
          (product: FeaturedProduct) => product.isActive !== false
        );
        setProducts(activeProducts);
        setFilteredProducts(activeProducts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        product => product.category === selectedCategory
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const convertToLKR = (usdPrice?: number): number | null => {
    if (!usdPrice) return null;
    const exchangeRate = 300;
    return usdPrice * exchangeRate;
  };

  const formatLKR = (price?: number): string => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = (
    originalPrice?: number,
    price?: number
  ): number | null => {
    if (!originalPrice || !price || originalPrice <= price) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Get unique categories
  const categories = [
    'all',
    ...new Set(products.map(p => p.category).filter(Boolean)),
  ];

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <Loading />;
  if (error) return <ErrorDisplay message={error} />;
  if (products.length === 0) return null;

  // Color scheme: Emerald/Teal theme

  return (
    <section className='py-16 bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50'>
      <div className='container mx-auto px-4 md:px-8'>
        {/* Header Section */}
        <div className='text-center mb-12'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className='text-emerald-600 font-bold text-sm uppercase tracking-wider bg-emerald-100 px-4 py-1.5 rounded-full inline-block'>
              Premium Collection
            </span>
            <h2 className='text-4xl md:text-5xl font-bold text-gray-800 mt-4 mb-4'>
              Featured Products
            </h2>
            <div className='w-24 h-1 bg-linear-to-r from-emerald-600 to-teal-600 mx-auto rounded-full'></div>
            <p className='text-gray-600 mt-4 max-w-2xl mx-auto'>
              Discover our handpicked selection of premium products at exclusive
              prices
            </p>
          </motion.div>
        </div>

        {/* Filters and Controls */}
        <div className='mb-8 flex flex-col md:flex-row justify-between items-center gap-4'>
          {/* Category Filter */}
          <div className='flex gap-2 flex-wrap justify-center'>
            {categories.map(category => (
              <button
                key={category ?? 'uncategorized'}
                onClick={() => setSelectedCategory(category ?? 'all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-emerald-100'
                }`}
              >
                {category === 'all' ? 'All Products' : category}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className='flex gap-2 bg-white rounded-lg p-1 shadow-md'>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-emerald-100'
              }`}
            >
              <FiGrid className='w-5 h-5' />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-emerald-100'
              }`}
            >
              <FiList className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Products Display */}
        <motion.div
          layout
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
              : 'space-y-6'
          }
        >
          <AnimatePresence mode='wait'>
            {currentProducts.map((product, index) => {
              const lkrPrice = convertToLKR(product.price);
              const lkrOriginalPrice = convertToLKR(product.originalPrice);
              const discount = calculateDiscount(
                product.originalPrice,
                product.price
              );
              const isInWishlist = wishlist.includes(product._id);

              if (viewMode === 'grid') {
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className='group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300'
                  >
                    {/* Discount Badge */}
                    {discount && (
                      <div className='absolute top-4 left-4 z-20 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg'>
                        {discount}% OFF
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className='absolute top-4 right-4 z-20 flex gap-2'>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleWishlist(product._id)}
                        className='bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg transition-all'
                      >
                        <FiHeart
                          className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                        />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className='bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg transition-all'
                      >
                        <FiShare2 className='w-4 h-4 text-gray-600' />
                      </motion.button>
                    </div>

                    {/* Product Image */}
                    <Link href={product.link || '/shop/pharmacy'}>
                      <div className='relative h-72 overflow-hidden bg-linear-to-br from-emerald-100 to-teal-100'>
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className='object-cover transition-transform duration-700 group-hover:scale-110'
                          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                        />
                        <div className='absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className='p-5'>
                      {product.category && (
                        <span className='text-xs text-emerald-600 font-semibold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded'>
                          {product.category}
                        </span>
                      )}

                      <Link href={product.link || '/shop/pharmacy'}>
                        <h3 className='font-bold text-gray-800 text-lg mt-2 mb-2 line-clamp-2 hover:text-emerald-600 transition-colors'>
                          {product.title}
                        </h3>
                      </Link>

                      <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                        {product.description}
                      </p>

                      {/* Price */}
                      <div className='mb-3'>
                        {lkrOriginalPrice && (
                          <span className='text-sm text-gray-400 line-through'>
                            {formatLKR(lkrOriginalPrice)}
                          </span>
                        )}
                        <div className='flex items-baseline gap-2'>
                          <span className='text-2xl font-bold text-emerald-600'>
                            {formatLKR(lkrPrice ?? undefined)}
                          </span>
                          {discount && (
                            <span className='text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full'>
                              Save {discount}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Shop Button */}
                      <Link href={product.link || '/shop/pharmacy'}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className='w-full bg-linear-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg'
                        >
                          <FiShoppingCart className='w-4 h-4' />
                          Shop Now
                        </motion.button>
                      </Link>
                    </div>
                  </motion.div>
                );
              } else {
                // List View
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    className='bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300'
                  >
                    <div className='flex flex-col md:flex-row'>
                      {/* Image */}
                      <div className='relative md:w-64 h-48 md:h-auto'>
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className='object-cover'
                        />
                        {discount && (
                          <div className='absolute top-3 left-3 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded'>
                            -{discount}%
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className='flex-1 p-6'>
                        <div className='flex justify-between items-start'>
                          <div>
                            {product.category && (
                              <span className='text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded'>
                                {product.category}
                              </span>
                            )}
                            <h3 className='font-bold text-xl text-gray-800 mt-2 mb-2'>
                              {product.title}
                            </h3>
                            <p className='text-gray-600 mb-3'>
                              {product.description}
                            </p>
                            <div>
                              {lkrOriginalPrice && (
                                <span className='text-sm text-gray-400 line-through'>
                                  {formatLKR(lkrOriginalPrice)}
                                </span>
                              )}
                              <div className='text-2xl font-bold text-emerald-600'>
                                {formatLKR(lkrPrice ?? undefined)}
                              </div>
                            </div>
                          </div>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => toggleWishlist(product._id)}
                              className='p-2 bg-gray-100 rounded-full hover:bg-red-50 transition-colors'
                            >
                              <FiHeart
                                className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                              />
                            </button>
                            <button className='p-2 bg-gray-100 rounded-full hover:bg-emerald-50 transition-colors'>
                              <FiRefreshCw className='w-5 h-5 text-gray-600' />
                            </button>
                          </div>
                        </div>
                        <Link href={product.link || '/shop/pharmacy'}>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            className='mt-4 bg-linear-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:from-emerald-700 hover:to-teal-700 transition-all'
                          >
                            <FiShoppingCart className='w-4 h-4' />
                            Shop Now
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              }
            })}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-12 flex justify-center items-center gap-2'>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className='p-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 transition-colors'
            >
              <FiChevronLeft className='w-5 h-5' />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                  currentPage === i + 1
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-emerald-100'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='p-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 transition-colors'
            >
              <FiChevronRight className='w-5 h-5' />
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className='mt-8 text-center text-gray-600'>
          Showing {indexOfFirstProduct + 1} -{' '}
          {Math.min(indexOfLastProduct, filteredProducts.length)} of{' '}
          {filteredProducts.length} products
        </div>
      </div>
    </section>
  );
}
