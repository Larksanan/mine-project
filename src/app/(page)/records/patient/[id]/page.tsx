/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiDownload,
  FiClipboard,
  FiPaperclip,
  FiCalendar,
  FiUser,
  FiTag,
  FiShield,
  FiActivity,
  FiFileText,
  FiImage,
  FiThermometer,
  FiFile,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiExternalLink,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import ErrorComponent from '@/components/Error';

const RECORD_TYPE_CONFIG: Record<
  string,
  { label: string; icon: any; gradient: string; accent: string }
> = {
  CONSULTATION: {
    label: 'Consultation',
    icon: FiUser,
    gradient: 'from-blue-500 to-indigo-600',
    accent: 'blue',
  },
  LAB_RESULT: {
    label: 'Lab Result',
    icon: FiThermometer,
    gradient: 'from-purple-500 to-violet-600',
    accent: 'purple',
  },
  IMAGING: {
    label: 'Imaging',
    icon: FiImage,
    gradient: 'from-indigo-500 to-blue-600',
    accent: 'indigo',
  },
  ECG: {
    label: 'ECG',
    icon: FiActivity,
    gradient: 'from-cyan-500 to-teal-600',
    accent: 'cyan',
  },
  PRESCRIPTION: {
    label: 'Prescription',
    icon: FiClipboard,
    gradient: 'from-emerald-500 to-green-600',
    accent: 'emerald',
  },
  SURGICAL: {
    label: 'Surgical Report',
    icon: FiFile,
    gradient: 'from-teal-500 to-cyan-600',
    accent: 'teal',
  },
  DISCHARGE_SUMMARY: {
    label: 'Discharge Summary',
    icon: FiFileText,
    gradient: 'from-orange-500 to-amber-600',
    accent: 'orange',
  },
  REFERRAL: {
    label: 'Referral',
    icon: FiActivity,
    gradient: 'from-pink-500 to-rose-600',
    accent: 'pink',
  },
  OTHER: {
    label: 'Other',
    icon: FiFile,
    gradient: 'from-slate-500 to-gray-600',
    accent: 'slate',
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: FiCheckCircle,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: FiCheckCircle,
  },
  ARCHIVED: {
    label: 'Archived',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: FiClock,
  },
  CONFIDENTIAL: {
    label: 'Confidential',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: FiAlertCircle,
  },
};

const getRecordTypeConfig = (type: string) =>
  RECORD_TYPE_CONFIG[type] || RECORD_TYPE_CONFIG.OTHER;

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;

const getDoctorName = (doctor: any) => {
  if (!doctor) return 'Unknown Doctor';
  if (doctor.firstName && doctor.lastName)
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  if (doctor.name)
    return doctor.name.includes('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
  if (doctor.email) return doctor.email.split('@')[0];
  return 'Unknown Doctor';
};

const getFileName = (url: string, idx: number) => {
  try {
    const parts = new URL(url).pathname.split('/');
    const name = parts[parts.length - 1];
    return name && name.length > 3
      ? decodeURIComponent(name)
      : `Attachment ${idx + 1}`;
  } catch {
    return `Attachment ${idx + 1}`;
  }
};

const getFileExt = (url: string) => {
  try {
    const name = new URL(url).pathname.split('/').pop() || '';
    return name.split('.').pop()?.toUpperCase() || 'FILE';
  } catch {
    return 'FILE';
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) =>
    ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.45, ease: 'easeInOut' },
    }) as const,
};

