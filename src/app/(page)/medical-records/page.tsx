/* eslint-disable no-undef */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiFileText,
  FiFilter,
  FiHeart,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUser,
  FiX,
  FiAlertTriangle,
} from 'react-icons/fi';
import {
  useMedicalHistory,
  useMedicalHistoryById,
  useMedicalHistoryActions,
  useMedicalHistoryStatus,
} from '@/hooks/useMedicalHistory';
import type {
  MedicalHistoryRecord,
  MedicalHistoryStatus,
  MedicalHistorySeverity,
} from '@/types/medicalHistory';

const SEVERITY_CONFIG = {
  mild: {
    label: 'Mild',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: FiCheckCircle,
  },
  moderate: {
    label: 'Moderate',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: FiAlertCircle,
  },
  severe: {
    label: 'Severe',
    color: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    icon: FiAlertTriangle,
  },
};

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-blue-100 text-blue-800',
    icon: FiActivity,
  },
  chronic: {
    label: 'Chronic',
    color: 'bg-purple-100 text-purple-800',
    icon: FiHeart,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-800',
    icon: FiCheckCircle,
  },
};

export default function MedicalRecordsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Filters
  const [nic, setNic] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nic: '',
    condition: '',
    diagnosisDate: '',
    status: 'active' as MedicalHistoryStatus,
    severity: 'mild' as MedicalHistorySeverity,
    symptoms: '',
    treatment: '',
    medications: '',
    notes: '',
  });

  // API hooks
  const {
    data: records,
    loading,
    pagination,
    refetch,
  } = useMedicalHistory({
    nic: nic || undefined,
    severity: (severityFilter as MedicalHistorySeverity) || undefined,
    status: (statusFilter as MedicalHistoryStatus) || undefined,
    page: currentPage,
    limit: 10,
  });

  const { data: selectedRecord } = useMedicalHistoryById(selectedRecordId);
  const { create, update, remove, creating, updating, deleting } =
    useMedicalHistoryActions();

  // Get status summary for stats
  const { statusData } = useMedicalHistoryStatus(nic || null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/dashboard/doctor/medicalHistory');
      return;
    }

    if (session.user?.role !== 'DOCTOR') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Helper function to format date for display
  const formatDate = (dateInput: Date | string | undefined) => {
    if (!dateInput) return 'N/A';
    const date =
      typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format date for input field
  const formatDateForInput = (dateInput: Date | string | undefined) => {
    if (!dateInput) return '';
    const date =
      typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toISOString().split('T')[0];
  };

  // Helper to get today's date in YYYY-MM-DD format for max date attribute
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Filter records by search term (client-side filtering)
  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.condition.toLowerCase().includes(search) ||
      (record.nic && record.nic.toLowerCase().includes(search)) ||
      (record.description &&
        record.description.toLowerCase().includes(search)) ||
      (record.treatment && record.treatment.toLowerCase().includes(search)) ||
      (record.notes && record.notes.toLowerCase().includes(search))
    );
  });

  // Further filter by severity (client-side filtering)
  const finalRecords = severityFilter
    ? filteredRecords.filter(r => r.severity === severityFilter)
    : filteredRecords;

  // Calculate stats from statusData or from records
  const totalRecords = pagination?.total || 0;
  const activeCount =
    statusData?.counts?.active ||
    records.filter(r => r.status === 'active').length;
  const chronicCount =
    statusData?.counts?.chronic ||
    records.filter(r => r.status === 'chronic').length;
  const severeCount =
    statusData?.severity?.severe ||
    records.filter(r => r.severity === 'severe').length;

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const medicationsArray = formData.medications
        ? formData.medications.split(',').map(m => m.trim())
        : [];

      await create({
        nic: formData.nic,
        condition: formData.condition,
        diagnosisDate: formData.diagnosisDate,
        status: formData.status,
        severity: formData.severity,
        description: formData.symptoms, // Map symptoms to description
        treatment: formData.treatment,
        medications: medicationsArray,
        notes: formData.notes,
      });

      setSuccessMessage('Medical record created successfully!');
      setShowCreateModal(false);
      resetForm();
      refetch();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error creating medical record:', err);
      setErrorMessage('Failed to create medical record');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;

    try {
      const medicationsArray = formData.medications
        ? formData.medications.split(',').map(m => m.trim())
        : [];

      await update(selectedRecordId, {
        condition: formData.condition,
        diagnosisDate: formData.diagnosisDate,
        status: formData.status,
        severity: formData.severity,
        description: formData.symptoms,
        treatment: formData.treatment,
        medications: medicationsArray,
        notes: formData.notes,
      });

      setSuccessMessage('Medical record updated successfully!');
      setShowEditModal(false);
      resetForm();
      refetch();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating medical record:', err);
      setErrorMessage('Failed to update medical record');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medical record?'))
      return;

    try {
      await remove(id);
      setSuccessMessage('Medical record deleted successfully!');
      refetch();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting medical record:', error);
      setErrorMessage('Failed to delete medical record');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleViewRecord = (record: MedicalHistoryRecord) => {
    setSelectedRecordId(record._id);
    setShowViewModal(true);
  };

  const handleEditRecord = (record: MedicalHistoryRecord) => {
    setSelectedRecordId(record._id);
    setFormData({
      nic: record.nic || '',
      condition: record.condition,
      diagnosisDate: formatDateForInput(record.diagnosisDate),
      status: record.status,
      severity: record.severity,
      symptoms: record.description || record.symptoms || '',
      treatment: record.treatment || '',
      medications: record.medications?.join(', ') || '',
      notes: record.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      nic: '',
      condition: '',
      diagnosisDate: '',
      status: 'active',
      severity: 'mild',
      symptoms: '',
      treatment: '',
      medications: '',
      notes: '',
    });
    setSelectedRecordId(null);
  };

  // Clear filters
  const clearFilters = () => {
    setNic('');
    setStatusFilter('');
    setSeverityFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (status === 'loading' || (loading && records.length === 0 && !nic)) {
    return (
      <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center'>
        <div className='text-center'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4'
          />
          <p className='text-gray-600 font-medium'>
            Loading medical records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden'>
      {/* Animated Background Elements */}
      <div className='fixed inset-0 pointer-events-none'>
        <motion.div
          className='absolute top-0 right-0 w-200 h-200 bg-linear-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl'
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className='absolute bottom-0 left-0 w-200 h-200 bg-linear-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl'
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      {/* Main Content */}
      <div className='relative z-10 max-w-7xl mx-auto px-4 py-8'>
        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='mb-6 bg-linear-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl'
            >
              <FiCheckCircle className='w-5 h-5' />
              {successMessage}
            </motion.div>
          )}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='mb-6 bg-linear-to-r from-rose-500 to-red-500 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl'
            >
              <FiAlertCircle className='w-5 h-5' />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
            <div>
              <h1 className='text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
                Medical Records
              </h1>
              <p className='text-gray-600 text-lg'>
                Comprehensive patient health history and diagnosis management
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`${
                  showFilters
                    ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300'
                } px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg`}
              >
                <FiFilter className='w-5 h-5' />
                Filters
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refetch}
                className='bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all border-2 border-gray-300 shadow-lg'
              >
                <FiRefreshCw className='w-5 h-5' />
                Refresh
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className='bg-linear-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg'
              >
                <FiPlus className='w-5 h-5' />
                New Record
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          {[
            {
              label: 'Total Records',
              value: totalRecords,
              icon: FiFileText,
              gradient: 'from-blue-500 via-indigo-500 to-purple-500',
              change: `${finalRecords.length} shown`,
            },
            {
              label: 'Active Cases',
              value: activeCount,
              icon: FiActivity,
              gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
              change: 'Ongoing treatment',
            },
            {
              label: 'Chronic Conditions',
              value: chronicCount,
              icon: FiHeart,
              gradient: 'from-purple-500 via-pink-500 to-rose-500',
              change: 'Long-term care',
            },
            {
              label: 'Severe Cases',
              value: severeCount,
              icon: FiAlertTriangle,
              gradient: 'from-rose-500 via-red-500 to-orange-500',
              change: 'Needs attention',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className='relative group'
            >
              <div
                className={`absolute inset-0 bg-linear-to-br ${stat.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}
              />
              <div className='relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-white shadow-xl'>
                <div className='flex items-center justify-between mb-4'>
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className='w-6 h-6 text-white' />
                  </div>
                  <span className='text-sm font-medium text-gray-500'>
                    {stat.change}
                  </span>
                </div>
                <div className='text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1'>
                  {stat.value}
                </div>
                <div className='text-sm text-gray-600 font-medium'>
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='overflow-hidden mb-8'
            >
              <div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-white'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                  {/* NIC Filter */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Patient NIC
                    </label>
                    <input
                      type='text'
                      placeholder='Enter patient NIC...'
                      value={nic}
                      onChange={e => {
                        setNic(e.target.value);
                        setCurrentPage(1);
                      }}
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={e => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                    >
                      <option value=''>All Status</option>
                      <option value='active'>Active</option>
                      <option value='chronic'>Chronic</option>
                      <option value='resolved'>Resolved</option>
                    </select>
                  </div>

                  {/* Severity Filter */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Severity
                    </label>
                    <select
                      value={severityFilter}
                      onChange={e => {
                        setSeverityFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                    >
                      <option value=''>All Severity</option>
                      <option value='mild'>Mild</option>
                      <option value='moderate'>Moderate</option>
                      <option value='severe'>Severe</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Search
                    </label>
                    <div className='relative'>
                      <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                      <input
                        type='text'
                        placeholder='Search records...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className='w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {(nic || statusFilter || severityFilter || searchTerm) && (
                  <div className='mt-4 flex justify-end'>
                    <button
                      onClick={clearFilters}
                      className='text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2'
                    >
                      <FiX className='w-4 h-4' />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Records List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-white'
        >
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold text-gray-900'>
              Medical History Records
            </h2>
            <div className='text-sm text-gray-600 font-medium'>
              Showing {finalRecords.length} of {pagination?.total || 0} records
            </div>
          </div>

          {finalRecords.length === 0 ? (
            <div className='text-center py-16'>
              <div className='w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4'>
                <FiFileText className='w-10 h-10 text-blue-600' />
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-2'>
                No medical records found
              </h3>
              <p className='text-gray-500 mb-6'>
                {searchTerm || nic || statusFilter || severityFilter
                  ? 'Try adjusting your filters or search criteria'
                  : 'Start by creating a new medical record'}
              </p>
              {!searchTerm && !nic && !statusFilter && !severityFilter && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className='bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg'
                >
                  <FiPlus className='w-5 h-5' />
                  Create First Record
                </motion.button>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              {finalRecords.map((record, index) => {
                const severityConfig =
                  SEVERITY_CONFIG[
                    record.severity as keyof typeof SEVERITY_CONFIG
                  ] || SEVERITY_CONFIG.mild;
                const statusConfig =
                  STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG] ||
                  STATUS_CONFIG.active;
                const SeverityIcon = severityConfig.icon;
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={record._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className='group relative'
                  >
                    {/* Severity indicator bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b ${severityConfig.color} rounded-l-xl`}
                    />

                    <div
                      className={`${severityConfig.bgColor} ${severityConfig.borderColor} border-2 rounded-xl p-6 hover:shadow-lg transition-all ml-1`}
                    >
                      <div className='flex flex-col lg:flex-row lg:items-start gap-6'>
                        {/* Main Info */}
                        <div className='flex-1'>
                          <div className='flex items-start justify-between mb-4'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-3 mb-2'>
                                <h3 className='text-xl font-bold text-gray-900'>
                                  {record.condition}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig.color}`}
                                >
                                  <StatusIcon className='w-3 h-3' />
                                  {statusConfig.label}
                                </span>
                              </div>

                              {record.nic && (
                                <div className='flex items-center gap-2 text-gray-600 mb-2'>
                                  <FiUser className='w-4 h-4' />
                                  <span className='text-sm font-medium'>
                                    Patient NIC: {record.nic}
                                  </span>
                                </div>
                              )}

                              <div className='flex items-center gap-4 text-sm text-gray-600'>
                                <div className='flex items-center gap-2'>
                                  <FiCalendar className='w-4 h-4' />
                                  <span>
                                    Diagnosed:{' '}
                                    {formatDate(record.diagnosisDate)}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <SeverityIcon
                                    className={`w-4 h-4 ${severityConfig.textColor}`}
                                  />
                                  <span
                                    className={`font-semibold ${severityConfig.textColor}`}
                                  >
                                    {severityConfig.label} Severity
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Description/Symptoms */}
                          {record.description && (
                            <div className='mb-3'>
                              <div className='text-xs font-semibold text-gray-500 mb-1'>
                                Symptoms / Description
                              </div>
                              <p className='text-sm text-gray-700 line-clamp-2'>
                                {record.description}
                              </p>
                            </div>
                          )}

                          {/* Treatment */}
                          {record.treatment && (
                            <div className='mb-3'>
                              <div className='text-xs font-semibold text-gray-500 mb-1'>
                                Treatment
                              </div>
                              <p className='text-sm text-gray-700 line-clamp-2'>
                                {record.treatment}
                              </p>
                            </div>
                          )}

                          {/* Medications */}
                          {record.medications &&
                            record.medications.length > 0 && (
                              <div>
                                <div className='text-xs font-semibold text-gray-500 mb-2'>
                                  Medications
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                  {record.medications.map((med, idx) => (
                                    <span
                                      key={idx}
                                      className='px-3 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200'
                                    >
                                      {med}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className='flex lg:flex-col gap-2'>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewRecord(record)}
                            className='px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors shadow-sm'
                          >
                            <FiEye className='w-4 h-4' />
                            <span className='hidden lg:inline'>View</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditRecord(record)}
                            className='px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors shadow-sm'
                          >
                            <FiEdit2 className='w-4 h-4' />
                            <span className='hidden lg:inline'>Edit</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteRecord(record._id)}
                            disabled={deleting}
                            className='px-4 py-2 bg-white border-2 border-rose-200 text-rose-700 rounded-lg font-semibold hover:bg-rose-50 flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50'
                          >
                            <FiTrash2 className='w-4 h-4' />
                            <span className='hidden lg:inline'>Delete</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className='flex justify-center mt-8 gap-2'>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className='px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors'
              >
                Previous
              </button>

              {[...Array(pagination.pages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.pages ||
                  Math.abs(page - currentPage) <= 2
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'border-2 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 3 ||
                  page === currentPage + 3
                ) {
                  return (
                    <span key={page} className='px-2 text-gray-500'>
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() =>
                  setCurrentPage(prev => Math.min(pagination.pages, prev + 1))
                }
                disabled={currentPage === pagination.pages}
                className='px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors'
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className='sticky top-0 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl'>
                <div className='flex justify-between items-center'>
                  <div>
                    <h2 className='text-2xl font-bold mb-1'>
                      {showCreateModal
                        ? 'Create New Medical Record'
                        : 'Edit Medical Record'}
                    </h2>
                    <p className='text-blue-100'>
                      {showCreateModal
                        ? 'Add a new patient health record'
                        : 'Update existing medical information'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                  >
                    <FiX className='w-6 h-6' />
                  </button>
                </div>
              </div>

              {/* Modal Form */}
              <form
                onSubmit={
                  showCreateModal ? handleCreateRecord : handleUpdateRecord
                }
                className='p-6 space-y-6'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* NIC */}
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Patient NIC *
                    </label>
                    <input
                      type='text'
                      value={formData.nic}
                      onChange={e =>
                        setFormData({ ...formData, nic: e.target.value })
                      }
                      required
                      disabled={showEditModal} // Disable NIC editing
                      placeholder='Enter patient NIC'
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed'
                    />
                    {showEditModal && (
                      <p className='text-xs text-gray-500 mt-1'>
                        NIC cannot be changed. Create a new record if needed.
                      </p>
                    )}
                  </div>

                  {/* Condition */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Condition *
                    </label>
                    <input
                      type='text'
                      value={formData.condition}
                      onChange={e =>
                        setFormData({ ...formData, condition: e.target.value })
                      }
                      required
                      placeholder='e.g., Hypertension, Diabetes'
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                    />
                  </div>

                  {/* Diagnosis Date */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Diagnosis Date *
                    </label>
                    <input
                      type='date'
                      value={formData.diagnosisDate}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          diagnosisDate: e.target.value,
                        })
                      }
                      required
                      max={getTodayString()}
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          status: e.target.value as MedicalHistoryStatus,
                        })
                      }
                      required
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                    >
                      <option value='active'>Active</option>
                      <option value='chronic'>Chronic</option>
                      <option value='resolved'>Resolved</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Severity *
                    </label>
                    <select
                      value={formData.severity}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          severity: e.target.value as MedicalHistorySeverity,
                        })
                      }
                      required
                      className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                    >
                      <option value='mild'>Mild</option>
                      <option value='moderate'>Moderate</option>
                      <option value='severe'>Severe</option>
                    </select>
                  </div>
                </div>

                {/* Symptoms/Description */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Symptoms / Description
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={e =>
                      setFormData({ ...formData, symptoms: e.target.value })
                    }
                    rows={3}
                    placeholder='Describe patient symptoms...'
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                  />
                </div>

                {/* Treatment */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Treatment Plan
                  </label>
                  <textarea
                    value={formData.treatment}
                    onChange={e =>
                      setFormData({ ...formData, treatment: e.target.value })
                    }
                    rows={3}
                    placeholder='Describe treatment plan...'
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                  />
                </div>

                {/* Medications */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Medications
                  </label>
                  <input
                    type='text'
                    value={formData.medications}
                    onChange={e =>
                      setFormData({ ...formData, medications: e.target.value })
                    }
                    placeholder='Comma-separated list of medications'
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Example: Aspirin 100mg, Lisinopril 10mg, Metformin 500mg
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={e =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder='Any additional notes or observations...'
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                  />
                </div>

                {/* Form Actions */}
                <div className='flex justify-end gap-3 pt-4 border-t-2 border-gray-200'>
                  <motion.button
                    type='button'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className='px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type='submit'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={creating || updating}
                    className='px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg'
                  >
                    {creating || updating ? (
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
                        {showCreateModal ? 'Creating...' : 'Updating...'}
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className='w-5 h-5' />
                        {showCreateModal ? 'Create Record' : 'Update Record'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => {
              setShowViewModal(false);
              setSelectedRecordId(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className={`sticky top-0 bg-linear-to-r ${
                  (
                    SEVERITY_CONFIG[
                      selectedRecord.severity as keyof typeof SEVERITY_CONFIG
                    ] || SEVERITY_CONFIG.mild
                  ).color
                } text-white p-6 rounded-t-2xl`}
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <h2 className='text-2xl font-bold mb-2'>
                      {selectedRecord.condition}
                    </h2>
                    <div className='flex items-center gap-3'>
                      <span className='px-3 py-1 bg-white/20 rounded-lg text-sm font-semibold'>
                        {
                          (
                            STATUS_CONFIG[
                              selectedRecord.status as keyof typeof STATUS_CONFIG
                            ] || STATUS_CONFIG.active
                          ).label
                        }
                      </span>
                      <span className='px-3 py-1 bg-white/20 rounded-lg text-sm font-semibold'>
                        {
                          (
                            SEVERITY_CONFIG[
                              selectedRecord.severity as keyof typeof SEVERITY_CONFIG
                            ] || SEVERITY_CONFIG.mild
                          ).label
                        }{' '}
                        Severity
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedRecordId(null);
                    }}
                    className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                  >
                    <FiX className='w-6 h-6' />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className='p-6 space-y-6'>
                {/* Patient & Diagnosis Info */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <div className='text-xs font-semibold text-gray-500 mb-1'>
                      Patient NIC
                    </div>
                    <div className='text-lg font-bold text-gray-900'>
                      {selectedRecord.nic || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className='text-xs font-semibold text-gray-500 mb-1'>
                      Diagnosis Date
                    </div>
                    <div className='text-lg font-bold text-gray-900'>
                      {formatDate(selectedRecord.diagnosisDate)}
                    </div>
                  </div>
                </div>

                {/* Symptoms/Description */}
                {selectedRecord.description && (
                  <div className='bg-blue-50 rounded-xl p-4 border-2 border-blue-100'>
                    <div className='text-sm font-semibold text-blue-900 mb-2'>
                      Symptoms / Description
                    </div>
                    <p className='text-gray-700'>
                      {selectedRecord.description}
                    </p>
                  </div>
                )}

                {/* Treatment */}
                {selectedRecord.treatment && (
                  <div className='bg-indigo-50 rounded-xl p-4 border-2 border-indigo-100'>
                    <div className='text-sm font-semibold text-indigo-900 mb-2'>
                      Treatment Plan
                    </div>
                    <p className='text-gray-700'>{selectedRecord.treatment}</p>
                  </div>
                )}

                {/* Medications */}
                {selectedRecord.medications &&
                  selectedRecord.medications.length > 0 && (
                    <div className='bg-purple-50 rounded-xl p-4 border-2 border-purple-100'>
                      <div className='text-sm font-semibold text-purple-900 mb-3'>
                        Prescribed Medications
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {selectedRecord.medications.map((med, idx) => (
                          <span
                            key={idx}
                            className='px-4 py-2 bg-white rounded-lg text-sm font-medium text-purple-700 border-2 border-purple-200'
                          >
                            {med}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Notes */}
                {selectedRecord.notes && (
                  <div className='bg-gray-50 rounded-xl p-4 border-2 border-gray-200'>
                    <div className='text-sm font-semibold text-gray-900 mb-2'>
                      Additional Notes
                    </div>
                    <p className='text-gray-700'>{selectedRecord.notes}</p>
                  </div>
                )}

                {/* Record Info */}
                <div className='pt-4 border-t-2 border-gray-200'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-gray-500'>Created:</span>{' '}
                      <span className='font-medium text-gray-900'>
                        {formatDate(selectedRecord.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-500'>Last Updated:</span>{' '}
                      <span className='font-medium text-gray-900'>
                        {formatDate(selectedRecord.updatedAt)}
                      </span>
                    </div>
                  </div>
                  {selectedRecord.durationDays && (
                    <div className='mt-2 text-sm'>
                      <span className='text-gray-500'>Condition Duration:</span>{' '}
                      <span className='font-medium text-gray-900'>
                        {selectedRecord.durationDays} days
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className='sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex justify-end gap-3 border-t-2 border-gray-200'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRecordId(null);
                  }}
                  className='px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditRecord(selectedRecord);
                  }}
                  className='px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center gap-2 shadow-lg'
                >
                  <FiEdit2 className='w-5 h-5' />
                  Edit Record
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
