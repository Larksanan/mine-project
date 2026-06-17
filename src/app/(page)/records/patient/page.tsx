/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiEye,
  FiFileText,
  FiTrendingUp,
  FiRefreshCw,
  FiUser,
  FiFilter,
  FiDownload,
  FiClipboard,
  FiThermometer,
  FiImage,
  FiFile,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';
import ErrorComponent from '@/components/Error';

interface Doctor {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  specialization?: string;
  phone?: string;
}

interface MedicalRecord {
  _id: string;
  recordType: string;
  title: string;
  description: string;
  date: string;
  status: string;
  attachments: string[];
  doctorNotes?: string;
  doctor?: Doctor;
  doctorId?: Doctor;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PatientInfo {
  id: string;
  name: string;
  email: string;
  nic?: string;
  phone?: string;
  address?: any;
  dob?: string;
  gender?: string;
}

const MEDICAL_RECORD_TYPES: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  CONSULTATION: { label: 'Consultation', icon: FiUser, color: 'blue' },
  LAB_RESULT: { label: 'Lab Result', icon: FiThermometer, color: 'purple' },
  IMAGING: { label: 'Imaging', icon: FiImage, color: 'indigo' },
  ECG: { label: 'ECG', icon: FiActivity, color: 'cyan' },
  PRESCRIPTION: { label: 'Prescription', icon: FiClipboard, color: 'green' },
  SURGICAL: { label: 'SURGICAL_REPORT', icon: FiFile, color: 'teal' },
  DISCHARGE_SUMMARY: {
    label: 'Discharge Summary',
    icon: FiFileText,
    color: 'orange',
  },
  REFERRAL: { label: 'Referral', icon: FiActivity, color: 'pink' },
  OTHER: { label: 'Other', icon: FiFile, color: 'gray' },
};

const getRecordTypeConfig = (type: string) => {
  return MEDICAL_RECORD_TYPES[type] || MEDICAL_RECORD_TYPES.OTHER;
};

const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; icon: any }
  > = {
    ACTIVE: {
      label: 'Active',
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: FiCheckCircle,
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: FiCheckCircle,
    },
    ARCHIVED: {
      label: 'Archived',
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: FiClock,
    },
    CONFIDENTIAL: {
      label: 'Confidential',
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: FiAlertCircle,
    },
  };
  return configs[status] || configs.ACTIVE;
};

