/**
 * @jest-environment jsdom
 */
import { DoctorProfile } from '@/types/booking';

export const createMockDoctor = (
  overrides?: Partial<DoctorProfile>
): DoctorProfile => ({
  _id: `doctor-${Date.now()}`,
  name: 'Dr. Jebarsan Thatcroos',
  email: 'test@example.com',
  phone: '0771234567',
  licenseNumber: 'SLMC001',
  hospital: 'ECHLP',
  languages: ['English', 'Tamil'],
  isVerified: true,
  specialization: 'Test Specialization',
  department: 'Test Department',
  experience: 10,
  consultationFee: 5000,
  rating: { average: 4.9, count: 10 },
  qualifications: ['MBBS'],
  image: '/test.jpg',
  ...overrides,
});

export const createMockDoctorsWithVariety = (
  count: number
): DoctorProfile[] => {
  const specializations = [
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
  ];
  const departments = [
    'Heart Center',
    'Neuro Center',
    'Children Hospital',
    'Bone Center',
    'Skin Clinic',
  ];

  return Array.from({ length: count }, (_, i) => ({
    _id: `doctor-${i}`,
    name: `Dr. Shalomai Moraies ${i}`,
    email: `doctor${i}@example.com`,
    phone: `077${String(i).padStart(7, '0')}`,
    licenseNumber: `SLMC${String(i).padStart(3, '0')}`,
    hospital: 'ECHLP',
    languages: ['English', 'Tamil'],
    isVerified: true,
    specialization: specializations[i % specializations.length],
    department: departments[i % departments.length],
    experience: (i % 20) + 1,
    consultationFee: 1000 + (i % 10) * 1000,
    rating: { average: 3.5 + (i % 15) / 10, count: 10 },
    availableSlots: [],
    bio: `Bio for doctor ${i}`,
    qualifications: ['MBBS'],
    image: `/doctor${i}.jpg`,
  }));
};

export const getUniqueValues = <T>(array: T[]): T[] =>
  Array.from(new Set(array)).sort();

describe('Filter Test Utils', () => {
  it('should export helper functions', () => {
    expect(createMockDoctor).toBeDefined();
    expect(createMockDoctorsWithVariety).toBeDefined();
    expect(getUniqueValues).toBeDefined();
  });
});

describe('Filter Test Utils', () => {
  it('should export helper functions', () => {
    expect(createMockDoctor).toBeDefined();
    expect(createMockDoctorsWithVariety).toBeDefined();
    expect(getUniqueValues).toBeDefined();
  });
});
