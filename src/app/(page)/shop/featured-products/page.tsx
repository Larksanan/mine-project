/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/ui/Loading';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiDollarSign,
  FiX,
  FiUpload,
  FiLink,
  FiInfo,
} from 'react-icons/fi';

interface FeaturedProduct {
  _id: string;
  image: string;
  title: string;
  description: string;
  link: string;
  price?: number;
  originalPrice?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export default function FeaturedProductsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FeaturedProduct | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    price: '',
    originalPrice: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = session?.user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'PHARMACIST') {
        router.push('/');
        showNotification(
          'error',
          'Access denied. Admin  and pharmacist only area.'
        );
      }
    }
  }, [status, session, router]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/allproduct/FeaturedProduct');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        showNotification('error', data.message || 'Failed to fetch products');
      }
    } catch {
      showNotification('error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotification(
          'error',
          'Invalid file type. Only JPG, PNG, WEBP allowed.'
        );
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'File size exceeds 5MB limit.');
        return;
      }

      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.description) {
      showNotification('error', 'Title and description are required');
      return;
    }

    if (!selectedFile && !editingProduct) {
      showNotification('error', 'Please select an image');
      return;
    }

    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('link', formData.link || '/shop/pharmacy');
    if (formData.price) formDataToSend.append('price', formData.price);
    if (formData.originalPrice)
      formDataToSend.append('originalPrice', formData.originalPrice);
    if (selectedFile) formDataToSend.append('image', selectedFile);

    try {
      const url = editingProduct
        ? `/api/allproduct/FeaturedProduct?id=${editingProduct._id}`
        : '/api/allproduct/FeaturedProduct';

      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          'success',
          `Product ${editingProduct ? 'updated' : 'created'} successfully`
        );
        resetForm();
        fetchProducts();
      } else {
        showNotification('error', data.message || 'Failed to save product');
      }
    } catch {
      showNotification('error', 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/allproduct/FeaturedProduct?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Product deleted successfully');
        fetchProducts();
      } else {
        showNotification('error', data.message || 'Failed to delete');
      }
    } catch (error) {
      showNotification('error', 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/allproduct/FeaturedProduct?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await response.json();

      if (data.success) {
        showNotification(
          'success',
          `Product ${!currentStatus ? 'activated' : 'deactivated'}`
        );
        fetchProducts();
      } else {
        showNotification('error', data.message || 'Failed to update status');
      }
    } catch (error) {
      showNotification('error', 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      price: '',
      originalPrice: '',
    });
    setSelectedFile(null);
    setImagePreview('');
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: FeaturedProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      link: product.link || '',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
    });
    setImagePreview(product.image);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
                notification.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Featured Products
            </h1>
            <p className='text-gray-600 mt-1'>
              Manage products displayed on the homepage
            </p>
          </div>
          {!showForm && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className='flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-md'
            >
              <FiPlus className='w-5 h-5' />
              Add New Product
            </motion.button>
          )}
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='bg-white rounded-lg shadow-lg p-6 mb-8'
            >
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-semibold text-gray-800'>
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h2>
                <button
                  onClick={resetForm}
                  className='text-gray-400 hover:text-gray-600 transition'
                >
                  <FiX className='w-6 h-6' />
                </button>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Image Upload */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Product Image *
                  </label>
                  <div className='mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-500 transition'>
                    <div className='space-y-1 text-center'>
                      {imagePreview ? (
                        <div className='relative'>
                          <div className='relative w-48 h-48 mx-auto'>
                            <Image
                              src={imagePreview}
                              alt='Preview'
                              fill
                              className='object-cover rounded-lg'
                            />
                          </div>
                          <button
                            type='button'
                            onClick={() => {
                              setSelectedFile(null);
                              setImagePreview('');
                            }}
                            className='mt-2 text-sm text-red-600 hover:text-red-700'
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <>
                          <FiUpload className='mx-auto h-12 w-12 text-gray-400' />
                          <div className='flex text-sm text-gray-600'>
                            <label
                              htmlFor='file-upload'
                              className='relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500'
                            >
                              <span>Upload a file</span>
                              <input
                                id='file-upload'
                                name='file-upload'
                                type='file'
                                onChange={handleFileChange}
                                accept='image/jpeg,image/png,image/webp'
                                className='sr-only'
                              />
                            </label>
                            <p className='pl-1'>or drag and drop</p>
                          </div>
                          <p className='text-xs text-gray-500'>
                            PNG, JPG, WEBP up to 5MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Title *
                  </label>
                  <input
                    type='text'
                    value={formData.title}
                    onChange={e =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    placeholder='Enter product title'
                    required
                    maxLength={100}
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    {formData.title.length}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    placeholder='Enter product description'
                    required
                    maxLength={500}
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Price Fields */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Price
                    </label>
                    <div className='relative'>
                      <FiDollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                      <input
                        type='number'
                        step='0.01'
                        value={formData.price}
                        onChange={e =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                        placeholder='0.00'
                      />
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Original Price
                    </label>
                    <div className='relative'>
                      <FiDollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                      <input
                        type='number'
                        step='0.01'
                        value={formData.originalPrice}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            originalPrice: e.target.value,
                          })
                        }
                        className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                        placeholder='0.00'
                      />
                    </div>
                  </div>
                </div>

                {/* Link */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Link URL
                  </label>
                  <div className='relative'>
                    <FiLink className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                    <input
                      type='text'
                      value={formData.link}
                      onChange={e =>
                        setFormData({ ...formData, link: e.target.value })
                      }
                      className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                      placeholder='/shop/pharmacy'
                    />
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Default: /shop/pharmacy
                  </p>
                </div>

                {/* Form Buttons */}
                <div className='flex gap-3 pt-4'>
                  <motion.button
                    type='submit'
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50'
                  >
                    {isSubmitting ? (
                      <span className='flex items-center justify-center gap-2'>
                        <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent'></div>
                        {editingProduct ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : editingProduct ? (
                      'Update Product'
                    ) : (
                      'Create Product'
                    )}
                  </motion.button>
                  <button
                    type='button'
                    onClick={resetForm}
                    className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold text-gray-800'>
              All Products ({products.length})
            </h2>
            <button
              onClick={fetchProducts}
              className='flex items-center gap-2 text-gray-600 hover:text-orange-600 transition'
            >
              <FiRefreshCw className='w-4 h-4' />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600'></div>
            </div>
          ) : products.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300'>
              <FiInfo className='mx-auto h-12 w-12 text-gray-400' />
              <p className='mt-4 text-gray-500'>No featured products found</p>
              <button
                onClick={() => setShowForm(true)}
                className='mt-4 text-orange-600 hover:text-orange-700 font-medium'
              >
                Create your first product →
              </button>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300'
                >
                  <div className='relative h-56 overflow-hidden'>
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className='object-cover hover:scale-105 transition-transform duration-300'
                    />
                    <div className='absolute top-2 right-2 flex gap-2'>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          handleToggleStatus(product._id, product.isActive)
                        }
                        className={`p-2 rounded-full shadow-lg transition ${
                          product.isActive
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                        title={product.isActive ? 'Active' : 'Inactive'}
                      >
                        {product.isActive ? (
                          <FiEye className='w-4 h-4' />
                        ) : (
                          <FiEyeOff className='w-4 h-4' />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(product)}
                        className='p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition'
                        title='Edit'
                      >
                        <FiEdit2 className='w-4 h-4' />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(product._id)}
                        className='p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition'
                        title='Delete'
                      >
                        <FiTrash2 className='w-4 h-4' />
                      </motion.button>
                    </div>
                    {product.price && (
                      <div className='absolute bottom-2 left-2 bg-orange-600 text-white px-2 py-1 rounded-lg text-sm font-bold'>
                        ${product.price}
                      </div>
                    )}
                  </div>
                  <div className='p-4'>
                    <h3 className='font-semibold text-lg text-gray-800 mb-2 line-clamp-1'>
                      {product.title}
                    </h3>
                    <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                      {product.description}
                    </p>
                    {product.originalPrice && product.price && (
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='text-xs text-gray-400 line-through'>
                          ${product.originalPrice}
                        </span>
                        <span className='text-xs text-green-600'>
                          Save $
                          {(product.originalPrice - product.price).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between items-center text-xs text-gray-400'>
                      <span>ID: {product._id.slice(-6)}</span>
                      <span>
                        {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
