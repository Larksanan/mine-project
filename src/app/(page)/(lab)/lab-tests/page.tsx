/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus as Plus,
  FiSearch as Search,
  FiFilter as Filter,
  FiDownload as Download,
  FiRefreshCw as RefreshCw,
  FiEye as Eye,
  FiEdit2 as Edit,
  FiTrash2 as Trash,
  FiFileText as FileText,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiActivity as Activity,
  FiLayers as Layers,
  FiClock as Clock,
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

interface Stats {
  total: number;
  active: number;
  inactive: number;
  categories: number;
  totalRevenue: number;
}

const CATEGORIES = [
  'All',
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

export default function LabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    categories: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
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
    fetchTests();
  }, []);

  useEffect(() => {
    filterTests();
  }, [tests, searchQuery, filterCategory, filterStatus]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lab/lab-tests?activeOnly=false');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tests');
      }

      setTests(result.tests || []);
      calculateStats(result.tests || []);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to load tests',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: LabTest[]) => {
    const uniqueCategories = new Set(data.map(t => t.category)).size;
    const totalRevenue = data.reduce((sum, t) => sum + (t.price || 0), 0);

    const stats = {
      total: data.length,
      active: data.filter(t => t.isActive).length,
      inactive: data.filter(t => !t.isActive).length,
      categories: uniqueCategories,
      totalRevenue,
    };
    setStats(stats);
  };

  const filterTests = () => {
    let filtered = [...tests];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        test =>
          test.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.testCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filterCategory !== 'All') {
      filtered = filtered.filter(test => test.category === filterCategory);
    }

    // Apply status filter
    if (filterStatus === 'ACTIVE') {
      filtered = filtered.filter(test => test.isActive);
    } else if (filterStatus === 'INACTIVE') {
      filtered = filtered.filter(test => !test.isActive);
    }

    setFilteredTests(filtered);
  };

  const handleDelete = async () => {
    if (!selectedTest) return;

    try {
      const response = await fetch(`/api/lab/lab-tests/${selectedTest}`, {
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

      fetchTests();
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to delete test',
        type: 'error',
      });
    } finally {
      setDeleteModal(false);
      setSelectedTest(null);
    }
  };

  const handleExport = () => {
    const csv = [
      [
        'Test Code',
        'Name',
        'Category',
        'Sample Type',
        'Price',
        'Processing Time',
        'Normal Range',
        'Status',
        'Created At',
      ].join(','),
      ...filteredTests.map(test =>
        [
          test.testCode,
          `"${test.name}"`,
          test.category,
          test.sampleType || 'N/A',
          test.price,
          test.processingTime || 'N/A',
          test.normalRange || 'N/A',
          test.isActive ? 'Active' : 'Inactive',
          new Date(test.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-tests-${new Date().toISOString().split('T')[0]}.csv`;
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
          <div>
            <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3'>
              <FileText className='w-10 h-10 text-blue-600' />
              Laboratory Tests
            </h1>
            <p className='text-gray-600 mt-2'>
              Manage all available laboratory tests
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={fetchTests}
              className='px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg'
            >
              <RefreshCw className='w-5 h-5' />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className='px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg'
            >
              <Download className='w-5 h-5' />
              Export
            </button>
            <Link
              href='/lab-tests/create'
              className='px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2'
            >
              <Plus className='w-5 h-5' />
              New Test
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-2xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-2'>
              <FileText className='w-8 h-8 text-gray-600' />
            </div>
            <p className='text-3xl font-bold text-gray-800'>{stats.total}</p>
            <p className='text-sm text-gray-600'>Total Tests</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-2xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-2'>
              <CheckCircle className='w-8 h-8 text-emerald-600' />
            </div>
            <p className='text-3xl font-bold text-emerald-600'>
              {stats.active}
            </p>
            <p className='text-sm text-gray-600'>Active Tests</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-2xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-2'>
              <XCircle className='w-8 h-8 text-red-600' />
            </div>
            <p className='text-3xl font-bold text-red-600'>{stats.inactive}</p>
            <p className='text-sm text-gray-600'>Inactive Tests</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white rounded-2xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-2'>
              <Layers className='w-8 h-8 text-purple-600' />
            </div>
            <p className='text-3xl font-bold text-purple-600'>
              {stats.categories}
            </p>
            <p className='text-sm text-gray-600'>Categories</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white rounded-2xl shadow-xl p-6'
          >
            <div className='flex items-center justify-between mb-2'>
              <p className='w-8 h-8 text-blue-600'> LKR</p>
            </div>
            <p className='text-3xl font-bold text-blue-600'>
              LKR {stats.totalRevenue.toFixed(0)}
            </p>
            <p className='text-sm text-gray-600'>Total Value</p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className='max-w-7xl mx-auto mb-8 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='bg-white rounded-3xl shadow-xl p-6'
        >
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search tests...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
              />
            </div>

            {/* Category Filter */}
            <div className='relative'>
              <Layers className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white'
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className='relative'>
              <Filter className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white'
              >
                <option value='ALL'>All Status</option>
                <option value='ACTIVE'>Active Only</option>
                <option value='INACTIVE'>Inactive Only</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tests Grid */}
      <div className='max-w-7xl mx-auto relative z-10'>
        <AnimatePresence mode='wait'>
          {filteredTests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='bg-white rounded-3xl shadow-xl p-12 text-center'
            >
              <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-gray-800 mb-2'>
                No Tests Found
              </h3>
              <p className='text-gray-600 mb-6'>
                Try adjusting your filters or create a new test
              </p>
              <Link
                href='/lab-tests/create'
                className='inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all'
              >
                <Plus className='w-5 h-5' />
                Create First Test
              </Link>
            </motion.div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredTests.map((test, index) => (
                <motion.div
                  key={test._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className='bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all'
                >
                  {/* Header */}
                  <div className='bg-linear-to-r from-blue-500 to-purple-500 p-6'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1'>
                        <h3 className='text-xl font-bold text-white mb-1 line-clamp-2'>
                          {test.name}
                        </h3>
                        <p className='text-blue-100 text-sm font-medium'>
                          {test.testCode}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          test.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {test.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='px-3 py-1 bg-white/20 text-white text-xs rounded-lg font-medium'>
                        {test.category}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className='p-6'>
                    {/* Price */}
                    <div className='mb-4 p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600 font-semibold'>
                          Price
                        </span>
                        <div className='flex items-center gap-1'>
                          <span className='text-2xl font-bold text-emerald-700'>
                            LKR {test.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className='space-y-3 mb-4'>
                      {test.sampleType && (
                        <div className='flex items-center gap-3 text-sm'>
                          <Activity className='w-4 h-4 text-gray-400 shrink-0' />
                          <span className='text-gray-600'>
                            Sample: {test.sampleType}
                          </span>
                        </div>
                      )}
                      {test.processingTime && (
                        <div className='flex items-center gap-3 text-sm'>
                          <Clock className='w-4 h-4 text-gray-400 shrink-0' />
                          <span className='text-gray-600'>
                            {test.processingTime}
                          </span>
                        </div>
                      )}
                      {test.description && (
                        <p className='text-sm text-gray-600 line-clamp-2'>
                          {test.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-2 pt-4 border-t border-gray-100'>
                      <Link
                        href={`/lab-tests/${test._id}`}
                        className='flex-1 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 font-semibold'
                      >
                        <Eye className='w-4 h-4' />
                        View
                      </Link>
                      <Link
                        href={`/lab-tests/${test._id}/edit`}
                        className='flex-1 py-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2 font-semibold'
                      >
                        <Edit className='w-4 h-4' />
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedTest(test._id);
                          setDeleteModal(true);
                        }}
                        className='p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors'
                        title='Delete'
                      >
                        <Trash className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal}
        onCancel={() => {
          setDeleteModal(false);
          setSelectedTest(null);
        }}
        onConfirm={handleDelete}
        title='Delete Lab Test'
        message='Are you sure you want to delete this lab test? This action cannot be undone and may affect existing test requests.'
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
