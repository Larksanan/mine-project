/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useFilters } from '../useFilters';
import { DoctorProfile } from '@/types/booking';

const mockDoctors: DoctorProfile[] = [
  {
    _id: '1',
    name: 'Dr. Jebarsan thatcroos',
    specialization: 'Cardiology',
    department: 'Heart Center',
    experience: 10,
    consultationFee: 5000,
    rating: { average: 4.5, count: 10 },
    qualifications: ['MBBS', 'MD'],
    image: '/doctor1.jpg',
    email: 'doc1@example.com',
    phone: '0771234567',
    licenseNumber: 'SLMC001',
    hospital: 'Heart Center',
    languages: ['English ,Tamil'],
    isVerified: true,
  },
  {
    _id: '2',
    name: 'Dr. Sovika sovika',
    specialization: 'Neurology',
    department: 'Neuro Center',
    experience: 8,
    consultationFee: 6000,
    rating: { average: 4.8, count: 8 },
    qualifications: ['MBBS', 'DM'],
    image: '/doctor2.jpg',
    email: 'doc2@example.com',
    phone: '0771234568',
    licenseNumber: 'SLMC002',
    hospital: 'Neuro Center',
    languages: ['English'],
    isVerified: true,
  },
  {
    _id: '3',
    name: 'Dr. sathuska sathu',
    specialization: 'Cardiology',
    department: 'Heart Center',
    experience: 15,
    consultationFee: 8000,
    rating: { average: 4.9, count: 15 },
    qualifications: ['MBBS', 'MD', 'DM'],
    image: '/doctor3.jpg',
    email: 'doc3@example.com',
    phone: '0771234569',
    licenseNumber: 'SLMC003',
    hospital: 'Heart Center',
    languages: ['English', 'Sinhala'],
    isVerified: true,
  },
  {
    _id: '4',
    name: 'Dr. larksanan lark',
    specialization: 'Pediatrics',
    department: 'Children Hospital',
    experience: 5,
    consultationFee: 3000,
    email: 'doc4@example.com',
    phone: '0771234570',
    licenseNumber: 'SLMC004',
    hospital: 'Children Hospital',
    languages: ['Tamil', 'English'],
    isVerified: true,
    qualifications: [],
  },
  {
    _id: '5',
    name: 'Dr. mohamed  farwais',
    specialization: 'Neurology',
    department: 'Neuro Center',
    experience: 12,
    consultationFee: 7000,
    rating: { average: 4.7, count: 12 },
    qualifications: ['MBBS', 'MS'],
    image: '/doctor5.jpg',
    email: 'doc5@example.com',
    phone: '0771234571',
    licenseNumber: 'SLMC005',
    hospital: 'Neuro Center',
    languages: ['English'],
    isVerified: true,
  },
];

