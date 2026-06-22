/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiSearch,
  FiX,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
  FiRefreshCw,
  FiFilter,
  FiMail,
  FiPhone,
  FiEye,
  FiClock,
  FiUpload,
  FiMapPin,
  FiHome,
  FiFileText,
  FiTruck,
  FiDollarSign,
  FiHash,
  FiImage,
  FiNavigation,
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

interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  phone: string;
}

interface Delivery {
  _id: string;
  prescriptionId: string;
  patientId: string;
  pharmaciesID: string | { _id: string; name: string };
  address: DeliveryAddress;
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';
  deliveryFee: number;
  trackingNumber?: string;
  notes?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface pharmacies {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    emergencyPhone?: string;
  };
  operatingHours: Record<string, string>;
  services: string[];
  status: string;
  is24Hours: boolean;
  description: string;
  website?: string;
  rating?: number;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
  estimatedDeliveryTime?: string;
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
  createdAt: string;
  updatedAt: string;
  attachmentUrl?: string;
  uploadedByPatient?: boolean;
  wantsDelivery?: boolean;
  deliveryAddress?: DeliveryAddress;
  delivery?: Delivery;
  pharmaciesID?: string | pharmacies;
  pharmacies?: pharmacies;
  sentTopharmacies?: boolean;
  pharmaciesSentAt?: string;
  pharmaciesStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FULFILLED';
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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

const DELIVERY_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    icon: any;
  }
> = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    icon: FiClock,
  },
  PROCESSING: {
    label: 'Processing',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: FiRefreshCw,
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: FiTruck,
  },
  DELIVERED: {
    label: 'Delivered',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: FiCheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: FiX,
  },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE;

const getDeliveryStatusConfig = (status: string) =>
  DELIVERY_STATUS_CONFIG[status] ?? DELIVERY_STATUS_CONFIG.PENDING;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

