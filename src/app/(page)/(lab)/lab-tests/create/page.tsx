/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiSave as Save,
  FiFileText as FileText,
  FiDollarSign as DollarSign,
  FiAlertCircle as AlertCircle,
  FiClock as Clock,
  FiActivity as Activity,
  FiLayers as Layers,
  FiInfo as Info,
  FiTag as Tag,
} from 'react-icons/fi';
import Toast from '@/components/ui/Toast';

interface FormData {
  name: string;
  testCode: string;
  category: string;
  description: string;
  price: string;
  preparationInstructions: string;
  sampleType: string;
  processingTime: string;
  normalRange: string;
  isActive: boolean;
}

const CATEGORIES = [
  'Hematology',
  'Clinical Chemistry',
  'Microbiology',
  'Immunology',
  'Pathology',
  'Cytology',
  'Molecular Biology',
  'Blood Bank',
  'Toxicology',
  'Endocrinology',
  'Cardiology',
  'General Laboratory',
];

const SAMPLE_TYPES = [
  'Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Sputum',
  'CSF',
  'Tissue',
  'Swab',
  'Other',
];

export default function CreateLabTestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    testCode: '',
    category: '',
    description: '',
    price: '',
    preparationInstructions: '',
    sampleType: '',
    processingTime: '',
    normalRange: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]:
        e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Test name is required';
    }

    if (!formData.testCode.trim()) {
      newErrors.testCode = 'Test code is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.sampleType) {
      newErrors.sampleType = 'Sample type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({
        show: true,
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
      };

      const response = await fetch('/api/lab/lab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create lab test');
      }

      setToast({
        show: true,
        message: 'Lab test created successfully',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/lab-tests');
      }, 1500);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to create lab test',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* Decorative background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
      </div>

      {/* Header */}
      <div className='max-w-4xl mx-auto mb-8 relative z-10'>
        <div className='flex items-center gap-4 mb-6'>
          <Link
            href='/lab-tests'
            className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105'
          >
            <ArrowLeft className='w-6 h-6 text-gray-700' />
          </Link>
          <div>
            <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Create Lab Test
            </h1>
            <p className='text-gray-600 mt-1'>
              Add a new laboratory test to the system
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className='max-w-4xl mx-auto relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-3xl shadow-xl overflow-hidden'
        >
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <FileText className='w-7 h-7 text-blue-500' />
                Basic Information
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Test Name */}
                <div className='md:col-span-2'>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Test Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    placeholder='e.g., Complete Blood Count (CBC)'
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.name
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.name && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Test Code */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Test Code <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Tag className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                      type='text'
                      name='testCode'
                      value={formData.testCode}
                      onChange={handleChange}
                      placeholder='e.g., CBC-001'
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        errors.testCode
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.testCode && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.testCode}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Category <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Layers className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <select
                      name='category'
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors appearance-none ${
                        errors.category
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    >
                      <option value=''>Select Category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.category && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className='md:col-span-2'>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    name='description'
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder='Brief description of the test...'
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none'
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Sample */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <DollarSign className='w-7 h-7 text-emerald-500' />
                Pricing & Sample Information
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Price */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Price (USD) <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <DollarSign className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                      type='number'
                      name='price'
                      value={formData.price}
                      onChange={handleChange}
                      placeholder='0.00'
                      step='0.01'
                      min='0'
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        errors.price
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.price}
                    </p>
                  )}
                </div>

                {/* Sample Type */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Sample Type <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Activity className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <select
                      name='sampleType'
                      value={formData.sampleType}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors appearance-none ${
                        errors.sampleType
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    >
                      <option value=''>Select Sample Type</option>
                      {SAMPLE_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.sampleType && (
                    <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
                      <AlertCircle className='w-4 h-4' />
                      {errors.sampleType}
                    </p>
                  )}
                </div>

                {/* Processing Time */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Processing Time
                  </label>
                  <div className='relative'>
                    <Clock className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                      type='text'
                      name='processingTime'
                      value={formData.processingTime}
                      onChange={handleChange}
                      placeholder='e.g., 24-48 hours'
                      className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                    />
                  </div>
                </div>

                {/* Normal Range */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Normal Range
                  </label>
                  <input
                    type='text'
                    name='normalRange'
                    value={formData.normalRange}
                    onChange={handleChange}
                    placeholder='e.g., 4.5-11.0 x10^9/L'
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <Info className='w-7 h-7 text-purple-500' />
                Additional Information
              </h2>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Preparation Instructions
                </label>
                <textarea
                  name='preparationInstructions'
                  value={formData.preparationInstructions}
                  onChange={handleChange}
                  rows={4}
                  placeholder='Enter any special preparation instructions for the patient (e.g., fasting required, medication restrictions)...'
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none'
                />
                <p className='mt-2 text-xs text-gray-500'>
                  Instructions for patient preparation before the test
                </p>
              </div>
            </div>

            {/* Status */}
            <div className='p-8 border-b border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6'>Status</h2>

              <div className='flex items-center gap-3 p-4 bg-gray-50 rounded-xl'>
                <input
                  type='checkbox'
                  id='isActive'
                  name='isActive'
                  checked={formData.isActive}
                  onChange={handleChange}
                  className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                <label htmlFor='isActive' className='flex-1 cursor-pointer'>
                  <p className='font-semibold text-gray-800'>Active Test</p>
                  <p className='text-sm text-gray-600'>
                    Allow this test to be ordered by doctors
                  </p>
                </label>
                <div
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    formData.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {formData.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className='p-8 bg-gray-50'>
              <div className='flex items-center justify-end gap-4'>
                <Link
                  href='/lab-tests'
                  className='px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all'
                >
                  Cancel
                </Link>
                <button
                  type='submit'
                  disabled={submitting}
                  className='px-8 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                >
                  {submitting ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className='w-5 h-5' />
                      Create Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
