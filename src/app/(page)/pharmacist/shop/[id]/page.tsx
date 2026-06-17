/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiEdit,
  FiSave,
  FiX,
  FiUpload,
  FiPackage,
  FiAlertCircle,
} from 'react-icons/fi';
import Image from 'next/image';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: string;
  image: string;
  inStock: boolean;
  stockQuantity: number;
  minStockLevel: number;
  pharmacy: {
    id: string;
    name: string;
  };
  sku: string;
  manufacturer: string;
  requiresPrescription: boolean;
  isControlledSubstance: boolean;
  sideEffects?: string;
  dosage?: string;
  activeIngredients?: string;
  barcode: string;
  createdAt: string;
  updatedAt: string;
}

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string | undefined;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const [editData, setEditData] = useState<Partial<Product>>({});

  const categories = [
    'Prescription',
    'OTC',
    'Supplements',
    'Medical Devices',
    'Personal Care',
    'First Aid',
    'Baby Care',
    'Vitamins',
    'Other',
  ];

  useEffect(() => {
    if (productId) {
      fetchProduct();
    } else {
      setError('Product ID is undefined');
      setLoading(false);
    }
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) {
      setError('Cannot fetch product: ID is undefined');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
        setEditData(data.data);
      } else {
        throw new Error(data.error || 'Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load product'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setEditData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value),
      }));
    } else {
      setEditData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadstart = () => setError(null);
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setEditData(prev => ({ ...prev, image: base64String }));
      };
      reader.onerror = () => setError('Failed to read image file');
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!productId) {
      setError('Product ID is missing');
      return;
    }

    // Validation
    if (!editData.name?.trim()) {
      setError('Product name is required');
      return;
    }

    if (!editData.price || Number(editData.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editData,
          price: parseFloat(editData.price as any),
          costPrice: parseFloat((editData.costPrice as any) || '0'),
          stockQuantity: parseInt((editData.stockQuantity as any) || '0'),
          minStockLevel: parseInt((editData.minStockLevel as any) || '0'),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
        setIsEditing(false);
        setImagePreview('');
        // Show success message
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update product'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(product || {});
    setImagePreview('');
    setError(null);
  };

  // Show loading state
  if (loading) return <Loading />;

  // Show error state
  if (error && !product) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-6xl mx-auto'>
          <button
            onClick={() => router.push('/Pharmacist/shop')}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6'
          >
            <FiArrowLeft />
            Back to Shop
          </button>
          <ErrorComponent message={error} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-6xl mx-auto'>
          <button
            onClick={() => router.push('/Pharmacist/shop')}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6'
          >
            <FiArrowLeft />
            Back to Shop
          </button>
          <div className='text-center py-12'>
            <FiPackage className='mx-auto text-6xl text-gray-300 mb-4' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Product Not Found
            </h2>
            <p className='text-gray-600 mb-6'>
              The product you&apos;re looking for doesn&apos;t exist.
            </p>
            <button
              onClick={() => router.push('/Pharmacist/shop')}
              className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
            >
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus =
    !product.inStock || product.stockQuantity === 0
      ? { text: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-200' }
      : product.stockQuantity <= product.minStockLevel
        ? {
            text: 'Low Stock',
            color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          }
        : {
            text: 'In Stock',
            color: 'text-green-600 bg-green-50 border-green-200',
          };

  return (
    <motion.div
      initial='initial'
      animate='in'
      exit='out'
      variants={pageVariants}
      className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 sm:p-6'
    >
      <div className='max-w-6xl mx-auto'>
        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6'
          >
            <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3'>
              <FiAlertCircle className='text-red-500 text-xl shrink-0' />
              <div className='flex-1'>
                <p className='text-red-800 text-sm'>{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className='text-red-600 hover:text-red-800 text-sm font-medium shrink-0'
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div className='mb-6'>
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => router.push('/Pharmacist/shop')}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors'
          >
            <FiArrowLeft />
            Back to Shop
          </motion.button>

          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text'>
                {isEditing ? 'Edit Product' : 'Product Details'}
              </h1>
              <p className='text-gray-600 mt-2 font-mono bg-gray-100 px-3 py-1 rounded-lg inline-block'>
                {product.sku}
              </p>
            </div>

            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className='flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl'
              >
                <FiEdit />
                Edit Product
              </motion.button>
            ) : (
              <div className='flex gap-3'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  className='flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300'
                >
                  <FiX />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  className='flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl'
                >
                  {saving ? (
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  ) : (
                    <FiSave />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Image & Status */}
          <div className='lg:col-span-1 space-y-6'>
            <motion.div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 sticky top-6 border border-white/20'>
              <h2 className='text-lg font-semibold mb-4 text-gray-900'>
                Product Image
              </h2>

              {isEditing ? (
                <div className='space-y-4'>
                  <div className='relative h-64 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden'>
                    <Image
                      src={
                        imagePreview ||
                        editData.image ||
                        '/placeholder-product.jpg'
                      }
                      alt={editData.name || 'Product'}
                      fill
                      className='object-cover transition-transform duration-300 hover:scale-105'
                    />
                  </div>
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300'
                  >
                    <FiUpload className='text-gray-400' />
                    <span className='text-gray-600'>Change Image</span>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden'
                    />
                  </motion.label>
                </div>
              ) : (
                <div className='relative h-64 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden group'>
                  <Image
                    src={product.image || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    className='object-cover transition-transform duration-300 group-hover:scale-105'
                  />
                </div>
              )}

              <div className='mt-6 space-y-3'>
                <div className='flex justify-between items-center pb-3 border-b border-gray-200'>
                  <span className='text-gray-600'>Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${stockStatus.color}`}
                  >
                    {stockStatus.text}
                  </span>
                </div>
                <div className='flex justify-between items-center pb-3 border-b border-gray-200'>
                  <span className='text-gray-600'>Category</span>
                  <span className='font-medium text-gray-900'>
                    {product.category}
                  </span>
                </div>
                <div className='flex justify-between items-center pb-3 border-b border-gray-200'>
                  <span className='text-gray-600'>Pharmacy</span>
                  <span className='font-medium text-gray-900'>
                    {product.pharmacy.name}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Last Updated</span>
                  <span className='font-medium text-gray-900 text-sm'>
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Details */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Info */}
            <motion.div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'>
              <h2 className='text-xl font-semibold mb-4 text-gray-900'>
                Basic Information
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Product Name
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='name'
                      value={editData.name || ''}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                      placeholder='Enter product name'
                    />
                  ) : (
                    <p className='text-gray-900 text-lg font-medium'>
                      {product.name}
                    </p>
                  )}
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      name='description'
                      value={editData.description || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                      placeholder='Enter product description'
                    />
                  ) : (
                    <p className='text-gray-900 leading-relaxed'>
                      {product.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Manufacturer
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='manufacturer'
                      value={editData.manufacturer || ''}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                      placeholder='Enter manufacturer'
                    />
                  ) : (
                    <p className='text-gray-900'>{product.manufacturer}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Category
                  </label>
                  {isEditing ? (
                    <select
                      name='category'
                      value={editData.category || ''}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className='text-gray-900'>{product.category}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Pricing & Stock */}
            <motion.div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'>
              <h2 className='text-xl font-semibold mb-4 text-gray-900'>
                Pricing & Stock
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Selling Price (Rs.)
                  </label>
                  {isEditing ? (
                    <input
                      type='number'
                      name='price'
                      value={editData.price || ''}
                      onChange={handleInputChange}
                      min='0'
                      step='0.01'
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                    />
                  ) : (
                    <p className='text-2xl font-bold text-green-600'>
                      Rs. {product.price.toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Cost Price (Rs.)
                  </label>
                  {isEditing ? (
                    <input
                      type='number'
                      name='costPrice'
                      value={editData.costPrice || ''}
                      onChange={handleInputChange}
                      min='0'
                      step='0.01'
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                    />
                  ) : (
                    <p className='text-gray-900 text-lg'>
                      Rs. {product.costPrice.toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Stock Quantity
                  </label>
                  {isEditing ? (
                    <input
                      type='number'
                      name='stockQuantity'
                      value={editData.stockQuantity || ''}
                      onChange={handleInputChange}
                      min='0'
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                    />
                  ) : (
                    <p className='text-gray-900 text-lg'>
                      {product.stockQuantity} units
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Min Stock Level
                  </label>
                  {isEditing ? (
                    <input
                      type='number'
                      name='minStockLevel'
                      value={editData.minStockLevel || ''}
                      onChange={handleInputChange}
                      min='0'
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                    />
                  ) : (
                    <p className='text-gray-900 text-lg'>
                      {product.minStockLevel} units
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div className='flex items-center md:col-span-2 p-3 bg-blue-50/50 rounded-xl border border-blue-200'>
                    <input
                      type='checkbox'
                      name='inStock'
                      checked={editData.inStock || false}
                      onChange={handleInputChange}
                      className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                    />
                    <label className='ml-2 text-sm text-gray-700 font-medium'>
                      Product is in stock
                    </label>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Medical Info */}
            <motion.div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'>
              <h2 className='text-xl font-semibold mb-4 text-gray-900'>
                Medical Information
              </h2>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Active Ingredients
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='activeIngredients'
                      value={editData.activeIngredients || ''}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                      placeholder='List active ingredients'
                    />
                  ) : (
                    <p className='text-gray-900'>
                      {product.activeIngredients || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Dosage
                  </label>
                  {isEditing ? (
                    <textarea
                      name='dosage'
                      value={editData.dosage || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                      placeholder='Enter dosage instructions'
                    />
                  ) : (
                    <p className='text-gray-900'>
                      {product.dosage || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Side Effects
                  </label>
                  {isEditing ? (
                    <textarea
                      name='sideEffects'
                      value={editData.sideEffects || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300'
                      placeholder='List possible side effects'
                    />
                  ) : (
                    <p className='text-gray-900'>
                      {product.sideEffects || 'Not specified'}
                    </p>
                  )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
                  <div className='flex items-center p-3 bg-purple-50/50 rounded-xl border border-purple-200'>
                    {isEditing ? (
                      <>
                        <input
                          type='checkbox'
                          name='requiresPrescription'
                          checked={editData.requiresPrescription || false}
                          onChange={handleInputChange}
                          className='w-4 h-4 text-purple-600 rounded focus:ring-purple-500'
                        />
                        <label className='ml-2 text-sm text-gray-700 font-medium'>
                          Requires prescription
                        </label>
                      </>
                    ) : (
                      <>
                        <span className='text-gray-600'>Prescription:</span>
                        <span
                          className={`ml-2 font-medium ${product.requiresPrescription ? 'text-purple-600' : 'text-gray-900'}`}
                        >
                          {product.requiresPrescription
                            ? 'Required'
                            : 'Not required'}
                        </span>
                      </>
                    )}
                  </div>

                  <div className='flex items-center p-3 bg-orange-50/50 rounded-xl border border-orange-200'>
                    {isEditing ? (
                      <>
                        <input
                          type='checkbox'
                          name='isControlledSubstance'
                          checked={editData.isControlledSubstance || false}
                          onChange={handleInputChange}
                          className='w-4 h-4 text-orange-600 rounded focus:ring-orange-500'
                        />
                        <label className='ml-2 text-sm text-gray-700 font-medium'>
                          Controlled substance
                        </label>
                      </>
                    ) : (
                      <>
                        <span className='text-gray-600'>Controlled:</span>
                        <span
                          className={`ml-2 font-medium ${product.isControlledSubstance ? 'text-orange-600' : 'text-gray-900'}`}
                        >
                          {product.isControlledSubstance ? 'Yes' : 'No'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
