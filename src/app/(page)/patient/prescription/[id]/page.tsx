// app/patient/prescription/[id]/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';

import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiPackage,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiTruck,
  FiHome,
  FiDownload,
  FiPrinter,
  FiNavigation,
  FiRefreshCw,
  FiImage,
  FiInfo,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUpload,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
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
  pharmacyId: string | { _id: string; name: string };
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

interface Pharmacy {
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
  pharmacyId?: string | Pharmacy;
  pharmacy?: Pharmacy;
  sentToPharmacy?: boolean;
  pharmacySentAt?: string;
  pharmacyStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FULFILLED';
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
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
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

export default function PrescriptionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPharmacySearch, setShowPharmacySearch] = useState(false);
  const [pharmacySearchTerm, setPharmacySearchTerm] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);
  const [pharmacyError, setPharmacyError] = useState<string | null>(null);
  const [sendingToPharmacy, setSendingToPharmacy] = useState(false);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    diagnosis: '',
    notes: '',
    status: '',
    deliveryAddress: {
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      phone: '',
    },
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPrescription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/patients/prescriptions/upload/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch prescription');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch prescription');
      }

      setPrescription(result.data);
      // Initialize edit data
      setEditData({
        diagnosis: result.data.diagnosis || '',
        notes: result.data.notes || '',
        status: result.data.status || 'ACTIVE',
        deliveryAddress: result.data.deliveryAddress || {
          line1: '',
          line2: '',
          city: '',
          postalCode: '',
          phone: '',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load prescription');
      showToast(err.message || 'Failed to load prescription', 'error', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchPrescription();
  }, [fetchPrescription]);

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

  useEffect(() => {
    if (showPharmacySearch) {
      const timer = setTimeout(() => {
        searchPharmacies(pharmacySearchTerm);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pharmacySearchTerm, showPharmacySearch, searchPharmacies]);

  useEffect(() => {
    if (showPharmacySearch) {
      searchPharmacies();
    }
  }, [showPharmacySearch, searchPharmacies]);

  /* ── Send Prescription to Pharmacy ── */
  const sendPrescriptionToPharmacy = async (pharmacyId: string) => {
    if (!prescription) return;

    try {
      setSendingToPharmacy(true);

      const response = await fetch('/api/prescriptions/send-to-pharmacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionId: prescription._id,
          pharmacyId,
          notes:
            'Patient requested this prescription to be filled at this pharmacy',
        }),
      });

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

      showToast('Prescription sent to pharmacy successfully!', 'success', {
        duration: 3000,
      });

      await fetchPrescription();
      setShowPharmacySearch(false);
    } catch (error: any) {
      showToast(
        error.message || 'Failed to send prescription to pharmacy',
        'error',
        {
          duration: 3000,
        }
      );
    } finally {
      setSendingToPharmacy(false);
    }
  };

  /* ── Update Prescription ── */
  const handleUpdatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prescription) return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/patients/prescriptions/${prescription._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            diagnosis: editData.diagnosis,
            notes: editData.notes,
            status: editData.status,
            deliveryAddress: editData.deliveryAddress,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prescription');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update prescription');
      }

      showToast('Prescription updated successfully!', 'success', {
        duration: 3000,
      });

      setIsEditing(false);
      await fetchPrescription();
    } catch (err: any) {
      showToast(err.message || 'Failed to update prescription', 'error', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ── Delete Prescription ── */
  const handleDeletePrescription = async () => {
    if (!prescription) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/patients/prescriptions/${prescription._id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel prescription');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel prescription');
      }

      showToast('Prescription cancelled successfully!', 'success', {
        duration: 3000,
      });

      router.push('/patient/prescription');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel prescription', 'error', {
        duration: 3000,
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescription();
    setTimeout(() => setRefreshing(false), 500);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !prescription) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <div className='max-w-md text-center'>
          <ErrorComponent message={error || 'Prescription not found'} />
          <button
            onClick={fetchPrescription}
            className='mt-4 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md hover:bg-gray-50'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusConf = getStatusConfig(prescription.status);
  const pharmacy =
    prescription.pharmacy ||
    (prescription.pharmacyId && typeof prescription.pharmacyId !== 'string'
      ? prescription.pharmacyId
      : null);
  const deliveryStatus = prescription.delivery?.status
    ? getDeliveryStatusConfig(prescription.delivery.status)
    : null;

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 px-4 py-8 sm:px-6 lg:px-8'>
      <ToastContainer />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='mx-auto max-w-6xl'
      >
        {/* ── Top Navigation ── */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className='mb-6 flex flex-wrap items-center justify-between gap-4'
        >
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md hover:bg-gray-50'
          >
            <FiArrowLeft className='h-4 w-4' />
            Back
          </button>

          <div className='flex flex-wrap items-center gap-2'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md hover:bg-gray-50 disabled:opacity-60'
            >
              <FiRefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md hover:bg-gray-50'
            >
              <FiPrinter className='h-4 w-4' />
              Print
            </motion.button>

            {prescription.status === 'ACTIVE' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium shadow-sm transition-all ${
                  isEditing
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'border border-gray-200 bg-white text-gray-700 hover:shadow-md hover:bg-gray-50'
                }`}
              >
                {isEditing ? (
                  <>
                    <FiX className='h-4 w-4' />
                    Cancel Edit
                  </>
                ) : (
                  <>
                    <FiEdit2 className='h-4 w-4' />
                    Edit
                  </>
                )}
              </motion.button>
            )}

            {prescription.status === 'ACTIVE' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteConfirm(true)}
                className='flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md'
              >
                <FiTrash2 className='h-4 w-4' />
                Cancel
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── Header ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className='mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
        >
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex-1'>
              <div className='flex flex-wrap items-center gap-3'>
                <h1 className='text-2xl font-bold text-gray-900'>
                  {prescription.prescriptionNumber}
                </h1>
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
                {prescription.uploadedByPatient && (
                  <span className='flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-medium text-purple-600'>
                    <FiUpload className='h-3 w-3' />
                    Uploaded
                  </span>
                )}
                {prescription.sentToPharmacy && (
                  <span className='flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium text-blue-600'>
                    <FiNavigation className='h-3 w-3' />
                    Sent to Pharmacy
                  </span>
                )}
              </div>
              <p className='mt-1 text-sm text-gray-600'>
                {prescription.diagnosis}
              </p>
              <div className='mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500'>
                <span className='flex items-center gap-1'>
                  <FiCalendar className='h-3.5 w-3.5' />
                  Started: {formatDate(prescription.startDate)}
                </span>
                {prescription.endDate && (
                  <span className='flex items-center gap-1'>
                    <FiCalendar className='h-3.5 w-3.5' />
                    Ends: {formatDate(prescription.endDate)}
                  </span>
                )}
                <span className='flex items-center gap-1'>
                  <FiClock className='h-3.5 w-3.5' />
                  {formatTimeAgo(prescription.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Edit Mode ── */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='overflow-hidden mb-6'
            >
              <form
                onSubmit={handleUpdatePrescription}
                className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
              >
                <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FiEdit2 className='h-5 w-5 text-blue-600' />
                  Edit Prescription
                </h2>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Diagnosis
                    </label>
                    <input
                      type='text'
                      value={editData.diagnosis}
                      onChange={e =>
                        setEditData({ ...editData, diagnosis: e.target.value })
                      }
                      className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Notes
                    </label>
                    <textarea
                      value={editData.notes}
                      onChange={e =>
                        setEditData({ ...editData, notes: e.target.value })
                      }
                      rows={3}
                      className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Status
                    </label>
                    <select
                      value={editData.status}
                      onChange={e =>
                        setEditData({ ...editData, status: e.target.value })
                      }
                      className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                    >
                      <option value='ACTIVE'>Active</option>
                      <option value='COMPLETED'>Completed</option>
                      <option value='EXPIRED'>Expired</option>
                    </select>
                  </div>

                  <div>
                    <h3 className='text-sm font-medium text-gray-700 mb-2'>
                      Delivery Address
                    </h3>
                    <div className='space-y-3'>
                      <input
                        type='text'
                        value={editData.deliveryAddress.line1}
                        onChange={e =>
                          setEditData({
                            ...editData,
                            deliveryAddress: {
                              ...editData.deliveryAddress,
                              line1: e.target.value,
                            },
                          })
                        }
                        placeholder='Address Line 1'
                        className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                      />
                      <input
                        type='text'
                        value={editData.deliveryAddress.line2}
                        onChange={e =>
                          setEditData({
                            ...editData,
                            deliveryAddress: {
                              ...editData.deliveryAddress,
                              line2: e.target.value,
                            },
                          })
                        }
                        placeholder='Address Line 2 (Optional)'
                        className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                      />
                      <div className='grid grid-cols-2 gap-3'>
                        <input
                          type='text'
                          value={editData.deliveryAddress.city}
                          onChange={e =>
                            setEditData({
                              ...editData,
                              deliveryAddress: {
                                ...editData.deliveryAddress,
                                city: e.target.value,
                              },
                            })
                          }
                          placeholder='City'
                          className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                        />
                        <input
                          type='text'
                          value={editData.deliveryAddress.postalCode}
                          onChange={e =>
                            setEditData({
                              ...editData,
                              deliveryAddress: {
                                ...editData.deliveryAddress,
                                postalCode: e.target.value,
                              },
                            })
                          }
                          placeholder='Postal Code'
                          className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                        />
                      </div>
                      <input
                        type='tel'
                        value={editData.deliveryAddress.phone}
                        onChange={e =>
                          setEditData({
                            ...editData,
                            deliveryAddress: {
                              ...editData.deliveryAddress,
                              phone: e.target.value,
                            },
                          })
                        }
                        placeholder='Phone Number'
                        className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                      />
                    </div>
                  </div>

                  <div className='flex gap-3 pt-4 border-t border-gray-200'>
                    <button
                      type='button'
                      onClick={() => setIsEditing(false)}
                      className='flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={loading}
                      className='flex-1 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50'
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Content ── */}
        <div className='grid gap-6 md:grid-cols-3'>
          {/* ── Left Column (2/3) ── */}
          <div className='md:col-span-2 space-y-6'>
            {/* Medications */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
            >
              <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4'>
                <FiPackage className='h-5 w-5 text-blue-600' />
                Medications ({prescription.medications.length})
              </h2>
              <div className='space-y-3'>
                {prescription.medications.map((med, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className='rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200'
                  >
                    <div className='flex flex-wrap items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-gray-900'>
                          {med.name}
                        </h3>
                        <div className='mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600'>
                          <span className='rounded-lg bg-white px-2 py-1 border border-gray-200'>
                            {med.dosage}
                          </span>
                          <span className='text-gray-400'>·</span>
                          <span>{med.frequency}</span>
                          <span className='text-gray-400'>·</span>
                          <span>{med.duration}</span>
                        </div>
                        {med.instructions && (
                          <p className='mt-2 text-sm text-gray-500 italic'>
                            💊 {med.instructions}
                          </p>
                        )}
                      </div>
                      <div className='flex items-center gap-2 text-xs'>
                        <span className='rounded-lg border border-gray-200 bg-white px-3 py-1 font-medium text-gray-700 shadow-sm'>
                          Qty <strong>{med.quantity}</strong>
                        </span>
                        <span className='rounded-lg border border-gray-200 bg-white px-3 py-1 font-medium text-gray-700 shadow-sm'>
                          Refills <strong>{med.refills}</strong>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Notes */}
            {prescription.notes && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
              >
                <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3'>
                  <FiFileText className='h-5 w-5 text-blue-600' />
                  Notes
                </h2>
                <p className='text-sm text-gray-600 whitespace-pre-wrap'>
                  {prescription.notes}
                </p>
              </motion.div>
            )}

            {/* Attachment */}
            {prescription.attachmentUrl && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
              >
                <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3'>
                  <FiImage className='h-5 w-5 text-blue-600' />
                  Attachment
                </h2>
                <a
                  href={prescription.attachmentUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-100 hover:text-blue-700'
                >
                  <FiDownload className='h-4 w-4' />
                  View Prescription Document
                </a>
              </motion.div>
            )}
          </div>

          {/* ── Right Column (1/3) ── */}
          <div className='space-y-6'>
            {/* Pharmacy Information */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
            >
              <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4'>
                <FiNavigation className='h-5 w-5 text-blue-600' />
                Pharmacy
              </h2>

              {pharmacy ? (
                <div className='space-y-3'>
                  <div>
                    <h3 className='font-semibold text-gray-900'>
                      {pharmacy.name}
                    </h3>
                    <div className='mt-1 space-y-1 text-sm text-gray-600'>
                      {pharmacy.address?.street && (
                        <p className='flex items-start gap-2'>
                          <FiMapPin className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                          <span>
                            {pharmacy.address.street}
                            {pharmacy.address.city &&
                              `, ${pharmacy.address.city}`}
                            {pharmacy.address.state &&
                              `, ${pharmacy.address.state}`}
                            {pharmacy.address.zipCode &&
                              ` ${pharmacy.address.zipCode}`}
                          </span>
                        </p>
                      )}
                      {pharmacy.contact?.phone && (
                        <p className='flex items-center gap-2'>
                          <FiPhone className='h-4 w-4 text-gray-400' />
                          {pharmacy.contact.phone}
                        </p>
                      )}
                      {pharmacy.contact?.email && (
                        <p className='flex items-center gap-2'>
                          <FiMail className='h-4 w-4 text-gray-400' />
                          {pharmacy.contact.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {pharmacy.deliveryAvailable && (
                    <div className='rounded-xl bg-emerald-50 p-3 border border-emerald-200'>
                      <div className='flex items-center gap-2 text-emerald-700'>
                        <FiTruck className='h-4 w-4' />
                        <span className='text-sm font-medium'>
                          Delivery Available
                        </span>
                      </div>
                      {pharmacy.deliveryFee !== undefined && (
                        <p className='mt-1 text-xs text-emerald-600'>
                          Fee: ${pharmacy.deliveryFee.toFixed(2)}
                        </p>
                      )}
                      {pharmacy.estimatedDeliveryTime && (
                        <p className='text-xs text-emerald-600'>
                          Est: {pharmacy.estimatedDeliveryTime}
                        </p>
                      )}
                    </div>
                  )}

                  <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
                    <span className='text-xs text-gray-500'>
                      Status: {prescription.pharmacyStatus || 'Pending'}
                    </span>
                    {isPharmacyOpen(pharmacy.operatingHours || {}) && (
                      <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'>
                        <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                        Open Now
                      </span>
                    )}
                  </div>

                  {prescription.pharmacySentAt && (
                    <p className='text-xs text-gray-500'>
                      Sent: {formatDateTime(prescription.pharmacySentAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div className='text-center py-4'>
                  <FiNavigation className='mx-auto h-12 w-12 text-gray-300 mb-2' />
                  <p className='text-sm text-gray-500'>No pharmacy assigned</p>
                  {prescription.status === 'ACTIVE' &&
                    !prescription.sentToPharmacy && (
                      <button
                        onClick={() => setShowPharmacySearch(true)}
                        className='mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700'
                      >
                        <FiNavigation className='h-4 w-4' />
                        Send to Pharmacy
                      </button>
                    )}
                  {prescription.status === 'ACTIVE' &&
                    prescription.sentToPharmacy && (
                      <button
                        onClick={() => setShowPharmacySearch(true)}
                        className='mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600'
                      >
                        <FiNavigation className='h-4 w-4' />
                        Change Pharmacy
                      </button>
                    )}
                </div>
              )}
            </motion.div>

            {/* Delivery Information */}
            {prescription.wantsDelivery && prescription.delivery && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
              >
                <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4'>
                  <FiTruck className='h-5 w-5 text-indigo-600' />
                  Delivery Details
                </h2>

                <div className='space-y-3'>
                  <div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Status
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          deliveryStatus
                            ? `${deliveryStatus.bg} ${deliveryStatus.text}`
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {deliveryStatus?.label || prescription.delivery.status}
                      </span>
                    </div>
                  </div>

                  <div className='rounded-xl bg-indigo-50 p-3 border border-indigo-200'>
                    <div className='flex items-center gap-2 text-indigo-900 mb-2'>
                      <FiHome className='h-4 w-4' />
                      <span className='text-sm font-medium'>Address</span>
                    </div>
                    <p className='text-sm text-indigo-700'>
                      {prescription.delivery.address.line1}
                      {prescription.delivery.address.line2 &&
                        `, ${prescription.delivery.address.line2}`}
                      {prescription.delivery.address.city &&
                        `, ${prescription.delivery.address.city}`}
                      {prescription.delivery.address.postalCode &&
                        `, ${prescription.delivery.address.postalCode}`}
                    </p>
                    <p className='text-sm text-indigo-600 mt-1'>
                      📞 {prescription.delivery.address.phone}
                    </p>
                  </div>

                  {prescription.delivery.trackingNumber && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-600'>Tracking Number</span>
                      <span className='font-mono text-blue-600'>
                        {prescription.delivery.trackingNumber}
                      </span>
                    </div>
                  )}

                  {prescription.delivery.deliveryFee > 0 && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-600'>Delivery Fee</span>
                      <span className='font-semibold text-gray-900'>
                        ${prescription.delivery.deliveryFee.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {prescription.delivery.dispatchedAt && (
                    <div className='text-sm text-gray-600 border-t border-indigo-100 pt-2'>
                      <span className='flex items-center gap-2'>
                        <FiClock className='h-4 w-4 text-indigo-500' />
                        Dispatched:{' '}
                        {formatDateTime(prescription.delivery.dispatchedAt)}
                      </span>
                    </div>
                  )}

                  {prescription.delivery.deliveredAt && (
                    <div className='text-sm text-emerald-600'>
                      <span className='flex items-center gap-2'>
                        <FiCheckCircle className='h-4 w-4' />
                        Delivered:{' '}
                        {formatDateTime(prescription.delivery.deliveredAt)}
                      </span>
                    </div>
                  )}

                  {prescription.delivery.notes && (
                    <div className='rounded-xl bg-gray-50 p-3 border border-gray-200'>
                      <p className='text-sm text-gray-600 italic'>
                        📝 {prescription.delivery.notes}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Status Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
            >
              <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4'>
                <FiInfo className='h-5 w-5 text-blue-600' />
                Status Information
              </h2>

              <div className='space-y-2 text-sm'>
                <div className='flex items-center justify-between py-2 border-b border-gray-100'>
                  <span className='text-gray-600'>Prescription Status</span>
                  <span className={`font-medium ${statusConf.text}`}>
                    {statusConf.label}
                  </span>
                </div>
                <div className='flex items-center justify-between py-2 border-b border-gray-100'>
                  <span className='text-gray-600'>Uploaded</span>
                  <span className='text-gray-900'>
                    {formatDateTime(prescription.createdAt)}
                  </span>
                </div>
                <div className='flex items-center justify-between py-2 border-b border-gray-100'>
                  <span className='text-gray-600'>Last Updated</span>
                  <span className='text-gray-900'>
                    {formatDateTime(prescription.updatedAt)}
                  </span>
                </div>
                {prescription.uploadedByPatient && (
                  <div className='flex items-center justify-between py-2'>
                    <span className='text-gray-600'>Upload Method</span>
                    <span className='text-gray-900'>Patient Upload</span>
                  </div>
                )}
                {prescription.wantsDelivery && (
                  <div className='flex items-center justify-between py-2'>
                    <span className='text-gray-600'>Delivery</span>
                    <span className='text-green-600'>Requested</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Pharmacy Search Modal ── */}
      <AnimatePresence>
        {showPharmacySearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
            onClick={() => !sendingToPharmacy && setShowPharmacySearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className='relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() =>
                  !sendingToPharmacy && setShowPharmacySearch(false)
                }
                className='absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'
                disabled={sendingToPharmacy}
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

              <div className='relative mb-4'>
                <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  value={pharmacySearchTerm}
                  onChange={e => setPharmacySearchTerm(e.target.value)}
                  placeholder='Search pharmacies by name, city, or services...'
                  className='w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                  disabled={sendingToPharmacy}
                />
                {pharmacySearchTerm && (
                  <button
                    onClick={() => setPharmacySearchTerm('')}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600'
                    disabled={sendingToPharmacy}
                  >
                    <FiX className='h-4 w-4' />
                  </button>
                )}
              </div>

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
                    disabled={sendingToPharmacy}
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
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          sendingToPharmacy
                            ? 'opacity-50 cursor-not-allowed border-gray-200'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => {
                          if (!sendingToPharmacy) {
                            sendPrescriptionToPharmacy(pharmacy._id);
                          }
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
                            </div>

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

                          {pharmacy.deliveryAvailable && (
                            <div className='ml-4 text-right'>
                              <span className='inline-flex items-center gap-1 text-emerald-600 text-sm'>
                                <FiTruck className='h-4 w-4' />
                                Delivery
                              </span>
                              {pharmacy.deliveryFee !== undefined && (
                                <p className='text-xs text-gray-500'>
                                  Fee: ${pharmacy.deliveryFee.toFixed(2)}
                                </p>
                              )}
                            </div>
                          )}
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

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className='relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
              onClick={e => e.stopPropagation()}
            >
              <div className='text-center'>
                <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4'>
                  <FiAlertCircle className='h-8 w-8 text-red-600' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>
                  Cancel Prescription?
                </h3>
                <p className='text-sm text-gray-500 mb-6'>
                  Are you sure you want to cancel this prescription? This action
                  cannot be undone.
                </p>
                <div className='flex gap-3'>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className='flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50'
                  >
                    Keep
                  </button>
                  <button
                    onClick={handleDeletePrescription}
                    disabled={deleting}
                    className='flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50'
                  >
                    {deleting ? 'Cancelling...' : 'Cancel Prescription'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
