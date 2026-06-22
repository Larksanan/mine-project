// Prescription detail page with Toast and enhanced animations
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiPackage,
  FiActivity,
  FiClipboard,
  FiHash,
  FiFileText,
  FiEdit2,
  FiPrinter,
  FiShare2,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

interface Medication {
  _id?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  refills: number;
}

interface Doctor {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  specialty?: string;
  phone?: string;
}

interface Patient {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nic?: string;
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
  isActive?: boolean;
  doctorId?: Doctor;
  doctor?: Doctor;
  patientId?: Patient;
  patient?: Patient;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
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

const getStatus = (status: string) =>
  STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE;

const getDoctorName = (d?: Doctor) => {
  if (!d) return 'Unknown Doctor';
  if (d.name && !d.name.includes('undefined')) return d.name;
  if (d.firstName && d.lastName) return `Dr. ${d.firstName} ${d.lastName}`;
  if (d.firstName) return `Dr. ${d.firstName}`;
  if (d.email) return d.email.split('@')[0];
  return 'Unknown Doctor';
};

const getPatientName = (p?: Patient) => {
  if (!p) return 'Unknown Patient';
  if (p.firstName && p.lastName) return `${p.firstName} ${p.lastName}`;
  if (p.firstName) return p.firstName;
  return 'Unknown Patient';
};

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

const fmtShort = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

/* ── Animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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
    scale: 1.01,
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  },
};

/* ── Components ── */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <motion.div
      className='flex items-start gap-3'
      whileHover={{ x: 4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors duration-200 group-hover:bg-gray-200'>
        <Icon className='h-3.5 w-3.5' />
      </span>
      <div className='min-w-0'>
        <p className='text-xs font-medium text-gray-400 uppercase tracking-wide'>
          {label}
        </p>
        <p className='mt-0.5 text-sm text-gray-800 wrap-break-word'>{value}</p>
      </div>
    </motion.div>
  );
}

function Card({
  title,
  children,
  className = '',
  delay = 0,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial='hidden'
      animate='visible'
      custom={delay}
      whileHover='hover'
      className='relative overflow-hidden'
    >
      <motion.div
        variants={cardHoverVariants}
        className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-300 ${className}`}
      >
        <div className='absolute inset-0 bg-linear-to-br from-transparent via-transparent to-gray-50/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
        {title && (
          <h2 className='mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400'>
            <span className='h-px flex-1 bg-gray-200' />
            {title}
            <span className='h-px flex-1 bg-gray-200' />
          </h2>
        )}
        <div className='relative z-10'>{children}</div>
      </motion.div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = getStatus(status);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${config.bg} ${config.border} ${config.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot} animate-pulse`} />
      <Icon className='h-4 w-4' />
      {config.label}
    </motion.div>
  );
}

