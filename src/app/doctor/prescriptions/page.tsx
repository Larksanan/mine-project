/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiX,
  FiCalendar,
  FiUser,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiEye,
  FiEdit,
  FiPackage,
  FiTrendingUp,
  FiRefreshCw,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import { Prescription, PrescriptionFilters } from '@/types/Prescription';

export default function PrescriptionsPage() {
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<
    Prescription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<PrescriptionFilters>({
    status: '',
    patient: '',
    dateRange: {
      start: '',
      end: '',
    },
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters, prescriptions]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/doctor/prescriptions');

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const result = await response.json();

      if (result.success) {
        setPrescriptions(result.data);
        setFilteredPrescriptions(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    if (searchTerm) {
      filtered = filtered.filter(
        prescription =>
          prescription.patientId.firstName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          prescription.patientId.lastName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          prescription.diagnosis
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          prescription.medications.some(med =>
            med.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (filters.status) {
      filtered = filtered.filter(
        prescription => prescription.status === filters.status
      );
    }

    if (filters.patient) {
      filtered = filtered.filter(
        prescription => prescription.patientId._id === filters.patient
      );
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(
        prescription =>
          new Date(prescription.startDate) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(
        prescription =>
          new Date(prescription.startDate) <= new Date(filters.dateRange.end)
      );
    }

    setFilteredPrescriptions(filtered);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      patient: '',
      dateRange: {
        start: '',
        end: '',
      },
    });
    setSearchTerm('');
  };

  const getUniquePatients = () => {
    const patientsMap = new Map();
    prescriptions.forEach(prescription => {
      patientsMap.set(prescription.patientId._id, prescription.patientId);
    });
    return Array.from(patientsMap.values());
  };

  const getStats = () => {
    return {
      total: prescriptions.length,
      active: prescriptions.filter(p => p.status === 'ACTIVE').length,
      completed: prescriptions.filter(p => p.status === 'COMPLETED').length,
      expired: prescriptions.filter(p => p.status === 'CANCELLED').length,
    };
  };

  const stats = getStats();

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;

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
            <div>
              <h1 className='text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
                Prescriptions
              </h1>
              <p className='text-slate-600 flex items-center gap-2'>
                <FiActivity className='w-4 h-4' />
                Manage and review patient prescriptions
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className='p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-200'
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
                onClick={() => router.push('/doctor/prescriptions/new')}
                className='flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all'
              >
                <FiPlus className='w-5 h-5' />
                New Prescription
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {[
            {
              label: 'Total',
              value: stats.total,
              icon: FiActivity,
              color: 'blue',
              gradient: 'from-blue-500 to-indigo-500',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: FiCheckCircle,
              color: 'green',
              gradient: 'from-green-500 to-emerald-500',
            },
            {
              label: 'Completed',
              value: stats.completed,
              icon: FiClock,
              color: 'purple',
              gradient: 'from-purple-500 to-pink-500',
            },
            {
              label: 'Expired',
              value: stats.expired,
              icon: FiAlertCircle,
              color: 'orange',
              gradient: 'from-orange-500 to-red-500',
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className='group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 overflow-hidden cursor-pointer'
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                <div className='relative'>
                  <div className='flex items-center justify-between mb-4'>
                    <div
                      className={`p-3 bg-linear-to-br ${stat.gradient} rounded-xl text-white shadow-lg`}
                    >
                      <Icon className='w-6 h-6' />
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                    >
                      <FiTrendingUp className='w-5 h-5 text-green-500' />
                    </motion.div>
                  </div>

                  <p className='text-sm font-medium text-slate-600 mb-1'>
                    {stat.label}
                  </p>
                  <p className='text-3xl font-bold text-slate-900'>
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='mb-6'
        >
          <div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6'>
            <div className='flex flex-col md:flex-row gap-4'>
              {/* Search */}
              <div className='flex-1 relative'>
                <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
                <input
                  type='text'
                  placeholder='Search by patient, diagnosis, or medication...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all'
                />
                {searchTerm && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setSearchTerm('')}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    <FiX className='w-4 h-4 text-slate-400' />
                  </motion.button>
                )}
              </div>

              {/* Filter Toggle */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className='flex items-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium'
              >
                <FiFilter className='w-5 h-5' />
                Filters
                {(filters.status ||
                  filters.patient ||
                  filters.dateRange.start) && (
                  <span className='px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full'>
                    Active
                  </span>
                )}
              </motion.button>

              {/* Clear Filters */}
              <AnimatePresence>
                {(searchTerm ||
                  filters.status ||
                  filters.patient ||
                  filters.dateRange.start) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearFilters}
                    className='px-6 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium border-2 border-red-200'
                  >
                    Clear All
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='mt-6 pt-6 border-t border-slate-200 overflow-hidden'
                >
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all'
                      >
                        <option value=''>All Status</option>
                        <option value='ACTIVE'>Active</option>
                        <option value='COMPLETED'>Completed</option>
                        <option value='EXPIRED'>Expired</option>
                        <option value='CANCELLED'>Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Patient
                      </label>
                      <select
                        value={filters.patient}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            patient: e.target.value,
                          }))
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all'
                      >
                        <option value=''>All Patients</option>
                        {getUniquePatients().map((patient: any) => (
                          <option key={patient._id} value={patient._id}>
                            {patient.firstName} {patient.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Date From
                      </label>
                      <input
                        type='date'
                        value={filters.dateRange.start}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              start: e.target.value,
                            },
                          }))
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all'
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Prescriptions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode='wait'>
            {filteredPrescriptions.length === 0 ? (
              <motion.div
                key='empty'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-12 text-center'
              >
                <div className='max-w-md mx-auto'>
                  <div className='p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center'>
                    <FiPackage className='w-10 h-10 text-slate-400' />
                  </div>
                  <h3 className='text-2xl font-bold text-slate-900 mb-2'>
                    {searchTerm ||
                    filters.status ||
                    filters.patient ||
                    filters.dateRange.start
                      ? 'No prescriptions found'
                      : 'No prescriptions yet'}
                  </h3>
                  <p className='text-slate-600 mb-6'>
                    {searchTerm ||
                    filters.status ||
                    filters.patient ||
                    filters.dateRange.start
                      ? 'Try adjusting your search or filters'
                      : 'Get started by creating your first prescription'}
                  </p>
                  {!(
                    searchTerm ||
                    filters.status ||
                    filters.patient ||
                    filters.dateRange.start
                  ) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/doctor/prescriptions/new')}
                      className='inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'
                    >
                      <FiPlus className='w-5 h-5' />
                      Create First Prescription
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className='space-y-4'>
                {filteredPrescriptions.map((prescription, index) => (
                  <PrescriptionCard
                    key={prescription._id}
                    prescription={prescription}
                    index={index}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Summary */}
        {filteredPrescriptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='mt-6 text-center text-sm text-slate-600'
          >
            Showing{' '}
            <span className='font-semibold text-slate-900'>
              {filteredPrescriptions.length}
            </span>{' '}
            of{' '}
            <span className='font-semibold text-slate-900'>
              {prescriptions.length}
            </span>{' '}
            prescriptions
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Enhanced Prescription Card Component
const PrescriptionCard = ({
  prescription,
  index,
}: {
  prescription: Prescription;
  index: number;
}) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { label: string; bg: string; text: string; icon: any }
    > = {
      ACTIVE: {
        label: 'Active',
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: FiCheckCircle,
      },
      COMPLETED: {
        label: 'Completed',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: FiCheckCircle,
      },
      EXPIRED: {
        label: 'Expired',
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: FiAlertCircle,
      },
      CANCELLED: {
        label: 'Cancelled',
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: FiX,
      },
    };
    return configs[status] || configs.ACTIVE;
  };

  const statusConfig = getStatusConfig(prescription.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className='group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-slate-200/50 overflow-hidden transition-all duration-300 cursor-pointer'
      onClick={() => router.push(`/doctor/prescriptions/${prescription._id}`)}
    >
      <div className='p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div className='flex items-start gap-4 flex-1'>
            <div className='p-3 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl text-white shadow-lg'>
              <FiUser className='w-6 h-6' />
            </div>

            <div className='flex-1'>
              <h3 className='text-xl font-bold text-slate-900 mb-1'>
                {prescription.patientId?.firstName || 'Unknown'}{' '}
                {prescription.patientId?.lastName || ''}
              </h3>
              <p className='text-sm text-slate-600 mb-2'>
                {prescription.diagnosis}
              </p>

              <div className='flex flex-wrap items-center gap-3 text-sm text-slate-500'>
                <span className='flex items-center gap-1'>
                  <FiCalendar className='w-4 h-4' />
                  {new Date(prescription.startDate).toLocaleDateString()}
                </span>
                <span className='flex items-center gap-1'>
                  <FiPackage className='w-4 h-4' />
                  {prescription.medications.length} medication(s)
                </span>
              </div>
            </div>
          </div>

          <div className='flex flex-col items-end gap-3'>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 ${statusConfig.bg} rounded-lg`}
            >
              <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
              <span className={`text-sm font-semibold ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            </div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className='flex items-center gap-2'
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={e => {
                      e.stopPropagation();
                      router.push(`/doctor/prescriptions/${prescription._id}`);
                    }}
                    className='p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors'
                  >
                    <FiEye className='w-4 h-4' />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={e => {
                      e.stopPropagation();
                      router.push(
                        `/doctor/prescriptions/${prescription._id}/edit`
                      );
                    }}
                    className='p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors'
                  >
                    <FiEdit className='w-4 h-4' />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Medications Preview */}
        {prescription.medications.length > 0 && (
          <div className='mt-4 pt-4 border-t border-slate-200'>
            <div className='flex flex-wrap gap-2'>
              {prescription.medications.slice(0, 3).map((med, idx) => (
                <span
                  key={idx}
                  className='px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-lg font-medium'
                >
                  {med.name}
                </span>
              ))}
              {prescription.medications.length > 3 && (
                <span className='px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg font-medium'>
                  +{prescription.medications.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hover Gradient Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className='absolute inset-0 bg-linear-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none'
      />
    </motion.div>
  );
};
