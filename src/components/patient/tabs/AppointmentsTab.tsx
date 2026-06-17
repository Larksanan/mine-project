'use client';

import React, { useState, useEffect } from 'react';
import {
  FiCalendar,
  FiClock,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiAlertCircle,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  getAppointmentStatusColor,
  getAppointmentTypeColor,
  formatAppointmentDate,
  formatAppointmentTime,
  isAppointmentUpcoming,
  isAppointmentPast,
} from '@/types/appiments';

interface AppointmentsTabProps {
  patientId: string;
}

const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ patientId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>(
    'all'
  );
  const [typeFilter, setTypeFilter] = useState<AppointmentType | 'all'>('all');

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/patients/${patientId}/appointments`);

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const result = await response.json();

      if (result.success) {
        setAppointments(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.doctor.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || appointment.status === statusFilter;
    const matchesType = typeFilter === 'all' || appointment.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const upcomingAppointments = filteredAppointments.filter(
    isAppointmentUpcoming
  );
  const pastAppointments = filteredAppointments.filter(isAppointmentPast);

  const handleCreateAppointment = () => {
    window.location.href = `/doctor/appointments/new?patientId=${patientId}`;
  };

  const handleRefresh = () => {
    fetchAppointments();
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
        <FiAlertCircle className='w-12 h-12 text-red-400 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-red-800 mb-2'>
          Unable to load appointments
        </h3>
        <p className='text-red-600 mb-4'>{error}</p>
        <button
          onClick={fetchAppointments}
          className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors'
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className='space-y-6'
    >
      {/* Header with Actions */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Appointments</h2>
          <p className='text-gray-600'>Manage and view patient appointments</p>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={handleRefresh}
            className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <FiRefreshCw className='w-4 h-4' />
            Refresh
          </button>
          <button
            onClick={handleCreateAppointment}
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <FiPlus className='w-4 h-4' />
            New Appointment
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className='bg-white rounded-lg border border-gray-200 p-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Search */}
          <div className='relative'>
            <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Search appointments...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as AppointmentStatus | 'all')
            }
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='all'>All Statuses</option>
            <option value='scheduled'>Scheduled</option>
            <option value='completed'>Completed</option>
            <option value='cancelled'>Cancelled</option>
            <option value='no-show'>No Show</option>
            <option value='confirmed'>Confirmed</option>
            <option value='rescheduled'>Rescheduled</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e =>
              setTypeFilter(e.target.value as AppointmentType | 'all')
            }
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='all'>All Types</option>
            <option value='checkup'>Checkup</option>
            <option value='consultation'>Consultation</option>
            <option value='follow-up'>Follow-up</option>
            <option value='surgery'>Surgery</option>
            <option value='emergency'>Emergency</option>
            <option value='routine'>Routine</option>
            <option value='vaccination'>Vaccination</option>
            <option value='therapy'>Therapy</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white rounded-lg border border-gray-200 p-4 text-center'>
          <div className='text-2xl font-bold text-blue-600'>
            {appointments.length}
          </div>
          <div className='text-sm text-gray-600'>Total</div>
        </div>
        <div className='bg-white rounded-lg border border-gray-200 p-4 text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {appointments.filter(a => a.status === 'completed').length}
          </div>
          <div className='text-sm text-gray-600'>Completed</div>
        </div>
        <div className='bg-white rounded-lg border border-gray-200 p-4 text-center'>
          <div className='text-2xl font-bold text-blue-600'>
            {upcomingAppointments.length}
          </div>
          <div className='text-sm text-gray-600'>Upcoming</div>
        </div>
        <div className='bg-white rounded-lg border border-gray-200 p-4 text-center'>
          <div className='text-2xl font-bold text-orange-600'>
            {appointments.filter(a => a.status === 'no-show').length}
          </div>
          <div className='text-sm text-gray-600'>No Shows</div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Upcoming Appointments
          </h3>
          <div className='grid gap-4'>
            {upcomingAppointments.map((appointment, index) => (
              <motion.div
                key={appointment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow'
              >
                <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h4 className='text-lg font-semibold text-gray-900'>
                        {appointment.reason}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getAppointmentStatusColor(appointment.status)}`}
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getAppointmentTypeColor(appointment.type)}`}
                      >
                        {appointment.type.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <FiCalendar className='w-4 h-4' />
                        {formatAppointmentDate(appointment.appointmentDate)}
                      </div>
                      <div className='flex items-center gap-1'>
                        <FiClock className='w-4 h-4' />
                        {formatAppointmentTime(
                          appointment.appointmentTime
                        )} • {appointment.duration} min
                      </div>
                      <div>
                        Dr. {appointment.doctor.firstName}{' '}
                        {appointment.doctor.lastName}
                        {appointment.doctor.specialization && (
                          <span className='text-gray-400'>
                            {' '}
                            • {appointment.doctor.specialization}
                          </span>
                        )}
                      </div>
                    </div>

                    {appointment.notes && (
                      <p className='mt-2 text-sm text-gray-600 line-clamp-2'>
                        {appointment.notes}
                      </p>
                    )}
                  </div>

                  <div className='flex gap-2'>
                    <button className='px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
                      Reschedule
                    </button>
                    <button className='px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'>
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Past Appointments{' '}
          {pastAppointments.length > 0 && `(${pastAppointments.length})`}
        </h3>

        {pastAppointments.length > 0 ? (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date & Time
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Reason
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Doctor
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {pastAppointments.map((appointment, index) => (
                  <motion.tr
                    key={appointment._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className='hover:bg-gray-50 transition-colors'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {formatAppointmentDate(appointment.appointmentDate)}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {formatAppointmentTime(appointment.appointmentTime)}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm font-medium text-gray-900'>
                        {appointment.reason}
                      </div>
                      {appointment.notes && (
                        <div className='text-sm text-gray-500 truncate max-w-xs'>
                          {appointment.notes}
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        Dr. {appointment.doctor.firstName}{' '}
                        {appointment.doctor.lastName}
                      </div>
                      {appointment.doctor.specialization && (
                        <div className='text-sm text-gray-500'>
                          {appointment.doctor.specialization}
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getAppointmentTypeColor(appointment.type)}`}
                      >
                        {appointment.type.replace('-', ' ')}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getAppointmentStatusColor(appointment.status)}`}
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 p-12 text-center'>
            <FiCalendar className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No appointments found
            </h3>
            <p className='text-gray-500 mb-6'>
              {appointments.length === 0
                ? "This patient doesn't have any appointments yet."
                : 'No appointments match your current filters.'}
            </p>
            {appointments.length === 0 && (
              <button
                onClick={handleCreateAppointment}
                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <FiPlus className='w-4 h-4' />
                Schedule First Appointment
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentsTab;
