import { useState, useEffect } from 'react';
import { PatientData, ApiResponse } from '@/types/patient';

export const usePatient = (patientId: string) => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/patients/${patientId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch patient data');
        }

        const result: ApiResponse<PatientData> = await response.json();

        if (result.success && result.data) {
          setPatient(result.data);
        } else {
          throw new Error(result.message || 'Failed to load patient');
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load patient'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  return { patient, loading, error };
};

export const usePatientCalculations = () => {
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';

    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    if (isNaN(birthDate.getTime())) return 'Invalid Date';

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return `${age} years`;
  };

  return { formatDate, calculateAge };
};