export default function MedicalRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch(`/api/records/patient/${id}`);
        if (!response.ok) throw new Error('Failed to fetch record');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        setRecord(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRecord();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;
  if (!record) return <ErrorComponent message='Record not found' />;

  const typeConfig = getRecordTypeConfig(record.recordType);
  const statusConfig = getStatusConfig(record.status);
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;
  const doctorName = getDoctorName(record.doctor || record.doctorId);

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50/40 to-indigo-50 py-10'>
      {/* Decorative background blobs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none z-0'>
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          className='absolute -top-48 -right-48 w-130 h-130 bg-linear-to-br from-blue-200/25 to-indigo-200/25 rounded-full blur-3xl'
        />
        <motion.div
          animate={{ scale: [1.15, 1, 1.15], rotate: [60, 0, 60] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className='absolute -bottom-48 -left-48 w-130 h-130 bg-linear-to-br from-indigo-200/25 to-purple-200/25 rounded-full blur-3xl'
        />
      </div>

      <div className='relative z-10 max-w-4xl mx-auto px-4 sm:px-6'>
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.back()}
          className='flex items-center gap-2 mb-8 px-4 py-2.5 bg-white/80 backdrop-blur-sm text-slate-700 font-medium rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all text-sm'
        >
          <FiArrowLeft className='w-4 h-4' />
          Back to Records
        </motion.button>

        {/* Hero banner */}
        <motion.div
          variants={fadeUp}
          initial='hidden'
          animate='show'
          custom={0}
          className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${typeConfig.gradient} p-8 md:p-10 mb-6 shadow-2xl`}
        >
          {/* Subtle pattern overlay */}
          <div
            className='absolute inset-0 opacity-10'
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className='relative flex flex-col md:flex-row md:items-center gap-6'>
            {/* Icon badge */}
            <div className='shrink-0 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30'>
              <TypeIcon className='w-10 h-10 text-white' />
            </div>

            <div className='flex-1'>
              <div className='flex flex-wrap items-center gap-3 mb-2'>
                <span className='px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30 uppercase tracking-wider'>
                  {typeConfig.label}
                </span>
                <span
                  className={`flex items-center gap-1.5 px-3 py-1 ${statusConfig.bg} ${statusConfig.text} text-xs font-semibold rounded-full border ${statusConfig.border}`}
                >
                  <StatusIcon className='w-3.5 h-3.5' />
                  {statusConfig.label}
                </span>
              </div>
              <h1 className='text-2xl md:text-3xl font-bold text-white leading-tight'>
                {record.title}
              </h1>
              <p className='text-white/70 text-sm mt-1 flex items-center gap-1.5'>
                <FiCalendar className='w-3.5 h-3.5' />
                {new Date(record.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick meta chips */}
        <motion.div
          variants={fadeUp}
          initial='hidden'
          animate='show'
          custom={1}
          className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'
        >
          {[
            {
              icon: FiCalendar,
              label: 'Date',
              value: new Date(record.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            },
            { icon: FiUser, label: 'Physician', value: doctorName },
            { icon: FiTag, label: 'Type', value: typeConfig.label },
            { icon: FiShield, label: 'Status', value: statusConfig.label },
          ].map((chip, i) => (
            <motion.div
              key={chip.label}
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={1.2 + i * 0.1}
              className='bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col gap-1'
            >
              <div className='flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider'>
                <chip.icon className='w-3.5 h-3.5' />
                {chip.label}
              </div>
              <p
                className='text-slate-800 font-semibold text-sm leading-snug truncate'
                title={chip.value}
              >
                {chip.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main content card */}
        <motion.div
          variants={fadeUp}
          initial='hidden'
          animate='show'
          custom={2}
          className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden'
        >
          {/* Description */}
          <Section icon={FiFileText} title='Description' index={0}>
            <p className='text-slate-700 leading-relaxed'>
              {record.description}
            </p>
          </Section>

          {/* Doctor Notes */}
          <AnimatePresence>
            {record.doctorNotes && (
              <Section
                icon={FiClipboard}
                title="Doctor's Notes"
                index={1}
                highlight
              >
                <p className='text-slate-700 leading-relaxed whitespace-pre-line'>
                  {record.doctorNotes}
                </p>
              </Section>
            )}
          </AnimatePresence>

          {/* Attachments */}
          <AnimatePresence>
            {record.attachments && record.attachments.length > 0 && (
              <Section icon={FiPaperclip} title='Attachments' index={2} last>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {record.attachments.map((url: string, idx: number) => (
                    <AttachmentCard key={idx} url={url} idx={idx} />
                  ))}
                </div>
              </Section>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer spacer */}
        <div className='h-12' />
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  icon: Icon,
  title,
  children,
  index = 0,
  highlight = false,
  last = false,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  index?: number;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial='hidden'
      animate='show'
      custom={2.5 + index * 0.15}
      className={`px-6 md:px-8 py-6 ${!last ? 'border-b border-slate-100' : ''} ${highlight ? 'bg-amber-50/40' : ''}`}
    >
      <div className='flex items-center gap-2 mb-4'>
        <div
          className={`p-2 rounded-lg ${highlight ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}
        >
          <Icon className='w-4 h-4' />
        </div>
        <h2 className='text-sm font-semibold text-slate-500 uppercase tracking-wider'>
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

function AttachmentCard({ url, idx }: { url: string; idx: number }) {
  const [hovered, setHovered] = useState(false);
  const name = getFileName(url, idx);
  const ext = getFileExt(url);

  const extColors: Record<string, string> = {
    PDF: 'bg-red-100 text-red-600',
    PNG: 'bg-blue-100 text-blue-600',
    JPG: 'bg-blue-100 text-blue-600',
    JPEG: 'bg-blue-100 text-blue-600',
    DOC: 'bg-indigo-100 text-indigo-600',
    DOCX: 'bg-indigo-100 text-indigo-600',
    XLSX: 'bg-green-100 text-green-600',
    CSV: 'bg-green-100 text-green-600',
  };
  const extColor = extColors[ext] || 'bg-slate-100 text-slate-600';

  return (
    <motion.a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className='flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group'
    >
      {/* File type badge */}
      <div
        className={`shrink-0 w-11 h-11 ${extColor} rounded-xl flex items-center justify-center font-bold text-xs`}
      >
        {ext.slice(0, 4)}
      </div>

      {/* File name */}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors'>
          {name}
        </p>
        <p className='text-xs text-slate-400 mt-0.5'>Click to open</p>
      </div>

      {/* Icon */}
      <AnimatePresence>
        {hovered ? (
          <motion.div
            key='ext'
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
          >
            <FiExternalLink className='w-4 h-4 text-blue-500' />
          </motion.div>
        ) : (
          <motion.div
            key='dl'
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
          >
            <FiDownload className='w-4 h-4 text-slate-400' />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.a>
  );
}