const getDoctorName = (doctor: Doctor | undefined) => {
  if (!doctor) return 'Unknown Doctor';
  if (doctor.firstName && doctor.lastName) {
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  }
  if (doctor.name) {
    return doctor.name.includes('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
  }
  if (doctor.email) {
    return doctor.email.split('@')[0];
  }
  return 'Unknown Doctor';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function PatientMedicalRecordsPage() {
  const router = useRouter();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [recordTypeFilter, statusFilter, debouncedSearch]);

  const fetchMedicalRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(recordTypeFilter !== 'ALL' && { recordType: recordTypeFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const response = await fetch(`/api/records/patient?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch medical records');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch medical records');
      }

      setRecords(result.data);
      setPagination(result.pagination);
      setPatientInfo(result.patient);
    } catch (err: any) {
      console.error('Error fetching medical records:', err);
      setError(err.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  }, [page, recordTypeFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchMedicalRecords();
  }, [fetchMedicalRecords]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMedicalRecords();
    setTimeout(() => setRefreshing(false), 500);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRecordTypeFilter('ALL');
    setStatusFilter('ALL');
    setShowFilters(false);
  };

  const hasActiveFilters =
    searchTerm || recordTypeFilter !== 'ALL' || statusFilter !== 'ALL';

  const stats = {
    total: pagination?.total ?? records.length,
    labResults: records.filter(r => r.recordType === 'LAB_RESULT').length,
    consultations: records.filter(r => r.recordType === 'CONSULTATION').length,
    imaging: records.filter(r => r.recordType === 'IMAGING').length,
  };

  if (
    loading &&
    page === 1 &&
    !debouncedSearch &&
    recordTypeFilter === 'ALL' &&
    statusFilter === 'ALL'
  ) {
    return <Loading />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Animated background blobs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className='absolute -top-40 -right-40 w-96 h-96 bg-linear-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl'
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className='absolute -bottom-40 -left-40 w-96 h-96 bg-linear-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl'
        />
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
                My Medical Records
              </h1>
              {patientInfo && (
                <p className='text-slate-600 flex items-center gap-2'>
                  <FiUser className='w-4 h-4' />
                  Welcome back, {patientInfo.name}
                </p>
              )}
              <p className='text-slate-600 flex items-center gap-2 mt-1'>
                <FiFileText className='w-4 h-4' />
                View and manage your health records
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className='self-start md:self-auto p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-200'
            >
              <motion.div
                animate={refreshing ? { rotate: 360 } : {}}
                transition={{
                  duration: 1,
                  repeat: refreshing ? Infinity : 0,
                  ease: 'linear',
                }}
              >
                <FiRefreshCw className='w-5 h-5' />
              </motion.div>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {[
            {
              label: 'Total Records',
              value: stats.total,
              icon: FiFileText,
              gradient: 'from-blue-500 to-indigo-500',
              color: 'text-blue-600',
            },
            {
              label: 'Lab Results',
              value: stats.labResults,
              icon: FiThermometer,
              gradient: 'from-purple-500 to-pink-500',
              color: 'text-purple-600',
            },
            {
              label: 'Consultations',
              value: stats.consultations,
              icon: FiUser,
              gradient: 'from-green-500 to-emerald-500',
              color: 'text-green-600',
            },
            {
              label: 'Imaging',
              value: stats.imaging,
              icon: FiImage,
              gradient: 'from-orange-500 to-red-500',
              color: 'text-orange-600',
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className='group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 overflow-hidden'
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
                <div className='relative'>
                  <div className='flex items-center justify-between mb-4'>
                    <div
                      className={`p-3 bg-linear-to-br ${stat.gradient} rounded-xl text-white shadow-lg`}
                    >
                      <Icon className='w-6 h-6' />
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                    >
                      <FiTrendingUp className={`w-5 h-5 ${stat.color}`} />
                    </motion.div>
                  </div>
                  <p className='text-sm font-medium text-slate-600 mb-1'>
                    {stat.label}
                  </p>
                  <p className='text-3xl font-bold text-slate-900'>
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='mb-6'
        >
          <div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6'>
            <div className='flex flex-col md:flex-row gap-4'>
              {/* Search input */}
              <div className='flex-1 relative'>
                <FiSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5' />
                <input
                  type='text'
                  placeholder='Search by title, description, or doctor notes...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all'
                />
                {searchTerm && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setSearchTerm('')}
                    className='absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    <FiX className='w-4 h-4 text-slate-400' />
                  </motion.button>
                )}
              </div>

              {/* Filter toggle */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className='flex items-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium'
              >
                <FiFilter className='w-5 h-5' />
                Filters
                {(recordTypeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <span className='px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full ml-2'>
                    {(recordTypeFilter !== 'ALL' ? 1 : 0) +
                      (statusFilter !== 'ALL' ? 1 : 0)}
                  </span>
                )}
              </motion.button>

              {/* Clear filters */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearFilters}
                    className='px-6 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium border-2 border-red-200'
                  >
                    Clear All
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Expanded filter panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='mt-6 pt-6 border-t border-slate-200 overflow-hidden'
                >
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Record Type
                      </label>
                      <select
                        value={recordTypeFilter}
                        onChange={e => setRecordTypeFilter(e.target.value)}
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white'
                      >
                        <option value='ALL'>All Types</option>
                        <option value='CONSULTATION'>Consultation</option>
                        <option value='LAB_RESULT'>Lab Result</option>
                        <option value='IMAGING'>Imaging</option>
                        <option value='PRESCRIPTION'>Prescription</option>
                        <option value='VACCINATION'>Vaccination</option>
                        <option value='SURGERY'>Surgery</option>
                        <option value='DISCHARGE_SUMMARY'>
                          Discharge Summary
                        </option>
                        <option value='REFERRAL'>Referral</option>
                        <option value='OTHER'>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white'
                      >
                        <option value='ALL'>All Status</option>
                        <option value='ACTIVE'>Active</option>
                        <option value='COMPLETED'>Completed</option>
                        <option value='ARCHIVED'>Archived</option>
                        <option value='CONFIDENTIAL'>Confidential</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Medical Records List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {loading && records.length === 0 ? (
            <div className='flex justify-center py-16'>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <FiRefreshCw className='w-8 h-8 text-blue-500' />
              </motion.div>
            </div>
          ) : (
            <AnimatePresence mode='wait'>
              {records.length === 0 ? (
                <motion.div
                  key='empty'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-12 text-center'
                >
                  <div className='max-w-md mx-auto'>
                    <div className='p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center'>
                      <FiFileText className='w-10 h-10 text-slate-400' />
                    </div>
                    <h3 className='text-2xl font-bold text-slate-900 mb-2'>
                      {hasActiveFilters
                        ? 'No matching records'
                        : 'No medical records yet'}
                    </h3>
                    <p className='text-slate-600'>
                      {hasActiveFilters
                        ? 'Try adjusting your search or filters to see more results'
                        : 'Your medical records will appear here once a doctor adds them'}
                    </p>
                    {hasActiveFilters && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearFilters}
                        className='mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                      >
                        Clear Filters
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className='space-y-4'>
                  {records.map((record, index) => (
                    <MedicalRecordCard
                      key={record._id}
                      record={record}
                      index={index}
                      onView={() =>
                        router.push(`/records/patient/${record._id}`)
                      }
                      onDownload={url => window.open(url, '_blank')}
                      onToast={(message, type) =>
                        setToast({ show: true, message, type })
                      }
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='mt-8 flex items-center justify-center gap-3'
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage(p => p - 1)}
              disabled={!pagination.hasPrev}
              className='px-5 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm'
            >
              Previous
            </motion.button>

            <div className='flex items-center gap-2'>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        pageNum === pagination.page
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                      }`}
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
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext}
              className='px-5 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm'
            >
              Next
            </motion.button>
          </motion.div>
        )}

        {/* Results summary */}
        {pagination && records.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='mt-6 text-center text-sm text-slate-600'
          >
            Showing{' '}
            <span className='font-semibold text-slate-900'>
              {records.length}
            </span>{' '}
            of{' '}
            <span className='font-semibold text-slate-900'>
              {pagination.total}
            </span>{' '}
            medical records
            {(recordTypeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <span className='ml-2 text-blue-600'>(filtered)</span>
            )}
          </motion.div>
        )}
      </div>

      {/* Toast — lives in parent where state is defined */}
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