const statHoverVariants = {
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

export default function PatientPrescriptionsPage() {
  const { showToast, ToastContainer } = useToast();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* search / filter state */
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  /* Upload modal state */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<pharmacies | null>(
    null
  );
  const [showPharmacySearch, setShowPharmacySearch] = useState(false);
  const [pharmacySearchTerm, setPharmacySearchTerm] = useState('');
  const [pharmacies, setPharmacies] = useState<pharmacies[]>([]);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);
  const [pharmacyError, setPharmacyError] = useState<string | null>(null);
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  /* debounce general search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* reset page on filter / search change */
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  /* ── Fetch Prescriptions ── */
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
        `/api/patients/prescriptions/upload?${params}`
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
    } catch (err: any) {
      setError(err.message || 'Failed to load prescriptions');
      showToast(err.message || 'Failed to load prescriptions', 'error', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, showToast]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  /* ── Search Pharmacies ── */
  const searchPharmacies = useCallback(async (search: string = '') => {
    try {
      setPharmacyLoading(true);
      setPharmacyError(null);

      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/pharmacy?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pharmacies');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPharmacies(result.data.pharmacies || []);
      } else {
        throw new Error(result.message || 'Failed to fetch pharmacies');
      }
    } catch (err: any) {
      setPharmacyError(err.message || 'Failed to load pharmacies');
      setPharmacies([]);
    } finally {
      setPharmacyLoading(false);
    }
  }, []);

  // Debounced pharmacy search
  useEffect(() => {
    if (showPharmacySearch) {
      const timer = setTimeout(() => {
        searchPharmacies(pharmacySearchTerm);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pharmacySearchTerm, showPharmacySearch, searchPharmacies]);

  // Load pharmacies when search modal opens
  useEffect(() => {
    if (showPharmacySearch) {
      searchPharmacies();
    }
  }, [showPharmacySearch, searchPharmacies]);

  /* ── Handlers ── */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setTimeout(() => setRefreshing(false), 500);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setShowFilters(false);
    showToast('Filters cleared', 'info', { duration: 1500 });
  };

  const hasActiveFilters = Boolean(searchTerm) || statusFilter !== 'ALL';

  /* ── Send Prescription to Pharmacy ── */
  const sendPrescriptionToPharmacy = async (
    prescriptionId: string,
    pharmacyId: string
  ) => {
    try {
      const response = await fetch(
        '/api/patients/prescriptions/send-to-pharmacy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prescriptionId,
            pharmacyId,
            notes:
              'Patient requested this prescription to be filled at this pharmacy',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to send prescription to pharmacy'
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result.message || 'Failed to send prescription to pharmacy'
        );
      }

      return result.data;
    } catch (error: any) {
      console.error('Error sending prescription to pharmacy:', error);
      throw error;
    }
  };

  /* ── Upload Handlers ── */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        showToast(`Selected: ${file.name}`, 'info', { duration: 2000 });
      } else {
        showToast('Please upload a JPEG, PNG, WEBP, or PDF file', 'error', {
          duration: 3000,
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      showToast(`Selected: ${file.name}`, 'info', { duration: 2000 });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast('Please select a file to upload', 'error', { duration: 3000 });
      return;
    }

    if (wantsDelivery && !selectedPharmacy) {
      showToast('Please select a pharmacy', 'error', { duration: 3000 });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('diagnosis', 'Uploaded by patient');
      formData.append('notes', '');
      formData.append('wantsDelivery', String(wantsDelivery));

      if (selectedPharmacy) {
        formData.append('pharmacyId', selectedPharmacy._id);
      }

      if (wantsDelivery) {
        formData.append('addressLine1', address.line1);
        formData.append('addressLine2', address.line2);
        formData.append('addressCity', address.city);
        formData.append('addressPostalCode', address.postalCode);
        formData.append('addressPhone', address.phone);
      }

      const response = await fetch('/api/patients/prescriptions/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload prescription');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload prescription');
      }

      // If pharmacy was selected, send the prescription to the pharmacy
      if (selectedPharmacy && result.data?._id) {
        try {
          await sendPrescriptionToPharmacy(
            result.data._id,
            selectedPharmacy._id
          );
          showToast('Prescription sent to pharmacy successfully!', 'success', {
            duration: 3000,
          });
        } catch (pharmacyError: any) {
          showToast(
            'Prescription uploaded but failed to send to pharmacy',
            'warning',
            {
              duration: 3000,
            }
          );
          console.error('Pharmacy send error:', pharmacyError);
        }
      }

      showToast('Prescription uploaded successfully!', 'success', {
        duration: 3000,
      });

      // Reset form and close modal
      setShowUploadModal(false);
      setSelectedFile(null);
      setWantsDelivery(false);
      setSelectedPharmacy(null);
      setAddress({
        line1: '',
        line2: '',
        city: '',
        postalCode: '',
        phone: '',
      });
      setDragActive(false);

      // Refresh prescriptions
      await fetchPrescriptions();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload prescription', 'error', {
        duration: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const isPharmacyOpen = (hours: Record<string, string>) => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const today = days[new Date().getDay()];
    const todayHours = hours[today];

    if (!todayHours || todayHours === 'Closed') return false;
    return true;
  };

  /* ── Stats ── */
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
              My Prescriptions
            </h1>
            <p className='mt-1 text-sm text-gray-500'>
              View and manage your prescriptions
            </p>
          </div>
          <div className='flex gap-2'>
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

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className='flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md'
            >
              <FiPlus className='h-4 w-4' />
              Upload New
            </motion.button>
          </div>
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
              variants={itemVariants}
              whileHover={statHoverVariants}
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

        {/* ── Search + Filters ── */}
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
                placeholder='Search by prescription number, diagnosis…'
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
        {loading && (page > 1 || debouncedSearch || statusFilter !== 'ALL') && (
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
              No prescriptions found
            </p>
            <p className='mt-1 text-xs text-gray-400'>
              Upload your first prescription to get started
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className='mt-4 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md'
            >
              Upload Prescription
            </motion.button>
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
                const statusConf = getStatusConfig(rx.status);
                const deliveryStatus = rx.delivery?.status
                  ? getDeliveryStatusConfig(rx.delivery.status)
                  : null;
                const pharmacies =
                  rx.pharmacies ||
                  (rx.pharmaciesID && typeof rx.pharmaciesID !== 'string'
                    ? rx.pharmaciesID
                    : null);

                return (
                  <motion.div
                    key={rx._id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
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
                          {rx.uploadedByPatient && (
                            <span className='flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-medium text-purple-600'>
                              <FiUpload className='h-3 w-3' />
                              Uploaded
                            </span>
                          )}
                          {rx.sentTopharmacies && (
                            <span className='flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium text-blue-600'>
                              <FiNavigation className='h-3 w-3' />
                              Sent to Pharmacy
                            </span>
                          )}
                          {rx.wantsDelivery && rx.delivery && (
                            <span
                              className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                                deliveryStatus
                                  ? `${deliveryStatus.bg} ${deliveryStatus.text} border-${deliveryStatus.text}/20`
                                  : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                              }`}
                            >
                              {deliveryStatus ? (
                                <>
                                  <deliveryStatus.icon className='h-3 w-3' />
                                  {deliveryStatus.label}
                                </>
                              ) : (
                                <>
                                  <FiTruck className='h-3 w-3' />
                                  Delivery
                                </>
                              )}
                            </span>
                          )}
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
                          href={`/patient/prescription/${rx._id}`}
                          className='flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
                        >
                          <FiEye className='h-3.5 w-3.5' />
                          View
                        </Link>
                      </div>
                    </div>

                    {/* ── Date row ── */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className='mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 px-4 py-2.5 text-xs text-gray-600'
                    >
                      <span className='flex items-center gap-1.5 text-gray-400'>
                        <FiCalendar className='h-3.5 w-3.5' />
                        Start: {formatDate(rx.startDate)}
                        {rx.endDate ? ` – End: ${formatDate(rx.endDate)}` : ''}
                      </span>
                    </motion.div>

                    {/* ── Medications ── */}
                    {rx.medications && rx.medications.length > 0 && (
                      <div className='mt-4 space-y-2'>
                        <AnimatePresence>
                          {rx.medications.slice(0, 2).map((med, i) => (
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
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {rx.medications.length > 2 && (
                          <p className='text-xs text-gray-400'>
                            + {rx.medications.length - 2} more medications
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── pharmacies Information ── */}
                    {pharmacies && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className='mt-3 rounded-xl bg-blue-50 p-4 border border-blue-100'
                      >
                        <div className='flex flex-wrap items-start justify-between gap-2'>
                          <div className='space-y-1'>
                            <div className='flex items-center gap-2'>
                              <FiPackage className='h-4 w-4 text-blue-600' />
                              <span className='text-sm font-medium text-blue-900'>
                                pharmacies: {pharmacies.name}
                              </span>
                            </div>
                            <p className='text-xs text-blue-700'>
                              {pharmacies.address?.street &&
                                `${pharmacies.address.street}, `}
                              {pharmacies.address?.city &&
                                `${pharmacies.address.city}, `}
                              {pharmacies.address?.state &&
                                `${pharmacies.address.state}`}
                            </p>
                            {pharmacies.contact?.phone && (
                              <p className='text-xs text-blue-600 flex items-center gap-1'>
                                <FiPhone className='h-3 w-3' />
                                {pharmacies.contact.phone}
                              </p>
                            )}
                            {pharmacies.contact?.email && (
                              <p className='text-xs text-blue-600 flex items-center gap-1'>
                                <FiMail className='h-3 w-3' />
                                {pharmacies.contact.email}
                              </p>
                            )}
                            {pharmacies.deliveryAvailable && (
                              <p className='text-xs text-emerald-600 flex items-center gap-1'>
                                <FiTruck className='h-3 w-3' />
                                Delivery Available
                                {pharmacies.deliveryFee !== undefined && (
                                  <span className='ml-1'>
                                    (${pharmacies.deliveryFee.toFixed(2)})
                                  </span>
                                )}
                              </p>
                            )}
                            {rx.pharmaciesStatus && (
                              <p className='text-xs text-blue-600 flex items-center gap-1'>
                                Status: {rx.pharmaciesStatus}
                              </p>
                            )}
                            {rx.pharmaciesSentAt && (
                              <p className='text-xs text-blue-500'>
                                Sent: {formatDateTime(rx.pharmaciesSentAt)}
                              </p>
                            )}
                          </div>
                          {isPharmacyOpen(pharmacies.operatingHours || {}) && (
                            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'>
                              <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                              Open Now
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ── Delivery Details ── */}
                    {rx.wantsDelivery && rx.delivery && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className='mt-3 rounded-xl bg-indigo-50 p-4'
                      >
                        <div className='flex flex-wrap items-start justify-between gap-2'>
                          <div className='space-y-1'>
                            <div className='flex items-center gap-2'>
                              <FiHome className='h-4 w-4 text-indigo-600' />
                              <span className='text-sm font-medium text-indigo-900'>
                                Delivery Details
                              </span>
                            </div>
                            <p className='text-xs text-indigo-700'>
                              {rx.delivery.address.line1}
                              {rx.delivery.address.line2 &&
                                `, ${rx.delivery.address.line2}`}
                              {rx.delivery.address.city &&
                                `, ${rx.delivery.address.city}`}
                              {rx.delivery.address.postalCode &&
                                `, ${rx.delivery.address.postalCode}`}
                            </p>
                            <p className='text-xs text-indigo-600'>
                              📞 {rx.delivery.address.phone}
                            </p>
                            {rx.delivery.trackingNumber && (
                              <p className='text-xs text-indigo-600 flex items-center gap-1'>
                                <FiHash className='h-3 w-3' />
                                Tracking: {rx.delivery.trackingNumber}
                              </p>
                            )}
                            {rx.delivery.deliveryFee > 0 && (
                              <p className='text-xs text-indigo-600 flex items-center gap-1'>
                                <FiDollarSign className='h-3 w-3' />
                                Delivery Fee: $
                                {rx.delivery.deliveryFee.toFixed(2)}
                              </p>
                            )}
                          </div>
                          {rx.delivery.status && (
                            <div
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                deliveryStatus
                                  ? `${deliveryStatus.bg} ${deliveryStatus.text}`
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {deliveryStatus?.label || rx.delivery.status}
                            </div>
                          )}
                        </div>
                        {rx.delivery.dispatchedAt && (
                          <p className='mt-2 text-xs text-indigo-500 border-t border-indigo-200 pt-2'>
                            🚚 Dispatched:{' '}
                            {formatDateTime(rx.delivery.dispatchedAt)}
                          </p>
                        )}
                        {rx.delivery.deliveredAt && (
                          <p className='text-xs text-emerald-600'>
                            ✅ Delivered:{' '}
                            {formatDateTime(rx.delivery.deliveredAt)}
                          </p>
                        )}
                        {rx.delivery.notes && (
                          <p className='mt-1 text-xs text-indigo-500 italic'>
                            📝 {rx.delivery.notes}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {rx.attachmentUrl && (
                      <motion.a
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        href={rx.attachmentUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 transition hover:text-blue-700'
                      >
                        <FiFileText className='h-3.5 w-3.5' />
                        View Attachment
                      </motion.a>
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

      {/* ── Upload Prescription Modal ── */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
            onClick={() => !uploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className='relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => !uploading && setShowUploadModal(false)}
                className='absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'
                disabled={uploading}
              >
                <FiX className='h-5 w-5' />
              </button>

              <div className='mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
                  <FiUpload className='h-6 w-6 text-blue-600' />
                  Upload Prescription
                </h2>
                <p className='mt-1 text-sm text-gray-500'>
                  Upload a prescription image or PDF file. Accepted formats:
                  JPEG, PNG, WEBP, PDF
                </p>
              </div>

              <form onSubmit={handleUpload} className='space-y-6'>
                {/* File Upload Area with Drag & Drop */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Prescription File *
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative rounded-2xl border-2 border-dashed transition-all ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : selectedFile
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                    } p-8 text-center`}
                  >
                    <input
                      type='file'
                      id='file-upload'
                      accept='.jpg,.jpeg,.png,.webp,.pdf'
                      onChange={handleFileSelect}
                      className='absolute inset-0 cursor-pointer opacity-0'
                      disabled={uploading}
                    />

                    {selectedFile ? (
                      <div className='flex flex-col items-center gap-3'>
                        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
                          <FiFileText className='h-8 w-8 text-emerald-600' />
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>
                            {selectedFile.name}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                          <p className='text-xs text-emerald-600 mt-1'>
                            ✓ File ready to upload
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={removeFile}
                          className='text-sm text-red-500 hover:text-red-600 transition'
                          disabled={uploading}
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className='flex flex-col items-center gap-3'>
                        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
                          <FiImage className='h-8 w-8 text-blue-600' />
                        </div>
                        <div>
                          <p className='font-medium text-gray-700'>
                            Drag & drop your file here
                          </p>
                          <p className='text-sm text-gray-500'>
                            or click to browse
                          </p>
                        </div>
                        <p className='text-xs text-gray-400'>
                          Supports: JPEG, PNG, WEBP, PDF (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pharmacy Selection */}
                <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
                  <div className='mb-3'>
                    <label className='flex items-center gap-3 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={wantsDelivery}
                        onChange={e => setWantsDelivery(e.target.checked)}
                        className='h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        disabled={uploading}
                      />
                      <div>
                        <span className='text-sm font-medium text-gray-700'>
                          Send to a pharmacy for fulfillment
                        </span>
                        <p className='text-xs text-gray-400'>
                          Choose a pharmacy to send your prescription to
                        </p>
                      </div>
                    </label>
                  </div>

                  {wantsDelivery && (
                    <div className='mt-3'>
                      {selectedPharmacy ? (
                        <div className='flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200'>
                          <div>
                            <p className='font-medium text-blue-900'>
                              {selectedPharmacy.name}
                            </p>
                            <p className='text-xs text-blue-700'>
                              {selectedPharmacy.address?.street &&
                                `${selectedPharmacy.address.street}, `}
                              {selectedPharmacy.address?.city &&
                                `${selectedPharmacy.address.city}`}
                            </p>
                          </div>
                          <div className='flex gap-2'>
                            <button
                              type='button'
                              onClick={() => {
                                setSelectedPharmacy(null);
                                setShowPharmacySearch(true);
                              }}
                              className='text-sm text-blue-600 hover:text-blue-700'
                            >
                              Change
                            </button>
                            {selectedPharmacy.deliveryAvailable && (
                              <span className='inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full'>
                                <FiTruck className='h-3 w-3' />
                                Delivery
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          type='button'
                          onClick={() => setShowPharmacySearch(true)}
                          className='w-full rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50 transition-all'
                        >
                          <FiSearch className='mx-auto h-6 w-6 text-gray-400 mb-2' />
                          Search for a pharmacy
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Delivery Address */}
                <AnimatePresence>
                  {wantsDelivery && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='overflow-hidden'
                    >
                      <div className='space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4'>
                        <h4 className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                          <FiMapPin className='h-4 w-4 text-indigo-600' />
                          Delivery Address
                        </h4>

                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>
                            Address Line 1 *
                          </label>
                          <input
                            type='text'
                            value={address.line1}
                            onChange={e =>
                              setAddress({ ...address, line1: e.target.value })
                            }
                            placeholder='Street address, building, etc.'
                            className='w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                            disabled={uploading}
                            required={wantsDelivery}
                          />
                        </div>

                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>
                            Address Line 2{' '}
                            <span className='text-gray-400'>(Optional)</span>
                          </label>
                          <input
                            type='text'
                            value={address.line2}
                            onChange={e =>
                              setAddress({ ...address, line2: e.target.value })
                            }
                            placeholder='Apartment, suite, etc.'
                            className='w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                            disabled={uploading}
                          />
                        </div>

                        <div className='grid grid-cols-2 gap-3'>
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                              City *
                            </label>
                            <input
                              type='text'
                              value={address.city}
                              onChange={e =>
                                setAddress({ ...address, city: e.target.value })
                              }
                              placeholder='City'
                              className='w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                              disabled={uploading}
                              required={wantsDelivery}
                            />
                          </div>
                          <div>
                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                              Postal Code{' '}
                              <span className='text-gray-400'>(Optional)</span>
                            </label>
                            <input
                              type='text'
                              value={address.postalCode}
                              onChange={e =>
                                setAddress({
                                  ...address,
                                  postalCode: e.target.value,
                                })
                              }
                              placeholder='Postal code'
                              className='w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                              disabled={uploading}
                            />
                          </div>
                        </div>

                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>
                            Phone Number *
                          </label>
                          <input
                            type='tel'
                            value={address.phone}
                            onChange={e =>
                              setAddress({ ...address, phone: e.target.value })
                            }
                            placeholder='+94 123 456789'
                            className='w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                            disabled={uploading}
                            required={wantsDelivery}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className='flex gap-3 pt-4 border-t border-gray-200'>
                  <motion.button
                    type='button'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !uploading && setShowUploadModal(false)}
                    className='flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50'
                    disabled={uploading}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type='submit'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={uploading || !selectedFile}
                    className='flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {uploading ? (
                      <span className='flex items-center justify-center gap-2'>
                        <FiRefreshCw className='h-4 w-4 animate-spin' />
                        Uploading...
                      </span>
                    ) : (
                      <span className='flex items-center justify-center gap-2'>
                        <FiUpload className='h-4 w-4' />
                        Upload Prescription
                      </span>
                    )}
                  </motion.button>
                </div>

                <p className='text-xs text-gray-400 text-center'>
                  By uploading, you confirm that this prescription is valid and
                  issued by a licensed healthcare provider.
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pharmacy Search Modal ── */}
      <AnimatePresence>
        {showPharmacySearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
            onClick={() => setShowPharmacySearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className='relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPharmacySearch(false)}
                className='absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'
              >
                <FiX className='h-5 w-5' />
              </button>

              <div className='mb-4'>
                <h3 className='text-xl font-bold text-gray-900'>
                  Select a Pharmacy
                </h3>
                <p className='text-sm text-gray-500'>
                  Choose a pharmacy to send your prescription to
                </p>
              </div>

              {/* Pharmacy Search Input */}
              <div className='relative mb-4'>
                <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  value={pharmacySearchTerm}
                  onChange={e => setPharmacySearchTerm(e.target.value)}
                  placeholder='Search pharmacies by name, city, or services...'
                  className='w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                />
                {pharmacySearchTerm && (
                  <button
                    onClick={() => setPharmacySearchTerm('')}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600'
                  >
                    <FiX className='h-4 w-4' />
                  </button>
                )}
              </div>

              {/* Pharmacy Results */}
              {pharmacyLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                </div>
              ) : pharmacyError ? (
                <div className='text-center py-8 text-red-500'>
                  <p>{pharmacyError}</p>
                  <button
                    onClick={() => searchPharmacies(pharmacySearchTerm)}
                    className='mt-2 text-blue-600 hover:text-blue-700'
                  >
                    Retry
                  </button>
                </div>
              ) : pharmacies.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <FiPackage className='mx-auto h-12 w-12 text-gray-300 mb-2' />
                  <p>No pharmacies found</p>
                  <p className='text-sm text-gray-400'>
                    Try adjusting your search
                  </p>
                </div>
              ) : (
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {pharmacies.map(pharmacy => {
                    const isOpen = isPharmacyOpen(pharmacy.operatingHours);

                    return (
                      <motion.div
                        key={pharmacy._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        className='p-4 rounded-xl border-2 border-gray-200 bg-white transition-all cursor-pointer hover:border-blue-300 hover:shadow-md'
                        onClick={() => {
                          setSelectedPharmacy(pharmacy);
                          setShowPharmacySearch(false);
                          showToast(`Selected: ${pharmacy.name}`, 'success', {
                            duration: 2000,
                          });
                        }}
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <h3 className='font-semibold text-gray-900'>
                                {pharmacy.name}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  isOpen
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isOpen ? 'bg-emerald-500' : 'bg-red-500'
                                  }`}
                                />
                                {isOpen ? 'Open' : 'Closed'}
                              </span>
                              {pharmacy.is24Hours && (
                                <span className='inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700'>
                                  <FiClock className='h-3 w-3' />
                                  24/7
                                </span>
                              )}
                            </div>

                            <div className='mt-2 space-y-1 text-sm text-gray-600'>
                              <p className='flex items-center gap-1.5'>
                                <FiMapPin className='h-3.5 w-3.5 text-gray-400' />
                                {pharmacy.address?.street &&
                                  `${pharmacy.address.street}, `}
                                {pharmacy.address?.city &&
                                  `${pharmacy.address.city}, `}
                                {pharmacy.address?.state &&
                                  `${pharmacy.address.state}`}
                                {pharmacy.address?.zipCode &&
                                  ` ${pharmacy.address.zipCode}`}
                              </p>
                              {pharmacy.contact?.phone && (
                                <p className='flex items-center gap-1.5'>
                                  <FiPhone className='h-3.5 w-3.5 text-gray-400' />
                                  {pharmacy.contact.phone}
                                </p>
                              )}
                              {pharmacy.contact?.email && (
                                <p className='flex items-center gap-1.5'>
                                  <FiMail className='h-3.5 w-3.5 text-gray-400' />
                                  {pharmacy.contact.email}
                                </p>
                              )}
                            </div>

                            {/* Services */}
                            {pharmacy.services &&
                              pharmacy.services.length > 0 && (
                                <div className='mt-2 flex flex-wrap gap-1'>
                                  {pharmacy.services
                                    .slice(0, 4)
                                    .map((service, idx) => (
                                      <span
                                        key={idx}
                                        className='rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600'
                                      >
                                        {service}
                                      </span>
                                    ))}
                                  {pharmacy.services.length > 4 && (
                                    <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500'>
                                      +{pharmacy.services.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>

                          {/* Delivery Info */}
                          <div className='ml-4 text-right'>
                            {pharmacy.deliveryAvailable && (
                              <div className='text-sm'>
                                <span className='inline-flex items-center gap-1 text-emerald-600'>
                                  <FiTruck className='h-4 w-4' />
                                  Delivery
                                </span>
                                {pharmacy.deliveryFee !== undefined && (
                                  <p className='text-xs text-gray-500'>
                                    Fee: ${pharmacy.deliveryFee.toFixed(2)}
                                  </p>
                                )}
                                {pharmacy.estimatedDeliveryTime && (
                                  <p className='text-xs text-gray-500'>
                                    Est: {pharmacy.estimatedDeliveryTime}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
