'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiPlus,
  FiEdit,
  FiCheck,
  FiX,
  FiMapPin,
  FiSearch,
  FiActivity,
  FiPieChart,
} from 'react-icons/fi';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';

interface Appointment {
  id: string;
  patient: {
    id: string;
    userId: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      gender: string;
    };
    medicalRecordNumber: string;
  };
  pharmacy: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  serviceType: string;
  status: string;
  reason: string;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prescriptionRefills?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vitalSigns?: any;
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  isUpcoming?: boolean;
  isPast?: boolean;
  isToday?: boolean;
}

const serviceTypeLabels = {
  MEDICATION_REVIEW: 'Medication Review',
  CHRONIC_DISEASE_MANAGEMENT: 'Chronic Disease Management',
  VACCINATION: 'Vaccination',
  HEALTH_SCREENING: 'Health Screening',
  PRESCRIPTION_CONSULTATION: 'Prescription Consultation',
  OTHER: 'Other',
};

const statusConfig = {
  SCHEDULED: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Scheduled',
  },
  CONFIRMED: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Confirmed',
  },
  IN_PROGRESS: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'In Progress',
  },
  COMPLETED: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Completed',
  },
  CANCELLED: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelled',
  },
  NO_SHOW: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'No Show',
  },
};

const serviceTypeColors = {
  MEDICATION_REVIEW: 'bg-purple-100 text-purple-800',
  CHRONIC_DISEASE_MANAGEMENT: 'bg-indigo-100 text-indigo-800',
  VACCINATION: 'bg-pink-100 text-pink-800',
  HEALTH_SCREENING: 'bg-teal-100 text-teal-800',
  PRESCRIPTION_CONSULTATION: 'bg-cyan-100 text-cyan-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export default function PharmacistAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    search: '',
    serviceType: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    upcoming: 0,
  });

  useEffect(() => {
    fetchAppointments();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.date && { date: filters.date }),
        ...(filters.search && { search: filters.search }),
        ...(filters.serviceType !== 'all' && {
          serviceType: filters.serviceType,
        }),
      });

      const response = await fetch(`/api/pharmacy/appointments?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();

      if (data.success) {
        setAppointments(data.data.appointments);
        setTotalPages(data.data.pagination.pages);
      } else {
        throw new Error(data.error || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/pharmacy/appointments/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(
        `/api/pharmacy/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      const data = await response.json();

      if (data.success) {
        setAppointments(prev =>
          prev.map(apt => (apt.id === appointmentId ? data.data : apt))
        );
      } else {
        throw new Error(data.error || 'Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update status'
      );
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const response = await fetch(
        `/api/pharmacy/appointments/${appointmentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      const data = await response.json();

      if (data.success) {
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
        fetchStats();
      } else {
        throw new Error(data.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to cancel appointment'
      );
    }
  };

  const getPatientName = (appointment: Appointment) => {
    return `${appointment.patient.userId.firstName} ${appointment.patient.userId.lastName}`;
  };

  const getPatientAge = (appointment: Appointment) => {
    const birthDate = new Date(appointment.patient.userId.dateOfBirth);
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 sm:p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text'>
                Pharmacy Appointments
              </h1>
              <p className='text-gray-600 mt-2'>
                Manage patient consultations and services
              </p>
            </div>

            {/* Fixed: Use motion.button instead of nested anchor tags */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                router.push('/Pharmacist/appointments/appointment')
              }
              className='flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl'
            >
              <FiPlus />
              New Appointment
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'
            >
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-blue-100 rounded-xl'>
                  <FiCalendar className='text-blue-600 text-xl' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Total Appointments</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.total}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'
            >
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-green-100 rounded-xl'>
                  <FiActivity className='text-green-600 text-xl' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>
                    Today&apos;s Appointments
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.today}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'
            >
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-purple-100 rounded-xl'>
                  <FiPieChart className='text-purple-600 text-xl' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Upcoming</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.upcoming}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/20'
          >
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
              <div className='relative'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search patients...'
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm'
                />
              </div>

              <select
                value={filters.status}
                onChange={e =>
                  setFilters(prev => ({ ...prev, status: e.target.value }))
                }
                className='px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm'
              >
                <option value='all'>All Status</option>
                <option value='SCHEDULED'>Scheduled</option>
                <option value='CONFIRMED'>Confirmed</option>
                <option value='IN_PROGRESS'>In Progress</option>
                <option value='COMPLETED'>Completed</option>
                <option value='CANCELLED'>Cancelled</option>
              </select>

              <select
                value={filters.serviceType}
                onChange={e =>
                  setFilters(prev => ({ ...prev, serviceType: e.target.value }))
                }
                className='px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm'
              >
                <option value='all'>All Services</option>
                <option value='MEDICATION_REVIEW'>Medication Review</option>
                <option value='CHRONIC_DISEASE_MANAGEMENT'>
                  Chronic Disease
                </option>
                <option value='VACCINATION'>Vaccination</option>
                <option value='HEALTH_SCREENING'>Health Screening</option>
                <option value='PRESCRIPTION_CONSULTATION'>Prescription</option>
                <option value='OTHER'>Other</option>
              </select>

              <input
                type='date'
                value={filters.date}
                onChange={e =>
                  setFilters(prev => ({ ...prev, date: e.target.value }))
                }
                className='px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm'
              />

              <button
                onClick={() =>
                  setFilters({
                    status: 'all',
                    date: '',
                    search: '',
                    serviceType: 'all',
                  })
                }
                className='flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50/50 backdrop-blur-sm transition-all duration-300'
              >
                <FiX />
                Clear Filters
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Appointments Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
        >
          <AnimatePresence>
            {appointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/20'
              >
                {/* Header */}
                <div className='p-6 border-b border-gray-200'>
                  <div className='flex justify-between items-start mb-3'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {getPatientName(appointment)}
                      </h3>
                      <p className='text-sm text-gray-600'>
                        {getPatientAge(appointment)} yrs •{' '}
                        {appointment.patient.userId.gender.toLowerCase()}
                      </p>
                      <p className='text-xs text-gray-500 font-mono mt-1'>
                        MRN: {appointment.patient.medicalRecordNumber}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[appointment.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}`}
                    >
                      {statusConfig[
                        appointment.status as keyof typeof statusConfig
                      ]?.label || appointment.status}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
                    <FiCalendar className='text-blue-500' />
                    <span>
                      {new Date(
                        appointment.appointmentDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <FiClock className='text-green-500' />
                    <span>
                      {formatTime(appointment.appointmentTime)} (
                      {appointment.duration} min)
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className='p-6'>
                  <div className='mb-4'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${serviceTypeColors[appointment.serviceType as keyof typeof serviceTypeColors] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {serviceTypeLabels[
                        appointment.serviceType as keyof typeof serviceTypeLabels
                      ] || appointment.serviceType}
                    </span>
                    <p className='text-gray-700 text-sm line-clamp-2'>
                      {appointment.reason}
                    </p>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600 mb-4'>
                    <FiMapPin className='text-red-500' />
                    <span className='truncate'>
                      {appointment.pharmacy.name}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex gap-2'>
                    {appointment.status === 'SCHEDULED' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            updateAppointmentStatus(appointment.id, 'CONFIRMED')
                          }
                          className='flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors border border-green-200 text-sm'
                        >
                          <FiCheck />
                          Confirm
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => cancelAppointment(appointment.id)}
                          className='flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-200 text-sm'
                        >
                          <FiX />
                        </motion.button>
                      </>
                    )}

                    {appointment.status === 'CONFIRMED' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          updateAppointmentStatus(appointment.id, 'IN_PROGRESS')
                        }
                        className='flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition-colors border border-yellow-200 text-sm'
                      >
                        Start Session
                      </motion.button>
                    )}

                    {appointment.status === 'IN_PROGRESS' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          updateAppointmentStatus(appointment.id, 'COMPLETED')
                        }
                        className='flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 text-sm'
                      >
                        Complete
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 text-sm'
                    >
                      <FiEdit />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {appointments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-12 text-center'
          >
            <FiCalendar className='mx-auto text-6xl text-gray-300 mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              No appointments found
            </h3>
            <p className='text-gray-600 mb-6'>
              {filters.status !== 'all' ||
              filters.date ||
              filters.search ||
              filters.serviceType !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'No appointments scheduled yet'}
            </p>
            {(filters.status !== 'all' ||
              filters.date ||
              filters.search ||
              filters.serviceType !== 'all') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setFilters({
                    status: 'all',
                    date: '',
                    search: '',
                    serviceType: 'all',
                  })
                }
                className='inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300'
              >
                Clear Filters
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mt-8 flex justify-center gap-2'
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className='px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              Previous
            </button>
            <span className='px-4 py-2 border rounded-lg bg-blue-50 text-blue-600'>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className='px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              Next
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