/* ── Main Page ── */
export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { showToast, ToastContainer } = useToast();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetch_ = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/doctor/prescriptions/pharmacist/${id}`);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to load prescription');
      }
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || 'Failed to load prescription');
      setPrescription(json.data);

      // Show success toast on refresh
      if (refreshing) {
        showToast('Prescription updated successfully', 'success', {
          duration: 2000,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || 'Failed to load prescription');
      showToast(e.message || 'Failed to load prescription', 'error', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [id, refreshing, showToast]);

  useEffect(() => {
    fetch_();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetch_();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleShare = () => {
    showToast('Share link copied to clipboard', 'info', { duration: 2000 });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    router.push(`/pharmacist/prescriptions/${id}/edit`);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;
  if (!prescription) return <ErrorComponent message='Prescription not found' />;

  const doctor = prescription.doctorId || prescription.doctor;
  const patient = prescription.patientId || prescription.patient;
  const status = getStatus(prescription.status);
  const StatusIcon = status.icon;

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 px-4 py-8 sm:px-6 lg:px-8'>
      <ToastContainer />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='mx-auto max-w-4xl'
      >
        {/* ── Back + actions ── */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className='mb-6 flex flex-wrap items-center justify-between gap-3'
        >
          <button
            onClick={() => router.back()}
            className='group flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:shadow-md hover:text-gray-900'
          >
            <FiArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
            Back
          </button>
          <div className='flex flex-wrap items-center gap-2'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEdit}
              className='flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md'
            >
              <FiEdit2 className='h-4 w-4' />
              Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:shadow-md'
            >
              <FiPrinter className='h-4 w-4' />
              Print
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:shadow-md'
            >
              <FiShare2 className='h-4 w-4' />
              Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className='flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:shadow-md disabled:opacity-60'
            >
              <FiRefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className='relative mb-6 overflow-hidden rounded-2xl bg-white p-6 shadow-sm'
        >
          <div
            className={`absolute inset-0 bg-linear-to-r ${status.gradient} opacity-5`}
          />
          <div className='relative flex flex-wrap items-start justify-between gap-4'>
            <div>
              <StatusBadge status={prescription.status} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className='mt-3 flex items-center gap-2'
              >
                <FiHash className='h-5 w-5 text-gray-400' />
                <span className='font-mono text-2xl font-bold tracking-tight text-gray-900'>
                  {prescription.prescriptionNumber}
                </span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className='mt-1 text-base text-gray-500'
              >
                {prescription.diagnosis}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className='text-right text-xs text-gray-400 space-y-1'
            >
              <p className='flex items-center justify-end gap-1'>
                <FiCalendar className='h-3 w-3' />
                Issued{' '}
                <span className='font-medium text-gray-600'>
                  {fmtShort(prescription.startDate)}
                </span>
              </p>
              {prescription.endDate && (
                <p className='flex items-center justify-end gap-1'>
                  <FiCalendar className='h-3 w-3' />
                  Expires{' '}
                  <span className='font-medium text-gray-600'>
                    {fmtShort(prescription.endDate)}
                  </span>
                </p>
              )}
              <p className='mt-2 text-gray-300'>
                Created {fmtShort(prescription.createdAt)}
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid gap-5 lg:grid-cols-3'
        >
          {/* ── Left column ── */}
          <div className='space-y-5 lg:col-span-2'>
            {/* Medications */}
            <Card title='Medications' delay={0.05}>
              <div className='space-y-3'>
                <AnimatePresence>
                  {prescription.medications.map((med, i) => (
                    <motion.div
                      key={med._id ?? i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className='rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-300 hover:shadow-sm'
                    >
                      <div className='flex flex-wrap items-start justify-between gap-2'>
                        <div>
                          <p className='font-semibold text-gray-900'>
                            {med.name}
                          </p>
                          <p className='mt-0.5 text-sm text-gray-500'>
                            {med.dosage}
                            <span className='mx-1.5 text-gray-300'>·</span>
                            {med.frequency}
                            <span className='mx-1.5 text-gray-300'>·</span>
                            {med.duration}
                          </p>
                        </div>
                        <div className='flex gap-2 text-xs'>
                          <span className='rounded-lg bg-white px-2.5 py-1 font-medium text-gray-700 shadow-sm'>
                            Qty&nbsp;
                            <span className='text-gray-900 font-bold'>
                              {med.quantity}
                            </span>
                          </span>
                          <span className='rounded-lg bg-white px-2.5 py-1 font-medium text-gray-700 shadow-sm'>
                            Refills&nbsp;
                            <span className='text-gray-900 font-bold'>
                              {med.refills}
                            </span>
                          </span>
                        </div>
                      </div>
                      {med.instructions && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className='mt-2 text-xs text-gray-500 italic border-t border-gray-200 pt-2'
                        >
                          💊 {med.instructions}
                        </motion.p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>

            {/* Notes */}
            {prescription.notes && (
              <Card title='Clinical Notes' delay={0.1}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className='flex gap-3 rounded-xl bg-blue-50/50 p-4'
                >
                  <FiFileText className='mt-0.5 h-5 w-5 shrink-0 text-blue-500' />
                  <p className='text-sm leading-relaxed text-gray-700 italic'>
                    {prescription.notes}
                  </p>
                </motion.div>
              </Card>
            )}

            {/* Dates */}
            <Card title='Timeline' delay={0.15}>
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
                {[
                  {
                    label: 'Start Date',
                    value: fmt(prescription.startDate),
                    icon: FiCalendar,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                  },
                  {
                    label: 'End Date',
                    value: fmt(prescription.endDate),
                    icon: FiCalendar,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                  },
                  {
                    label: 'Created',
                    value: fmt(prescription.createdAt),
                    icon: FiActivity,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                  },
                  {
                    label: 'Updated',
                    value: fmt(prescription.updatedAt),
                    icon: FiRefreshCw,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50',
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className={`rounded-xl ${item.bg} p-3 transition-all hover:shadow-sm`}
                  >
                    <item.icon className={`h-4 w-4 ${item.color} mb-1`} />
                    <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>
                      {item.label}
                    </p>
                    <p className='mt-1 text-sm font-semibold text-gray-800'>
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Right column ── */}
          <div className='space-y-5'>
            {/* Doctor */}
            <Card title='Doctor' delay={0.1}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className='space-y-4'
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className='flex items-center gap-3 rounded-xl bg-blue-50/50 p-3'
                >
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white shadow-lg'>
                    <FiUser className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>
                      {getDoctorName(doctor)}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {doctor?.specialty ?? 'General Practitioner'}
                    </p>
                  </div>
                </motion.div>
                <div className='space-y-3 border-t border-gray-100 pt-3'>
                  <InfoRow
                    icon={FiMail}
                    label='Email'
                    value={doctor?.email ?? '—'}
                  />
                  <InfoRow
                    icon={FiPhone}
                    label='Phone'
                    value={doctor?.phone ?? '—'}
                  />
                </div>
              </motion.div>
            </Card>

            {/* Patient */}
            {patient && (
              <Card title='Patient' delay={0.15}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className='space-y-4'
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className='flex items-center gap-3 rounded-xl bg-violet-50/50 p-3'
                  >
                    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-400 to-violet-600 text-white shadow-lg'>
                      <FiUser className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='font-semibold text-gray-900'>
                        {getPatientName(patient)}
                      </p>
                      {patient.nic && (
                        <p className='text-xs text-gray-400'>
                          NIC: {patient.nic}
                        </p>
                      )}
                    </div>
                  </motion.div>
                  <div className='space-y-3 border-t border-gray-100 pt-3'>
                    {patient.email && (
                      <InfoRow
                        icon={FiMail}
                        label='Email'
                        value={patient.email}
                      />
                    )}
                    {patient.phone && (
                      <InfoRow
                        icon={FiPhone}
                        label='Phone'
                        value={patient.phone}
                      />
                    )}
                  </div>
                </motion.div>
              </Card>
            )}

            {/* Quick stats */}
            <Card title='Summary' delay={0.2}>
              <div className='grid grid-cols-2 gap-3'>
                {[
                  {
                    label: 'Medications',
                    value: prescription.medications.length,
                    icon: FiPackage,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-50',
                  },
                  {
                    label: 'Total Qty',
                    value: prescription.medications.reduce(
                      (s, m) => s + m.quantity,
                      0
                    ),
                    icon: FiClipboard,
                    color: 'text-teal-600',
                    bg: 'bg-teal-50',
                  },
                  {
                    label: 'Total Refills',
                    value: prescription.medications.reduce(
                      (s, m) => s + m.refills,
                      0
                    ),
                    icon: FiRefreshCw,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50',
                  },
                  {
                    label: 'Status',
                    value: status.label,
                    icon: StatusIcon,
                    color: status.text,
                    bg: status.bg,
                  },
                ].map((s, idx) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className={`rounded-xl ${s.bg} p-3 transition-all hover:shadow-md`}
                  >
                    <s.icon className={`h-5 w-5 ${s.color} mb-1`} />
                    <p className='text-xl font-bold text-gray-900'>{s.value}</p>
                    <p className='text-xs text-gray-500'>{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* ── Bottom actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-gray-200 pt-8'
        >
          <Link
            href='/pharmacist/prescriptions'
            className='group flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700'
          >
            <FiArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
            Back to all prescriptions
          </Link>
          <span className='text-gray-300'>|</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className='text-sm font-medium text-gray-400 transition hover:text-gray-600'
          >
            ↑ Back to top
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
