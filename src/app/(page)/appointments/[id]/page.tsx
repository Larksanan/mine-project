'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Appointment } from '@/types/appointment';
import LoadingSpinner from '@/components/Loading';
import AppointmentHeader from '@/components/Appointment/details/AppointmentHeader';
import AppointmentInfo from '@/components/Appointment/details/AppointmentInfo';
import MedicalInfo from '@/components/Appointment/details/MedicalInfo';
import PatientInfo from '@/components/Appointment/details/PatientInfo';
import DoctorInfo from '@/components/Appointment/details/DoctorInfo';
import QuickActions from '@/components/Appointment/details/QuickActions';
import AppointmentMetadata from '@/components/Appointment/details/AppointmentMetadata';
import ErrorDisplay from '@/components/Appointment/details/ErrorDisplay';

export default function AppointmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/appointments/${appointmentId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch appointment');
      }

      const result = await response.json();

      if (result.success) {
        setAppointment(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch appointment');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      setError(null);

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      const result = await response.json();

      if (result.success) {
        setAppointment(result.data);
      } else {
        throw new Error(result.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this appointment? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }

      const result = await response.json();

      if (result.success) {
        router.push('/appointments');
      } else {
        throw new Error(result.message || 'Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setError('Failed to delete appointment');
    }
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Scheduled';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'NO_SHOW':
        return 'No Show';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'CONSULTATION':
        return 'Consultation';
      case 'FOLLOW_UP':
        return 'Follow-up';
      case 'CHECKUP':
        return 'Checkup';
      case 'EMERGENCY':
        return 'Emergency';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-UK', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateAge = (dateOfBirth: Date) => {
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

  const handleEdit = () => {
    router.push(`/appointments/${appointmentId}/edit`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !appointment) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            {error || 'Appointment not found'}
          </h2>
          <button
            onClick={() => router.push('/appointments')}
            className='text-blue-600 hover:text-blue-700'
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-6'>
        <AppointmentHeader
          appointmentDate={appointment.appointmentDate}
          appointmentTime={appointment.appointmentTime}
          onBack={() => router.push('/appointments')}
          onEdit={handleEdit}
          onDelete={handleDeleteAppointment}
          formatDate={formatDate}
          formatTime={formatTime}
        />

        {error && (
          <ErrorDisplay
            error={error}
            onBack={() => router.push('/appointments')}
          />
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            <AppointmentInfo
              appointment={appointment}
              getTypeText={getTypeText}
              getStatusText={getStatusText}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              formatTime={formatTime}
            />

            <MedicalInfo appointment={appointment} />
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <PatientInfo
              patient={appointment.patient}
              calculateAge={calculateAge}
            />

            <DoctorInfo doctor={appointment.doctor} />

            <QuickActions
              currentStatus={appointment.status}
              updating={updating}
              onStatusUpdate={updateAppointmentStatus}
              onRefresh={fetchAppointment}
            />

            <AppointmentMetadata
              appointmentId={appointmentId}
              createdAt={appointment.createdAt}
              updatedAt={appointment.updatedAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
