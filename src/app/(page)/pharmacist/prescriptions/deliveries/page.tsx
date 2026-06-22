/* eslint-disable no-undef */
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiMapPin,
  FiPhone,
  FiEdit2,
  FiEye,
} from 'react-icons/fi';

interface Delivery {
  _id: string;
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';
  address: {
    line1: string;
    line2?: string;
    city: string;
    postalCode?: string;
    phone: string;
  };
  trackingNumber?: string;
  deliveryFee: number;
  notes?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  prescriptionId?: {
    prescriptionNumber: string;
    diagnosis: string;
    status: string;
  };
  patientId?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    Icon: FiClock,
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-400',
  },
  PROCESSING: {
    label: 'Processing',
    Icon: FiPackage,
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-400',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    Icon: FiTruck,
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
    dot: 'bg-purple-400',
  },
  DELIVERED: {
    label: 'Delivered',
    Icon: FiCheckCircle,
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    Icon: FiXCircle,
    className: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-400',
  },
};

const STATUS_TABS = [
  'ALL',
  'PENDING',
  'PROCESSING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3 },
};

const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const { Icon } = config;
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className='w-3 h-3' />
      {config.label}
    </motion.span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PharmacyDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { showToast, ToastContainer } = useToast();

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(activeStatus !== 'ALL' && { status: activeStatus }),
        ...(search && { search }),
      });
      const res = await fetch(
        `/api/patients/prescriptions/pharmacist/deliveries?${params}`
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDeliveries(data.data);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load deliveries';
      setError(errorMessage);
      showToast(errorMessage, 'error', { duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, search, showToast]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      <ToastContainer />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='bg-white border-b border-slate-200 px-6 py-5'
      >
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className='text-xl font-semibold text-slate-900'
            >
              Deliveries
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className='text-sm text-slate-500 mt-0.5'
            >
              {pagination
                ? `${pagination.total} total deliveries`
                : 'Manage your pharmacy deliveries'}
            </motion.p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchDeliveries}
            disabled={loading}
            className='flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors'
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      <div className='max-w-7xl mx-auto px-6 py-6 space-y-5'>
        {/* Filters */}
        <motion.div
          variants={fadeInUp}
          initial='initial'
          animate='animate'
          className='bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm'
        >
          <form onSubmit={handleSearch} className='flex gap-2'>
            <div className='relative flex-1'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type='text'
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder='Search by patient name or tracking number...'
                className='w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            <motion.button
              {...scaleOnHover}
              type='submit'
              className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors'
            >
              Search
            </motion.button>
            {search && (
              <motion.button
                {...scaleOnHover}
                type='button'
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setPage(1);
                }}
                className='px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
              >
                Clear
              </motion.button>
            )}
          </form>

          <motion.div
            variants={staggerContainer}
            initial='initial'
            animate='animate'
            className='flex gap-1 flex-wrap'
          >
            {STATUS_TABS.map(status => (
              <motion.button
                key={status}
                variants={fadeIn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeStatus === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL'
                  ? 'All'
                  : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700'
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={fadeInUp}
          initial='initial'
          animate='animate'
          className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm'
        >
          {loading ? (
            <div className='divide-y divide-slate-100'>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className='p-5 animate-pulse'
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-10 h-10 bg-slate-100 rounded-lg' />
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 bg-slate-100 rounded w-48' />
                      <div className='h-3 bg-slate-100 rounded w-32' />
                    </div>
                    <div className='h-6 w-24 bg-slate-100 rounded-full' />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className='py-16 text-center'
            >
              <div className='w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <FiTruck className='w-6 h-6 text-slate-400' />
              </div>
              <p className='text-sm font-medium text-slate-900'>
                No deliveries found
              </p>
              <p className='text-sm text-slate-500 mt-1'>
                {activeStatus !== 'ALL' || search
                  ? 'Try adjusting your filters'
                  : 'Deliveries will appear here once prescriptions are accepted'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial='initial'
              animate='animate'
              className='divide-y divide-slate-100'
            >
              {deliveries.map(delivery => (
                <motion.div
                  key={delivery._id}
                  variants={slideIn}
                  whileHover={{ backgroundColor: '#f8fafc' }}
                  transition={{ duration: 0.2 }}
                  className='p-5 hover:bg-slate-50 transition-colors'
                >
                  <div className='flex items-start gap-4'>
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0'
                    >
                      <FiPackage className='w-5 h-5 text-slate-500' />
                    </motion.div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-sm font-semibold text-slate-900'>
                          {delivery.patientId
                            ? `${delivery.patientId.firstName} ${delivery.patientId.lastName}`
                            : 'Unknown Patient'}
                        </span>
                        {delivery.trackingNumber && (
                          <span className='text-xs text-slate-400 font-mono'>
                            #{delivery.trackingNumber}
                          </span>
                        )}
                      </div>
                      {delivery.prescriptionId && (
                        <p className='text-xs text-slate-500 mt-0.5'>
                          Rx: {delivery.prescriptionId.prescriptionNumber} —{' '}
                          {delivery.prescriptionId.diagnosis}
                        </p>
                      )}
                      <div className='flex items-center gap-4 mt-2 flex-wrap'>
                        <span className='flex items-center gap-1 text-xs text-slate-500'>
                          <FiMapPin className='w-3 h-3' />
                          {delivery.address.line1}, {delivery.address.city}
                        </span>
                        {delivery.patientId?.phone && (
                          <span className='flex items-center gap-1 text-xs text-slate-500'>
                            <FiPhone className='w-3 h-3' />
                            {delivery.patientId.phone}
                          </span>
                        )}
                        <span className='text-xs text-slate-400'>
                          {formatDate(delivery.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 shrink-0'>
                      <StatusBadge status={delivery.status} />
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className='text-sm font-medium text-slate-700'
                      >
                        Rs. {delivery.deliveryFee.toFixed(2)}
                      </motion.span>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          href={`/pharmacist/prescriptions/deliveries/${delivery._id}`}
                          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors'
                        >
                          <FiEye className='w-3 h-3' />
                          View
                        </Link>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          href={`/pharmacist/prescriptions/deliveries/${delivery._id}/edit`}
                          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors'
                        >
                          <FiEdit2 className='w-3 h-3' />
                          Edit
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {pagination && pagination.totalPages > 1 && (
          <motion.div
            variants={fadeInUp}
            initial='initial'
            animate='animate'
            className='flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-sm'
          >
            <p className='text-sm text-slate-500'>
              Page {pagination.page} of {pagination.totalPages} (
              {pagination.total} total)
            </p>
            <div className='flex gap-2'>
              <motion.button
                {...scaleOnHover}
                onClick={() => setPage(p => p - 1)}
                disabled={!pagination.hasPrev || loading}
                className='flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
              >
                <FiChevronLeft className='w-4 h-4' />
                Prev
              </motion.button>
              <motion.button
                {...scaleOnHover}
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext || loading}
                className='flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
              >
                Next
                <FiChevronRight className='w-4 h-4' />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
