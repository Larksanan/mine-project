/* eslint-disable no-undef */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from '@/components/ui/Loading';
import ErrorComponent from '@/components/ui/Error';
import { useToast } from '../../../../../../components/ui/Toast';
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiHash,
  FiCalendar,
  FiDollarSign,
  FiAlertCircle,
  FiChevronRight,
  FiLoader,
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
  updatedAt: string;
  prescriptionId?: {
    _id: string;
    prescriptionNumber: string;
    diagnosis: string;
    status: string;
    attachmentUrl?: string;
  };
  patientId?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  pharmaciesID?: {
    _id: string;
    name: string;
    address: string;
    phone: string;
  };
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    Icon: FiClock,
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-400',
    description: 'Awaiting pharmacy processing',
  },
  PROCESSING: {
    label: 'Processing',
    Icon: FiPackage,
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-400',
    description: 'Pharmacy is preparing the order',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    Icon: FiTruck,
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
    dot: 'bg-purple-400',
    description: 'Order is on its way',
  },
  DELIVERED: {
    label: 'Delivered',
    Icon: FiCheckCircle,
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-400',
    description: 'Successfully delivered',
  },
  CANCELLED: {
    label: 'Cancelled',
    Icon: FiXCircle,
    className: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-400',
    description: 'This delivery has been cancelled',
  },
};

