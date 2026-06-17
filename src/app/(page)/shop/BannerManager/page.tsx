'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Loading from '@/components/Loading';
import ErrorDisplay from '@/components/Error';
import { motion, AnimatePresence } from 'framer-motion';

import { z } from 'zod';

const bannerSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
  link: z
    .string()
    .min(1, 'Link URL is required')
    .url('Please enter a valid URL'),
  image: z.instanceof(File).optional(),
});

interface Banner {
  _id: string;
  image: string;
  title: string;
  description: string;
  link?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  title: string;
  description: string;
  link: string;
}

interface UploadStatus {
  type: 'success' | 'error';
  message: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    link: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all banners
  const fetchBanners = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/allproduct/banner');

      if (!response.ok) {
        throw new Error(`Failed to fetch banners: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setBanners(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch banners');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Validate form with zod
  const validateForm = (): boolean => {
    try {
      bannerSchema.parse({
        title: formData.title,
        description: formData.description,
        link: formData.link,
        image: selectedFile,
      });
      setValidationErrors([]);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = err.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        setValidationErrors(newErrors);
      }
      return false;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    setValidationErrors(prev => prev.filter(err => err.field !== name));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setUploadStatus({
          type: 'error',
          message: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.',
        });
        setTimeout(() => setUploadStatus(null), 3000);
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadStatus({
          type: 'error',
          message: 'File size exceeds 5MB limit.',
        });
        setTimeout(() => setUploadStatus(null), 3000);
        return;
      }

      setSelectedFile(file);
      // Clear validation error for image
      setValidationErrors(prev => prev.filter(err => err.field !== 'image'));
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const resetForm = (): void => {
    setFormData({ title: '', description: '', link: '' });
    setSelectedFile(null);
    setImagePreview('');
    setEditingBanner(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      setUploadStatus({
        type: 'error',
        message: 'Please fix the validation errors before submitting.',
      });
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setUploadStatus(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('link', formData.link);
      formDataToSend.append('isActive', 'true');

      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      } else if (editingBanner && !selectedFile) {
        // If editing and no new file selected, use JSON mode
        const response = await fetch(
          `/api/allproduct/banner?id=${editingBanner._id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              link: formData.link,
              image: editingBanner.image,
              isActive: true,
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setUploadStatus({
            type: 'success',
            message: editingBanner
              ? 'Banner updated successfully!'
              : 'Banner created successfully!',
          });
          resetForm();
          setShowForm(false);
          fetchBanners();
          setTimeout(() => setUploadStatus(null), 3000);
        } else {
          throw new Error(data.message || 'Operation failed');
        }
        setIsSubmitting(false);
        return;
      } else if (!selectedFile && !editingBanner) {
        throw new Error('Please select an image');
      }

      // For create or update with file upload
      const url = editingBanner
        ? `/api/allproduct/banner?id=${editingBanner._id}`
        : '/api/allproduct/banner';

      const response = await fetch(url, {
        method: editingBanner ? 'PUT' : 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadStatus({
          type: 'success',
          message: editingBanner
            ? 'Banner updated successfully!'
            : 'Banner created successfully!',
        });
        resetForm();
        setShowForm(false);
        fetchBanners();
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to save banner');
      }
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save banner',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner: Banner): void => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      link: banner.link || '',
    });
    setImagePreview(banner.image);
    setSelectedFile(null);
    setValidationErrors([]);
    setShowForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch(`/api/allproduct/banner?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadStatus({
          type: 'success',
          message: 'Banner deleted successfully!',
        });
        fetchBanners();
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to delete banner');
      }
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete banner',
      });
    }
  };

  const handleCancel = (): void => {
    resetForm();
    setShowForm(false);
    setEditingBanner(null);
  };

  // Get error message for a specific field
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(err => err.field === fieldName)?.message;
  };

  if (loading) return <Loading />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800'>Banner Manager</h1>
          <p className='text-gray-600 mt-1'>Manage your homepage banners</p>
        </div>
        {!showForm && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
            Add New Banner
          </motion.button>
        )}
      </div>

      {/* Upload Status */}
      <AnimatePresence>
        {uploadStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 p-4 rounded-lg ${
              uploadStatus.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            <div className='flex items-center gap-2'>
              {uploadStatus.type === 'success' ? (
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              ) : (
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              )}
              {uploadStatus.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Banner Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200'
          >
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold text-gray-800'>
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <button
                onClick={handleCancel}
                className='text-gray-500 hover:text-gray-700'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Banner Image *
                </label>
                <div
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-orange-500 transition ${
                    getFieldError('image')
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                >
                  <div className='space-y-1 text-center'>
                    {imagePreview ? (
                      <div className='relative'>
                        <div className='relative w-48 h-32 mx-auto'>
                          <Image
                            src={imagePreview}
                            alt='Preview'
                            fill
                            className='object-cover rounded-md'
                          />
                        </div>
                        <button
                          type='button'
                          onClick={() => {
                            setSelectedFile(null);
                            setImagePreview('');
                            if (fileInputRef.current)
                              fileInputRef.current.value = '';
                          }}
                          className='mt-2 text-sm text-red-600 hover:text-red-700'
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className='mx-auto h-12 w-12 text-gray-400'
                          stroke='currentColor'
                          fill='none'
                          viewBox='0 0 48 48'
                          aria-hidden='true'
                        >
                          <path
                            d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                            strokeWidth={2}
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                        <div className='flex text-sm text-gray-600'>
                          <label
                            htmlFor='file-upload'
                            className='relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500'
                          >
                            <span>Upload a file</span>
                            <input
                              id='file-upload'
                              name='file-upload'
                              type='file'
                              ref={fileInputRef}
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
                {getFieldError('image') && (
                  <p className='mt-1 text-sm text-red-600'>
                    {getFieldError('image')}
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Title *
                </label>
                <input
                  type='text'
                  name='title'
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter banner title'
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    getFieldError('title')
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  maxLength={100}
                />
                {getFieldError('title') && (
                  <p className='mt-1 text-sm text-red-600'>
                    {getFieldError('title')}
                  </p>
                )}
                <p className='text-xs text-gray-500 mt-1'>
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description *
                </label>
                <textarea
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder='Enter banner description'
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    getFieldError('description')
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  maxLength={500}
                />
                {getFieldError('description') && (
                  <p className='mt-1 text-sm text-red-600'>
                    {getFieldError('description')}
                  </p>
                )}
                <p className='text-xs text-gray-500 mt-1'>
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Link URL *
                </label>
                <input
                  type='url'
                  name='link'
                  value={formData.link}
                  onChange={handleInputChange}
                  required
                  placeholder='https://example.com/product'
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    getFieldError('link') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {getFieldError('link') && (
                  <p className='mt-1 text-sm text-red-600'>
                    {getFieldError('link')}
                  </p>
                )}
                <p className='text-xs text-gray-500 mt-1'>
                  Enter the URL where the banner should link to
                </p>
              </div>

              <div className='flex gap-3'>
                <motion.button
                  type='submit'
                  disabled={isSubmitting || (!selectedFile && !editingBanner)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition disabled:bg-orange-300 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <span className='flex items-center justify-center gap-2'>
                      <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                          fill='none'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                      {editingBanner ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : editingBanner ? (
                    'Update Banner'
                  ) : (
                    'Create Banner'
                  )}
                </motion.button>
                <button
                  type='button'
                  onClick={handleCancel}
                  className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition'
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banners Grid */}
      <div>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-semibold text-gray-800'>
            All Banners ({banners.length})
          </h2>
          {banners.length > 0 && (
            <p className='text-sm text-gray-500'>
              Showing {banners.length} banner{banners.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {banners.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'
          >
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            <p className='mt-4 text-gray-500'>No banners found</p>
            <button
              onClick={() => setShowForm(true)}
              className='mt-4 text-orange-600 hover:text-orange-700 font-medium'
            >
              Create your first banner →
            </button>
          </motion.div>
        ) : (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {banners.map(banner => (
              <motion.div
                key={banner._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group'
              >
                <div className='relative h-48 overflow-hidden'>
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className='object-cover group-hover:scale-105 transition-transform duration-300'
                  />
                  <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(banner)}
                      className='bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition mr-2'
                      title='Edit'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                        />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(banner._id)}
                      className='bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition'
                      title='Delete'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                    </motion.button>
                  </div>
                  {banner.link && (
                    <a
                      href={banner.link}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm hover:bg-black/70 transition'
                    >
                      Visit Link →
                    </a>
                  )}
                </div>
                <div className='p-4'>
                  <h3 className='font-semibold text-lg text-gray-800 mb-2 line-clamp-1'>
                    {banner.title}
                  </h3>
                  <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                    {banner.description}
                  </p>
                  <div className='flex justify-between items-center'>
                    {banner.isActive !== undefined && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          banner.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                    {banner.createdAt && (
                      <p className='text-xs text-gray-400'>
                        {new Date(banner.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
