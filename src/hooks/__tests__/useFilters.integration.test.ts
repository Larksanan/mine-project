/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useFilters } from '../useFilters';
import { DoctorProfile } from '@/types/booking';

const extendedMockDoctors: DoctorProfile[] = [
  {
    _id: '1',
    name: 'Dr. Jebarsan Thatcroos',
    specialization: 'Cardiology',
    department: 'Heart Institute',
    experience: 15,
    consultationFee: 8000,
    rating: { average: 4.9, count: 10 },
    qualifications: ['MBBS', 'MD'],
    image: '/doctor1.jpg',
    email: 'doc1@example.com',
    phone: '0771234567',
    licenseNumber: 'SLMC001',
    hospital: 'Heart Institute',
    languages: ['English'],
    isVerified: true,
  },
  {
    _id: '2',
    name: 'Dr. Shalomai Moraies',
    specialization: 'Neurology',
    department: 'Neuro Sciences',
    experience: 8,
    consultationFee: 6000,
    rating: { average: 4.5, count: 8 },
    qualifications: ['MBBS', 'DM'],
    image: '/doctor2.jpg',
    email: 'doc2@example.com',
    phone: '0771234568',
    licenseNumber: 'SLMC002',
    hospital: 'Neuro Sciences',
    languages: ['English'],
    isVerified: true,
  },
  {
    _id: '3',
    name: 'Dr. Mohamed Farwais',
    specialization: 'Cardiology',
    department: 'Cardiac Care',
    experience: 5,
    consultationFee: 4000,
    rating: { average: 4.2, count: 5 },
    qualifications: ['MBBS'],
    image: '/doctor3.jpg',
    email: 'doc3@example.com',
    phone: '0771234569',
    licenseNumber: 'SLMC003',
    hospital: 'Cardiac Care',
    languages: ['English'],
    isVerified: true,
  },
  {
    _id: '4',
    name: 'Dr. Sathuska Sathu',
    specialization: 'Pediatrics',
    department: 'Children Hospital',
    experience: 12,
    consultationFee: 3500,
    rating: { average: 4.7, count: 12 },
    qualifications: ['MBBS', 'DCH'],
    image: '/doctor4.jpg',
    email: 'doc4@example.com',
    phone: '0771234570',
    licenseNumber: 'SLMC004',
    hospital: 'Children Hospital',
    languages: ['English'],
    isVerified: true,
  },
  {
    _id: '5',
    name: 'Dr. Larksanan Lark',
    specialization: 'Neurology',
    department: 'Brain Center',
    experience: 20,
    consultationFee: 10000,
    rating: { average: 4.9, count: 10 },
    image: '/doctor5.jpg',
    email: 'doc5@example.com',
    phone: '0771234571',
    licenseNumber: 'SLMC005',
    hospital: 'Brain Center',
    languages: ['English'],
    isVerified: true,
    qualifications: [],
  },
];

describe('useFilters Integration with Filtering Logic', () => {
  describe('Filtering scenarios', () => {
    it('should provide data for filtering by specialization', () => {
      const { result } = renderHook(() => useFilters(extendedMockDoctors));

      const availableSpecializations = result.current.specializations;
      expect(availableSpecializations).toEqual([
        'Cardiology',
        'Neurology',
        'Pediatrics',
      ]);

      act(() => {
        result.current.setSelectedSpecialization('Cardiology');
      });

      // const filteredDoctors = doctors.filter(doctor =>
      //   doctor.specialization === selectedSpecialization || selectedSpecialization === ''
      // );
      expect(result.current.selectedSpecialization).toBe('Cardiology');
    });

    it('should provide data for filtering by department', () => {
      const { result } = renderHook(() => useFilters(extendedMockDoctors));

      const availableDepartments = result.current.departments;
      expect(availableDepartments).toEqual([
        'Brain Center',
        'Cardiac Care',
        'Children Hospital',
        'Heart Institute',
        'Neuro Sciences',
      ]);

      act(() => {
        result.current.setSelectedDepartment('Children Hospital');
      });

      expect(result.current.selectedDepartment).toBe('Children Hospital');
    });

    it('should provide data for filtering by experience', () => {
      const { result } = renderHook(() => useFilters(extendedMockDoctors));

      act(() => {
        result.current.setMinExperience(10);
      });

      expect(result.current.minExperience).toBe(10);

      // const filteredDoctors = doctors.filter(doctor =>
      //   doctor.experience >= minExperience
      // );
    });

    it('should provide data for filtering by fee', () => {
      const { result } = renderHook(() => useFilters(extendedMockDoctors));

      act(() => {
        result.current.setMaxFee(5000);
      });

      expect(result.current.maxFee).toBe(5000);

      // const filteredDoctors = doctors.filter(doctor =>
      //   doctor.consultationFee <= maxFee
      // );
    });

    it('should provide data for searching by name', () => {
      const { result } = renderHook(() => useFilters(extendedMockDoctors));

      act(() => {
        result.current.setSearchTerm('Expert');
      });

      expect(result.current.searchTerm).toBe('Expert');

      // In a real component:
      // const filteredDoctors = doctors.filter(doctor =>
      //   doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
      // );
    });
  });

  describe('Combined filtering', () => {
    it('should support multiple simultaneous filters', () => {
      const { result } = renderHook(() => useFilters(extendedMockDoctors));

      act(() => {
        result.current.setSearchTerm('Expert');
        result.current.setSelectedSpecialization('Neurology');
        result.current.setMinExperience(5);
        result.current.setMaxFee(8000);
      });

      expect(result.current.searchTerm).toBe('Expert');
      expect(result.current.selectedSpecialization).toBe('Neurology');
      expect(result.current.minExperience).toBe(5);
      expect(result.current.maxFee).toBe(8000);

      // const filteredDoctors = doctors.filter(doctor => {
      //   const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase());
      //   const matchesSpecialization = !selectedSpecialization ||
      //     doctor.specialization === selectedSpecialization;
      //   const matchesExperience = doctor.experience >= minExperience;
      //   const matchesFee = doctor.consultationFee <= maxFee;
      //
      //   return matchesSearch && matchesSpecialization && matchesExperience && matchesFee;
      // });
    });

    it('should clear all filters except showFilters', () => {
      const { result } = renderHook(() => useFilters(extendedMockDoctors));

      act(() => {
        result.current.setSearchTerm('Test');
        result.current.setSelectedSpecialization('Cardiology');
        result.current.setSelectedDepartment('Heart Institute');
        result.current.setMinExperience(10);
        result.current.setMaxFee(5000);
        result.current.setShowFilters(true);
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.searchTerm).toBe('');
      expect(result.current.selectedSpecialization).toBe('');
      expect(result.current.selectedDepartment).toBe('');
      expect(result.current.minExperience).toBe(0);
      expect(result.current.maxFee).toBe(10000);

      expect(result.current.showFilters).toBe(true);
    });
  });

  describe('Filter UI state', () => {
    it('should control filter panel visibility', () => {
      const { result } = renderHook(() => useFilters(extendedMockDoctors));

      expect(result.current.showFilters).toBe(false);

      act(() => {
        result.current.setShowFilters(true);
      });

      expect(result.current.showFilters).toBe(true);
      act(() => {
        result.current.setShowFilters(false);
      });

      expect(result.current.showFilters).toBe(false);
    });
  });
});