const STATUS_FLOW = [
  'PENDING',
  'PROCESSING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3 },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const { Icon } = config;
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <Icon className='w-4 h-4' />
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

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <motion.div variants={slideIn} className='flex items-start gap-3'>
      <div className='w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5'>
        <Icon className='w-4 h-4 text-slate-500' />
      </div>
      <div>
        <p className='text-xs text-slate-400 font-medium uppercase tracking-wide'>
          {label}
        </p>
        <p className='text-sm text-slate-900 mt-0.5'>{value}</p>
      </div>
    </motion.div>
  );
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastContainer } = useToast();
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/patients/prescriptions/pharmacist/deliveries/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.error);
        setDelivery(data.data);
        setNotes(data.data.notes || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    if (!selectedStatus) return;
    setUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');
    try {
      const res = await fetch(
        `/api/patients/prescriptions/pharmacist/deliveries/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: selectedStatus,
            notes: notes || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDelivery(data.data);
      setSelectedStatus('');
      const successMessage = data.message || 'Delivery updated successfully';
      setUpdateSuccess(successMessage);

      showToast(successMessage, 'success', { duration: 3000 });

      setTimeout(() => setUpdateSuccess(''), 4000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update delivery';
      setUpdateError(errorMessage);
      showToast(errorMessage, 'error', { duration: 4000 });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this delivery?')) return;
    setUpdating(true);
    setUpdateError('');
    try {
      const res = await fetch(
        `/api/patients/prescriptions/pharmacist/deliveries/${id}`,
        {
          method: 'DELETE',
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Delivery cancelled successfully', 'success', {
        duration: 3000,
      });
      router.push('/pharmacist/prescriptions/deliveries');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to cancel delivery';
      setUpdateError(errorMessage);
      showToast(errorMessage, 'error', { duration: 4000 });
      setUpdating(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !delivery) {
    return <ErrorComponent message={error || 'Delivery not found'} />;
  }

  const allowedNext = ALLOWED_TRANSITIONS[delivery.status] || [];
  const activeStepIndex = STATUS_FLOW.indexOf(
    delivery.status as (typeof STATUS_FLOW)[number]
  );

  return (
    <div className='min-h-screen bg-slate-50'>
      <ToastContainer />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='bg-white border-b border-slate-200 px-6 py-4'
      >
        <div className='max-w-5xl mx-auto'>
          <div className='flex items-center gap-2 text-sm text-slate-500 mb-3'>
            <Link
              href='/pharmacist/prescriptions/deliveries'
              className='hover:text-slate-900 transition-colors'
            >
              Deliveries
            </Link>
            <FiChevronRight className='w-3 h-3' />
            <span className='text-slate-900 font-medium'>
              {delivery.trackingNumber
                ? `#${delivery.trackingNumber}`
                : 'Delivery Details'}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href='/pharmacist/prescriptions/deliveries'
                  className='p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'
                >
                  <FiArrowLeft className='w-4 h-4' />
                </Link>
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className='text-xl font-semibold text-slate-900'
                >
                  {delivery.patientId
                    ? `${delivery.patientId.firstName} ${delivery.patientId.lastName}`
                    : 'Delivery Details'}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className='text-sm text-slate-500'
                >
                  Created {formatDate(delivery.createdAt)}
                </motion.p>
              </div>
            </div>
            <StatusBadge status={delivery.status} />
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial='initial'
        animate='animate'
        className='max-w-5xl mx-auto px-6 py-6 space-y-5'
      >
        {/* Progress tracker */}
        {delivery.status !== 'CANCELLED' && (
          <motion.div
            variants={fadeInUp}
            className='bg-white rounded-xl border border-slate-200 p-5'
          >
            <h2 className='text-sm font-semibold text-slate-700 mb-4'>
              Delivery Progress
            </h2>
            <div className='flex items-center'>
              {STATUS_FLOW.map((step, i) => {
                const config = STATUS_CONFIG[step];
                const { Icon } = config;
                const isCompleted = activeStepIndex > i;
                const isActive = activeStepIndex === i;
                return (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className='flex items-center flex-1 last:flex-none'
                  >
                    <div className='flex flex-col items-center gap-1.5'>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon className='w-4 h-4' />
                      </motion.div>
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          isActive
                            ? 'text-blue-600'
                            : isCompleted
                              ? 'text-emerald-600'
                              : 'text-slate-400'
                        }`}
                      >
                        {config.label}
                      </span>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className={`flex-1 h-0.5 mx-2 mb-5 ${
                          isCompleted ? 'bg-emerald-300' : 'bg-slate-100'
                        }`}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          {/* Left: Details */}
          <motion.div variants={fadeInUp} className='lg:col-span-2 space-y-5'>
            <motion.div
              variants={fadeInUp}
              className='bg-white rounded-xl border border-slate-200 p-5'
            >
              <h2 className='text-sm font-semibold text-slate-700 mb-4'>
                Delivery Information
              </h2>
              <motion.div variants={staggerContainer} className='space-y-4'>
                <InfoRow
                  icon={FiMapPin}
                  label='Delivery Address'
                  value={[
                    delivery.address.line1,
                    delivery.address.line2,
                    delivery.address.city,
                    delivery.address.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                />
                <InfoRow
                  icon={FiPhone}
                  label='Contact Phone'
                  value={delivery.address.phone}
                />
                <InfoRow
                  icon={FiHash}
                  label='Tracking Number'
                  value={delivery.trackingNumber || 'Not assigned yet'}
                />
                <InfoRow
                  icon={FiDollarSign}
                  label='Delivery Fee'
                  value={`Rs. ${delivery.deliveryFee.toFixed(2)}`}
                />
                {delivery.dispatchedAt && (
                  <InfoRow
                    icon={FiCalendar}
                    label='Dispatched At'
                    value={formatDate(delivery.dispatchedAt)}
                  />
                )}
                {delivery.deliveredAt && (
                  <InfoRow
                    icon={FiCheckCircle}
                    label='Delivered At'
                    value={formatDate(delivery.deliveredAt)}
                  />
                )}
                {delivery.notes && (
                  <InfoRow
                    icon={FiFileText}
                    label='Notes'
                    value={delivery.notes}
                  />
                )}
              </motion.div>
            </motion.div>

            {delivery.prescriptionId && (
              <motion.div
                variants={fadeInUp}
                className='bg-white rounded-xl border border-slate-200 p-5'
              >
                <h2 className='text-sm font-semibold text-slate-700 mb-4'>
                  Prescription
                </h2>
                <motion.div variants={staggerContainer} className='space-y-4'>
                  <InfoRow
                    icon={FiHash}
                    label='Prescription Number'
                    value={delivery.prescriptionId.prescriptionNumber}
                  />
                  <InfoRow
                    icon={FiFileText}
                    label='Diagnosis'
                    value={delivery.prescriptionId.diagnosis}
                  />
                  <InfoRow
                    icon={FiClock}
                    label='Status'
                    value={delivery.prescriptionId.status}
                  />
                </motion.div>
              </motion.div>
            )}

            {delivery.patientId && (
              <motion.div
                variants={fadeInUp}
                className='bg-white rounded-xl border border-slate-200 p-5'
              >
                <h2 className='text-sm font-semibold text-slate-700 mb-4'>
                  Patient
                </h2>
                <motion.div variants={staggerContainer} className='space-y-4'>
                  <InfoRow
                    icon={FiPackage}
                    label='Full Name'
                    value={`${delivery.patientId.firstName} ${delivery.patientId.lastName}`}
                  />
                  <InfoRow
                    icon={FiPhone}
                    label='Phone'
                    value={delivery.patientId.phone}
                  />
                  <InfoRow
                    icon={FiFileText}
                    label='Email'
                    value={delivery.patientId.email}
                  />
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Right: Actions */}
          <motion.div variants={fadeInUp} className='space-y-5'>
            {allowedNext.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className='bg-white rounded-xl border border-slate-200 p-5'
              >
                <h2 className='text-sm font-semibold text-slate-700 mb-4'>
                  Update Status
                </h2>
                <div className='space-y-3'>
                  <div className='space-y-2'>
                    {allowedNext
                      .filter(s => s !== 'CANCELLED')
                      .map((status, index) => (
                        <motion.button
                          key={status}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setSelectedStatus(
                              status === selectedStatus ? '' : status
                            )
                          }
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                            selectedStatus === status
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedStatus === status
                                ? 'bg-blue-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          Mark as{' '}
                          {
                            STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
                              ?.label
                          }
                        </motion.button>
                      ))}
                  </div>

                  <div>
                    <label className='block text-xs text-slate-500 font-medium mb-1.5'>
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder='Add a note about this update...'
                      className='w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdate}
                    disabled={!selectedStatus || updating}
                    className='w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    {updating && <FiLoader className='w-4 h-4 animate-spin' />}
                    {updating ? 'Updating...' : 'Save Update'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Timeline */}
            <motion.div
              variants={fadeInUp}
              className='bg-white rounded-xl border border-slate-200 p-5'
            >
              <h2 className='text-sm font-semibold text-slate-700 mb-3'>
                Timeline
              </h2>
              <motion.div variants={staggerContainer} className='space-y-2.5'>
                {[
                  { label: 'Created', value: delivery.createdAt },
                  { label: 'Last updated', value: delivery.updatedAt },
                  ...(delivery.dispatchedAt
                    ? [{ label: 'Dispatched', value: delivery.dispatchedAt }]
                    : []),
                  ...(delivery.deliveredAt
                    ? [{ label: 'Delivered', value: delivery.deliveredAt }]
                    : []),
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    variants={slideIn}
                    transition={{ delay: index * 0.05 }}
                    className='flex justify-between text-xs'
                  >
                    <span className='text-slate-500'>{item.label}</span>
                    <span className='text-slate-900 font-medium'>
                      {formatDate(item.value)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Cancel */}
            {delivery.status !== 'CANCELLED' &&
              delivery.status !== 'DELIVERED' && (
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  disabled={updating}
                  className='w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors'
                >
                  <FiXCircle className='w-4 h-4' />
                  Cancel Delivery
                </motion.button>
              )}

            <AnimatePresence>
              {updateError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2'
                >
                  <FiAlertCircle className='w-4 h-4 shrink-0' />
                  {updateError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {updateSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className='fixed bottom-6 right-6 bg-emerald-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2'
            >
              <FiCheckCircle className='w-4 h-4' />
              {updateSuccess}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
