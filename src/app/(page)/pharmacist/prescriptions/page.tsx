/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
  FiRefreshCw,
  FiUser,
  FiFilter,
  FiMail,
  FiPhone,
  FiEye,
  FiEdit2,
  FiCreditCard,
  FiClock,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

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
  doctor?: Doctor;
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

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
    icon: any;
    gradient: string;
  }
> = {
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    icon: FiCheckCircle,
    gradient: 'from-emerald-400 to-emerald-600',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    icon: FiCheckCircle,
    gradient: 'from-blue-400 to-blue-600',
  },
  EXPIRED: {
    label: 'Expired',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: FiAlertCircle,
    gradient: 'from-amber-400 to-amber-600',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-400',
    icon: FiX,
    gradient: 'from-red-400 to-red-600',
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE;

const getDoctorName = (doctor: Doctor | undefined) => {
  if (!doctor) return 'Unknown Doctor';
  if (doctor.name && doctor.name !== 'undefined undefined') return doctor.name;
  if (doctor.firstName && doctor.lastName)
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  if (doctor.firstName) return `Dr. ${doctor.firstName}`;
  if (doctor.email) return doctor.email.split('@')[0];
  return 'Unknown Doctor';
};

const getDoctorSpecialty = (doctor: Doctor | undefined) =>
  doctor?.specialty ?? 'General Practitioner';

const getDoctorEmail = (doctor: Doctor | undefined) =>
  doctor?.email ?? 'Email not available';

const getDoctorPhone = (doctor: Doctor | undefined) =>
  doctor?.phone ?? 'Phone not available';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

/* ── Animation Variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
};

const statHoverVariants = {
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

export default function PharmacistPrescriptionsPage() {
  const { showToast, ToastContainer } = useToast();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* search / filter state */
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [nicTerm, setNicTerm] = useState('');
  const [activeNic, setActiveNic] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  /* debounce general search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* reset page on filter / search change */
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch, activeNic]);

  /* ── Fetch ── */
  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(activeNic && { nic: activeNic }),
      });

      const response = await fetch(
        `/api/doctor/prescriptions/pharmacist?${params}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch prescriptions');
      }

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to fetch prescriptions');

      setPrescriptions(result.data);
      setPagination(result.pagination);
      setPatientInfo(result.patient ?? null);

      // Show toast on successful fetch
      if (!loading) {
        showToast('Prescriptions updated successfully', 'success', {
          duration: 2000,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load prescriptions');
      showToast(err.message || 'Failed to load prescriptions', 'error', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, activeNic, showToast]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  /* ── Handlers ── */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleNicSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nic = nicTerm.trim().toUpperCase();
    setActiveNic(nic);
    if (nic) {
      showToast(`Searching for NIC: ${nic}`, 'info', { duration: 2000 });
    }
  };

  const clearNic = () => {
    setNicTerm('');
    setActiveNic('');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setShowFilters(false);
    clearNic();
    showToast('Filters cleared', 'info', { duration: 1500 });
  };

  const hasActiveFilters =
    Boolean(searchTerm) || statusFilter !== 'ALL' || Boolean(activeNic);

  /* ── Stats ── */
  const stats = {
    total: pagination?.total ?? prescriptions.length,
    active: prescriptions.filter(p => p.status === 'ACTIVE').length,
    completed: prescriptions.filter(p => p.status === 'COMPLETED').length,
    expired: prescriptions.filter(
      p => p.status === 'EXPIRED' || p.status === 'CANCELLED'
    ).length,
  };

  if (
    loading &&
    page === 1 &&
    !debouncedSearch &&
    statusFilter === 'ALL' &&
    !activeNic
  ) {
    return <Loading />;
  }

  if (error) return <ErrorComponent message={error} />;

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 px-4 py-8 sm:px-6 lg:px-8'>
      <ToastContainer />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='mx-auto max-w-6xl'
      >
        {/* ── Header ── */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <div>
            <h1 className='text-3xl font-bold bg-linear-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent'>
              Prescriptions
            </h1>
            {patientInfo && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className='mt-1 text-sm text-gray-500'
              >
                Viewing history for{' '}
                <span className='font-medium text-gray-700'>
                  {patientInfo.name}
                </span>
              </motion.p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md hover:bg-gray-50 disabled:opacity-60'
          >
            <FiRefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </motion.button>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4'
        >
          {[
            {
              label: 'Total',
              value: stats.total,
              icon: FiPackage,
              gradient: 'from-blue-400 to-blue-600',
              bg: 'bg-blue-50',
              color: 'text-blue-600',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: FiActivity,
              gradient: 'from-emerald-400 to-emerald-600',
              bg: 'bg-emerald-50',
              color: 'text-emerald-600',
            },
            {
              label: 'Completed',
              value: stats.completed,
              icon: FiCheckCircle,
              gradient: 'from-purple-400 to-purple-600',
              bg: 'bg-purple-50',
              color: 'text-purple-600',
            },
            {
              label: 'Expired/Cancelled',
              value: stats.expired,
              icon: FiAlertCircle,
              gradient: 'from-amber-400 to-amber-600',
              bg: 'bg-amber-50',
              color: 'text-amber-600',
            },
          ].map((s, idx) => (
            <motion.div
              key={s.label}
              whileHover='hover'
              // cast to any to satisfy framer-motion/TypeScript variant typing
              variants={statHoverVariants as any}
              className='group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg'
            >
              <div
                className={`absolute inset-0 bg-linear-to-br ${s.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />
              <div className='relative flex items-center justify-between'>
                <div>
                  <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    {s.label}
                  </p>
                  <motion.p
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05, type: 'spring' }}
                    className='mt-1 text-2xl font-bold text-gray-900'
                  >
                    {s.value}
                  </motion.p>
                </div>
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}
                >
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── NIC Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'
        >
          <p className='mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400'>
            <FiCreditCard className='h-4 w-4' />
            Search by NIC Number
          </p>
          <form onSubmit={handleNicSearch} className='flex gap-3'>
            <div className='relative flex-1'>
              <FiCreditCard className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                value={nicTerm}
                onChange={e => setNicTerm(e.target.value.toUpperCase())}
                placeholder='e.g. 200026204034'
                maxLength={12}
                className='w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 font-mono text-sm tracking-wider text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
              />
              {nicTerm && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  type='button'
                  onClick={clearNic}
                  className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600'
                >
                  <FiX className='h-4 w-4' />
                </motion.button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type='submit'
              disabled={!nicTerm.trim() || loading}
              className='flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <FiSearch className='h-4 w-4' />
              Search
            </motion.button>
          </form>

          {/* Active NIC badge */}
          <AnimatePresence>
            {activeNic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='overflow-hidden'
              >
                <div className='mt-4 flex items-center gap-3 rounded-xl border-t border-gray-100 pt-4'>
                  <span className='text-xs text-gray-500'>
                    Filtering by NIC:
                  </span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className='flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-sm font-semibold text-blue-700'
                  >
                    <FiCreditCard className='h-3.5 w-3.5' />
                    {activeNic}
                  </motion.span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearNic}
                    className='text-xs font-medium text-red-500 transition hover:text-red-600'
                  >
                    Clear
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── General Search + Filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'
        >
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='relative flex-1'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Search by prescription number, diagnosis, or patient name…'
                className='w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600'
                >
                  <FiX className='h-4 w-4' />
                </button>
              )}
            </div>

            <div className='flex gap-2'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  showFilters || statusFilter !== 'ALL'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiFilter className='h-4 w-4' />
                Filters
                {statusFilter !== 'ALL' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className='ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white'
                  >
                    1
                  </motion.span>
                )}
              </motion.button>

              {hasActiveFilters && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearFilters}
                  className='text-sm font-medium text-red-500 transition hover:text-red-600'
                >
                  Clear all
                </motion.button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className='overflow-hidden'
              >
                <div className='mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4'>
                  {['ALL', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED'].map(
                    s => (
                      <motion.button
                        key={s}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                          statusFilter === s
                            ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {s === 'ALL'
                          ? 'All Statuses'
                          : s.charAt(0) + s.slice(1).toLowerCase()}
                      </motion.button>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Loading overlay for subsequent fetches ── */}
        {loading &&
          (page > 1 ||
            debouncedSearch ||
            statusFilter !== 'ALL' ||
            activeNic) && (
            <div className='mb-4 flex items-center justify-center py-8 text-sm text-gray-500'>
              <FiRefreshCw className='mr-2 h-5 w-5 animate-spin' />
              Loading prescriptions…
            </div>
          )}

        {/* ── Empty state ── */}
        {!loading && prescriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center'
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100'
            >
              <FiPackage className='h-10 w-10 text-gray-400' />
            </motion.div>
            <p className='text-sm font-medium text-gray-500'>
              {activeNic
                ? `No prescriptions found for NIC ${activeNic}`
                : 'No prescriptions found'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className='mt-3 text-sm font-medium text-blue-600 transition hover:text-blue-700'
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          /* ── Prescription cards ── */
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='space-y-4'
          >
            <AnimatePresence>
              {prescriptions.map(rx => {
                const doctor = rx.doctorId || rx.doctor;
                const statusConf = getStatusConfig(rx.status);

                return (
                  <motion.div
                    key={rx._id}
                    variants={itemVariants}
                    whileHover={cardHoverVariants}
                    className='group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg'
                  >
                    <div
                      className={`absolute inset-0 bg-linear-to-r ${statusConf.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />

                    {/* ── top row ── */}
                    <div className='relative flex flex-wrap items-start justify-between gap-4'>
                      <div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-mono text-sm font-bold text-gray-900'>
                            {rx.prescriptionNumber}
                          </span>
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusConf.bg} ${statusConf.border} ${statusConf.text}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusConf.dot} animate-pulse`}
                            />
                            {statusConf.label}
                          </motion.span>
                        </div>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className='mt-1 text-sm text-gray-600'
                        >
                          {rx.diagnosis}
                        </motion.p>
                      </div>

                      {/* ── action buttons ── */}
                      <div className='flex flex-wrap items-center gap-2'>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className='flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-500'
                        >
                          <FiClock className='h-3.5 w-3.5' />
                          {formatTimeAgo(rx.createdAt)}
                        </motion.span>

                        <Link
                          href={`/pharmacist/prescriptions/${rx._id}`}
                          className='flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
                        >
                          <FiEye className='h-3.5 w-3.5' />
                          View
                        </Link>

                        <Link
                          href={`/pharmacist/prescriptions/${rx._id}/edit`}
                          className='flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 hover:shadow-md'
                        >
                          <FiEdit2 className='h-3.5 w-3.5' />
                          Edit
                        </Link>
                      </div>
                    </div>

                    {/* ── Doctor row ── */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className='mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 px-4 py-2.5 text-xs text-gray-600'
                    >
                      <span className='flex items-center gap-1.5 font-medium text-gray-700'>
                        <FiUser className='h-3.5 w-3.5 text-gray-400' />
                        {getDoctorName(doctor)}
                        <span className='text-gray-300'>·</span>
                        {getDoctorSpecialty(doctor)}
                      </span>
                      <span className='flex items-center gap-1.5'>
                        <FiMail className='h-3.5 w-3.5 text-gray-400' />
                        {getDoctorEmail(doctor)}
                      </span>
                      <span className='flex items-center gap-1.5'>
                        <FiPhone className='h-3.5 w-3.5 text-gray-400' />
                        {getDoctorPhone(doctor)}
                      </span>
                      <span className='flex items-center gap-1.5 text-gray-400'>
                        <FiCalendar className='h-3.5 w-3.5' />
                        {formatDate(rx.startDate)}
                        {rx.endDate ? ` – ${formatDate(rx.endDate)}` : ''}
                      </span>
                    </motion.div>

                    {/* ── Medications ── */}
                    <div className='mt-4 space-y-2'>
                      <AnimatePresence>
                        {rx.medications.map((med, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm transition-all hover:border-gray-200'
                          >
                            <div>
                              <span className='font-semibold text-gray-800'>
                                {med.name}
                              </span>
                              <span className='ml-2 text-gray-400'>
                                {med.dosage}
                                <span className='mx-1'>·</span>
                                {med.frequency}
                                <span className='mx-1'>·</span>
                                {med.duration}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 text-xs'>
                              <span className='rounded-lg border border-gray-200 bg-white px-2 py-1 font-medium text-gray-700 shadow-sm'>
                                Qty <strong>{med.quantity}</strong>
                              </span>
                              <span className='rounded-lg border border-gray-200 bg-white px-2 py-1 font-medium text-gray-700 shadow-sm'>
                                Refills <strong>{med.refills}</strong>
                              </span>
                            </div>
                            {med.instructions && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className='w-full text-xs italic text-gray-400'
                              >
                                💊 {med.instructions}
                              </motion.p>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {rx.notes && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className='mt-3 flex items-start gap-2 rounded-xl bg-yellow-50 px-4 py-2 text-xs italic text-yellow-700'
                      >
                        <FiAlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                        {rx.notes}
                      </motion.p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row'
          >
            <p className='text-sm text-gray-500'>
              Page{' '}
              <span className='font-medium text-gray-700'>
                {pagination.page}
              </span>{' '}
              of{' '}
              <span className='font-medium text-gray-700'>
                {pagination.totalPages}
              </span>
              <span className='mx-1 text-gray-300'>·</span>
              <span className='font-medium text-gray-700'>
                {pagination.total}
              </span>{' '}
              total
            </p>
            <div className='flex gap-2'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className='rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
                className='rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Next
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
