'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppointmentsHeader from '@/components/Appointment/appintment/AppointmentsHeader';
import StatsGrid from '@/components/Appointment/appintment/StatsGrid';
import SearchFilters from '@/components/Appointment/appintment/SearchFilters';
import AppointmentsList from '@/components/Appointment/appintment/AppointmentsList';
import LoadingSpinner from '@/components/Loading';
import EmptyState from '@/components/Appointment/appintment/EmptyStat';

import { Appointment, AppointmentStats } from '@/types/appointment';

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchAppointments = async () => {
    try {
      setError(null);
      const response = await fetch('/api/appointments');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch appointments');
      }

      const result = await response.json();
      console.log('Appointments API response:', result);

      if (result.success) {
        // Filter out appointments with null patient data
        const validAppointments = (result.data?.appointments || []).filter(
          (apt: Appointment) => apt.patient !== null
        );
        setAppointments(validAppointments);

        if (validAppointments.length !== result.data?.appointments?.length) {
          console.warn(
            'Some appointments had null patient data and were filtered out'
          );
        }
      } else {
        throw new Error(result.message || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load appointments'
      );
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/appointments/stats');

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAppointments();
      await fetchStats();
      setLoading(false);
      setRefreshing(false);
    })();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    await fetchAppointments();
    await fetchStats();
    setLoading(false);
    setRefreshing(false);
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchAppointments();
        await fetchStats();
      } else {
        alert('Failed to delete appointment: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    // Safe access to patient properties
    const patientFirstName = appointment.patient?.firstName || '';
    const patientLastName = appointment.patient?.lastName || '';
    const patientEmail = appointment.patient?.email || '';
    const reason = appointment.reason || '';

    const matchesSearch =
      patientFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || appointment.status === filterStatus;

    const matchesType = filterType === 'all' || appointment.type === filterType;

    const matchesDate =
      !selectedDate || appointment.appointmentDate === selectedDate;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <AppointmentsHeader
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onNewAppointment={() => router.push('/appointments/new')}
        />

        {/* Error Display */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 text-red-800'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='font-medium'>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className='mt-2 text-sm text-red-600 hover:text-red-800 underline'
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Grid */}
        {stats && <StatsGrid stats={stats} />}

        {/* Search and Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterType={filterType}
          onTypeChange={setFilterType}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Appointments List */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          <div className='p-6 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Appointments ({filteredAppointments.length})
            </h2>
          </div>

          <div className='p-6'>
            {loading ? (
              <LoadingSpinner />
            ) : filteredAppointments.length === 0 ? (
              <EmptyState
                hasFilters={
                  !!searchTerm ||
                  filterStatus !== 'all' ||
                  filterType !== 'all' ||
                  !!selectedDate
                }
                onNewAppointment={() => router.push('/appointments/new')}
              />
            ) : (
              <AppointmentsList
                appointments={filteredAppointments}
                onViewAppointment={id => router.push(`/appointments/${id}`)}
                onEditAppointment={id =>
                  router.push(`/appointments/${id}/edit`)
                }
                onDeleteAppointment={handleDeleteAppointment}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
