'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';
import { Appointment, AppointmentFormData } from '@/types/appointment';
import LoadingSpinner from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import EditAppointmentHeader from '@/components/Appointment/edit/EditAppointmentHeader';
import EditAppointmentForm from '@/components/Appointment/edit/EditAppointmentForm';
import PatientInfoCard from '@/components/Appointment/edit/PatientInfoCard';

function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const { data: _session } = useSession();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    appointmentDate: '',
    appointmentTime: '',
    duration: 30,
    type: 'CONSULTATION',
    status: 'SCHEDULED',
    reason: '',
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    patientId: '',
    doctorId: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchAppointment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/appointments/${appointmentId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch appointment: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success && result.data) {
        const appointmentData = result.data;
        setAppointment(appointmentData);

        // Initialize form data with current appointment data
        setFormData({
          appointmentDate: appointmentData.appointmentDate?.split('T')[0] || '',
          appointmentTime: appointmentData.appointmentTime || '',
          duration: appointmentData.duration || 30,
          type: appointmentData.type || 'CONSULTATION',
          status: appointmentData.status || 'SCHEDULED',
          reason: appointmentData.reason || '',
          symptoms: appointmentData.symptoms || '',
          diagnosis: appointmentData.diagnosis || '',
          prescription: appointmentData.prescription || '',
          notes: appointmentData.notes || '',
          patientId:
            appointmentData.patient?._id || appointmentData.patient || '',
          doctorId: appointmentData.doctor || '',
        });
      } else {
        throw new Error(result.message || 'Failed to fetch appointment data');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load appointment details'
      );
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId, fetchAppointment]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Appointment date is required';
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.appointmentDate = 'Appointment date cannot be in the past';
      }
    }

    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Appointment time is required';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Reason for visit is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to update appointment: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success) {
        router.push(`/appointments/${appointmentId}`);
      } else {
        throw new Error(result.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update appointment'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    router.push(`/appointments/${appointmentId}`);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const calculateAge = (dateOfBirth: Date) => {
    try {
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
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <ErrorComponent message={error || 'Appointment not found'} />
          <div className='mt-4 space-x-3'>
            <button
              onClick={() => fetchAppointment()}
              className='text-sm px-3 py-2 bg-white border rounded text-blue-600 hover:text-blue-700'
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/appointments')}
              className='text-sm px-3 py-2 text-blue-600 hover:text-blue-700'
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6'>
        <EditAppointmentHeader
          onBack={() => router.push(`/appointments/${appointmentId}`)}
          patientName={`${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`}
          originalDate={appointment.appointmentDate}
          originalTime={appointment.appointmentTime}
        />

        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 text-red-800'>
              <FiAlertCircle className='w-5 h-5' />
              <span className='font-medium'>Error: {error}</span>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Form */}
          <div className='lg:col-span-2'>
            <EditAppointmentForm
              appointment={appointment}
              formData={formData}
              formErrors={formErrors}
              updating={updating}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              getMinDate={getMinDate}
            />
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <PatientInfoCard
              patient={appointment.patient}
              calculateAge={calculateAge}
            />

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-blue-50 border border-blue-200 rounded-xl p-6'
            >
              <h3 className='font-semibold text-blue-900 mb-2'>
                Editing Guidelines
              </h3>
              <ul className='text-sm text-blue-800 space-y-2'>
                <li>• Update date/time if rescheduling is needed</li>
                <li>• Modify medical information after consultation</li>
                <li>• Update status to reflect current state</li>
                <li>• Add diagnosis and prescription after examination</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditAppointmentPage;
