/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus as Plus,
  FiSearch as Search,
  FiFilter as Filter,
  FiUser as User,
  FiMail as Mail,
  FiPhone as Phone,
  FiClock as Clock,
  FiEdit2 as Edit,
  FiTrash2 as Trash,
  FiEye as View,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiAlertCircle as AlertCircle,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiDownload as Download,
  FiRefreshCw as Refresh,
} from 'react-icons/fi';
import Toast from '@/components/ui/Toast';
import Loading from '@/components/ui/Loading';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

interface Technician {
  _id: string;
  id: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  specialization: string[];
  qualification: string;
  yearsOfExperience: number;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_LEAVE';
  shift: 'GENERAL' | 'MORNING' | 'EVENING' | 'NIGHT';
  isAvailable: boolean;
  maxConcurrentTests: number;
  currentWorkload: number;
  performanceScore: number;
  efficiency: number;
  isLicenseExpired: boolean;
  certifications: string[];
  joinedDate: string;
  notes?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    nic: string;
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  technicians: Technician[];
  total: number;
}

const STATUS_CONFIG = {
  AVAILABLE: {
    color: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: '●',
    label: 'Available',
  },
  BUSY: {
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: '●',
    label: 'Busy',
  },
  OFFLINE: {
    color: 'slate',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: '●',
    label: 'Offline',
  },
  ON_LEAVE: {
    color: 'orange',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: '●',
    label: 'On Leave',
  },
};

const SHIFT_CONFIG = {
  GENERAL: { label: 'General', color: 'blue' },
  MORNING: { label: 'Morning', color: 'amber' },
  EVENING: { label: 'Evening', color: 'purple' },
  NIGHT: { label: 'Night', color: 'indigo' },
};

const SPECIALIZATIONS = [
  'All',
  'Hematology',
  'Clinical Chemistry',
  'Microbiology',
  'Immunology',
  'Pathology',
  'Cytology',
  'Molecular Biology',
  'Blood Bank',
  'General Laboratory',
];

