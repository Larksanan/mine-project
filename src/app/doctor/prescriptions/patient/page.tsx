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
  FiPackage,
  FiTrendingUp,
  FiRefreshCw,
  FiUser,
  FiFilter,
  FiMail,
  FiPhone,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  refills: number;
}

interface Doctor {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  specialty?: string;
  phone?: string;
}

interface Prescription {
  _id: string;
  prescriptionNumber: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  doctorId?: Doctor;
  doctor?: Doctor; // Handle both possible field names
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
}

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
    EXPIRED: {
      label: 'Expired',
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      icon: FiAlertCircle,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: FiX,
    },
  };
  return configs[status] || configs.ACTIVE;
};

const getDoctorName = (doctor: Doctor | undefined) => {
  if (!doctor) return 'Unknown Doctor';

  if (doctor.name && doctor.name !== 'undefined undefined') {
    return doctor.name;
  }
  if (doctor.firstName && doctor.lastName) {
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  }
  if (doctor.firstName) {
    return `Dr. ${doctor.firstName}`;
  }
  if (doctor.email) {
    return doctor.email.split('@')[0];
  }
  return 'Unknown Doctor';
};

const getDoctorSpecialty = (doctor: Doctor | undefined) => {
  if (!doctor) return 'General Practitioner';
  return doctor.specialty || 'General Practitioner';
};

const getDoctorEmail = (doctor: Doctor | undefined) => {
  if (!doctor) return 'Email not available';
  return doctor.email || 'Email not available';
};

const getDoctorPhone = (doctor: Doctor | undefined) => {
  if (!doctor) return 'Phone not available';
  return doctor.phone || 'Phone not available';
};

