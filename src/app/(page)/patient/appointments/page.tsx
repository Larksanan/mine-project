'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Loading from '@/components/Loading';

// Custom hooks
import { useAppointments } from '@/hooks/useAppointments';
import { useAppointmentStats } from '@/hooks/useAppointmentStats';

// Components
import { Header } from '@/components/patient/book/Header';
import { ErrorDisplay } from '@/components/patient/book/ErrorDisplay';
import { FilterBar } from '@/components/patient/book/FilterBar';
import { EmptyState } from '@/components/patient/book/EmptyState';
import { AppointmentCard } from '@/components/patient/book//AppointmentCard';
import { StatsSummary } from '@/components/patient/book/StatsSummary';

export default function PatientAppointments() {
  const router = useRouter();
  const { status } = useSession();

  // Use custom hooks
  const {
    appointments,
    filteredAppointments,
    loading,
    error,
    statusFilter,
    setStatusFilter,
  } = useAppointments(status);

  useAppointmentStats(appointments);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/patient/appointments');
    }
  }, [status, router]);

  const handleBookNewAppointment = () => {
    router.push('/patient/appointments/book');
  };

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <Header
          title='My Appointments'
          description='View and manage your medical appointments'
        />

        {/* Error Message */}
        {error && <ErrorDisplay error={error} />}

        {/* Filter Bar */}
        <FilterBar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onBookNewAppointment={handleBookNewAppointment}
        />

        {/* Appointments List or Empty State */}
        {filteredAppointments.length === 0 ? (
          <EmptyState
            statusFilter={statusFilter}
            onBookAppointment={handleBookNewAppointment}
          />
        ) : (
          <div className='space-y-4'>
            {filteredAppointments.map(appointment => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
              />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {appointments.length > 0 && (
          <StatsSummary appointments={appointments} />
        )}
      </div>
    </div>
  );
}
