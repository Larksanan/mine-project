import { useState, useEffect, useCallback } from 'react';
import { DoctorProfile, SortOption } from '@/types/booking';

export const useDoctors = (status: string) => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients/docter');

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const result = await response.json();

      if (result.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedDoctors = (result.data || []).map((doc: any) => ({
          _id: doc.id || doc._id,
          name: doc.user?.name || '',
          email: doc.user?.email || '',
          phone: doc.user?.phone || '',
          image: doc.user?.image || '',
          specialization: doc.profile?.specialization || '',
          department: doc.profile?.department || '',
          licenseNumber: doc.profile?.licenseNumber || '',
          hospital: doc.profile?.hospitalAffiliation || 'Not specified',
          experience: doc.profile?.experience || 0,
          consultationFee: doc.profile?.consultationFee || 0,
          qualifications: doc.profile?.qualifications || [],
          languages: doc.profile?.languages || [],
          isVerified: doc.profile?.isVerified || false,
          rating: doc.profile?.rating || { average: 0, count: 0 },
          availableHours: doc.profile?.availability
            ? {
                days: doc.profile.availability.days || [],
                start: doc.profile.availability.startTime || '',
                end: doc.profile.availability.endTime || '',
              }
            : undefined,
        }));

        setDoctors(transformedDoctors);
        setFilteredDoctors(transformedDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterAndSortDoctors = useCallback(
    (
      doctorsList: DoctorProfile[],
      searchTerm: string,
      selectedSpecialization: string,
      selectedDepartment: string,
      minExperience: number,
      maxFee: number,
      sortBy: SortOption
    ) => {
      let filtered = [...doctorsList];

      if (searchTerm.trim()) {
        const searchLower = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(
          doctor =>
            doctor.name.toLowerCase().includes(searchLower) ||
            doctor.specialization.toLowerCase().includes(searchLower) ||
            doctor.hospital.toLowerCase().includes(searchLower)
        );
      }

      if (selectedSpecialization) {
        filtered = filtered.filter(
          doctor => doctor.specialization === selectedSpecialization
        );
      }

      if (selectedDepartment) {
        filtered = filtered.filter(
          doctor => doctor.department === selectedDepartment
        );
      }

      if (minExperience > 0) {
        filtered = filtered.filter(
          doctor => doctor.experience >= minExperience
        );
      }

      filtered = filtered.filter(doctor => doctor.consultationFee <= maxFee);

      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'experience':
            return b.experience - a.experience;
          case 'fee':
            return a.consultationFee - b.consultationFee;
          case 'rating':
            return (b.rating?.average || 0) - (a.rating?.average || 0);
          default:
            return a.name.localeCompare(b.name);
        }
      });

      return filtered;
    },
    []
  );

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDoctors();
    }
  }, [status, fetchDoctors]);

  return {
    doctors,
    filteredDoctors,
    loading,
    setFilteredDoctors,
    filterAndSortDoctors,
    refetchDoctors: fetchDoctors,
  };
};
