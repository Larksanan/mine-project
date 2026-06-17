/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiPackage,
  FiPrinter,
  FiShare2,
  FiRefreshCw,
  FiHeart,
  FiDroplet,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

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
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  specialty?: string;
  phone?: string;
  address?: string;
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
  doctorId: Doctor;
  createdAt: string;
  updatedAt: string;
}

const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; icon: any; border: string }
  > = {
    ACTIVE: {
      label: 'Active',
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: FiCheckCircle,
      border: 'border-green-200',
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: FiCheckCircle,
      border: 'border-blue-200',
    },
    EXPIRED: {
      label: 'Expired',
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      icon: FiAlertCircle,
      border: 'border-orange-200',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: FiX,
      border: 'border-red-200',
    },
  };
  return configs[status] || configs.ACTIVE;
};

// Helper function to get doctor name
const getDoctorName = (doctor: Doctor | undefined) => {
  if (!doctor) return 'Unknown Doctor';
  if (doctor.firstName && doctor.lastName) {
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  }
  if (doctor.firstName) {
    return `Dr. ${doctor.firstName}`;
  }
  if (doctor.email) {
    return doctor.email.split('@')[0];
  }
  return 'Unknown Doctor';
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/doctor/prescriptions/patient/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch prescription');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch prescription');
      }

      setPrescription(result.data);
    } catch (err: any) {
      console.error('Error fetching prescription:', err);
      setError(err.message || 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPrescription();
    }
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescription();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prescription Details',
          text: `Prescription #${prescription?.prescriptionNumber}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  if (!prescription) {
    return (
      <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center'>
        <div className='text-center'>
          <FiPackage className='w-16 h-16 text-slate-400 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>
            Prescription Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            The prescription you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <button
            onClick={() => router.push('/patient/prescriptions')}
            className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(prescription.status);
  const StatusIcon = statusConfig.icon;
  const doctorName = getDoctorName(prescription.doctorId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = () => {
    if (prescription.endDate) {
      return new Date(prescription.endDate) < new Date();
    }
    return false;
  };

  const getDaysRemaining = () => {
    if (prescription.endDate) {
      const end = new Date(prescription.endDate);
      const today = new Date();
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Animated background blobs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className='absolute -top-40 -right-40 w-96 h-96 bg-linear-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl'
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className='absolute -bottom-40 -left-40 w-96 h-96 bg-linear-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl'
        />
      </div>

      <div className='relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header with back button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-6'
        >
          <div className='flex items-center justify-between'>
            <button
              onClick={() => router.back()}
              className='flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200'
            >
              <FiArrowLeft className='w-5 h-5' />
              Back
            </button>

            <div className='flex items-center gap-2'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className='p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-md transition-all border border-slate-200'
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : {}}
                  transition={{
                    duration: 1,
                    repeat: refreshing ? Infinity : 0,
                    ease: 'linear',
                  }}
                >
                  <FiRefreshCw className='w-5 h-5' />
                </motion.div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className='p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-md transition-all border border-slate-200'
              >
                <FiPrinter className='w-5 h-5' />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className='p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-md transition-all border border-slate-200'
              >
                <FiShare2 className='w-5 h-5' />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className='space-y-6'>
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
          >
            <div className='p-6 md:p-8'>
              <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div
                      className={`p-2 ${statusConfig.bg} rounded-lg ${statusConfig.border} border`}
                    >
                      <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
                    </div>
                    <span
                      className={`px-3 py-1 ${statusConfig.bg} ${statusConfig.text} rounded-full text-sm font-semibold`}
                    >
                      {statusConfig.label}
                    </span>
                    {prescription.status === 'ACTIVE' && daysRemaining && (
                      <span className='px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold'>
                        {daysRemaining} days remaining
                      </span>
                    )}
                    {isExpired() && (
                      <span className='px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold'>
                        Expired
                      </span>
                    )}
                  </div>

                  <h1 className='text-2xl md:text-3xl font-bold text-slate-900 mb-2'>
                    Prescription #{prescription.prescriptionNumber}
                  </h1>
                  <p className='text-slate-600 text-lg'>
                    {prescription.diagnosis}
                  </p>
                </div>

                <div className='text-left md:text-right'>
                  <p className='text-sm text-slate-500 mb-1'>Issued on</p>
                  <p className='font-semibold text-slate-700'>
                    {formatDate(prescription.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Doctor Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
          >
            <div className='p-6 md:p-8'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <FiUser className='w-5 h-5 text-blue-600' />
                </div>
                <h2 className='text-xl font-bold text-slate-900'>
                  Prescribing Doctor
                </h2>
              </div>

              <div className='flex flex-col md:flex-row gap-6'>
                <div className='flex-1'>
                  <div className='mb-4'>
                    <p className='text-sm text-slate-500 mb-1'>Doctor Name</p>
                    <p className='font-semibold text-slate-900 text-lg'>
                      {doctorName}
                    </p>
                  </div>
                  {prescription.doctorId?.specialty && (
                    <div className='mb-4'>
                      <p className='text-sm text-slate-500 mb-1'>Specialty</p>
                      <p className='text-slate-700'>
                        {prescription.doctorId.specialty}
                      </p>
                    </div>
                  )}
                </div>

                <div className='flex-1'>
                  {prescription.doctorId?.email && (
                    <div className='mb-4'>
                      <p className='text-sm text-slate-500 mb-1 flex items-center gap-1'>
                        <FiMail className='w-4 h-4' /> Email
                      </p>
                      <p className='text-slate-700'>
                        {prescription.doctorId.email}
                      </p>
                    </div>
                  )}
                  {prescription.doctorId?.phone && (
                    <div className='mb-4'>
                      <p className='text-sm text-slate-500 mb-1 flex items-center gap-1'>
                        <FiPhone className='w-4 h-4' /> Phone
                      </p>
                      <p className='text-slate-700'>
                        {prescription.doctorId.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Prescription Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
          >
            <div className='p-6 md:p-8'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <FiFileText className='w-5 h-5 text-purple-600' />
                </div>
                <h2 className='text-xl font-bold text-slate-900'>
                  Prescription Details
                </h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <p className='text-sm text-slate-500 mb-1 flex items-center gap-1'>
                    <FiCalendar className='w-4 h-4' /> Start Date
                  </p>
                  <p className='font-semibold text-slate-700'>
                    {formatDate(prescription.startDate)}
                  </p>
                </div>
                {prescription.endDate && (
                  <div>
                    <p className='text-sm text-slate-500 mb-1 flex items-center gap-1'>
                      <FiClock className='w-4 h-4' /> End Date
                    </p>
                    <p className='font-semibold text-slate-700'>
                      {formatDate(prescription.endDate)}
                    </p>
                  </div>
                )}
              </div>

              {prescription.notes && (
                <div className='mt-6 pt-6 border-t border-slate-200'>
                  <p className='text-sm text-slate-500 mb-2'>
                    Additional Notes
                  </p>
                  <p className='text-slate-700 bg-slate-50 p-4 rounded-lg'>
                    {prescription.notes}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Medications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
          >
            <div className='p-6 md:p-8'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <FiPackage className='w-5 h-5 text-green-600' />
                </div>
                <h2 className='text-xl font-bold text-slate-900'>
                  Medications ({prescription.medications.length})
                </h2>
              </div>

              <div className='space-y-4'>
                {prescription.medications.map((medication, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className='border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow'
                  >
                    <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <FiDroplet className='w-4 h-4 text-blue-500' />
                          <h3 className='text-lg font-bold text-slate-900'>
                            {medication.name}
                          </h3>
                          <span className='px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full'>
                            {medication.dosage}
                          </span>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-3'>
                          <div>
                            <p className='text-xs text-slate-500 mb-1'>
                              Frequency
                            </p>
                            <p className='text-sm font-medium text-slate-700'>
                              {medication.frequency}
                            </p>
                          </div>
                          <div>
                            <p className='text-xs text-slate-500 mb-1'>
                              Duration
                            </p>
                            <p className='text-sm font-medium text-slate-700'>
                              {medication.duration}
                            </p>
                          </div>
                          <div>
                            <p className='text-xs text-slate-500 mb-1'>
                              Quantity
                            </p>
                            <p className='text-sm font-medium text-slate-700'>
                              {medication.quantity} units
                            </p>
                          </div>
                          <div>
                            <p className='text-xs text-slate-500 mb-1'>
                              Refills
                            </p>
                            <p className='text-sm font-medium text-slate-700'>
                              {medication.refills} remaining
                            </p>
                          </div>
                        </div>

                        {medication.instructions && (
                          <div className='mt-3 pt-3 border-t border-slate-100'>
                            <p className='text-xs text-slate-500 mb-1 flex items-center gap-1'>
                              <FiHeart className='w-3 h-3' /> Instructions
                            </p>
                            <p className='text-sm text-slate-700'>
                              {medication.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Footer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden'
          >
            <div className='p-6 md:p-8'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-sm'>
                <div>
                  <p className='text-slate-500 mb-1'>Prescription ID</p>
                  <p className='font-mono text-slate-700'>{prescription._id}</p>
                </div>
                <div>
                  <p className='text-slate-500 mb-1'>Last Updated</p>
                  <p className='text-slate-700'>
                    {formatDateTime(prescription.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Important Notes */}
              <div className='mt-6 pt-6 border-t border-slate-200'>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <div className='flex items-start gap-3'>
                    <FiAlertCircle className='w-5 h-5 text-yellow-600 mt-0.5' />
                    <div>
                      <p className='font-semibold text-yellow-800 mb-1'>
                        Important Information
                      </p>
                      <ul className='text-sm text-yellow-700 space-y-1 list-disc list-inside'>
                        <li>
                          Always take medication as prescribed by your doctor
                        </li>
                        <li>Do not exceed the recommended dosage</li>
                        <li>
                          Contact your doctor immediately if you experience any
                          side effects
                        </li>
                        <li>Keep this prescription for your records</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
