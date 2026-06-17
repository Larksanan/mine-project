/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDoctors } from '../useDoctors';
import { DoctorProfile } from '@/types/booking';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error
console.error = jest.fn();

describe('useDoctors Hook', () => {
  // Sample API response data
  const mockApiResponse = {
    success: true,
    data: [
      {
        id: 'doc-1',
        user: {
          name: 'Dr. Jebarsan Thatcroos',
          email: 'jebrsanthatcroos@gmil.com',
          phone: '1234567890',
          image: '/jeba.jpg',
        },
        profile: {
          specialization: 'Cardiology',
          department: 'Heart Center',
          licenseNumber: 'LIC123',
          hospitalAffiliation: 'City Hospital',
          experience: 10,
          consultationFee: 5000,
          qualifications: ['MBBS', 'MD'],
          languages: ['English', 'Tamil'],
          isVerified: true,
          rating: { average: 4.5, count: 120 },
          availability: {
            days: ['Monday', 'Wednesday', 'Friday'],
            startTime: '09:00',
            endTime: '17:00',
          },
        },
      },
      {
        _id: 'doc-2',
        user: {
          name: 'Dr. Shalomai Moraies',
          email: 'shalomaimoraies@gamil.com',
          phone: '0987654321',
          image: '/jane.jpg',
        },
        profile: {
          specialization: 'Neurology',
          department: 'Neuro Center',
          licenseNumber: 'LIC456',
          hospitalAffiliation: 'General Hospital',
          experience: 8,
          consultationFee: 6000,
          qualifications: ['MBBS', 'DM'],
          languages: ['English'],
          isVerified: true,
          rating: { average: 4.8, count: 95 },
          availability: {
            days: ['Tuesday', 'Thursday'],
            startTime: '10:00',
            endTime: '16:00',
          },
        },
      },
      {
        id: 'doc-3',
        user: {
          name: 'Dr. Mohamed Farwais',
          email: 'mohamedfarwais@example.com',
          phone: '5555555555',
        },
        profile: {
          specialization: 'Cardiology',
          department: 'Heart Center',
          licenseNumber: 'LIC789',
          hospitalAffiliation: 'University Hospital',
          experience: 15,
          consultationFee: 8000,
          qualifications: ['MBBS', 'MD', 'DM'],
          languages: ['English', 'Tamil'],
          rating: { average: 4.9, count: 200 },
        },
      },
    ],
  };

  const mockTransformedDoctors: DoctorProfile[] = [
    {
      _id: 'doc-1',
      name: 'Dr. Jebarsan Thatcroos',
      email: 'jebrsanthatcroos@gmil.com',
      phone: '1234567890',
      image: '/jeba.jpg',
      specialization: 'Cardiology',
      department: 'Heart Center',
      licenseNumber: 'LIC123',
      hospital: 'City Hospital',
      experience: 10,
      consultationFee: 5000,
      qualifications: ['MBBS', 'MD'],
      languages: ['English', 'Tamil'],
      isVerified: true,
      rating: { average: 4.5, count: 120 },
      availableHours: {
        days: ['Monday', 'Wednesday', 'Friday'],
        start: '09:00',
        end: '17:00',
      },
    },
    {
      _id: 'doc-2',
      name: 'Dr. Shalomai Moraies',
      email: 'shalomaimoraies@gamil.com',
      phone: '0987654321',
      image: '/jane.jpg',
      specialization: 'Neurology',
      department: 'Neuro Center',
      licenseNumber: 'LIC456',
      hospital: 'General Hospital',
      experience: 8,
      consultationFee: 6000,
      qualifications: ['MBBS', 'DM'],
      languages: ['English'],
      isVerified: true,
      rating: { average: 4.8, count: 95 },
      availableHours: {
        days: ['Tuesday', 'Thursday'],
        start: '10:00',
        end: '16:00',
      },
    },
    {
      _id: 'doc-3',
      name: 'Dr. Mohamed Farwais',
      email: 'mohamedfarwais@example.com',
      phone: '5555555555',
      image: '',
      specialization: 'Cardiology',
      department: 'Heart Center',
      licenseNumber: 'LIC789',
      hospital: 'University Hospital',
      experience: 15,
      consultationFee: 8000,
      qualifications: ['MBBS', 'MD', 'DM'],
      isVerified: false,
      rating: { average: 4.9, count: 200 },
      availableHours: undefined,
      languages: ['English', 'Tamil'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();
  });

  describe('Initial state', () => {
    it('should initialize with empty arrays and loading true', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      expect(result.current.doctors).toEqual([]);
      expect(result.current.filteredDoctors).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(typeof result.current.setFilteredDoctors).toBe('function');
      expect(typeof result.current.filterAndSortDoctors).toBe('function');
      expect(typeof result.current.refetchDoctors).toBe('function');
    });

    it('should not fetch doctors when status is not authenticated', async () => {
      renderHook(() => useDoctors('unauthenticated'));

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('fetchDoctors function', () => {
    it('should fetch doctors successfully when authenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useDoctors('authenticated'));

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/patients/docter');
      expect(result.current.doctors).toEqual(mockTransformedDoctors);
      expect(result.current.filteredDoctors).toEqual(mockTransformedDoctors);
    });

    it('should handle API response with empty data array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const { result } = renderHook(() => useDoctors('authenticated'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.doctors).toEqual([]);
      expect(result.current.filteredDoctors).toEqual([]);
    });

    it('should handle API response with null data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: null,
        }),
      });

      const { result } = renderHook(() => useDoctors('authenticated'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.doctors).toEqual([]);
      expect(result.current.filteredDoctors).toEqual([]);
    });

    it('should handle API response without data property', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      const { result } = renderHook(() => useDoctors('authenticated'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.doctors).toEqual([]);
      expect(result.current.filteredDoctors).toEqual([]);
    });

    it('should handle doctors with missing properties gracefully', async () => {
      const incompleteResponse = {
        success: true,
        data: [
          {
            // Missing id/_id
            user: {
              // Missing name
              email: 'jebarsanthatcroos16@gmil.com',
            },
            profile: {
              // Empty profile
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteResponse,
      });

      const { result } = renderHook(() => useDoctors('authenticated'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.doctors).toHaveLength(1);
      const doctor = result.current.doctors[0];
      expect(doctor._id).toBeUndefined(); // Would be undefined from id || _id
      expect(doctor.name).toBe('');
      expect(doctor.specialization).toBe('');
      expect(doctor.consultationFee).toBe(0);
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useDoctors('authenticated'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching doctors:',
        expect.any(Error)
      );
      expect(result.current.doctors).toEqual([]);
      expect(result.current.filteredDoctors).toEqual([]);
    });

    it('should handle non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useDoctors('authenticated'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching doctors:',
        expect.any(Error)
      );
    });

    it('should handle API response with success: false', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          message: 'Failed to fetch doctors',
        }),
      });

      const { result } = renderHook(() => useDoctors('authenticated'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Transform should still work but data would be empty
      expect(result.current.doctors).toEqual([]);
    });
  });

  describe('filterAndSortDoctors function', () => {
    const testDoctors: DoctorProfile[] = [
      {
        _id: '1',
        name: 'Dr. Jebarsan Thatcroos',
        email: 'jebarsanthatcroos16@gmil.com',
        phone: '11234567400',
        specialization: 'Cardiology',
        department: 'Heart Center',
        licenseNumber: 'L1',
        hospital: 'City Hospital',
        experience: 5,
        consultationFee: 3000,
        qualifications: ['MBBS'],
        languages: ['English'],
        isVerified: true,
        rating: { average: 4.0, count: 50 },
      },
      {
        _id: '2',
        name: 'Dr. Sovika Sovi',
        email: 'sovikasovi@example.com',
        phone: '2222222222',
        image: '',
        specialization: 'Neurology',
        department: 'Neuro Center',
        licenseNumber: 'L2',
        hospital: 'General Hospital',
        experience: 12,
        consultationFee: 7000,
        qualifications: ['MBBS', 'MD'],
        languages: ['English', 'Spanish'],
        isVerified: true,
        rating: { average: 4.7, count: 120 },
      },
      {
        _id: '3',
        name: 'Dr. Carol Davis',
        email: 'carol@example.com',
        phone: '3333333333',
        image: '',
        specialization: 'Cardiology',
        department: 'Heart Center',
        licenseNumber: 'L3',
        hospital: 'University Hospital',
        experience: 8,
        consultationFee: 5000,
        qualifications: ['MBBS', 'MD'],
        languages: ['English'],
        isVerified: false,
        rating: { average: 4.5, count: 80 },
      },
      {
        _id: '4',
        name: 'Dr. Emarsan Thatcroos ',
        email: 'emarsanthatcroos@example.com',
        phone: '4444444444',
        image: '',
        specialization: 'Pediatrics',
        department: 'Children Hospital',
        licenseNumber: 'L4',
        hospital: 'Kids Hospital',
        experience: 3,
        consultationFee: 2500,
        qualifications: ['MBBS'],
        languages: ['English'],
        isVerified: true,
        rating: { average: 4.2, count: 40 },
      },
    ];

    it('should return all doctors when no filters applied', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        testDoctors,
        '', // searchTerm
        '', // selectedSpecialization
        '', // selectedDepartment
        0, // minExperience
        10000, // maxFee
        'name' // sortBy
      );

      expect(filtered).toHaveLength(4);
      expect(filtered.map(d => d.name)).toEqual([
        'Dr. Carol Davis',
        'Dr. Emarsan Thatcroos ',
        'Dr. Jebarsan Thatcroos',
        'Dr. Sovika Sovi',
      ]);
    });

    it('should filter by search term', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      // Search by name
      let filtered = result.current.filterAndSortDoctors(
        testDoctors,
        'Jebarsan',
        '',
        '',
        0,
        10000,
        'name'
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Dr. Jebarsan Thatcroos');

      // Search by specialization
      filtered = result.current.filterAndSortDoctors(
        testDoctors,
        'cardio',
        '',
        '',
        0,
        10000,
        'name'
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.map(d => d.name)).toEqual([
        'Dr. Carol Davis',
        'Dr. Jebarsan Thatcroos',
      ]);

      // Search by hospital
      filtered = result.current.filterAndSortDoctors(
        testDoctors,
        'University',
        '',
        '',
        0,
        10000,
        'name'
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Dr. Carol Davis');

      // Case insensitive search
      filtered = result.current.filterAndSortDoctors(
        testDoctors,
        'HOSPITAL',
        '',
        '',
        0,
        10000,
        'name'
      );
      expect(filtered).toHaveLength(4); // All have "Hospital" in their hospital name
    });

    it('should filter by specialization', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        testDoctors,
        '',
        'Cardiology',
        '',
        0,
        10000,
        'name'
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(d => d.specialization)).toEqual([
        'Cardiology',
        'Cardiology',
      ]);
      expect(filtered.map(d => d.name)).toEqual([
        'Dr. Carol Davis',
        'Dr. Jebarsan Thatcroos',
      ]);
    });

    it('should filter by department', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        testDoctors,
        '',
        '',
        'Heart Center',
        0,
        10000,
        'name'
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(d => d.department)).toEqual([
        'Heart Center',
        'Heart Center',
      ]);
    });

    it('should filter by minimum experience', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        testDoctors,
        '',
        '',
        '',
        8,
        10000,
        'name'
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(d => d.name)).toEqual([
        'Dr. Carol Davis', // 8 years
        'Dr. Sovika Sovi', // 12 years
      ]);
    });

    it('should filter by maximum fee', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        testDoctors,
        '',
        '',
        '',
        0,
        4000,
        'name'
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(d => d.name)).toEqual([
        'Dr. Emarsan Thatcroos ', // 2500
        'Dr. Jebarsan Thatcroos', // 3000
      ]);
    });

    it('should apply multiple filters simultaneously', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        testDoctors,
        '', // searchTerm
        'Cardiology', // specialization
        'Heart Center', // department
        5, // min experience
        6000, // max fee
        'name' // sort
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(d => d.name)).toEqual([
        'Dr. Carol Davis', // 8 years, 5000 fee
        'Dr. Jebarsan Thatcroos', // 5 years, 3000 fee
      ]);
    });

    describe('Sorting', () => {
      it('should sort by name (default)', () => {
        const { result } = renderHook(() => useDoctors('unauthenticated'));

        const filtered = result.current.filterAndSortDoctors(
          testDoctors,
          '',
          '',
          '',
          0,
          10000,
          'name'
        );

        expect(filtered.map(d => d.name)).toEqual([
          'Dr. Carol Davis',
          'Dr. Emarsan Thatcroos ',
          'Dr. Jebarsan Thatcroos',
          'Dr. Sovika Sovi',
        ]);
      });

      it('should sort by experience (descending)', () => {
        const { result } = renderHook(() => useDoctors('unauthenticated'));

        const filtered = result.current.filterAndSortDoctors(
          testDoctors,
          '',
          '',
          '',
          0,
          10000,
          'experience'
        );

        expect(filtered.map(d => d.name)).toEqual([
          'Dr. Sovika Sovi', // 12 years
          'Dr. Carol Davis', // 8 years
          'Dr. Jebarsan Thatcroos', // 5 years
          'Dr. Emarsan Thatcroos ', // 3 years
        ]);
      });

      it('should sort by fee (ascending)', () => {
        const { result } = renderHook(() => useDoctors('unauthenticated'));

        const filtered = result.current.filterAndSortDoctors(
          testDoctors,
          '',
          '',
          '',
          0,
          10000,
          'fee'
        );

        expect(filtered.map(d => d.name)).toEqual([
          'Dr. Emarsan Thatcroos ', // 2500
          'Dr. Jebarsan Thatcroos', // 3000
          'Dr. Carol Davis', // 5000
          'Dr. Sovika Sovi', // 7000
        ]);
      });

      it('should sort by rating (descending)', () => {
        const { result } = renderHook(() => useDoctors('unauthenticated'));

        const filtered = result.current.filterAndSortDoctors(
          testDoctors,
          '',
          '',
          '',
          0,
          10000,
          'rating'
        );

        expect(filtered.map(d => d.name)).toEqual([
          'Dr. Sovika Sovi', // 4.7
          'Dr. Carol Davis', // 4.5
          'Dr. Emarsan Thatcroos ', // 4.2
          'Dr. Jebarsan Thatcroos', // 4.0
        ]);
      });

      it('should handle doctors without rating', () => {
        const doctorsWithoutRating = [
          { ...testDoctors[0], rating: undefined },
          { ...testDoctors[1], rating: { average: 0, count: 0 } },
        ];

        const { result } = renderHook(() => useDoctors('unauthenticated'));

        const filtered = result.current.filterAndSortDoctors(
          doctorsWithoutRating,
          '',
          '',
          '',
          0,
          10000,
          'rating'
        );

        // Should handle missing ratings gracefully
        expect(filtered).toHaveLength(2);
      });
    });

    it('should not modify original array', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const originalDoctors = [...testDoctors];
      const filtered = result.current.filterAndSortDoctors(
        testDoctors,
        'Alice',
        '',
        '',
        0,
        10000,
        'name'
      );

      // Original array should remain unchanged
      expect(testDoctors).toEqual(originalDoctors);
      // Should return new array
      expect(filtered).not.toBe(testDoctors);
    });

    it('should handle empty doctors array', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        [],
        'test',
        'Cardiology',
        'Heart Center',
        5,
        5000,
        'name'
      );

      expect(filtered).toEqual([]);
    });
  });

  describe('setFilteredDoctors function', () => {
    it('should update filteredDoctors state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useDoctors('authenticated'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newFilteredDoctors = [mockTransformedDoctors[0]];

      act(() => {
        result.current.setFilteredDoctors(newFilteredDoctors);
      });

      expect(result.current.filteredDoctors).toEqual(newFilteredDoctors);
      // Original doctors array should remain unchanged
      expect(result.current.doctors).toEqual(mockTransformedDoctors);
    });
  });

  describe('refetchDoctors function', () => {
    it('should refetch doctors when called', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [mockApiResponse.data[0]], // Only first doctor
          }),
        });

      const { result } = renderHook(() => useDoctors('authenticated'));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.doctors).toHaveLength(3);

      // Refetch
      await act(async () => {
        await result.current.refetchDoctors();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.current.doctors).toHaveLength(1);
    });

    it('should handle errors during refetch', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        })
        .mockRejectedValueOnce(new Error('Refetch error'));

      const { result } = renderHook(() => useDoctors('authenticated'));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Refetch with error
      await act(async () => {
        await result.current.refetchDoctors();
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching doctors:',
        expect.any(Error)
      );
    });
  });

  describe('useEffect dependencies', () => {
    it('should fetch doctors when status changes to authenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { rerender } = renderHook(({ status }) => useDoctors(status), {
        initialProps: { status: 'unauthenticated' },
      });

      // Should not fetch initially
      expect(global.fetch).not.toHaveBeenCalled();

      // Change status to authenticated
      rerender({ status: 'authenticated' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should not fetch doctors when status changes from authenticated to unauthenticated', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { rerender } = renderHook(({ status }) => useDoctors(status), {
        initialProps: { status: 'authenticated' },
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Change status to unauthenticated
      rerender({ status: 'unauthenticated' });

      // Should not fetch again
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('useCallback dependencies', () => {
    it('should maintain stable function references', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result, rerender } = renderHook(() =>
        useDoctors('authenticated')
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstFetchDoctors = result.current.refetchDoctors;
      const firstFilterAndSort = result.current.filterAndSortDoctors;

      // Re-render
      rerender();

      const secondFetchDoctors = result.current.refetchDoctors;
      const secondFilterAndSort = result.current.filterAndSortDoctors;

      // Functions should maintain same references
      expect(firstFetchDoctors).toBe(secondFetchDoctors);
      expect(firstFilterAndSort).toBe(secondFilterAndSort);
    });
  });

  describe('Edge cases', () => {
    it('should handle doctors with same experience or fee during sorting', () => {
      const doctorsWithSameValues: DoctorProfile[] = [
        {
          _id: '1',
          name: 'Dr. A',
          email: 'a@example.com',
          phone: '111',
          image: '',
          specialization: 'Cardiology',
          department: 'Heart',
          licenseNumber: 'L1',
          hospital: 'Hospital A',
          experience: 5,
          consultationFee: 3000,
          qualifications: ['MBBS'],
          languages: ['English'],
          isVerified: true,
          rating: { average: 4.0, count: 50 },
        },
        {
          _id: '2',
          name: 'Dr. B',
          email: 'b@example.com',
          phone: '222',
          image: '',
          specialization: 'Cardiology',
          department: 'Heart',
          licenseNumber: 'L2',
          hospital: 'Hospital B',
          experience: 5,
          consultationFee: 3000,
          qualifications: ['MBBS'],
          languages: ['English'],
          isVerified: true,
          rating: { average: 4.0, count: 50 },
        },
      ];

      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        doctorsWithSameValues,
        '',
        '',
        '',
        0,
        10000,
        'experience'
      );

      // Should maintain original order when values are equal
      expect(filtered.map(d => d.name)).toEqual(['Dr. A', 'Dr. B']);
    });

    it('should handle search with whitespace', () => {
      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        mockTransformedDoctors,
        '  Jebarsan   ', // With spaces
        '',
        '',
        0,
        10000,
        'name'
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Dr. Jebarsan Thatcroos');
    });

    it('should handle doctors with null or undefined properties', () => {
      const doctorsWithNulls: DoctorProfile[] = [
        {
          _id: '1',
          name: 'Dr. Test',
          email: '',
          phone: '',
          image: '',
          specialization: '',
          department: '',
          licenseNumber: '',
          hospital: '',
          experience: 0,
          consultationFee: 0,
          qualifications: [],
          languages: [],
          isVerified: false,
          rating: undefined,
        },
      ];

      const { result } = renderHook(() => useDoctors('unauthenticated'));

      const filtered = result.current.filterAndSortDoctors(
        doctorsWithNulls,
        'test',
        '',
        '',
        0,
        10000,
        'rating'
      );

      // Should handle null/undefined without crashing
      expect(filtered).toHaveLength(1);
    });
  });
});