function MedicalRecordCard({
  record,
  index,
  onView,
  onDownload,
  onToast,
}: {
  record: MedicalRecord;
  index: number;
  onView: () => void;
  onDownload: (url: string) => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const typeConfig = getRecordTypeConfig(record.recordType);
  const statusConfig = getStatusConfig(record.status);
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;
  const doctorName = getDoctorName(record.doctor || record.doctorId);

  const getTypeColorClass = () => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      cyan: 'bg-cyan-100 text-cyan-600',
      green: 'bg-green-100 text-green-600',
      teal: 'bg-teal-100 text-teal-600',
      red: 'bg-red-100 text-red-600',
      orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600',
      gray: 'bg-gray-100 text-gray-600',
    };
    return colors[typeConfig.color] || colors.blue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className='relative group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-slate-200/50 overflow-hidden transition-all duration-300 cursor-pointer'
      onClick={onView}
    >
      <div className='p-6'>
        <div className='flex items-start justify-between mb-4'>
          {/* Left side */}
          <div className='flex items-start gap-4 flex-1'>
            <div className={`p-3 ${getTypeColorClass()} rounded-xl shadow-lg`}>
              <TypeIcon className='w-6 h-6' />
            </div>

            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                <h3 className='text-xl font-bold text-slate-900'>
                  {record.title}
                </h3>
                <span
                  className={`px-2 py-0.5 ${getTypeColorClass()} text-xs rounded-full font-medium`}
                >
                  {typeConfig.label}
                </span>
              </div>

              <p className='text-slate-600 text-sm mb-2 line-clamp-2'>
                {record.description}
              </p>

              <div className='flex flex-wrap items-center gap-4 text-sm text-slate-500'>
                <span className='flex items-center gap-1'>
                  <FiCalendar className='w-4 h-4' />
                  {formatDate(record.date)}
                </span>
                <span className='flex items-center gap-1'>
                  <FiUser className='w-4 h-4' />
                  {doctorName}
                </span>
                {record.attachments && record.attachments.length > 0 && (
                  <span className='flex items-center gap-1'>
                    <FiDownload className='w-4 h-4' />
                    {record.attachments.length} attachment(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Status & Actions */}
          <div className='flex flex-col items-end gap-3 ml-4'>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 ${statusConfig.bg} rounded-lg shadow-sm`}
            >
              <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
              <span className={`text-sm font-semibold ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            </div>

            <AnimatePresence>
              {isHovered && (
                <div className='flex gap-2'>
                  {record.attachments && record.attachments.length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={e => {
                        e.stopPropagation();
                        onDownload(record.attachments[0]);
                        onToast('Downloading attachment...', 'info');
                      }}
                      className='p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors'
                      title='Download attachment'
                    >
                      <FiDownload className='w-4 h-4' />
                    </motion.button>
                  )}
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={e => {
                      e.stopPropagation();
                      onView();
                    }}
                    className='p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors'
                    title='View details'
                  >
                    <FiEye className='w-4 h-4' />
                  </motion.button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Doctor notes preview */}
        {record.doctorNotes && (
          <div className='mt-4 pt-4 border-t border-slate-200'>
            <div className='flex items-start gap-2'>
              <FiClipboard className='w-4 h-4 text-slate-400 mt-0.5' />
              <p className='text-sm text-slate-600 line-clamp-2'>
                <span className='font-medium'>Doctor&apos;s Notes:</span>{' '}
                {record.doctorNotes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hover gradient overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className='absolute inset-0 bg-linear-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none'
      />
    </motion.div>
  );
}
