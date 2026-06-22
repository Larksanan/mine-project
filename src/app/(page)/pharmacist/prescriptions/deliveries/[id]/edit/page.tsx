'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import Loading from '@/components/ui/Loading';
import ErrorComponent from '@/components/ui/Error';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiChevronRight,
  FiDollarSign,
  FiSave,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';

interface Delivery {
  _id: string;
  status: string;
  deliveryFee: number;
  trackingNumber?: string;
  patientId?: {
    firstName: string;
    lastName: string;
  };
  address: {
    line1: string;
    city: string;
  };
}

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

const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export default function EditDeliveryFeePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { showToast, ToastContainer } = useToast();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState(false);

  const [fee, setFee] = useState('');
  const [feeError, setFeeError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/patients/prescriptions/pharmacist/deliveries/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.error);
        setDelivery(data.data);
        setFee(String(data.data.deliveryFee ?? '0'));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const validate = (): boolean => {
    setFeeError('');
    const parsed = parseFloat(fee);
    if (fee.trim() === '') {
      setFeeError('Delivery fee is required.');
      return false;
    }
    if (isNaN(parsed) || parsed < 0) {
      setFeeError('Enter a valid amount (0 or more).');
      return false;
    }
    if (parsed > 99999) {
      setFeeError('Fee seems too high. Please double-check.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      const response = await fetch(
        `/api/patients/prescriptions/pharmacist/deliveries/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: delivery?.status || 'PENDING',
            deliveryFee: parseFloat(parseFloat(fee).toFixed(2)),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update delivery fee');
      }

      if (!data.success) throw new Error(data.error);

      setSuccess(true);
      showToast(
        `Delivery fee updated to Rs. ${parseFloat(fee).toFixed(2)}`,
        'success',
        { duration: 3000 }
      );

      setTimeout(() => {
        router.push(`/pharmacist/prescriptions/deliveries/${id}`);
      }, 1500);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update delivery fee';
      setSaveError(errorMessage);
      showToast(errorMessage, 'error', { duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    delivery !== null && parseFloat(fee || '0') !== delivery.deliveryFee;

  if (loading) {
    return <Loading />;
  }

  if (error || !delivery) {
    return <ErrorComponent message={error || 'Delivery not found'} />;
  }

  const patientName = delivery.patientId
    ? `${delivery.patientId.firstName} ${delivery.patientId.lastName}`
    : 'Unknown Patient';

  const newFeeFormatted = parseFloat(parseFloat(fee || '0').toFixed(2)).toFixed(
    2
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
        <div className='max-w-2xl mx-auto'>
          {/* Breadcrumb */}
          <motion.div
            variants={staggerContainer}
            initial='initial'
            animate='animate'
            className='flex items-center gap-2 text-sm text-slate-500 mb-3'
          >
            <motion.div variants={fadeInUp}>
              <Link
                href='/pharmacist/prescriptions/deliveries'
                className='hover:text-slate-900 transition-colors'
              >
                Deliveries
              </Link>
            </motion.div>
            <FiChevronRight className='w-3 h-3' />
            <motion.div variants={fadeInUp}>
              <Link
                href={`/pharmacist/prescriptions/deliveries/${id}`}
                className='hover:text-slate-900 transition-colors'
              >
                {delivery.trackingNumber
                  ? `#${delivery.trackingNumber}`
                  : patientName}
              </Link>
            </motion.div>
            <FiChevronRight className='w-3 h-3' />
            <motion.span
              variants={fadeInUp}
              className='text-slate-900 font-medium'
            >
              Edit Fee
            </motion.span>
          </motion.div>

          <div className='flex items-center gap-3'>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={`/pharmacist/prescriptions/deliveries/${id}`}
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
                Edit Delivery Fee
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className='text-sm text-slate-500'
              >
                {patientName}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial='initial'
        animate='animate'
        className='max-w-2xl mx-auto px-6 py-8'
      >
        <motion.div
          variants={fadeInUp}
          className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm'
        >
          {/* Current summary bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='bg-linear-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5'>
                  Current Fee
                </p>
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: 0.3,
                  }}
                  className='text-lg font-semibold text-slate-900'
                >
                  Rs. {delivery.deliveryFee.toFixed(2)}
                </motion.p>
              </div>
              <div className='text-right'>
                <p className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5'>
                  Status
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className='text-sm font-medium text-slate-700'
                >
                  {delivery.status}
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Form body */}
          <div className='px-6 py-6 space-y-6'>
            {/* Fee input */}
            <motion.div
              variants={fadeInUp}
              initial='initial'
              animate='animate'
              transition={{ delay: 0.1 }}
            >
              <label
                htmlFor='deliveryFee'
                className='block text-sm font-medium text-slate-700 mb-2'
              >
                New Delivery Fee
              </label>

              <div className='relative'>
                <div className='absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none'>
                  <span className='text-sm font-medium text-slate-500'>
                    Rs.
                  </span>
                </div>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id='deliveryFee'
                  type='number'
                  min='0'
                  step='0.01'
                  value={fee}
                  onChange={e => {
                    setFee(e.target.value);
                    setFeeError('');
                  }}
                  placeholder='0.00'
                  className={`w-full pl-12 pr-10 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    feeError
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none'>
                  <FiDollarSign className='w-4 h-4 text-slate-400' />
                </div>
              </div>

              {/* Validation error */}
              <AnimatePresence>
                {feeError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='mt-2 text-xs text-red-600 flex items-center gap-1.5'
                  >
                    <FiAlertCircle className='w-3.5 h-3.5 shrink-0' />
                    {feeError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Diff hint */}
              <AnimatePresence>
                {!feeError && isDirty && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='mt-2 text-xs text-slate-500 flex items-center gap-1.5'
                  >
                    <FiInfo className='w-3.5 h-3.5 shrink-0 text-blue-400' />
                    Changing from&nbsp;
                    <span className='font-medium text-slate-700'>
                      Rs. {delivery.deliveryFee.toFixed(2)}
                    </span>
                    &nbsp;→&nbsp;
                    <motion.span
                      key={newFeeFormatted}
                      initial={{ scale: 0.8, color: '#2563eb' }}
                      animate={{ scale: 1, color: '#1e293b' }}
                      transition={springTransition}
                      className='font-medium'
                    >
                      Rs. {newFeeFormatted}
                    </motion.span>
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Save error */}
            <AnimatePresence>
              {saveError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2'
                >
                  <FiAlertCircle className='w-4 h-4 shrink-0' />
                  {saveError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={springTransition}
                  className='bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 flex items-center gap-2'
                >
                  <FiCheckCircle className='w-4 h-4 shrink-0' />
                  Fee updated to Rs. {newFeeFormatted}. Redirecting…
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <motion.div
              variants={staggerContainer}
              initial='initial'
              animate='animate'
              className='flex items-center gap-3 pt-1'
            >
              <motion.button
                {...scaleOnHover}
                onClick={handleSave}
                disabled={saving || success || !isDirty}
                className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm'
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <FiLoader className='w-4 h-4' />
                  </motion.div>
                ) : success ? (
                  <FiCheckCircle className='w-4 h-4' />
                ) : (
                  <FiSave className='w-4 h-4' />
                )}
                {saving ? 'Saving…' : success ? 'Saved!' : 'Save Changes'}
              </motion.button>

              <motion.div {...scaleOnHover}>
                <Link
                  href={`/pharmacist/prescriptions/deliveries/${id}`}
                  className='px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
                >
                  Cancel
                </Link>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {!isDirty && !success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='text-xs text-slate-400'
                >
                  Change the amount above to enable saving.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