export default function LabTechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedShift, setSelectedShift] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    technicianId: string | null;
    technicianName: string;
  }>({
    isOpen: false,
    technicianId: null,
    technicianName: '',
  });

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  // Fetch technicians
  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedSpecialization !== 'All' && {
          specialization: selectedSpecialization,
        }),
        ...(selectedStatus !== 'All' && { status: selectedStatus }),
        ...(selectedShift !== 'All' && { shift: selectedShift }),
      });

      const response = await fetch(`/api/lab/lab-technicians?${params}`);
      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch technicians');
      }

      if (result.success && result.technicians) {
        setTechnicians(result.technicians);
        setTotalItems(result.total);
      } else {
        setTechnicians([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load technicians');
      console.error('Error fetching technicians:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, [
    currentPage,
    limit,
    sortBy,
    sortOrder,
    searchTerm,
    selectedSpecialization,
    selectedStatus,
    selectedShift,
  ]);

  // Handle delete technician
  const handleDelete = async () => {
    if (!deleteModal.technicianId) return;

    try {
      const response = await fetch(
        `/api/lab/lab-technicians/${deleteModal.technicianId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete technician');
      }

      setToast({
        show: true,
        message: 'Technician deleted successfully',
        type: 'success',
      });

      // Refresh the list
      fetchTechnicians();
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to delete technician',
        type: 'error',
      });
    } finally {
      setDeleteModal({ isOpen: false, technicianId: null, technicianName: '' });
    }
  };

  // Handle export data
  const handleExport = () => {
    try {
      const dataToExport = technicians.map(t => ({
        Name: t.name,
        'Employee ID': t.employeeId,
        Email: t.email,
        Phone: t.phone,
        Specialization: t.specialization.join(', '),
        Qualification: t.qualification,
        'Years of Experience': t.yearsOfExperience,
        Status: t.status,
        Shift: t.shift,
        'Max Concurrent Tests': t.maxConcurrentTests,
        'Current Workload': t.currentWorkload,
        'Performance Score': `${t.performanceScore}%`,
        Efficiency: `${t.efficiency}%`,
        'License Expired': t.isLicenseExpired ? 'Yes' : 'No',
        'Joined Date': new Date(t.joinedDate).toLocaleDateString(),
        Certifications: t.certifications?.join(', ') || '',
      }));

      const csv = [
        Object.keys(dataToExport[0]).join(','),
        ...dataToExport.map(row =>
          Object.values(row)
            .map(value => `"${value}"`)
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `technicians-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setToast({
        show: true,
        message: 'Data exported successfully',
        type: 'success',
      });
    } catch (err) {
      setToast({
        show: true,
        message: 'Failed to export data',
        type: 'error',
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: Technician['status']) => {
    const config = STATUS_CONFIG[status];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}
      >
        <span className={`text-${config.color}-500 text-lg`}>
          {config.icon}
        </span>
        {config.label}
      </span>
    );
  };

  // Get shift badge
  const getShiftBadge = (shift: Technician['shift']) => {
    const config = SHIFT_CONFIG[shift];
    return (
      <span
        className={`px-2 py-1 bg-${config.color}-100 text-${config.color}-700 rounded-lg text-xs font-medium`}
      >
        {config.label}
      </span>
    );
  };

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-50'>
      {/* Decorative background elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse' />
        <div
          className='absolute top-40 -left-40 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse'
          style={{ animationDelay: '2s' }}
        />
        <div
          className='absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse'
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-10'
        >
          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-4xl font-bold text-slate-900 tracking-tight'>
                Laboratory Technicians
              </h1>
              <p className='mt-2 text-slate-600 text-lg'>
                Manage and monitor your laboratory staff
              </p>
            </div>
            <div className='flex gap-3'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                className='px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all flex items-center gap-2'
              >
                <Download className='w-5 h-5' />
                <span>Export</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchTechnicians}
                className='px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all flex items-center gap-2'
              >
                <Refresh className='w-5 h-5' />
                <span>Refresh</span>
              </motion.button>
              <Link href='/labtechnicians/new'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='px-6 py-3.5 bg-linear-to-r from-blue-500 to-teal-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-teal-600 flex items-center gap-2 shadow-xl shadow-blue-500/30'
                >
                  <Plus className='w-5 h-5' />
                  <span>Add Technician</span>
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mt-8'>
            {[
              {
                label: 'Total Technicians',
                value: totalItems,
                icon: User,
                color: 'blue',
              },
              {
                label: 'Available',
                value: technicians.filter(t => t.status === 'AVAILABLE').length,
                icon: CheckCircle,
                color: 'emerald',
              },
              {
                label: 'Busy',
                value: technicians.filter(t => t.status === 'BUSY').length,
                icon: Clock,
                color: 'amber',
              },
              {
                label: 'On Leave',
                value: technicians.filter(t => t.status === 'ON_LEAVE').length,
                icon: XCircle,
                color: 'orange',
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-slate-600 font-medium'>
                      {stat.label}
                    </p>
                    <p className='text-3xl font-bold text-slate-900 mt-2'>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='mb-6'
        >
          <div className='flex flex-col md:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search by name, email, or employee ID...'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className='w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium'
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3.5 border-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Filter className='w-5 h-5' />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mt-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-slate-200'
              >
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                  {/* Specialization Filter */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Specialization
                    </label>
                    <select
                      value={selectedSpecialization}
                      onChange={e => {
                        setSelectedSpecialization(e.target.value);
                        setCurrentPage(1);
                      }}
                      className='w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      {SPECIALIZATIONS.map(spec => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={e => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className='w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value='All'>All Status</option>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shift Filter */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Shift
                    </label>
                    <select
                      value={selectedShift}
                      onChange={e => {
                        setSelectedShift(e.target.value);
                        setCurrentPage(1);
                      }}
                      className='w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value='All'>All Shifts</option>
                      {Object.entries(SHIFT_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Sort By
                    </label>
                    <select
                      value={`${sortBy}:${sortOrder}`}
                      onChange={e => {
                        const [newSortBy, newSortOrder] =
                          e.target.value.split(':');
                        setSortBy(newSortBy);
                        setSortOrder(newSortOrder as 'asc' | 'desc');
                      }}
                      className='w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value='createdAt:desc'>Newest First</option>
                      <option value='createdAt:asc'>Oldest First</option>
                      <option value='name:asc'>Name (A-Z)</option>
                      <option value='name:desc'>Name (Z-A)</option>
                      <option value='yearsOfExperience:desc'>
                        Most Experienced
                      </option>
                      <option value='yearsOfExperience:asc'>
                        Least Experienced
                      </option>
                      <option value='performanceScore:desc'>
                        Highest Performance
                      </option>
                      <option value='currentWorkload:asc'>
                        Lowest Workload
                      </option>
                    </select>
                  </div>
                </div>

                {/* Items per page */}
                <div className='mt-4 pt-4 border-t border-slate-200'>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    Items per page
                  </label>
                  <select
                    value={limit}
                    onChange={e => {
                      setLimit(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className='w-32 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    {[5, 10, 20, 50, 100].map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Technicians List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 overflow-hidden'
        >
          {loading ? (
            <div className='py-20'>
              <Loading size='lg' fullScreen={false} />
            </div>
          ) : error ? (
            <div className='py-20 text-center'>
              <AlertCircle className='w-12 h-12 text-red-400 mx-auto mb-4' />
              <p className='text-red-600 font-medium'>{error}</p>
              <button
                onClick={fetchTechnicians}
                className='mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
              >
                Try Again
              </button>
            </div>
          ) : technicians.length === 0 ? (
            <div className='py-20 text-center'>
              <User className='w-12 h-12 text-slate-400 mx-auto mb-4' />
              <p className='text-slate-600 font-medium'>No technicians found</p>
              <Link href='/labtechnicians/new'>
                <button className='mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'>
                  Add Your First Technician
                </button>
              </Link>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-slate-50 border-b-2 border-slate-200'>
                  <tr>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-slate-600'>
                      Technician
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-slate-600'>
                      Contact
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-slate-600'>
                      Specialization
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-slate-600'>
                      Experience
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-slate-600'>
                      Workload
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-slate-600'>
                      Status/Shift
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-slate-600'>
                      Performance
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-slate-600'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {technicians.map((technician, index) => (
                    <motion.tr
                      key={technician._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className='hover:bg-slate-50 transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 bg-linear-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md'>
                            <User className='w-5 h-5 text-white' />
                          </div>
                          <div>
                            <p className='font-semibold text-slate-900'>
                              {technician.name}
                            </p>
                            <p className='text-sm text-slate-500'>
                              {technician.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <p className='text-sm text-slate-600 flex items-center gap-2'>
                            <Mail className='w-4 h-4 text-slate-400' />
                            {technician.email}
                          </p>
                          <p className='text-sm text-slate-600 flex items-center gap-2'>
                            <Phone className='w-4 h-4 text-slate-400' />
                            {technician.phone}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <p className='font-medium text-slate-900'>
                            {technician.specialization.join(', ')}
                          </p>
                          <p className='text-xs text-slate-500'>
                            {technician.qualification}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span className='px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200'>
                          {technician.yearsOfExperience} years
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <div className='w-16 h-2 bg-slate-200 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-blue-500 rounded-full'
                              style={{
                                width: `${(technician.currentWorkload / technician.maxConcurrentTests) * 100}%`,
                              }}
                            />
                          </div>
                          <span className='text-xs font-medium text-slate-600'>
                            {technician.currentWorkload}/
                            {technician.maxConcurrentTests}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-2'>
                          {getStatusBadge(technician.status)}
                          {getShiftBadge(technician.shift)}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`text-sm font-semibold ${
                              technician.performanceScore >= 80
                                ? 'text-emerald-600'
                                : technician.performanceScore >= 60
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {technician.performanceScore}%
                          </span>
                          {technician.isLicenseExpired && (
                            <span className='px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium'>
                              License Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <Link href={`/labtechnicians/${technician._id}`}>
                            <button className='p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all'>
                              <View className='w-5 h-5' />
                            </button>
                          </Link>
                          <Link href={`/labtechnicians/${technician._id}/edit`}>
                            <button className='p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all'>
                              <Edit className='w-5 h-5' />
                            </button>
                          </Link>
                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                technicianId: technician._id,
                                technicianName: technician.name,
                              })
                            }
                            className='p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all'
                          >
                            <Trash className='w-5 h-5' />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && technicians.length > 0 && (
            <div className='px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50'>
              <p className='text-sm text-slate-600'>
                Showing {(currentPage - 1) * limit + 1} to{' '}
                {Math.min(currentPage * limit, totalItems)} of {totalItems}{' '}
                technicians
              </p>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    currentPage === 1
                      ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-white'
                  }`}
                >
                  <ChevronLeft className='w-5 h-5' />
                </button>
                <span className='px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg'>
                  {currentPage}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    currentPage === totalPages
                      ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-white'
                  }`}
                >
                  <ChevronRight className='w-5 h-5' />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title='Delete Technician'
        message={`Are you sure you want to delete ${deleteModal.technicianName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteModal({
            isOpen: false,
            technicianId: null,
            technicianName: '',
          })
        }
      />

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
