/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiEdit2,
  FiCheck,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiFileText,
  FiActivity,
  FiHeart,
  FiThermometer,
  FiEye,
  FiVideo,
  FiCheckCircle,
} from 'react-icons/fi';
import { MdOutlineNoteAlt } from 'react-icons/md';

interface Appointment {
  _id: string;
  id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nic: string;
    dateOfBirth: string | null;
    gender: string;
    address: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    } | null;
  };
  doctor: {
    _id: string;
    id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
    department: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const APPOINTMENT_STATUS: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    color: 'bg-blue-100 text-blue-800',
    icon: FiClock,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: FiCheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: FiX,
  },
  NO_SHOW: {
    label: 'No Show',
    color: 'bg-gray-100 text-gray-800',
    icon: FiAlertCircle,
  },
};

const APPOINTMENT_TYPES: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  'IN-PERSON': {
    label: 'In-Person',
    icon: FiUser,
    color: 'bg-purple-100 text-purple-800',
  },
  FOLLOW_UP: {
    label: 'Follow Up',
    icon: FiActivity,
    color: 'bg-indigo-100 text-indigo-800',
  },
  VIDEO: {
    label: 'Video Call',
    icon: FiVideo,
    color: 'bg-cyan-100 text-cyan-800',
  },
  PHONE: {
    label: 'Phone Call',
    icon: FiPhone,
    color: 'bg-orange-100 text-orange-800',
  },
};

