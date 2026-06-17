/**
 * @jest-environment jsdom
 */
import { DoctorProfile } from '@/types/booking';

export const createMockDoctorProfile = (
  overrides?: Partial<DoctorProfile>
): DoctorProfile => ({
  _id: `doctor-${Date.now()}`,
  name: 'Dr. Jebarsan Thatcroos',
  email: 'jebarsathatcroos@gmail.com',
  phone: '1234567890',
  image: '/test.jpg',
  specialization: 'Test Specialization',
  department: 'Test Department',
  licenseNumber: 'LIC-TEST',
  hospital: 'Test Hospital',
  experience: 5,
  consultationFee: 3000,
  qualifications: ['MBBS'],
  languages: ['English', 'Tamil'],
  isVerified: true,
  rating: { average: 4.0, count: 50 },
  availableHours: {
    days: ['Monday', 'Wednesday'],
    start: '09:00',
    end: '17:00',
  },
  ...overrides,
});

export const createMockApiResponse = (doctors: Partial<DoctorProfile>[]) => ({
  success: true,
  data: doctors.map((doc, index) => ({
    id: doc._id || `doc-${index}`,
    _id: doc._id || `doc-${index}`,
    user: {
      name: doc.name || '',
      email: doc.email || '',
      phone: doc.phone || '',
      image: doc.image || '',
    },
    profile: {
      specialization: doc.specialization || '',
      department: doc.department || '',
      licenseNumber: doc.licenseNumber || '',
      hospitalAffiliation: doc.hospital || '',
      experience: doc.experience || 0,
      consultationFee: doc.consultationFee || 0,
      qualifications: doc.qualifications || [],
      languages: doc.languages || [],
      isVerified: doc.isVerified || false,
      rating: doc.rating || { average: 0, count: 0 },
      availability: doc.availableHours
        ? {
            days: doc.availableHours.days,
            startTime: doc.availableHours.start,
            endTime: doc.availableHours.end,
          }
        : undefined,
    },
  })),
});

export const mockFetchSuccess = (response: any) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => response,
  });
};

export const mockFetchError = (error: Error) => {
  (global.fetch as jest.Mock).mockRejectedValue(error);
};

describe('Hook Test Utils', () => {
  it('should export helper functions', () => {
    expect(createMockApiResponse).toBeDefined();
  });
});
