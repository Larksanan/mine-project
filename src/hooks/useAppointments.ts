import { useState, useEffect, useCallback } from 'react';
import { Appointment } from '@/types/appointment';

export const useAppointments = (status: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/appointments/patient/book');

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAppointments(result.data.appointments || []);
        setFilteredAppointments(result.data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load appointments'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAppointments();
    }
  }, [status, fetchAppointments]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter(apt => apt.status === statusFilter)
      );
    }
  }, [statusFilter, appointments]);

  const refetchAppointments = useCallback(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    filteredAppointments,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refetchAppointments,
  };
};
