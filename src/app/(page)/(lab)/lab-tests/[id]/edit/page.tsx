'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  FiSave as Save,
  FiArrowLeft as ArrowLeft,
  FiAlertCircle as AlertCircle,
} from 'react-icons/fi';
import {
  useLabTest,
  useLabTestActions,
  useTestCategories,
} from '@/hooks/Uselabtests';
import Loading from '@/components/ui/Loading';
import Error from '@/components/Error';

// Form schema
const testSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be a positive number'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  sampleType: z.string().min(1, 'Sample type is required'),
  preparationInstructions: z.string().optional(),
  normalRange: z.string().optional(),
  units: z.string().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

interface EditTestPageProps {
  params: {
    id: string;
  };
}

export default function EditTestPage({ params }: EditTestPageProps) {
  const router = useRouter();
  const isNew = params.id === 'new';
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const { test, loading, error } = useLabTest(isNew ? '' : params.id);
  const { categories, loading: loadingCategories } = useTestCategories();
  const { createTest, updateTest, creating, updating } = useLabTestActions();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      price: 0,
      duration: 30,
      sampleType: 'Blood',
      preparationInstructions: '',
      normalRange: '',
      units: '',
    },
  });

  // Populate form when editing existing test
  useEffect(() => {
    if (test && !isNew) {
      setValue('name', test.name);
      setValue('category', test.category);
      setValue('description', test.description || '');
      setValue('price', test.price);
      setValue('duration', test.duration);
      setValue('sampleType', test.sampleType);
      setValue('preparationInstructions', test.preparationInstructions || '');
      setValue('normalRange', test.normalRange || '');
      setValue('units', test.units || '');
    }
  }, [test, setValue, isNew]);

  const onSubmit = async (data: TestFormData) => {
    try {
      if (isNew) {
        const newTest = await createTest(data);
        if (newTest) {
          router.push(`/lab-tests/${newTest._id}/edit`);
        }
      } else {
        const updated = await updateTest(params.id, data);
        if (updated) {
          // Show success message
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Failed to save test:', error);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setValue('category', newCategory.trim());
      setNewCategory('');
      setShowNewCategory(false);
    }
  };

  if (!isNew && loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loading />
      </div>
    );
  }

  if (!isNew && error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Error message={error} />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            href='/lab-tests'
            className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-1' />
            Back to Tests
          </Link>
          <h1 className='text-3xl font-bold text-gray-900'>
            {isNew ? 'Create New Test' : 'Edit Test'}
          </h1>
          <p className='mt-2 text-sm text-gray-600'>
            {isNew
              ? 'Add a new laboratory test to the system'
              : `Editing ${test?.name}`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
          >
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Basic Information
            </h2>

            <div className='space-y-4'>
              {/* Test Name */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Test Name <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  {...register('name')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='e.g., Complete Blood Count'
                />
                {errors.name && (
                  <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                    <AlertCircle className='w-4 h-4' />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Category <span className='text-red-500'>*</span>
                </label>
                {showNewCategory ? (
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Enter new category'
                      autoFocus
                    />
                    <button
                      type='button'
                      onClick={handleAddCategory}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                    >
                      Add
                    </button>
                    <button
                      type='button'
                      onClick={() => setShowNewCategory(false)}
                      className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className='flex gap-2'>
                    <select
                      {...register('category')}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value=''>Select a category</option>
                      {!loadingCategories &&
                        categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                    <button
                      type='button'
                      onClick={() => setShowNewCategory(true)}
                      className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 whitespace-nowrap'
                    >
                      New Category
                    </button>
                  </div>
                )}
                {errors.category && (
                  <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                    <AlertCircle className='w-4 h-4' />
                    {errors.category.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Brief description of the test...'
                />
              </div>
            </div>
          </motion.div>

          {/* Test Specifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
          >
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Test Specifications
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Price */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Price ($) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  step='0.01'
                  {...register('price', { valueAsNumber: true })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                {errors.price && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Duration (minutes) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  {...register('duration', { valueAsNumber: true })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                {errors.duration && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.duration.message}
                  </p>
                )}
              </div>

              {/* Sample Type */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Sample Type <span className='text-red-500'>*</span>
                </label>
                <select
                  {...register('sampleType')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='Blood'>Blood</option>
                  <option value='Urine'>Urine</option>
                  <option value='Stool'>Stool</option>
                  <option value='Tissue'>Tissue</option>
                  <option value='Swab'>Swab</option>
                  <option value='Other'>Other</option>
                </select>
                {errors.sampleType && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.sampleType.message}
                  </p>
                )}
              </div>

              {/* Units */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Units (e.g., mg/dL, cells/μL)
                </label>
                <input
                  type='text'
                  {...register('units')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='e.g., mg/dL'
                />
              </div>
            </div>
          </motion.div>

          {/* Reference Ranges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
          >
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Reference Ranges & Preparation
            </h2>

            <div className='space-y-4'>
              {/* Normal Range */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Normal Range
                </label>
                <input
                  type='text'
                  {...register('normalRange')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='e.g., 4.5-11.0'
                />
              </div>

              {/* Preparation Instructions */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Preparation Instructions
                </label>
                <textarea
                  {...register('preparationInstructions')}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Instructions for patients before the test...'
                />
              </div>
            </div>
          </motion.div>

          {/* Form Actions */}
          <div className='flex items-center justify-end gap-4 pt-6'>
            <Link
              href='/lab-tests'
              className='px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </Link>
            <button
              type='submit'
              disabled={creating || updating || !isDirty}
              className='px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              <Save className='w-5 h-5' />
              {creating || updating
                ? 'Saving...'
                : isNew
                  ? 'Create Test'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