export default function DoctorAppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: '',
    diagnosis: '',
    prescription: '',
    notes: '',
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/dashboard/doctor/appointments');
      return;
    }

    if (session.user?.role !== 'DOCTOR') {
      router.push('/dashboard');
      return;
    }

    fetchAppointments();
  }, [
    session,
    status,
    selectedDate,
    statusFilter,
    typeFilter,
    pagination.page,
  ]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('date', selectedDate);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(
        `/api/appointments/Doctor/appointments?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setAppointments(data.data.appointments || []);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(
        `/api/appointments/Doctor/appointments/${selectedAppointment._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateForm),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('Appointment updated successfully!');
        setAppointments(
          appointments.map(apt =>
            apt._id === selectedAppointment._id
              ? ({ ...apt, ...updateForm } as Appointment)
              : apt
          )
        );
        setShowUpdateModal(false);
        setSelectedAppointment(null);
        setUpdateForm({
          status: '',
          diagnosis: '',
          prescription: '',
          notes: '',
        });
        fetchAppointments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setUpdateForm({
      status: appointment.status,
      diagnosis: appointment.diagnosis || '',
      prescription: appointment.prescription || '',
      notes: appointment.notes || '',
    });
    setShowUpdateModal(true);
  };

  const getPatientFullName = (patient: Appointment['patient']) => {
    return `${patient.firstName} ${patient.lastName}`;
  };

  const getPatientAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getPatientAddress = (address: Appointment['patient']['address']) => {
    if (!address) return 'N/A';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAppointments = appointments.filter(
    apt =>
      searchTerm === '' ||
      getPatientFullName(apt.patient)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      apt.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient.phone.includes(searchTerm) ||
      apt.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats safely
  const scheduledCount = appointments.filter(
    a => a.status === 'SCHEDULED'
  ).length;
  const completedCount = appointments.filter(
    a => a.status === 'COMPLETED'
  ).length;
  const videoCount = appointments.filter(a => a.type === 'VIDEO').length;
  const avgDuration =
    appointments.length > 0
      ? Math.round(
          appointments.reduce((acc, a) => acc + a.duration, 0) /
            appointments.length
        )
      : 0;
  const videoPercentage =
    appointments.length > 0
      ? ((videoCount / appointments.length) * 100).toFixed(0)
      : '0';

  if (loading && appointments.length === 0) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center'>
        <div className='text-center'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4'
          />
          <p className='text-gray-600'>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50'>
      {/* Floating Background Elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute w-64 h-64 rounded-full bg-linear-to-r from-blue-100/20 to-cyan-100/20'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.sin(i) * 50, 0],
              y: [0, Math.cos(i) * 50, 0],
              rotate: 360,
            }}
            transition={{
              duration: 20 + i * 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className='relative z-10 max-w-7xl mx-auto px-4 py-8'>
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='mb-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3'
            >
              <FiCheckCircle className='w-5 h-5' />
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='mb-6 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center gap-3'
            >
              <FiAlertCircle className='w-5 h-5' />
              {error}
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
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Appointments
              </h1>
              <p className='text-gray-600'>
                Manage your patient appointments and medical records
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className='bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all border border-gray-300 shadow-sm'
              >
                <FiFilter className='w-5 h-5' />
                Filters
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchAppointments}
                className='bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all border border-gray-300 shadow-sm'
              >
                <FiRefreshCw className='w-5 h-5' />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          {[
            {
              label: "Today's Appointments",
              value: appointments.length,
              icon: FiCalendar,
              color: 'from-blue-500 to-cyan-500',
              change: `${scheduledCount} scheduled`,
            },
            {
              label: 'Completed',
              value: completedCount,
              icon: FiCheckCircle,
              color: 'from-green-500 to-emerald-500',
              change: 'Today',
            },
            {
              label: 'Video Calls',
              value: videoCount,
              icon: FiVideo,
              color: 'from-purple-500 to-pink-500',
              change: `${videoPercentage}%`,
            },
            {
              label: 'Avg. Duration',
              value: `${avgDuration} min`,
              icon: FiClock,
              color: 'from-orange-500 to-red-500',
              change: 'Per appointment',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-linear-to-br ${stat.color} rounded-2xl p-6 text-white shadow-xl`}
            >
              <div className='flex items-center justify-between mb-4'>
                <stat.icon className='w-8 h-8' />
                <span className='text-sm font-medium opacity-90'>
                  {stat.change}
                </span>
              </div>
              <div className='text-3xl font-bold mb-1'>{stat.value}</div>
              <div className='text-sm opacity-90'>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='bg-white rounded-2xl shadow-xl p-6 mb-8'
            >
              <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                {/* Date Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Date
                  </label>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => {
                        const date = new Date(selectedDate);
                        date.setDate(date.getDate() - 1);
                        setSelectedDate(date.toISOString().split('T')[0]);
                      }}
                      className='p-2 hover:bg-gray-100 rounded-lg'
                    >
                      <FiChevronLeft className='w-5 h-5 text-gray-600' />
                    </button>
                    <input
                      type='date'
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                    <button
                      onClick={() => {
                        const date = new Date(selectedDate);
                        date.setDate(date.getDate() + 1);
                        setSelectedDate(date.toISOString().split('T')[0]);
                      }}
                      className='p-2 hover:bg-gray-100 rounded-lg'
                    >
                      <FiChevronRight className='w-5 h-5 text-gray-600' />
                    </button>
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='all'>All Status</option>
                    <option value='SCHEDULED'>Scheduled</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='CANCELLED'>Cancelled</option>
                    <option value='NO_SHOW'>No Show</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Appointment Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='all'>All Types</option>
                    <option value='IN-PERSON'>In-Person</option>
                    <option value='VIDEO'>Video Call</option>
                    <option value='PHONE'>Phone Call</option>
                    <option value='FOLLOW_UP'>Follow Up</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Search
                  </label>
                  <div className='relative'>
                    <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search patient...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-2xl shadow-xl p-6'
        >
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold text-gray-900'>
              {selectedDate === new Date().toISOString().split('T')[0]
                ? "Today's Appointments"
                : `Appointments for ${new Date(selectedDate).toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}`}
            </h2>
            <div className='text-sm text-gray-600'>
              Showing {filteredAppointments.length} of {pagination.total}{' '}
              appointments
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className='text-center py-12'>
              <FiCalendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No appointments found
              </h3>
              <p className='text-gray-500'>
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'No appointments scheduled for this date'}
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {filteredAppointments.map((appointment, index) => {
                const StatusIcon = APPOINTMENT_STATUS[appointment.status]?.icon;
                const statusConfig = APPOINTMENT_STATUS[appointment.status];
                const TypeIcon =
                  APPOINTMENT_TYPES[appointment.type]?.icon || FiUser;
                const typeConfig = APPOINTMENT_TYPES[appointment.type] || {
                  label: appointment.type,
                  color: 'bg-gray-100 text-gray-800',
                };

                return (
                  <motion.div
                    key={appointment._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className='bg-linear-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all'
                  >
                    <div className='flex flex-col lg:flex-row lg:items-start gap-6'>
                      {/* Time & Status */}
                      <div className='flex lg:flex-col items-start lg:items-center gap-3 lg:gap-2 lg:w-32'>
                        <div className='flex items-center gap-2'>
                          <FiClock className='w-5 h-5 text-gray-500' />
                          <span className='font-semibold text-gray-900'>
                            {formatTime(appointment.appointmentTime)}
                          </span>
                        </div>
                        <span className='text-sm text-gray-500'>
                          {appointment.duration} min
                        </span>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            statusConfig?.color || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {StatusIcon && <StatusIcon className='w-3 h-3' />}
                          {statusConfig?.label || appointment.status}
                        </div>
                      </div>

                      {/* Patient Info */}
                      <div className='flex-1'>
                        <div className='flex flex-col lg:flex-row lg:items-center gap-4 mb-4'>
                          <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 flex items-center justify-center shrink-0'>
                              <FiUser className='w-5 h-5 text-white' />
                            </div>
                            <div>
                              <h3 className='font-bold text-gray-900'>
                                {getPatientFullName(appointment.patient)}
                              </h3>
                              <div className='flex items-center gap-3 text-sm text-gray-600'>
                                <span>{appointment.patient.gender}</span>
                                <span>•</span>
                                <span>
                                  {getPatientAge(
                                    appointment.patient.dateOfBirth
                                  )}{' '}
                                  years
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className='flex flex-wrap gap-2'>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${typeConfig.color}`}
                            >
                              {TypeIcon && <TypeIcon className='w-3 h-3' />}
                              {typeConfig.label}
                            </span>
                            {appointment.patient.nic && (
                              <span className='px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium'>
                                NIC: {appointment.patient.nic}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                          <div className='flex items-center gap-3'>
                            <FiPhone className='w-4 h-4 text-gray-500' />
                            <span className='text-sm text-gray-700'>
                              {appointment.patient.phone}
                            </span>
                          </div>
                          <div className='flex items-center gap-3'>
                            <FiMail className='w-4 h-4 text-gray-500' />
                            <span className='text-sm text-gray-700'>
                              {appointment.patient.email}
                            </span>
                          </div>
                          {appointment.patient.address && (
                            <div className='flex items-center gap-3 md:col-span-2'>
                              <FiMapPin className='w-4 h-4 text-gray-500' />
                              <span className='text-sm text-gray-700'>
                                {getPatientAddress(appointment.patient.address)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Reason & Symptoms */}
                        <div className='space-y-2'>
                          <div className='flex items-start gap-2'>
                            <FiFileText className='w-4 h-4 text-gray-500 mt-1' />
                            <div>
                              <div className='text-xs text-gray-500'>
                                Reason for Visit
                              </div>
                              <p className='text-sm text-gray-900'>
                                {appointment.reason}
                              </p>
                            </div>
                          </div>
                          {appointment.symptoms && (
                            <div className='flex items-start gap-2'>
                              <FiActivity className='w-4 h-4 text-gray-500 mt-1' />
                              <div>
                                <div className='text-xs text-gray-500'>
                                  Symptoms
                                </div>
                                <p className='text-sm text-gray-900'>
                                  {appointment.symptoms}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Diagnosis & Prescription (if completed) */}
                        {appointment.status === 'COMPLETED' && (
                          <div className='mt-4 p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              {appointment.diagnosis && (
                                <div>
                                  <div className='text-xs font-medium text-green-800 mb-1 flex items-center gap-1'>
                                    <FiThermometer className='w-3 h-3' />
                                    Diagnosis
                                  </div>
                                  <p className='text-sm text-gray-900'>
                                    {appointment.diagnosis}
                                  </p>
                                </div>
                              )}
                              {appointment.prescription && (
                                <div>
                                  <div className='text-xs font-medium text-green-800 mb-1 flex items-center gap-1'>
                                    <FiHeart className='w-3 h-3' />
                                    Prescription
                                  </div>
                                  <p className='text-sm text-gray-900'>
                                    {appointment.prescription}
                                  </p>
                                </div>
                              )}
                              {appointment.notes && (
                                <div className='md:col-span-2'>
                                  <div className='text-xs font-medium text-green-800 mb-1 flex items-center gap-1'>
                                    <MdOutlineNoteAlt className='w-3 h-3' />
                                    Additional Notes
                                  </div>
                                  <p className='text-sm text-gray-900'>
                                    {appointment.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className='flex flex-row lg:flex-col gap-2'>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewDetails(appointment)}
                          className='px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 flex items-center justify-center gap-2 transition-colors'
                        >
                          <FiEye className='w-4 h-4' />
                          <span className='hidden lg:inline'>View</span>
                        </motion.button>

                        {appointment.status === 'SCHEDULED' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditAppointment(appointment)}
                            className='px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 flex items-center justify-center gap-2 transition-colors'
                          >
                            <FiEdit2 className='w-4 h-4' />
                            <span className='hidden lg:inline'>Update</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className='flex justify-center mt-8'>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                      className='p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <FiChevronLeft className='w-5 h-5 text-gray-600' />
                    </button>

                    {[...Array(pagination.pages)].map((_, i) => {
                      const pageNumber = i + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === pagination.pages ||
                        Math.abs(pageNumber - pagination.page) <= 2
                      ) {
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              setPagination(prev => ({
                                ...prev,
                                page: pageNumber,
                              }))
                            }
                            className={`w-10 h-10 rounded-lg font-medium ${
                              pagination.page === pageNumber
                                ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === pagination.page - 3 ||
                        pageNumber === pagination.page + 3
                      ) {
                        return <span key={i}>...</span>;
                      }
                      return null;
                    })}

                    <button
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page === pagination.pages}
                      className='p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <FiChevronRight className='w-5 h-5 text-gray-600' />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className='sticky top-0 bg-linear-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h2 className='text-2xl font-bold mb-2'>
                      Appointment Details
                    </h2>
                    <p className='text-blue-100'>
                      {getPatientFullName(selectedAppointment.patient)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                  >
                    <FiX className='w-6 h-6' />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className='p-6 space-y-6'>
                {/* Appointment Info */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='col-span-2 md:col-span-1'>
                    <div className='text-xs text-gray-500 mb-1'>
                      Date & Time
                    </div>
                    <div className='flex items-center gap-2'>
                      <FiCalendar className='w-4 h-4 text-blue-600' />
                      <span className='font-medium'>
                        {new Date(
                          selectedAppointment.appointmentDate
                        ).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                      <FiClock className='w-4 h-4 text-blue-600' />
                      <span className='font-medium'>
                        {formatTime(selectedAppointment.appointmentTime)} (
                        {selectedAppointment.duration} min)
                      </span>
                    </div>
                  </div>

                  <div className='col-span-2 md:col-span-1'>
                    <div className='text-xs text-gray-500 mb-1'>
                      Status & Type
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          APPOINTMENT_STATUS[selectedAppointment.status]?.color
                        }`}
                      >
                        {APPOINTMENT_STATUS[selectedAppointment.status]?.label}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          APPOINTMENT_TYPES[selectedAppointment.type]?.color ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {APPOINTMENT_TYPES[selectedAppointment.type]?.label ||
                          selectedAppointment.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div className='border-t pt-6'>
                  <h3 className='text-lg font-bold text-gray-900 mb-4'>
                    Patient Information
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <div className='text-xs text-gray-500 mb-1'>
                        Full Name
                      </div>
                      <p className='font-medium'>
                        {getPatientFullName(selectedAppointment.patient)}
                      </p>
                    </div>
                    <div>
                      <div className='text-xs text-gray-500 mb-1'>NIC</div>
                      <p className='font-medium'>
                        {selectedAppointment.patient.nic}
                      </p>
                    </div>
                    <div>
                      <div className='text-xs text-gray-500 mb-1'>
                        Age & Gender
                      </div>
                      <p className='font-medium'>
                        {getPatientAge(selectedAppointment.patient.dateOfBirth)}{' '}
                        years, {selectedAppointment.patient.gender}
                      </p>
                    </div>
                    <div>
                      <div className='text-xs text-gray-500 mb-1'>Phone</div>
                      <p className='font-medium'>
                        {selectedAppointment.patient.phone}
                      </p>
                    </div>
                    <div className='md:col-span-2'>
                      <div className='text-xs text-gray-500 mb-1'>Email</div>
                      <p className='font-medium'>
                        {selectedAppointment.patient.email}
                      </p>
                    </div>
                    <div className='md:col-span-2'>
                      <div className='text-xs text-gray-500 mb-1'>Address</div>
                      <p className='font-medium'>
                        {getPatientAddress(selectedAppointment.patient.address)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Details */}
                <div className='border-t pt-6'>
                  <h3 className='text-lg font-bold text-gray-900 mb-4'>
                    Medical Details
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <div className='text-xs text-gray-500 mb-1'>
                        Reason for Visit
                      </div>
                      <p className='text-gray-900'>
                        {selectedAppointment.reason}
                      </p>
                    </div>
                    {selectedAppointment.symptoms && (
                      <div>
                        <div className='text-xs text-gray-500 mb-1'>
                          Symptoms
                        </div>
                        <p className='text-gray-900'>
                          {selectedAppointment.symptoms}
                        </p>
                      </div>
                    )}
                    {selectedAppointment.diagnosis && (
                      <div>
                        <div className='text-xs text-gray-500 mb-1'>
                          Diagnosis
                        </div>
                        <p className='text-gray-900'>
                          {selectedAppointment.diagnosis}
                        </p>
                      </div>
                    )}
                    {selectedAppointment.prescription && (
                      <div>
                        <div className='text-xs text-gray-500 mb-1'>
                          Prescription
                        </div>
                        <p className='text-gray-900'>
                          {selectedAppointment.prescription}
                        </p>
                      </div>
                    )}
                    {selectedAppointment.notes && (
                      <div>
                        <div className='text-xs text-gray-500 mb-1'>
                          Additional Notes
                        </div>
                        <p className='text-gray-900'>
                          {selectedAppointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className='sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex justify-end gap-3'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDetailsModal(false)}
                  className='px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                >
                  Close
                </motion.button>
                {selectedAppointment.status === 'SCHEDULED' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditAppointment(selectedAppointment);
                    }}
                    className='px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors'
                  >
                    Update Appointment
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Modal */}
      <AnimatePresence>
        {showUpdateModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => setShowUpdateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className='sticky top-0 bg-linear-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h2 className='text-2xl font-bold mb-2'>
                      Update Appointment
                    </h2>
                    <p className='text-green-100'>
                      {getPatientFullName(selectedAppointment.patient)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                  >
                    <FiX className='w-6 h-6' />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <form
                onSubmit={handleUpdateAppointment}
                className='p-6 space-y-6'
              >
                {/* Status */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Status *
                  </label>
                  <select
                    value={updateForm.status}
                    onChange={e =>
                      setUpdateForm({ ...updateForm, status: e.target.value })
                    }
                    className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    required
                  >
                    <option value='SCHEDULED'>Scheduled</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='CANCELLED'>Cancelled</option>
                    <option value='NO_SHOW'>No Show</option>
                  </select>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Diagnosis
                  </label>
                  <textarea
                    value={updateForm.diagnosis}
                    onChange={e =>
                      setUpdateForm({
                        ...updateForm,
                        diagnosis: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder='Enter diagnosis...'
                    className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  />
                </div>

                {/* Prescription */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Prescription
                  </label>
                  <textarea
                    value={updateForm.prescription}
                    onChange={e =>
                      setUpdateForm({
                        ...updateForm,
                        prescription: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder='Enter prescription details...'
                    className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Additional Notes
                  </label>
                  <textarea
                    value={updateForm.notes}
                    onChange={e =>
                      setUpdateForm({ ...updateForm, notes: e.target.value })
                    }
                    rows={3}
                    placeholder='Any additional notes...'
                    className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3'>
                    <FiAlertCircle className='w-5 h-5' />
                    {error}
                  </div>
                )}

                {/* Modal Footer */}
                <div className='flex justify-end gap-3 pt-4 border-t'>
                  <motion.button
                    type='button'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUpdateModal(false)}
                    className='px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors'
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type='submit'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isSubmitting}
                    className='px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className='w-5 h-5 animate-spin' />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiCheck className='w-5 h-5' />
                        Update Appointment
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
