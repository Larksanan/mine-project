/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiArrowLeft as ArrowLeft,
  FiEdit2 as Edit,
  FiTrash2 as Trash,
  FiFileText as FileText,
  FiDollarSign as DollarSign,
  FiActivity as Activity,
  FiClock as Clock,
  FiAlertCircle as AlertCircle,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiLayers as Layers,
  FiTag as Tag,
  FiInfo as Info,
  FiDownload as Download,
  FiPrinter as Printer,
  FiTrendingUp as TrendingUp,
  FiCalendar as Calendar,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

interface LabTest {
  _id: string;
  name: string;
  testCode: string;
  category: string;
  description?: string;
  price: number;
  preparationInstructions?: string;
  sampleType?: string;
  processingTime?: string;
  normalRange?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LabTestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [test, setTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    fetchTest();
  }, [resolvedParams.id]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lab/lab-tests/${resolvedParams.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch test');
      }

      if (result.test) {
        setTest(result.test);
      } else {
        throw new Error('Test not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load test');
      console.error('Error fetching test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!test) return;

    try {
      const response = await fetch(`/api/lab/lab-tests/${test._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete test');
      }

      setToast({
        show: true,
        message: 'Test deleted successfully',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/lab-tests');
      }, 2000);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to delete test',
        type: 'error',
      });
    } finally {
      setDeleteModal(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!test) return;

    const data = {
      'Test Code': test.testCode,
      'Test Name': test.name,
      Category: test.category,
      'Price (USD)': `$${test.price.toFixed(2)}`,
      'Sample Type': test.sampleType || 'N/A',
      'Processing Time': test.processingTime || 'N/A',
      'Normal Range': test.normalRange || 'N/A',
      Description: test.description || 'N/A',
      'Preparation Instructions': test.preparationInstructions || 'N/A',
      Status: test.isActive ? 'Active' : 'Inactive',
      'Created At': new Date(test.createdAt).toLocaleString(),
      'Last Updated': new Date(test.updatedAt).toLocaleString(),
    };

    const csv = [
      Object.keys(data).join(','),
      Object.values(data)
        .map(v => `"${v}"`)
        .join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-test-${test.testCode}-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setToast({
      show: true,
      message: 'Data exported successfully',
      type: 'success',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <Loading />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center'
        >
          <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <AlertCircle className='w-10 h-10 text-red-500' />
          </div>
          <h2 className='text-3xl font-bold text-gray-800 mb-4'>
            Test Not Found
          </h2>
          <p className='text-gray-600 mb-8'>
            {error || 'The requested lab test could not be found.'}
          </p>
          <Link
            href='/lab-tests'
            className='inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all'
          >
            <ArrowLeft className='w-5 h-5' />
            Back to Tests
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* Decorative background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
      </div>

      {/* Header */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Link
              href='/lab-tests'
              className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105'
            >
              <ArrowLeft className='w-6 h-6 text-gray-700' />
            </Link>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Test Details
              </h1>
              <p className='text-gray-600 mt-1'>
                Complete laboratory test information
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={handleExport}
              className='px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg'
            >
              <Download className='w-5 h-5' />
              Export
            </button>
            <button
              onClick={handlePrint}
              className='px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg'
            >
              <Printer className='w-5 h-5' />
              Print
            </button>
            <Link
              href={`/lab-tests/${test._id}/edit`}
              className='px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2'
            >
              <Edit className='w-5 h-5' />
              Edit
            </Link>
            <button
              onClick={() => setDeleteModal(true)}
              className='px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-red-500/30'
            >
              <Trash className='w-5 h-5' />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10'>
        {/* Left Column - Overview */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4'>Status</h3>
            <div
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${
                test.isActive
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {test.isActive ? (
                <CheckCircle className='w-8 h-8 text-emerald-600' />
              ) : (
                <XCircle className='w-8 h-8 text-red-600' />
              )}
              <div>
                <p
                  className={`font-bold text-lg ${
                    test.isActive ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {test.isActive ? 'Active' : 'Inactive'}
                </p>
                <p className='text-sm text-gray-600'>
                  {test.isActive
                    ? 'Available for ordering'
                    : 'Not available for ordering'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Test Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <Tag className='w-5 h-5 text-blue-500' />
              Test Code
            </h3>
            <div className='p-4 bg-blue-50 rounded-xl border-2 border-blue-200'>
              <p className='text-2xl font-bold text-blue-700 text-center'>
                {test.testCode}
              </p>
            </div>
          </motion.div>

          {/* Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <Layers className='w-5 h-5 text-purple-500' />
              Category
            </h3>
            <div className='p-4 bg-purple-50 rounded-xl border-2 border-purple-200'>
              <p className='text-lg font-bold text-purple-700 text-center'>
                {test.category}
              </p>
            </div>
          </motion.div>

          {/* Price */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <DollarSign className='w-5 h-5 text-emerald-500' />
              Price
            </h3>
            <div className='p-6 bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200'>
              <div className='flex items-center justify-center gap-2'>
                <DollarSign className='w-8 h-8 text-emerald-600' />
                <p className='text-4xl font-bold text-emerald-700'>
                  {test.price.toFixed(2)}
                </p>
              </div>
              <p className='text-sm text-gray-600 text-center mt-2'>USD</p>
            </div>
          </motion.div>

          {/* Test ID */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white rounded-3xl shadow-xl p-6'
          >
            <h3 className='text-lg font-bold text-gray-800 mb-4'>Test ID</h3>
            <p className='text-xs font-mono text-gray-600 bg-gray-50 p-4 rounded-xl break-all'>
              {test._id}
            </p>
          </motion.div>
        </div>

        {/* Right Column - Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Test Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <FileText className='w-7 h-7 text-blue-500' />
              Test Information
            </h3>

            <div className='space-y-6'>
              {/* Test Name */}
              <div>
                <p className='text-sm text-gray-600 mb-2 font-semibold'>
                  Test Name
                </p>
                <p className='text-2xl font-bold text-gray-800'>{test.name}</p>
              </div>

              {/* Description */}
              {test.description && (
                <div>
                  <p className='text-sm text-gray-600 mb-2 font-semibold'>
                    Description
                  </p>
                  <p className='text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl'>
                    {test.description}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Technical Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Activity className='w-7 h-7 text-purple-500' />
              Technical Details
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Sample Type */}
              {test.sampleType && (
                <div className='p-4 bg-purple-50 rounded-xl border border-purple-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Activity className='w-5 h-5 text-purple-600' />
                    <p className='text-sm text-gray-600 font-semibold'>
                      Sample Type
                    </p>
                  </div>
                  <p className='text-lg font-bold text-purple-700'>
                    {test.sampleType}
                  </p>
                </div>
              )}

              {/* Processing Time */}
              {test.processingTime && (
                <div className='p-4 bg-amber-50 rounded-xl border border-amber-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Clock className='w-5 h-5 text-amber-600' />
                    <p className='text-sm text-gray-600 font-semibold'>
                      Processing Time
                    </p>
                  </div>
                  <p className='text-lg font-bold text-amber-700'>
                    {test.processingTime}
                  </p>
                </div>
              )}

              {/* Normal Range */}
              {test.normalRange && (
                <div className='md:col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <TrendingUp className='w-5 h-5 text-blue-600' />
                    <p className='text-sm text-gray-600 font-semibold'>
                      Normal Range
                    </p>
                  </div>
                  <p className='text-lg font-bold text-blue-700'>
                    {test.normalRange}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Preparation Instructions */}
          {test.preparationInstructions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className='bg-white rounded-3xl shadow-xl p-8'
            >
              <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
                <Info className='w-7 h-7 text-emerald-500' />
                Preparation Instructions
              </h3>
              <div className='p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-200'>
                <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>
                  {test.preparationInstructions}
                </p>
              </div>
              <div className='mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 text-amber-600 shrink-0 mt-0.5' />
                <p className='text-sm text-amber-800'>
                  <span className='font-semibold'>Important:</span> Patients
                  should follow these instructions carefully to ensure accurate
                  test results.
                </p>
              </div>
            </motion.div>
          )}

          {/* System Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className='bg-white rounded-3xl shadow-xl p-8'
          >
            <h3 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
              <Calendar className='w-7 h-7 text-gray-500' />
              System Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='p-4 bg-gray-50 rounded-xl'>
                <p className='text-sm text-gray-600 mb-1'>Created At</p>
                <p className='text-gray-800 font-medium'>
                  {new Date(test.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className='p-4 bg-gray-50 rounded-xl'>
                <p className='text-sm text-gray-600 mb-1'>Last Updated</p>
                <p className='text-gray-800 font-medium'>
                  {new Date(test.updatedAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title='Delete Lab Test'
        message={`Are you sure you want to delete "${test.name}"? This action cannot be undone and may affect existing test requests.`}
      />

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
