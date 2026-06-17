'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Productpharmacy,
  StockFilter,
  ProductsResponse,
  ProductFilters,
} from '@/types/product';
import { validateProductId } from '@/validation/productValidation';

export const useProducts = (initialFilters?: Partial<ProductFilters>) => {
  const [products, setProducts] = useState<Productpharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(
    initialFilters?.searchQuery || ''
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialFilters?.selectedCategory || ''
  );
  const [stockFilter, setStockFilter] = useState<StockFilter>(
    initialFilters?.stockFilter || 'all'
  );
  const [currentPage, setCurrentPage] = useState(
    initialFilters?.currentPage || 1
  );
  const [totalPages, setTotalPages] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const categories = [
    'Prescription',
    'OTC',
    'Supplements',
    'Medical Devices',
    'Personal Care',
    'Other',
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (stockFilter !== 'all') {
        if (stockFilter === 'inStock') params.append('inStock', 'true');
        if (stockFilter === 'outOfStock') params.append('inStock', 'false');
      }

      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data: ProductsResponse = await response.json();

      if (data.success) {
        // Make sure we're using the correct property from the API response
        // The response might be structured differently - adjust based on your actual API
        const productsData = data.data.products || data.data.products || [];
        setProducts(productsData);
        setTotalPages(data.data.pagination.pages);
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, stockFilter, searchQuery]);

  const handleDelete = async (productId: string) => {
    if (!validateProductId(productId)) {
      setError('Invalid product ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setDeleteLoading(productId);
      setError(null);

      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchProducts(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete product'
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  const clearFilters = useCallback(() => {
    setSelectedCategory('');
    setStockFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const retryFetch = useCallback(() => {
    setError(null);
    fetchProducts();
  }, [fetchProducts]);

  // Add low stock filter logic
  const filteredProducts = useCallback(() => {
    if (stockFilter === 'lowStock') {
      return products.filter(
        product =>
          product.inStock &&
          product.stockQuantity > 0 &&
          product.stockQuantity <= product.minStockLevel
      );
    }

    if (stockFilter === 'inStock') {
      return products.filter(
        product =>
          product.inStock &&
          product.stockQuantity > 0 &&
          product.stockQuantity > product.minStockLevel
      );
    }

    if (stockFilter === 'outOfStock') {
      return products.filter(
        product => !product.inStock || product.stockQuantity === 0
      );
    }

    return products;
  }, [products, stockFilter]);

  // Search functionality
  const searchedProducts = useCallback(() => {
    const filtered = filteredProducts();

    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter(
      product =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.manufacturer.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
  }, [filteredProducts, searchQuery]);

  // Category filter
  const categorizedProducts = useCallback(() => {
    const searched = searchedProducts();

    if (!selectedCategory) return searched;

    return searched.filter(product => product.category === selectedCategory);
  }, [searchedProducts, selectedCategory]);

  return {
    products: categorizedProducts(), // Return filtered products
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
    fetchProducts,
    handleDelete,
    clearFilters,
    retryFetch,
    rawProducts: products, // Keep original unfiltered products if needed
  };
};

export const useStockStatus = () => {
  const getStockStatus = useCallback((product: Productpharmacy) => {
    if (!product.inStock || product.stockQuantity === 0) {
      return {
        text: 'Out of Stock',
        color: 'text-red-600 bg-red-50 border-red-200',
      };
    }
    if (product.stockQuantity <= product.minStockLevel) {
      return {
        text: 'Low Stock',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      };
    }
    return {
      text: 'In Stock',
      color: 'text-green-600 bg-green-50 border-green-200',
    };
  }, []);

  return { getStockStatus };
};
