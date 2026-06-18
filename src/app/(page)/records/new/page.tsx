'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  FiArrowLeft,
  FiSave,
  FiUpload,
  FiFile,
  FiImage,
  FiX,
  FiUser,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiSearch,
  FiClipboard,
  FiPaperclip,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import Toast from '../../../../components/ui/Toast';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
}

interface MedicalRecordFormData {
  patientId: string;
  recordType: string;
  title: string;
  description: string;
  date: string;
  status: string;
  doctorNotes: string;
  attachments: File[];
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
} as const;

const sidebarVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24, delay: 0.25 },
  },
} as const;

const patientRevealVariants = {
  hidden: { opacity: 0, height: 0, scaleY: 0.9 },
  visible: {
    opacity: 1,
    height: 'auto',
    scaleY: 1,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    height: 0,
    scaleY: 0.9,
    transition: { duration: 0.2 },
  },
} as const;

const fileItemVariants = {
  hidden: { opacity: 0, x: -16, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, x: 16, scale: 0.9, transition: { duration: 0.18 } },
} as const;

const pulseRing: Variants = {
  initial: { scale: 1, opacity: 0.6 },
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.6, 0, 0.6],
    transition: { duration: 1.6, repeat: Infinity, ease: [0.42, 0, 0.58, 1] },
  },
};

