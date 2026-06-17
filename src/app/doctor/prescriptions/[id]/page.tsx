/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unknown-property */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiPrinter,
  FiUser,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMail,
  FiPhone,
  FiMapPin,
  FiPackage,
  FiActivity,
  FiDownload,
  FiShare2,
  FiX,
  FiAlertTriangle,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import { Prescription } from '@/types/Prescription';
import LogoStatic from '@/components/Logo.static';

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/doctor/prescriptions/${prescriptionId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch prescription');
      }

      const result = await response.json();

      if (result.success) {
        setPrescription(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch prescription');
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
      setError('Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(
        `/api/doctor/prescriptions/${prescriptionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete prescription');
      }

      const result = await response.json();

      if (result.success) {
        router.push('/doctor/prescriptions');
      } else {
        throw new Error(result.message || 'Failed to delete prescription');
      }
    } catch (error) {
      console.error('Error deleting prescription:', error);
      setError('Failed to delete prescription. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Use browser's native print-to-PDF functionality
    // This is more reliable and doesn't have CSS compatibility issues
    const originalTitle = document.title;
    document.title = `prescription-${prescription?.patientId.firstName}-${prescription?.patientId.lastName}-${new Date().toISOString().split('T')[0]}`;

    // Trigger print dialog
    window.print();

    // Restore original title
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Prescription for ${prescription?.patientId.firstName} ${prescription?.patientId.lastName}`,
          text: `Prescription Details - Diagnosis: ${prescription?.diagnosis}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
        setShowShareModal(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { label: string; icon: any; bg: string; text: string; gradient: string }
    > = {
      ACTIVE: {
        label: 'Active',
        icon: FiActivity,
        bg: 'bg-green-100',
        text: 'text-green-700',
        gradient: 'from-green-500 to-emerald-500',
      },
      COMPLETED: {
        label: 'Completed',
        icon: FiCheckCircle,
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        gradient: 'from-blue-500 to-indigo-500',
      },
      CANCELLED: {
        label: 'Cancelled',
        icon: FiXCircle,
        bg: 'bg-red-100',
        text: 'text-red-700',
        gradient: 'from-red-500 to-pink-500',
      },
      EXPIRED: {
        label: 'Expired',
        icon: FiClock,
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        gradient: 'from-orange-500 to-red-500',
      },
    };
    return configs[status] || configs.ACTIVE;
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;
  if (!prescription) return <ErrorComponent message='Prescription not found' />;

  const statusConfig = getStatusConfig(prescription.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Animated Background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className='absolute -top-40 -right-40 w-96 h-96 bg-linear-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl'
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className='absolute -bottom-40 -left-40 w-96 h-96 bg-linear-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl'
        />
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <motion.button
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/doctor/prescriptions')}
                className='p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-200'
              >
                <FiArrowLeft className='w-6 h-6 text-slate-700' />
              </motion.button>

              <div>
                <h1 className='text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1'>
                  Prescription Details
                </h1>
                <p className='text-slate-600 flex items-center gap-2'>
                  <FiCalendar className='w-4 h-4' />
                  Created on {formatShortDate(prescription.createdAt)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-wrap items-center gap-3'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className='p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-200'
                title='Print / Save as PDF'
              >
                <FiDownload className='w-5 h-5' />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className='p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-200'
                title='Share Prescription'
              >
                <FiShare2 className='w-5 h-5' />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className='p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-200'
                title='Print Preview'
              >
                <FiPrinter className='w-5 h-5' />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  router.push(`/doctor/prescriptions/${prescriptionId}/edit`)
                }
                className='flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'
              >
                <FiEdit className='w-5 h-5' />
                Edit
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteConfirm(true)}
                className='flex items-center gap-2 px-6 py-3 bg-linear-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'
              >
                <FiTrash2 className='w-5 h-5' />
                Delete
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
                onClick={() => setShowDeleteConfirm(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className='bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl'
                >
                  <div className='flex items-center gap-4 mb-6'>
                    <div className='p-3 bg-red-100 rounded-xl'>
                      <FiAlertTriangle className='w-8 h-8 text-red-600' />
                    </div>
                    <div>
                      <h3 className='text-2xl font-bold text-slate-900'>
                        Delete Prescription?
                      </h3>
                      <p className='text-slate-600 text-sm'>
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  <p className='text-slate-600 mb-6 leading-relaxed'>
                    Are you sure you want to permanently delete this
                    prescription for{' '}
                    <span className='font-semibold text-slate-900'>
                      {prescription.patientId.firstName}{' '}
                      {prescription.patientId.lastName}
                    </span>
                    ? This will remove all prescription data and cannot be
                    recovered.
                  </p>

                  <div className='flex gap-3'>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteLoading}
                      className='flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all'
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className='flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all'
                    >
                      {deleteLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className='w-5 h-5 border-2 border-white border-t-transparent rounded-full'
                          />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FiTrash2 className='w-5 h-5' />
                          Delete
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className='bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl'
              >
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-3'>
                    <div className='p-3 bg-blue-100 rounded-xl'>
                      <FiShare2 className='w-6 h-6 text-blue-600' />
                    </div>
                    <h3 className='text-2xl font-bold text-slate-900'>
                      Share Prescription
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    <FiX className='w-5 h-5 text-slate-600' />
                  </button>
                </div>

                {shareSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='py-8 text-center'
                  >
                    <div className='p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center'>
                      <FiCheckCircle className='w-10 h-10 text-green-600' />
                    </div>
                    <p className='text-lg font-semibold text-green-600'>
                      Link copied to clipboard!
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <p className='text-slate-600 mb-6'>
                      Share this prescription with colleagues or copy the link
                      to save for later.
                    </p>

                    <div className='space-y-3'>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => copyToClipboard(window.location.href)}
                        className='w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all'
                      >
                        <FiShare2 className='w-5 h-5' />
                        Copy Link
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const subject = `Prescription for ${prescription?.patientId.firstName} ${prescription?.patientId.lastName}`;
                          const body = `View prescription details: ${window.location.href}`;
                          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        }}
                        className='w-full flex items-center gap-3 px-4 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all'
                      >
                        <FiMail className='w-5 h-5' />
                        Share via Email
                      </motion.button>
                    </div>

                    <div className='mt-6 p-4 bg-slate-50 rounded-xl'>
                      <p className='text-xs text-slate-600 mb-2 font-medium'>
                        Direct Link:
                      </p>
                      <p className='text-xs text-slate-800 font-mono break-all bg-white p-2 rounded border border-slate-200'>
                        {window.location.href}
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className='grid grid-cols-1 xl:grid-cols-3 gap-6 print-area'
          id='prescription-content'
        >
          {/* Print Header */}
          <div className='hidden print:block col-span-full mb-8'>
            <div className='flex items-center justify-between border-b-2 border-slate-900 pb-6'>
              <LogoStatic size='lg' className='relative' />
              <div className='text-right'>
                <h1 className='text-3xl font-bold text-slate-900'>
                  PRESCRIPTION
                </h1>
                <p className='text-slate-600 font-medium mt-1'>
                  #{prescription._id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className='xl:col-span-2 space-y-6'>
            {/* Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
            >
              <div
                className={`absolute inset-0 bg-linear-to-r ${statusConfig.gradient} opacity-10`}
              />
              <div className='relative p-6 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div
                    className={`p-4 bg-linear-to-br ${statusConfig.gradient} rounded-xl text-white shadow-lg`}
                  >
                    <StatusIcon className='w-8 h-8' />
                  </div>
                  <div>
                    <h2 className='text-2xl font-bold text-slate-900'>
                      {statusConfig.label}
                    </h2>
                    <p className='text-slate-600'>
                      Current prescription status
                    </p>
                  </div>
                </div>
                <div
                  className={`px-6 py-3 ${statusConfig.bg} ${statusConfig.text} rounded-xl font-bold text-lg`}
                >
                  {statusConfig.label.toUpperCase()}
                </div>
              </div>
            </motion.div>

            {/* Patient Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
            >
              <div className='bg-linear-to-r from-blue-500 to-indigo-500 p-6'>
                <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                  <FiUser className='w-7 h-7' />
                  Patient Information
                </h2>
              </div>

              <div className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Left Column */}
                  <div className='space-y-4'>
                    <div className='p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl'>
                      <label className='block text-sm font-semibold text-slate-600 mb-2'>
                        Full Name
                      </label>
                      <p className='text-xl font-bold text-slate-900'>
                        {prescription.patientId.firstName}{' '}
                        {prescription.patientId.lastName}
                      </p>
                    </div>

                    <div className='p-4 bg-slate-50 rounded-xl'>
                      <label className='block text-sm font-semibold text-slate-600 mb-2'>
                        Date of Birth
                      </label>
                      <p className='text-slate-900 font-medium'>
                        {formatShortDate(prescription.patientId.dateOfBirth)}
                        <span className='ml-2 text-sm text-slate-600'>
                          ({calculateAge(prescription.patientId.dateOfBirth)}{' '}
                          years old)
                        </span>
                      </p>
                    </div>

                    <div className='p-4 bg-slate-50 rounded-xl'>
                      <label className='block text-sm font-semibold text-slate-600 mb-2'>
                        Gender
                      </label>
                      <p className='text-slate-900 font-medium capitalize'>
                        {prescription.patientId.gender.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className='space-y-4'>
                    <div className='p-4 bg-slate-50 rounded-xl'>
                      <label className='block text-sm font-semibold text-slate-600 mb-2 items-center gap-2'>
                        <FiMail className='w-4 h-4' />
                        Email
                      </label>
                      <p className='text-slate-900 font-medium'>
                        {prescription.patientId.email}
                      </p>
                    </div>

                    <div className='p-4 bg-slate-50 rounded-xl'>
                      <label className='block text-sm font-semibold text-slate-600 mb-2 items-center gap-2'>
                        <FiPhone className='w-4 h-4' />
                        Phone
                      </label>
                      <p className='text-slate-900 font-medium'>
                        {prescription.patientId.phone}
                      </p>
                    </div>

                    {prescription.patientId.address && (
                      <div className='p-4 bg-slate-50 rounded-xl'>
                        <label className='text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2'>
                          <FiMapPin className='w-4 h-4' />
                          Address
                        </label>
                        <p className='text-slate-900 font-medium text-sm leading-relaxed'>
                          {prescription.patientId.address.street}
                          <br />
                          {prescription.patientId.address.city},{' '}
                          {prescription.patientId.address.state}{' '}
                          {prescription.patientId.address.zipCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Info */}
                {(prescription.patientId.allergies?.length > 0 ||
                  prescription.patientId.medications?.length > 0) && (
                  <div className='mt-6 pt-6 border-t border-slate-200'>
                    <h3 className='text-lg font-bold text-slate-900 mb-4'>
                      Medical Information
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {prescription.patientId.allergies?.length > 0 && (
                        <div className='p-4 bg-red-50 rounded-xl border border-red-200'>
                          <label className='block text-sm font-semibold text-red-900 mb-3'>
                            Allergies
                          </label>
                          <div className='flex flex-wrap gap-2'>
                            {prescription.patientId.allergies.map(
                              (allergy, index) => (
                                <span
                                  key={index}
                                  className='px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-lg'
                                >
                                  {allergy}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {prescription.patientId.medications?.length > 0 && (
                        <div className='p-4 bg-blue-50 rounded-xl border border-blue-200'>
                          <label className='block text-sm font-semibold text-blue-900 mb-3'>
                            Current Medications
                          </label>
                          <div className='space-y-1'>
                            {prescription.patientId.medications.map(
                              (med, index) => (
                                <p
                                  key={index}
                                  className='text-sm text-blue-800 font-medium'
                                >
                                  • {med}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Diagnosis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
            >
              <div className='bg-linear-to-r from-green-500 to-emerald-500 p-6'>
                <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                  <FiFileText className='w-7 h-7' />
                  Diagnosis & Treatment
                </h2>
              </div>

              <div className='p-6 space-y-6'>
                <div className='p-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200'>
                  <label className='block text-sm font-semibold text-green-900 mb-3'>
                    Primary Diagnosis
                  </label>
                  <p className='text-2xl font-bold text-green-900'>
                    {prescription.diagnosis}
                  </p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='p-4 bg-slate-50 rounded-xl'>
                    <label className='block text-sm font-semibold text-slate-600 mb-2 items-center gap-2'>
                      <FiCalendar className='w-4 h-4' />
                      Start Date
                    </label>
                    <p className='text-slate-900 font-bold'>
                      {formatShortDate(prescription.startDate)}
                    </p>
                  </div>

                  {prescription.endDate && (
                    <div className='p-4 bg-slate-50 rounded-xl'>
                      <label className='block text-sm font-semibold text-slate-600 mb-2 items-center gap-2'>
                        <FiCalendar className='w-4 h-4' />
                        End Date
                      </label>
                      <p className='text-slate-900 font-bold'>
                        {formatShortDate(prescription.endDate)}
                        <span className='ml-2 text-sm text-slate-600 font-normal'>
                          (
                          {calculateDuration(
                            prescription.startDate,
                            prescription.endDate
                          )}{' '}
                          days)
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Medications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
            >
              <div className='bg-linear-to-r from-purple-500 to-pink-500 p-6'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                    <FiPackage className='w-7 h-7' />
                    Medications
                  </h2>
                  <span className='px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-bold'>
                    {prescription.medications.length} prescribed
                  </span>
                </div>
              </div>

              <div className='p-6 space-y-4'>
                {prescription.medications.map((medication, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className='border-2 border-slate-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all'
                  >
                    <div className='flex items-start justify-between mb-4'>
                      <div>
                        <h3 className='text-2xl font-bold text-slate-900 mb-1'>
                          {medication.name}
                        </h3>
                        <div className='flex items-center gap-3 text-sm text-slate-600'>
                          <span className='flex items-center gap-1'>
                            <FiPackage className='w-4 h-4' />
                            Qty: {medication.quantity}
                          </span>
                          {medication.refills > 0 && (
                            <span className='flex items-center gap-1'>
                              <FiActivity className='w-4 h-4' />
                              {medication.refills} refills
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-bold'>
                        #{index + 1}
                      </div>
                    </div>

                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      {[
                        { label: 'Dosage', value: medication.dosage },
                        { label: 'Frequency', value: medication.frequency },
                        { label: 'Duration', value: medication.duration },
                        {
                          label: 'Refills',
                          value: medication.refills.toString(),
                        },
                      ].map(item => (
                        <div
                          key={item.label}
                          className='p-3 bg-slate-50 rounded-xl'
                        >
                          <label className='block text-xs font-semibold text-slate-500 uppercase mb-1'>
                            {item.label}
                          </label>
                          <p className='text-slate-900 font-bold'>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {medication.instructions && (
                      <div className='mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg'>
                        <label className='block text-sm font-semibold text-amber-900 mb-2'>
                          Special Instructions
                        </label>
                        <p className='text-amber-800 leading-relaxed'>
                          {medication.instructions}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Additional Notes */}
            {prescription.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6'
              >
                <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <FiFileText className='w-6 h-6 text-orange-500' />
                  Additional Notes
                </h2>
                <div className='p-4 bg-orange-50 rounded-xl border border-orange-200'>
                  <p className='text-slate-700 leading-relaxed'>
                    {prescription.notes}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6 no-print'>
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className='sticky top-6 bg-linear-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
            >
              <div className='bg-linear-to-r from-slate-900 to-slate-700 p-6'>
                <h2 className='text-xl font-bold text-white'>
                  Prescription Summary
                </h2>
              </div>

              <div className='p-6 space-y-4'>
                {[
                  {
                    label: 'Prescription ID',
                    value: prescription._id.slice(-8),
                    mono: true,
                  },
                  {
                    label: 'Status',
                    value: (
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 ${statusConfig.bg} ${statusConfig.text} rounded-lg font-bold text-sm`}
                      >
                        <StatusIcon className='w-4 h-4' />
                        {statusConfig.label}
                      </span>
                    ),
                  },
                  {
                    label: 'Medications',
                    value: prescription.medications.length,
                  },
                  {
                    label: 'Created',
                    value: formatShortDate(prescription.createdAt),
                  },
                  {
                    label: 'Last Updated',
                    value: formatShortDate(prescription.updatedAt),
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center py-3 border-b border-slate-200 last:border-0'
                  >
                    <span className='text-sm font-medium text-slate-600'>
                      {item.label}
                    </span>
                    <span
                      className={`font-bold text-slate-900 ${(item as any).mono ? 'font-mono text-xs' : ''}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className='p-6 bg-slate-50 border-t border-slate-200 space-y-3'>
                <h3 className='font-bold text-slate-900 mb-4'>Quick Actions</h3>

                {[
                  {
                    label: 'Edit Prescription',
                    icon: FiEdit,
                    action: () =>
                      router.push(
                        `/doctor/prescriptions/${prescriptionId}/edit`
                      ),
                    gradient: 'from-blue-600 to-indigo-600',
                  },
                  {
                    label: 'Print / Save PDF',
                    icon: FiDownload,
                    action: handleDownload,
                    gradient: 'from-green-600 to-emerald-600',
                  },
                  {
                    label: 'Share Prescription',
                    icon: FiShare2,
                    action: handleShare,
                    gradient: 'from-purple-600 to-pink-600',
                  },
                  {
                    label: 'Print Preview',
                    icon: FiPrinter,
                    action: handlePrint,
                    gradient: 'from-slate-600 to-slate-700',
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.action}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r ${item.gradient} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all`}
                    >
                      <Icon className='w-5 h-5' />
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Patient Quick Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className='bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 p-6'
            >
              <h3 className='font-bold text-blue-900 mb-4 flex items-center gap-2'>
                <FiUser className='w-5 h-5' />
                Patient Quick Info
              </h3>
              <div className='space-y-3'>
                {[
                  {
                    label: 'Age',
                    value: `${calculateAge(prescription.patientId.dateOfBirth)} years`,
                  },
                  { label: 'Gender', value: prescription.patientId.gender },
                  {
                    label: 'Allergies',
                    value: prescription.patientId.allergies?.length || 0,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center py-2'
                  >
                    <span className='text-sm font-medium text-blue-700'>
                      {item.label}:
                    </span>
                    <span className='text-blue-900 font-bold'>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-area * {
            overflow: visible !important;
          }
          .print-area.grid {
            display: block !important;
          }
          /* Ensure logo text is visible in print if backgrounds are disabled */
          .text-transparent {
            color: #000 !important;
            background: none !important;
            -webkit-text-fill-color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
