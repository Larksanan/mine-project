/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import ErrorDisplay from '@/components/Error';
import ProductGrid from '@/components/products/ProductGrid';
import EmptyState from '@/components/products/EmptyState';
import { Product } from '@/types/product';
import NewsLetter from '@/components/shop/NewsLetter';
import Banner from '@/components/shop/Banner';
import FeaturedProduct from '@/components/shop/FeaturedProduct';
import { useToast } from '@/hooks/useToast';
import { motion } from 'framer-motion';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simple endpoint - always use relative path
      const endpoint = '/api/products/user?all=true';

      console.log('Fetching products from:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(' API Error:', errorText);
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }

      const productsArray = extractProductsFromResponse(data);

      if (!Array.isArray(productsArray)) {
        console.error('Products is not an array:', productsArray);
        throw new Error('Invalid response format');
      }

      if (productsArray.length === 0) {
        console.warn('No products found in response');
        setProducts([]);
        setLoading(false);
        return;
      }

      const normalizedProducts = normalizeProducts(productsArray);
      const uniqueProducts = deduplicateProducts(normalizedProducts);

      console.log(' Successfully loaded', uniqueProducts.length, 'products');
      setProducts(uniqueProducts);
      setLoading(false);

      if (uniqueProducts.length > 0) {
        toast.showToast(
          `Successfully loaded ${uniqueProducts.length} products`,
          'success'
        );
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(
        'Failed to fetch products: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
      setLoading(false);
      toast.showToast(
        'Failed to fetch products. Please try again later.',
        'error'
      );
    }
  };

  const extractProductsFromResponse = (data: any): Product[] => {
    // Handle response where data is directly an array
    if (Array.isArray(data.data)) {
      return data.data;
    }

    // Handle response with nested products
    if (data.success && data.data) {
      if (data.data.products && Array.isArray(data.data.products)) {
        return data.data.products;
      }
      if (typeof data.data === 'object' && data.data.products) {
        return data.data.products;
      }
    }

    // Handle response that's directly an array
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  };

  const normalizeProducts = (productsArray: Product[]): Product[] => {
    return productsArray.map(product => ({
      ...product,
      _id: product.id || product._id,
      id: product.id || product._id,
    }));
  };

  const deduplicateProducts = (products: Product[]): Product[] => {
    return products.filter(
      (product, index, self) =>
        index ===
        self.findIndex(p => (p._id || p.id) === (product._id || product.id))
    );
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchProducts();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorDisplay message={error} />;
  if (!products.length) return <EmptyState onRetry={handleRetry} />;

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 pb-20'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='py-4 md:py-8'>
          <Banner />
        </div>

        <NewsLetter />

        <div className='mt-16 mb-10 text-center md:text-left px-4'>
          <h2 className='text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight'>
            Our Pharmacy Catalog
          </h2>
          <p className='mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl'>
            Trusted medications and wellness products at your fingertips.
          </p>
          <div className='mt-4 h-1.5 w-24 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full mx-auto md:mx-0' />
        </div>

        <ProductGrid products={products} />
        <FeaturedProduct />
      </div>
    </motion.main>
  );
}