export default function PatientPrescriptionsPage() {
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const response = await fetch(
        `/api/doctor/prescriptions/patient?${params}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch prescriptions');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch prescriptions');
      }

      setPrescriptions(result.data);
      setPagination(result.pagination);
      setPatientInfo(result.patient);
    } catch (err: any) {
      console.error('Error fetching prescriptions:', err);
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setTimeout(() => setRefreshing(false), 500);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'ALL';

  // Derived stats
  const stats = {
    total: pagination?.total ?? prescriptions.length,
    active: prescriptions.filter(p => p.status === 'ACTIVE').length,
    completed: prescriptions.filter(p => p.status === 'COMPLETED').length,
    expired: prescriptions.filter(
      p => p.status === 'EXPIRED' || p.status === 'CANCELLED'
    ).length,
  };

  if (loading && page === 1 && !debouncedSearch && statusFilter === 'ALL') {
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
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
                My Prescriptions
              </h1>
              {patientInfo && (
                <p className='text-slate-600 flex items-center gap-2'>
                  <FiUser className='w-4 h-4' />
                  Welcome back, {patientInfo.name}
                </p>
              )}
              <p className='text-slate-600 flex items-center gap-2 mt-1'>
                <FiActivity className='w-4 h-4' />
                View and track your prescribed medications
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

        {/* ── Stats Cards ── */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {[
            {
              label: 'Total Prescriptions',
              value: stats.total,
              icon: FiActivity,
              gradient: 'from-blue-500 to-indigo-500',
              color: 'text-blue-600',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: FiCheckCircle,
              gradient: 'from-green-500 to-emerald-500',
              color: 'text-green-600',
            },
            {
              label: 'Completed',
              value: stats.completed,
              icon: FiClock,
              gradient: 'from-purple-500 to-pink-500',
              color: 'text-purple-600',
            },
            {
              label: 'Expired/Cancelled',
              value: stats.expired,
              icon: FiAlertCircle,
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

        {/* ── Search & Filters ── */}
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
                  placeholder='Search by diagnosis, medication, or prescription number...'
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
                {statusFilter !== 'ALL' && (
                  <span className='px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full ml-2'>
                    1
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
                  <div className='max-w-xs'>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Filter by Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white'
                    >
                      <option value='ALL'>All Prescriptions</option>
                      <option value='ACTIVE'>Active</option>
                      <option value='COMPLETED'>Completed</option>
                      <option value='EXPIRED'>Expired</option>
                      <option value='CANCELLED'>Cancelled</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Prescriptions List ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {loading && prescriptions.length === 0 ? (
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
              {prescriptions.length === 0 ? (
                <motion.div
                  key='empty'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-12 text-center'
                >
                  <div className='max-w-md mx-auto'>
                    <div className='p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center'>
                      <FiPackage className='w-10 h-10 text-slate-400' />
                    </div>
                    <h3 className='text-2xl font-bold text-slate-900 mb-2'>
                      {hasActiveFilters
                        ? 'No matching prescriptions'
                        : 'No prescriptions yet'}
                    </h3>
                    <p className='text-slate-600'>
                      {hasActiveFilters
                        ? 'Try adjusting your search or filters to see more results'
                        : 'Your prescriptions will appear here once a doctor prescribes medication for you'}
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
                  {prescriptions.map((prescription, index) => (
                    <PrescriptionCard
                      key={prescription._id}
                      prescription={prescription}
                      index={index}
                      onView={() =>
                        router.push(
                          `/doctor/prescriptions/patient/${prescription._id}`
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

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

        {pagination && prescriptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='mt-6 text-center text-sm text-slate-600'
          >
            Showing{' '}
            <span className='font-semibold text-slate-900'>
              {prescriptions.length}
            </span>{' '}
            of{' '}
            <span className='font-semibold text-slate-900'>
              {pagination.total}
            </span>{' '}
            prescriptions
            {statusFilter !== 'ALL' && (
              <span className='ml-2 text-blue-600'>
                (filtered by {statusFilter.toLowerCase()} status)
              </span>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PrescriptionCard({
  prescription,
  index,
  onView,
}: {
  prescription: Prescription;
  index: number;
  onView: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = getStatusConfig(prescription.status);
  const StatusIcon = statusConfig.icon;

  const doctor = prescription.doctor || prescription.doctorId;
  const doctorName = getDoctorName(doctor);
  const doctorSpecialty = getDoctorSpecialty(doctor);
  const doctorEmail = getDoctorEmail(doctor);
  const doctorPhone = getDoctorPhone(doctor);

  const getMedicationCount = () => {
    const count = prescription.medications.length;
    return `${count} medication${count !== 1 ? 's' : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          {/* Left side - Doctor & Diagnosis */}
          <div className='flex items-start gap-4 flex-1'>
            <div className='p-3 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl text-white shadow-lg'>
              <FiUser className='w-6 h-6' />
            </div>

            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                <h3 className='text-xl font-bold text-slate-900'>
                  {doctorName}
                </h3>
                <span className='px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium'>
                  {doctorSpecialty}
                </span>
              </div>

              <p className='text-slate-700 font-medium mb-2'>
                {prescription.diagnosis}
              </p>

              <div className='flex flex-wrap items-center gap-4 text-sm text-slate-500'>
                <span className='flex items-center gap-1'>
                  <FiCalendar className='w-4 h-4' />
                  Started: {formatDate(prescription.startDate)}
                </span>
                {prescription.endDate && (
                  <span className='flex items-center gap-1'>
                    <FiClock className='w-4 h-4' />
                    Until: {formatDate(prescription.endDate)}
                  </span>
                )}
                <span className='flex items-center gap-1'>
                  <FiPackage className='w-4 h-4' />
                  {getMedicationCount()}
                </span>
              </div>

              {/* Doctor contact info - shown on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='mt-3 pt-3 border-t border-slate-200'
                  >
                    <div className='flex items-center gap-4 text-xs text-slate-500'>
                      {doctorEmail && doctorEmail !== 'Email not available' && (
                        <span className='flex items-center gap-1'>
                          <FiMail className='w-3 h-3' />
                          {doctorEmail}
                        </span>
                      )}
                      {doctorPhone && doctorPhone !== 'Phone not available' && (
                        <span className='flex items-center gap-1'>
                          <FiPhone className='w-3 h-3' />
                          {doctorPhone}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side - Status & Action */}
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
                >
                  <FiEye className='w-4 h-4' />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Medications Preview */}
        {prescription.medications.length > 0 && (
          <div className='mt-4 pt-4 border-t border-slate-200'>
            <div className='flex flex-wrap gap-2'>
              {prescription.medications.slice(0, 3).map((med, idx) => (
                <span
                  key={idx}
                  className='px-3 py-1 bg-linear-to-r from-purple-50 to-pink-50 text-purple-700 text-sm rounded-lg font-medium border border-purple-100'
                >
                  {med.name} · {med.dosage}
                </span>
              ))}
              {prescription.medications.length > 3 && (
                <span className='px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg font-medium'>
                  +{prescription.medications.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer with prescription number */}
        <div className='mt-3 flex items-center justify-between'>
          <p className='text-xs text-slate-400 font-mono'>
            Prescription #{prescription.prescriptionNumber}
          </p>
          <p className='text-xs text-slate-400'>
            {formatDate(prescription.createdAt)}
          </p>
        </div>
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