describe('useFilters Hook', () => {
  describe('Initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      expect(result.current.searchTerm).toBe('');
      expect(result.current.selectedSpecialization).toBe('');
      expect(result.current.selectedDepartment).toBe('');
      expect(result.current.minExperience).toBe(0);
      expect(result.current.maxFee).toBe(10000);
      expect(result.current.showFilters).toBe(false);
    });

    it('should compute specializations from doctors array', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      expect(result.current.specializations).toEqual([
        'Cardiology',
        'Neurology',
        'Pediatrics',
      ]);
    });

    it('should compute departments from doctors array', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      expect(result.current.departments).toEqual([
        'Children Hospital',
        'Heart Center',
        'Neuro Center',
      ]);
    });

    it('should handle empty doctors array', () => {
      const { result } = renderHook(() => useFilters([]));

      expect(result.current.specializations).toEqual([]);
      expect(result.current.departments).toEqual([]);
    });
  });

  describe('State updates', () => {
    it('should update search term', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      act(() => {
        result.current.setSearchTerm('Jebarsan');
      });

      expect(result.current.searchTerm).toBe('Jebarsan');
    });

    it('should update selected specialization', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      act(() => {
        result.current.setSelectedSpecialization('Cardiology');
      });

      expect(result.current.selectedSpecialization).toBe('Cardiology');
    });

    it('should update selected department', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      act(() => {
        result.current.setSelectedDepartment('Heart Center');
      });

      expect(result.current.selectedDepartment).toBe('Heart Center');
    });

    it('should update minimum experience', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      act(() => {
        result.current.setMinExperience(10);
      });

      expect(result.current.minExperience).toBe(10);
    });

    it('should update maximum fee', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      act(() => {
        result.current.setMaxFee(5000);
      });

      expect(result.current.maxFee).toBe(5000);
    });

    it('should toggle show filters', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

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

  describe('clearFilters function', () => {
    it('should reset all filter values to defaults', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      act(() => {
        result.current.setSearchTerm('Jebarsan');
        result.current.setSelectedSpecialization('Cardiology');
        result.current.setSelectedDepartment('Heart Center');
        result.current.setMinExperience(10);
        result.current.setMaxFee(5000);
        result.current.setShowFilters(true);
      });

      expect(result.current.searchTerm).toBe('Jebarsan');
      expect(result.current.selectedSpecialization).toBe('Cardiology');
      expect(result.current.selectedDepartment).toBe('Heart Center');
      expect(result.current.minExperience).toBe(10);
      expect(result.current.maxFee).toBe(5000);
      expect(result.current.showFilters).toBe(true);

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

    it('should work when called multiple times', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      act(() => {
        result.current.setSearchTerm('Test');
      });

      act(() => {
        result.current.clearFilters();
        result.current.clearFilters();
        result.current.clearFilters();
      });

      expect(result.current.searchTerm).toBe('');
    });
  });

  describe('Memoized values', () => {
    it('should memoize specializations', () => {
      const { result, rerender } = renderHook(
        ({ doctors }) => useFilters(doctors),
        {
          initialProps: { doctors: mockDoctors },
        }
      );

      const firstSpecializations = result.current.specializations;

      rerender({ doctors: mockDoctors });

      const secondSpecializations = result.current.specializations;

      expect(firstSpecializations).toBe(secondSpecializations);
    });

    it.skip('should recompute specializations when doctors change', () => {
      const { result, rerender } = renderHook(
        ({ doctors }) => useFilters(doctors),
        {
          initialProps: { doctors: mockDoctors },
        }
      );

      const firstSpecializations = result.current.specializations;

      rerender({ doctors: mockDoctors });

      const secondSpecializations = result.current.specializations;

      expect(firstSpecializations).toBe(secondSpecializations);

      const doctorsWithNewSpecialization = [
        ...mockDoctors,
        {
          _id: '6',
          name: 'Dr. Mathushana Mathu',
          specialization: 'Orthopedics',
          department: 'Bone Center',
          experience: 7,
          consultationFee: 4000,
          availableSlots: [],
          bio: 'Orthopedic specialist',
          rating: { average: 4.4, count: 7 },
          qualifications: ['MBBS', 'MS'],
          image: '/doctor6.jpg',
          email: 'doc6@example.com',
          phone: '0771234572',
          licenseNumber: 'SLMC006',
          hospital: 'Bone Center',
          languages: ['English'],
          isVerified: true,
        },
      ];

      rerender({ doctors: doctorsWithNewSpecialization });

      const thirdSpecializations = result.current.specializations;

      expect(thirdSpecializations).not.toBe(firstSpecializations);
      expect(thirdSpecializations).toContain('Orthopedics');
    });

    it('should memoize departments', () => {
      const { result, rerender } = renderHook(
        ({ doctors }) => useFilters(doctors),
        {
          initialProps: { doctors: mockDoctors },
        }
      );

      const firstDepartments = result.current.departments;

      rerender({ doctors: mockDoctors });

      const secondDepartments = result.current.departments;

      expect(firstDepartments).toBe(secondDepartments);
    });

    it('should handle doctors with missing specialization or department', () => {
      const incompleteDoctors: DoctorProfile[] = [
        {
          _id: '1',
          name: 'Dr. mathurukka',
          specialization: '',
          department: 'Test Department',
          experience: 5,
          consultationFee: 3000,
          rating: { average: 4.0, count: 5 },
          qualifications: ['MBBS'],
          image: '/test.jpg',
          email: 'test1@example.com',
          phone: '123',
          licenseNumber: '123',
          hospital: 'Test',
          languages: ['English'],
          isVerified: true,
        },
        {
          _id: '2',
          name: 'Dr. sayanthini',
          specialization: 'Test Specialization',
          department: '',
          experience: 8,
          consultationFee: 4000,
          rating: { average: 4.2, count: 8 },
          qualifications: ['MBBS', 'MD'],
          image: '/another.jpg',
          email: 'test2@example.com',
          phone: '123',
          licenseNumber: '123',
          hospital: 'Test',
          languages: ['English'],
          isVerified: true,
        },
      ];

      const { result } = renderHook(() => useFilters(incompleteDoctors));
      expect(result.current.specializations).toContain('');
      expect(result.current.departments).toContain('');
    });

    it('should handle duplicate specializations and departments', () => {
      const doctorsWithDuplicates: DoctorProfile[] = [
        {
          _id: '1',
          name: 'Dr. Mayuri',
          specialization: 'Cardiology',
          department: 'Heart Center',
          experience: 10,
          consultationFee: 5000,
          rating: { average: 4.5, count: 10 },
          qualifications: ['MBBS'],
          image: '/one.jpg',
          email: 'dup1@example.com',
          phone: '123',
          licenseNumber: '123',
          hospital: 'Heart Center',
          languages: ['English'],
          isVerified: true,
        },
        {
          _id: '2',
          name: 'Dr. melkin',
          specialization: 'Cardiology',
          department: 'Heart Center',
          experience: 8,
          rating: { average: 4.3, count: 8 },
          qualifications: ['MBBS', 'MD'],
          image: '/two.jpg',
          email: 'dup2@example.com',
          phone: '123',
          licenseNumber: '123',
          hospital: 'Heart Center',
          languages: ['English'],
          isVerified: true,
          consultationFee: 0,
        },
        {
          _id: '3',
          name: 'Dr. Emarsan',
          specialization: 'Cardiology',
          department: 'Heart Center',
          experience: 12,
          consultationFee: 5500,
          rating: { average: 4.7, count: 12 },
          qualifications: ['MBBS', 'MD', 'DM'],
          image: '/three.jpg',
          email: 'dup3@example.com',
          phone: '123',
          licenseNumber: '123',
          hospital: 'Heart Center',
          languages: ['English'],
          isVerified: true,
        },
      ];

      const { result } = renderHook(() => useFilters(doctorsWithDuplicates));

      expect(result.current.specializations).toEqual(['Cardiology']);
      expect(result.current.departments).toEqual(['Heart Center']);
    });
  });

  describe('Edge cases', () => {
    it.skip('should handle undefined doctors prop', () => {
      const { result } = renderHook(() => useFilters(undefined as any));
      expect(result.current.specializations).toEqual([]);
      expect(result.current.departments).toEqual([]);
    });

    it.skip('should handle doctors with null specialization or department', () => {
      const doctorsWithNulls = [
        {
          _id: '1',
          name: 'Dr. manoj',
          specialization: null as any,
          department: null as any,
          experience: 5,
          consultationFee: 3000,
          rating: { average: 4.0, count: 5 },
          qualifications: ['MBBS'],
          image: '/test.jpg',
          email: 'null@example.com',
          phone: '123',
          licenseNumber: '123',
          hospital: 'Test',
          languages: ['English'],
          isVerified: true,
        },
      ];

      const { result } = renderHook(() => useFilters(doctorsWithNulls));

      expect(result.current.specializations).toEqual([]);
      expect(result.current.departments).toEqual([]);
    });

    it('should handle doctors with undefined specialization or department', () => {
      const doctorsWithUndefined = [
        {
          _id: '1',
          name: 'Dr. rosan jebanesan',
          specialization: undefined as any,
          department: undefined as any,
          experience: 5,
          consultationFee: 3000,
          rating: { average: 4.0, count: 5 },
          qualifications: ['MBBS'],
          image: '/test.jpg',
          email: 'undef@example.com',
          phone: '123',
          licenseNumber: '123',
          hospital: 'Test',
          languages: ['English'],
          isVerified: true,
        },
      ];

      const { result } = renderHook(() => useFilters(doctorsWithUndefined));

      expect(result.current.specializations).toEqual([]);
      expect(result.current.departments).toEqual([]);
    });
  });

  describe('Performance and optimization', () => {
    it.skip('should maintain stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useFilters(mockDoctors));

      const firstReferences = {
        setSearchTerm: result.current.setSearchTerm,
        setSelectedSpecialization: result.current.setSelectedSpecialization,
        setSelectedDepartment: result.current.setSelectedDepartment,
        setMinExperience: result.current.setMinExperience,
        setMaxFee: result.current.setMaxFee,
        setShowFilters: result.current.setShowFilters,
        clearFilters: result.current.clearFilters,
      };

      for (let i = 0; i < 5; i++) {
        rerender();
      }

      const finalReferences = {
        setSearchTerm: result.current.setSearchTerm,
        setSelectedSpecialization: result.current.setSelectedSpecialization,
        setSelectedDepartment: result.current.setSelectedDepartment,
        setMinExperience: result.current.setMinExperience,
        setMaxFee: result.current.setMaxFee,
        setShowFilters: result.current.setShowFilters,
        clearFilters: result.current.clearFilters,
      };

      expect(firstReferences.setSearchTerm).toBe(finalReferences.setSearchTerm);
      expect(firstReferences.setSelectedSpecialization).toBe(
        finalReferences.setSelectedSpecialization
      );
      expect(firstReferences.setSelectedDepartment).toBe(
        finalReferences.setSelectedDepartment
      );
      expect(firstReferences.setMinExperience).toBe(
        finalReferences.setMinExperience
      );
      expect(firstReferences.setMaxFee).toBe(finalReferences.setMaxFee);
      expect(firstReferences.setShowFilters).toBe(
        finalReferences.setShowFilters
      );
      expect(firstReferences.clearFilters).toBe(finalReferences.clearFilters);
    });

    it('should handle large doctors array efficiently', () => {
      const largeDoctorsArray: DoctorProfile[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDoctorsArray.push({
          _id: `${i}`,
          name: `Dr. Shalomi ${i}`,
          specialization: `Specialization ${i % 10}`,
          department: `Department ${i % 5}`,
          experience: i % 30,
          consultationFee: 1000 + (i % 10) * 1000,
          rating: { average: 3.5 + (i % 15) / 10, count: 10 },
          qualifications: ['MBBS'],
          image: `/doctor${i}.jpg`,
          email: `doc${i}@example.com`,
          phone: '123',
          licenseNumber: `LIC${i}`,
          hospital: 'General',
          languages: ['English'],
          isVerified: true,
        });
      }

      const { result } = renderHook(() => useFilters(largeDoctorsArray));

      expect(result.current.specializations).toHaveLength(10);
      expect(result.current.departments).toHaveLength(5);
      expect(result.current.specializations).toEqual(
        expect.arrayContaining(['Specialization 0', 'Specialization 9'])
      );
      expect(result.current.departments).toEqual(
        expect.arrayContaining(['Department 0', 'Department 4'])
      );
    });

    it('should not cause unnecessary re-renders with same state updates', () => {
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useFilters(mockDoctors);
      });

      const initialRenderCount = renderCount;
      act(() => {
        result.current.setSearchTerm('');
        result.current.setSearchTerm('');
        result.current.setSearchTerm('');
      });

      expect(renderCount).toBe(initialRenderCount);
    });
  });

  describe('Integration with filtering logic', () => {
    it('should provide all necessary data for filtering doctors', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      act(() => {
        result.current.setSearchTerm('cardio');
        result.current.setSelectedSpecialization('Cardiology');
        result.current.setMinExperience(8);
        result.current.setMaxFee(6000);
      });

      const filterValues = {
        searchTerm: result.current.searchTerm.toLowerCase(),
        selectedSpecialization: result.current.selectedSpecialization,
        minExperience: result.current.minExperience,
        maxFee: result.current.maxFee,
      };

      expect(filterValues.searchTerm).toBe('cardio');
      expect(filterValues.selectedSpecialization).toBe('Cardiology');
      expect(filterValues.minExperience).toBe(8);
      expect(filterValues.maxFee).toBe(6000);
    });
  });

  describe('TypeScript interface compliance', () => {
    it('should return correct TypeScript types', () => {
      const { result } = renderHook(() => useFilters(mockDoctors));

      expect(typeof result.current.searchTerm).toBe('string');
      expect(typeof result.current.selectedSpecialization).toBe('string');
      expect(typeof result.current.selectedDepartment).toBe('string');
      expect(typeof result.current.minExperience).toBe('number');
      expect(typeof result.current.maxFee).toBe('number');
      expect(typeof result.current.showFilters).toBe('boolean');
      expect(Array.isArray(result.current.specializations)).toBe(true);
      expect(Array.isArray(result.current.departments)).toBe(true);
      expect(typeof result.current.setSearchTerm).toBe('function');
      expect(typeof result.current.clearFilters).toBe('function');
    });

    it('should work with DoctorProfile type constraints', () => {
      const validDoctors: DoctorProfile[] = mockDoctors;
      const { result } = renderHook(() => useFilters(validDoctors));
      expect(result.current).toBeDefined();
    });
  });
});
