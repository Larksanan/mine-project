import { useState, useMemo } from 'react';
import { DoctorProfile } from '@/types/booking';

export const useFilters = (doctors: DoctorProfile[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [maxFee, setMaxFee] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);

  const specializations = useMemo(
    () => Array.from(new Set(doctors.map(d => d.specialization))).sort(),
    [doctors]
  );

  const departments = useMemo(
    () => Array.from(new Set(doctors.map(d => d.department))).sort(),
    [doctors]
  );

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialization('');
    setSelectedDepartment('');
    setMinExperience(0);
    setMaxFee(10000);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedSpecialization,
    setSelectedSpecialization,
    selectedDepartment,
    setSelectedDepartment,
    minExperience,
    setMinExperience,
    maxFee,
    setMaxFee,
    showFilters,
    setShowFilters,
    specializations,
    departments,
    clearFilters,
  };
};
