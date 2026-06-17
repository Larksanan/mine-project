/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Loading from '@/components/ui/Loading';
import ErrorComponent from '@/components/Error';
import { Patient, PatientStats } from '@/types/patient';
import PatientStatsComponent from '@/components/patient/PatientStats';
import PatientFilters from '@/components/patient/PatientFilters';
import PatientTable from '@/components/patient/PatientTable';
import {
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import auth from '../../../lib/auth';

const calculateAge = (dateOfBirth: string | Date): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Animation variants with proper typing
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

function PatientRECEPTIONIST() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>('ALL');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('ALL');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>('ALL');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('true');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    params.append('page', pagination.page.toString());
    params.append('limit', pagination.limit.toString());

    if (searchTerm) params.append('search', searchTerm);

    if (genderFilter && genderFilter !== 'ALL')
      params.append('gender', genderFilter);
    if (bloodTypeFilter && bloodTypeFilter !== 'ALL')
      params.append('bloodType', bloodTypeFilter);
    if (ageGroupFilter && ageGroupFilter !== 'ALL')
      params.append('ageGroup', ageGroupFilter);
    if (maritalStatusFilter && maritalStatusFilter !== 'ALL')
      params.append('maritalStatus', maritalStatusFilter);
    if (isActiveFilter !== '') params.append('isActive', isActiveFilter);

    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);

    return params.toString();
  }, [
    searchTerm,
    genderFilter,
    bloodTypeFilter,
    ageGroupFilter,
    maritalStatusFilter,
    isActiveFilter,
    sortBy,
    sortOrder,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/dashboard');
      return;
    }

    const successParam = searchParams.get('success');
    const messageParam = searchParams.get('message');

    if (successParam === 'true') {
      setSuccess(messageParam || 'Patient created successfully!');

      const timer = setTimeout(() => {
        setSuccess(null);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('success');
        newUrl.searchParams.delete('message');
        window.history.replaceState({}, '', newUrl.toString());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [session, status, router, searchParams]);

  const fetchPatients = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams();
      const response = await fetch(`/api/patients?${queryParams}`);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(
            `Server Error: ${response.status} ${response.statusText}`
          );
        }

        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch patients');
      }

      const result = await response.json();

      if (result.success) {
        setPatients(result.data || []);
        setPagination(
          result.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
      } else {
        throw new Error(result.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load patients'
      );
    } finally {
      setLoading(false);
    }
  }, [session, buildQueryParams]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/patients/stats');

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (
      session?.user &&
      (session.user.role === 'DOCTOR' ||
        session.user.role === 'ADMIN' ||
        session.user.role === 'RECEPTIONIST')
    ) {
      fetchPatients();
      fetchStats();
    }
  }, [session, status, fetchPatients]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPatients(), fetchStats()]);
    setRefreshing(false);
    setSuccess('Data refreshed successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeletePatient = async (patientId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this patient? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setDeletingId(patientId);
      setError(null);

      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete patient');
      }

      const result = await response.json();

      if (result.success) {
        fetchPatients();
        fetchStats();
        setSuccess('Patient deleted successfully!');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(result.message || 'Failed to delete patient');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete patient'
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewPatient = (id: string) => {
    router.push(`/patients/${id}`);
  };

  const handleEditPatient = (id: string) => {
    router.push(`/patients/${id}/edit`);
  };

  const handleAddPatient = () => {
    router.push('/patients/new');
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (session?.user) {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    searchTerm,
    genderFilter,
    bloodTypeFilter,
    ageGroupFilter,
    maritalStatusFilter,
    isActiveFilter,
    session,
  ]);

  useEffect(() => {
    if (session?.user) {
      fetchPatients();
    }
  }, [pagination.page, pagination.limit, session, fetchPatients]);

  if (status === 'loading' || (loading && patients.length === 0)) {
    return <Loading />;
  }

  if (error && patients.length === 0) {
    return <ErrorComponent message={error} />;
  }

  if (
    !session?.user ||
    (session.user.role !== 'RECEPTIONIST' &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'DOCTOR')
  ) {
    return <ErrorComponent message='Unauthorized access' />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 relative overflow-hidden'
    >
      {/* Animated Background Elements */}
      <div className='fixed inset-0 pointer-events-none'>
        <motion.div
          className='absolute top-0 right-0 w-200 h-200 bg-linear-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl'
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        <motion.div
          className='absolute bottom-0 left-0 w-200 h-200 bg-linear-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl'
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      </div>

      {/* Main Content */}
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header Section with Animation */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='mb-8'
        >
          <motion.div
            variants={itemVariants}
            className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'
          >
            <div>
              <motion.h1
                variants={itemVariants}
                className='text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'
              >
                Patient Management
              </motion.h1>
              <motion.p variants={itemVariants} className='text-gray-600 mt-2'>
                Efficiently manage and track patient information
              </motion.p>
            </div>

            <div className='flex items-center gap-3'>
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className='flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </motion.button>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddPatient}
                className='flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg'
              >
                <FiPlus className='w-5 h-5' />
                New Patient
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Success Message with Animation */}
        <AnimatePresence mode='wait'>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className='mb-6 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-4 shadow-xl'
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <FiCheckCircle className='w-5 h-5 shrink-0' />
                  <span className='font-medium'>{success}</span>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className='p-1 hover:bg-white/20 rounded-lg transition-colors'
                  aria-label='Dismiss'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path d='M6 18L18 6M6 6l12 12'></path>
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message with Animation */}
        <AnimatePresence mode='wait'>
          {error && patients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className='mb-6 bg-linear-to-r from-rose-500 to-red-500 text-white rounded-2xl p-4 shadow-xl'
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <FiAlertCircle className='w-5 h-5 shrink-0' />
                  <span className='font-medium'>Error: {error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className='p-1 hover:bg-white/20 rounded-lg transition-colors'
                  aria-label='Dismiss'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path d='M6 18L18 6M6 6l12 12'></path>
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards with Animation */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {stats && (
            <motion.div variants={itemVariants}>
              <PatientStatsComponent stats={stats} />
            </motion.div>
          )}
        </motion.div>

        {/* Filters Section with Animation */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='mt-6'
        >
          <motion.div variants={itemVariants}>
            <PatientFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              genderFilter={genderFilter}
              onGenderFilterChange={setGenderFilter}
              ageFilter={ageGroupFilter}
              onAgeFilterChange={setAgeGroupFilter}
              maritalStatusFilter={maritalStatusFilter}
              onMaritalStatusFilterChange={setMaritalStatusFilter}
              isActiveFilter={isActiveFilter === 'true'}
              onIsActiveFilterChange={value =>
                setIsActiveFilter(value ? 'true' : 'false')
              }
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(newSortBy, newSortOrder) => {
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              limit={pagination.limit}
              onLimitChange={handleLimitChange}
              bloodTypeFilter={bloodTypeFilter}
              onBloodTypeFilterChange={setBloodTypeFilter}
            />
          </motion.div>
        </motion.div>

        {/* Patient Table Section with Animation */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='mt-6'
        >
          <motion.div
            variants={itemVariants}
            className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50'
          >
            <PatientTable
              patients={patients}
              deletingId={deletingId}
              onView={handleViewPatient}
              onEdit={handleEditPatient}
              onDelete={handleDeletePatient}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />
          </motion.div>
        </motion.div>

        {/* Pagination Section with Animation */}
        {pagination.pages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className='mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50'
          >
            <div className='text-sm text-gray-700'>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} patients
            </div>

            <div className='flex items-center gap-2'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || loading}
                className='px-4 py-2 bg-white border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md'
              >
                Previous
              </motion.button>

              <div className='flex items-center gap-1'>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                          pagination.page === pageNum
                            ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 shadow-md'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  }
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
                className='px-4 py-2 bg-white border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md'
              >
                Next
              </motion.button>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-700'>
              <span>Items per page:</span>
              <select
                value={pagination.limit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                disabled={loading}
                className='border-2 border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
              >
                <option value='5'>5</option>
                <option value='10'>10</option>
                <option value='25'>25</option>
                <option value='50'>50</option>
                <option value='100'>100</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Empty State with Animation */}
        <AnimatePresence mode='wait'>
          {patients.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className='mt-8 text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-white/50 shadow-xl'
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2,
                }}
                className='w-24 h-24 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4'
              >
                <svg
                  className='h-12 w-12 text-blue-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className='mt-4 text-xl font-bold text-gray-900'
              >
                {searchTerm ||
                genderFilter !== 'ALL' ||
                ageGroupFilter !== 'ALL' ||
                bloodTypeFilter !== 'ALL'
                  ? 'No patients found'
                  : 'No patients yet'}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className='mt-2 text-gray-500'
              >
                {searchTerm ||
                genderFilter !== 'ALL' ||
                ageGroupFilter !== 'ALL' ||
                bloodTypeFilter !== 'ALL'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new patient.'}
              </motion.p>

              {!searchTerm &&
                genderFilter === 'ALL' &&
                ageGroupFilter === 'ALL' &&
                bloodTypeFilter === 'ALL' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className='mt-8'
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddPatient}
                      className='inline-flex items-center px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg'
                    >
                      <FiPlus className='w-5 h-5 mr-2' />
                      Add Your First Patient
                    </motion.button>
                  </motion.div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PatientRECEPTIONIST />
    </Suspense>
  );
}