const steps = ['Patient', 'Details', 'Attachments', 'Notes'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className='flex items-center gap-0 mb-8'>
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div className='flex flex-col items-center'>
            <motion.div
              animate={{
                backgroundColor: i <= current ? '#2563eb' : '#e5e7eb',
                scale: i === current ? 1.15 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className='w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow'
              style={{
                backgroundColor: i <= current ? '#2563eb' : '#e5e7eb',
                color: i <= current ? '#fff' : '#9ca3af',
              }}
            >
              {i < current ? <FiCheckCircle className='w-4 h-4' /> : i + 1}
            </motion.div>
            <span
              className={`text-xs mt-1 font-medium ${i <= current ? 'text-blue-600' : 'text-gray-400'}`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <motion.div
              className='flex-1 h-0.5 mx-1 -mt-3'
              animate={{ backgroundColor: i < current ? '#2563eb' : '#e5e7eb' }}
              transition={{ duration: 0.4 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function NewMedicalRecordPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<MedicalRecordFormData>({
    patientId: '',
    recordType: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    doctorNotes: '',
    attachments: [],
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [nicSearch, setNicSearch] = useState('');
  const [searchingNic, setSearchingNic] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] =
    useState<Patient | null>(null);

  // ✅ FIX 1: Toast state declared here
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  // Computed current step for indicator
  const currentStep = selectedPatientDetails
    ? formData.recordType && formData.title
      ? formData.attachments.length > 0
        ? 3
        : 2
      : 1
    : 0;

  const recordTypes = [
    { value: 'CONSULTATION', label: 'Consultation Note' },
    { value: 'LAB_RESULT', label: 'Lab Result' },
    { value: 'IMAGING', label: 'Imaging Report' },
    { value: 'ECG', label: 'ECG Report' },
    { value: 'PRESCRIPTION', label: 'Prescription' },
    { value: 'PROGRESS_NOTE', label: 'Progress Note' },
    { value: 'SURGICAL_REPORT', label: 'Surgical Report' },
    { value: 'DISCHARGE_SUMMARY', label: 'Discharge Summary' },
    { value: 'OTHER', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const result = await response.json();
      if (result.success) {
        setPatients(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPageError('Failed to load patients. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.patientId) errors.patientId = 'Patient is required';
    if (!formData.recordType) errors.recordType = 'Record type is required';
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.date) errors.date = 'Date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setToast({
        show: true,
        message: 'Please fill in all required fields.',
        type: 'error',
      });
      return;
    }

    setSaving(true);

    try {
      const submitData = new FormData();
      submitData.append('patientId', formData.patientId);
      submitData.append('recordType', formData.recordType);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('date', formData.date);
      submitData.append('status', formData.status);
      submitData.append('doctorNotes', formData.doctorNotes);
      formData.attachments.forEach(file =>
        submitData.append('attachments', file)
      );

      const response = await fetch('/api/records', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create record');
      }

      const result = await response.json();
      if (result.success) {
        setToast({
          show: true,
          message: 'Medical record created successfully!',
          type: 'success',
        });
        setTimeout(() => router.push('/records'), 1200);
      } else {
        throw new Error(result.message || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating record:', error);
      setToast({
        show: true,
        message:
          error instanceof Error ? error.message : 'Failed to create record',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'patientId') {
      const patient = patients.find(p => p._id === value);
      setSelectedPatientDetails(patient || null);
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNicSearch = async () => {
    if (!nicSearch.trim()) {
      setToast({
        show: true,
        message: 'Please enter a NIC number',
        type: 'error',
      });
      return;
    }

    try {
      setSearchingNic(true);
      const response = await fetch(`/api/patients/search?nic=${nicSearch}`);

      if (!response.ok) throw new Error('Patient not found');

      const result = await response.json();
      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, patientId: result.data._id }));
        setSelectedPatientDetails(result.data);
        setNicSearch('');
        setFormErrors(prev => ({ ...prev, patientId: '' }));
        setToast({ show: true, message: 'Patient found!', type: 'success' });
      } else {
        throw new Error('Patient not found with this NIC');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setToast({
        show: true,
        message: error instanceof Error ? error.message : 'Patient not found',
        type: 'error',
      });
      setSelectedPatientDetails(null);
    } finally {
      setSearchingNic(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    )
      age--;
    return age;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      f =>
        f.type.startsWith('image/') ||
        f.type === 'application/pdf' ||
        f.type.startsWith('text/')
    );
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/'))
      return <FiImage className='w-4 h-4 text-purple-500' />;
    if (file.type === 'application/pdf')
      return <FiFileText className='w-4 h-4 text-red-500' />;
    return <FiFile className='w-4 h-4 text-blue-500' />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <Loading />;

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className='mb-8'
        >
          <button
            onClick={() => router.push('/records')}
            className='group flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium'
          >
            <motion.span
              whileHover={{ x: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <FiArrowLeft className='w-5 h-5' />
            </motion.span>
            Back to Records
          </button>

          <div className='flex justify-between items-start'>
            <div>
              <h1 className='text-3xl font-extrabold text-gray-900 tracking-tight'>
                New Medical Record
              </h1>
              <p className='text-gray-500 mt-1 text-sm'>
                Fill in the details below to create a new medical record for a
                patient.
              </p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 18,
                delay: 0.2,
              }}
              className='hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-200 rounded-full text-sm font-semibold text-blue-700'
            >
              <FiClipboard className='w-4 h-4' />
              New Record
            </motion.div>
          </div>

          {/* Step indicator */}
          <div className='mt-6'>
            <StepIndicator current={currentStep} />
          </div>
        </motion.div>

        {/* ── Page-level error banner ── */}
        <AnimatePresence>
          {pageError && (
            <motion.div
              key='page-error'
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className='mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between'
            >
              <div className='flex items-center gap-2 text-red-800'>
                <FiAlertCircle className='w-5 h-5 shrink-0' />
                <span className='font-medium text-sm'>{pageError}</span>
              </div>
              <button
                onClick={() => setPageError(null)}
                className='text-red-400 hover:text-red-600 ml-4'
              >
                <FiX className='w-4 h-4' />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='grid grid-cols-1 lg:grid-cols-3 gap-8'
          >
            {/* ── Main Column ── */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Patient Selection */}
              <motion.div
                variants={cardVariants}
                className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'
              >
                <h2 className='text-lg font-bold text-gray-900 mb-5 flex items-center gap-2'>
                  <span className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
                    <FiUser className='w-4 h-4 text-blue-600' />
                  </span>
                  Patient Information
                </h2>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Search by NIC Number <span className='text-red-500'>*</span>
                  </label>
                  <div className='flex gap-2'>
                    <div className='relative flex-1'>
                      <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4' />
                      <input
                        type='text'
                        value={nicSearch}
                        onChange={e => setNicSearch(e.target.value)}
                        placeholder='Enter NIC number...'
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm ${
                          formErrors.patientId && !selectedPatientDetails
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                        }`}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNicSearch();
                          }
                        }}
                      />
                    </div>
                    <motion.button
                      type='button'
                      onClick={handleNicSearch}
                      disabled={searchingNic}
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ scale: 1.02 }}
                      className='px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-semibold shadow-sm'
                    >
                      {searchingNic ? (
                        <span className='flex items-center gap-2'>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className='w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block'
                          />
                          Searching
                        </span>
                      ) : (
                        'Search'
                      )}
                    </motion.button>
                  </div>
                  {formErrors.patientId && !selectedPatientDetails && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='mt-1.5 text-xs text-red-600 flex items-center gap-1'
                    >
                      <FiAlertCircle className='w-3 h-3' />{' '}
                      {formErrors.patientId}
                    </motion.p>
                  )}
                </div>

                {/* Patient Details Card */}
                <AnimatePresence>
                  {selectedPatientDetails && (
                    <motion.div
                      key='patient-card'
                      variants={patientRevealVariants}
                      initial='hidden'
                      animate='visible'
                      exit='exit'
                      className='mt-5 overflow-hidden'
                    >
                      <div className='p-5 bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl'>
                        <div className='flex items-center justify-between mb-4'>
                          <div className='flex items-center gap-2'>
                            <div className='relative'>
                              <motion.div
                                variants={pulseRing}
                                initial='initial'
                                animate='animate'
                                className='absolute inset-0 rounded-full bg-blue-400'
                              />
                              <div className='relative w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm'>
                                {selectedPatientDetails.firstName[0]}
                                {selectedPatientDetails.lastName[0]}
                              </div>
                            </div>
                            <h3 className='font-bold text-blue-900'>
                              Patient Found
                            </h3>
                          </div>
                          <button
                            type='button'
                            onClick={() => {
                              setSelectedPatientDetails(null);
                              setFormData(prev => ({ ...prev, patientId: '' }));
                              setNicSearch('');
                            }}
                            className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors'
                          >
                            Change
                          </button>
                        </div>
                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          {[
                            {
                              label: 'Full Name',
                              value: `${selectedPatientDetails.firstName} ${selectedPatientDetails.lastName}`,
                            },
                            {
                              label: 'Email',
                              value: selectedPatientDetails.email,
                            },
                            {
                              label: 'Age',
                              value: `${calculateAge(selectedPatientDetails.dateOfBirth)} years`,
                            },
                            {
                              label: 'Gender',
                              value:
                                selectedPatientDetails.gender
                                  .charAt(0)
                                  .toUpperCase() +
                                selectedPatientDetails.gender
                                  .slice(1)
                                  .toLowerCase(),
                            },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className='text-blue-500 text-xs font-semibold uppercase tracking-wide mb-0.5'>
                                {label}
                              </p>
                              <p className='text-blue-900 font-medium'>
                                {value}
                              </p>
                            </div>
                          ))}
                          <div className='col-span-2'>
                            <p className='text-blue-500 text-xs font-semibold uppercase tracking-wide mb-0.5'>
                              Date of Birth
                            </p>
                            <p className='text-blue-900 font-medium'>
                              {new Date(
                                selectedPatientDetails.dateOfBirth
                              ).toLocaleDateString('en-LK', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Record Details */}
              <motion.div
                variants={cardVariants}
                className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'
              >
                <h2 className='text-lg font-bold text-gray-900 mb-5 flex items-center gap-2'>
                  <span className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
                    <FiFileText className='w-4 h-4 text-green-600' />
                  </span>
                  Record Details
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Record Type */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                      Record Type <span className='text-red-500'>*</span>
                    </label>
                    <select
                      name='recordType'
                      value={formData.recordType}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-shadow ${
                        formErrors.recordType
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <option value=''>Select record type...</option>
                      {recordTypes.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.recordType && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-1 text-xs text-red-600 flex items-center gap-1'
                      >
                        <FiAlertCircle className='w-3 h-3' />{' '}
                        {formErrors.recordType}
                      </motion.p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                      Status
                    </label>
                    <select
                      name='status'
                      value={formData.status}
                      onChange={handleChange}
                      className='w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                    >
                      {statusOptions.map(s => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                      Title <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      name='title'
                      value={formData.title}
                      onChange={handleChange}
                      placeholder='Enter record title...'
                      className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-shadow ${
                        formErrors.title
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    />
                    {formErrors.title && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-1 text-xs text-red-600 flex items-center gap-1'
                      >
                        <FiAlertCircle className='w-3 h-3' /> {formErrors.title}
                      </motion.p>
                    )}
                  </div>

                  {/* Date */}
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                      Date <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      name='date'
                      value={formData.date}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        formErrors.date
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    />
                    {formErrors.date && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-1 text-xs text-red-600 flex items-center gap-1'
                      >
                        <FiAlertCircle className='w-3 h-3' /> {formErrors.date}
                      </motion.p>
                    )}
                  </div>

                  {/* Description */}
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                      Description
                    </label>
                    <textarea
                      name='description'
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder='Enter record description...'
                      className='w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none'
                    />
                  </div>
                </div>
              </motion.div>

              {/* File Attachments */}
              <motion.div
                variants={cardVariants}
                className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'
              >
                <h2 className='text-lg font-bold text-gray-900 mb-5 flex items-center gap-2'>
                  <span className='w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center'>
                    <FiPaperclip className='w-4 h-4 text-purple-600' />
                  </span>
                  File Attachments
                </h2>

                <motion.div
                  animate={{
                    borderColor: dragActive ? '#3b82f6' : '#e5e7eb',
                    backgroundColor: dragActive ? '#eff6ff' : '#fafafa',
                    scale: dragActive ? 1.01 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className='border-2 border-dashed rounded-xl p-8 text-center cursor-pointer'
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <motion.div
                    animate={{ y: dragActive ? -6 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <FiUpload
                      className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragActive ? 'text-blue-500' : 'text-gray-300'}`}
                    />
                    <p className='text-gray-600 text-sm mb-1 font-medium'>
                      {dragActive
                        ? 'Drop files here'
                        : 'Drag & drop files here, or click to browse'}
                    </p>
                    <p className='text-xs text-gray-400 mb-4'>
                      PDF, JPG, PNG, GIF, TXT, DOC supported
                    </p>
                    <input
                      type='file'
                      multiple
                      accept='.pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx'
                      onChange={handleFileChange}
                      className='hidden'
                      id='file-upload'
                    />
                    <label
                      htmlFor='file-upload'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer transition-colors font-semibold shadow-sm'
                    >
                      <FiUpload className='w-4 h-4' />
                      Browse Files
                    </label>
                  </motion.div>
                </motion.div>

                {/* File List */}
                <AnimatePresence>
                  {formData.attachments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='mt-4 space-y-2 overflow-hidden'
                    >
                      <p className='text-sm font-semibold text-gray-700 flex items-center gap-1'>
                        <FiPaperclip className='w-4 h-4' />
                        {formData.attachments.length} file
                        {formData.attachments.length > 1 ? 's' : ''} selected
                      </p>
                      <AnimatePresence>
                        {formData.attachments.map((file, index) => (
                          <motion.div
                            key={`${file.name}-${index}`}
                            variants={fileItemVariants}
                            initial='hidden'
                            animate='visible'
                            exit='exit'
                            layout
                            className='flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl'
                          >
                            <div className='flex items-center gap-3'>
                              {getFileIcon(file)}
                              <div>
                                <p className='font-medium text-gray-800 text-sm'>
                                  {file.name}
                                </p>
                                <p className='text-xs text-gray-400'>
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <motion.button
                              type='button'
                              onClick={() => removeFile(index)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className='text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors'
                            >
                              <FiX className='w-4 h-4' />
                            </motion.button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Doctor Notes */}
              <motion.div
                variants={cardVariants}
                className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'
              >
                <h2 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                  <span className='w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center'>
                    <FiClipboard className='w-4 h-4 text-amber-600' />
                  </span>
                  Doctor Notes
                </h2>
                <textarea
                  name='doctorNotes'
                  value={formData.doctorNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder='Enter your notes, observations, or recommendations...'
                  className='w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none'
                />
              </motion.div>
            </div>

            {/* ── Sidebar ── */}
            <motion.div
              variants={sidebarVariants}
              initial='hidden'
              animate='visible'
              className='space-y-5'
            >
              {/* Record Summary */}
              <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5'>
                <h2 className='text-base font-bold text-gray-900 mb-4'>
                  Record Summary
                </h2>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-500'>Patient</span>
                    <span className='font-semibold text-gray-800 text-right max-w-30 truncate'>
                      {selectedPatientDetails ? (
                        `${selectedPatientDetails.firstName} ${selectedPatientDetails.lastName}`
                      ) : (
                        <span className='text-gray-300 font-normal'>
                          Not selected
                        </span>
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-500'>Files</span>
                    <span className='font-semibold text-gray-800'>
                      <AnimatePresence mode='wait'>
                        <motion.span
                          key={formData.attachments.length}
                          initial={{ y: -8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 8, opacity: 0 }}
                          className='inline-block'
                        >
                          {formData.attachments.length}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-500'>Status</span>
                    <span
                      className={`font-semibold capitalize px-2 py-0.5 rounded-full text-xs ${
                        formData.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : formData.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formData.status.toLowerCase()}
                    </span>
                  </div>
                  {formData.date && (
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-500'>Date</span>
                      <span className='font-semibold text-gray-800'>
                        {new Date(formData.date).toLocaleDateString('en-LK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Completion progress */}
                <div className='mt-4 pt-4 border-t border-gray-100'>
                  <div className='flex justify-between text-xs text-gray-500 mb-1.5'>
                    <span>Completion</span>
                    <span>
                      {Math.round((currentStep / (steps.length - 1)) * 100)}%
                    </span>
                  </div>
                  <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                    <motion.div
                      className='h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full'
                      animate={{
                        width: `${(currentStep / (steps.length - 1)) * 100}%`,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 120,
                        damping: 20,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5'>
                <div className='space-y-3'>
                  <motion.button
                    type='submit'
                    disabled={saving}
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.97 }}
                    className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all font-semibold shadow-md shadow-blue-200 text-sm'
                  >
                    {saving ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          className='w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block'
                        />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiSave className='w-4 h-4' />
                        Create Medical Record
                      </>
                    )}
                  </motion.button>

                  <button
                    type='button'
                    onClick={() => router.push('/records')}
                    className='w-full px-4 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm'
                  >
                    Cancel
                  </button>
                </div>

                <div className='mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl'>
                  <p className='text-xs text-amber-700 leading-relaxed'>
                    <strong>Note:</strong> All uploaded files are securely
                    stored and accessible only to authorized medical staff.
                  </p>
                </div>
              </div>

              {/* Supported Formats */}
              <div className='bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5'>
                <h3 className='font-bold text-blue-900 mb-3 text-sm'>
                  Supported Formats
                </h3>
                <ul className='space-y-2 text-sm text-blue-800'>
                  {[
                    {
                      icon: <FiFileText className='w-4 h-4' />,
                      label: 'PDF Documents',
                    },
                    {
                      icon: <FiImage className='w-4 h-4' />,
                      label: 'Images (JPG, PNG, GIF)',
                    },
                    {
                      icon: <FiFile className='w-4 h-4' />,
                      label: 'Text Documents',
                    },
                    {
                      icon: <FiFile className='w-4 h-4' />,
                      label: 'ECG Reports',
                    },
                    {
                      icon: <FiFile className='w-4 h-4' />,
                      label: 'X-Ray Images',
                    },
                  ].map(({ icon, label }) => (
                    <li key={label} className='flex items-center gap-2 text-xs'>
                      <span className='text-blue-400'>{icon}</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </form>
      </div>

      <AnimatePresence>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
