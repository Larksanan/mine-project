/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/admin/doctor/route';
import { NextRequest } from 'next/server';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/User');
jest.mock('@/models/Doctor', () => {
  const MockDoctor = jest.fn();

  (MockDoctor as any).find = jest.fn();
  (MockDoctor as any).findOne = jest.fn();
  (MockDoctor as any).countDocuments = jest.fn();
  (MockDoctor as any).findTopRated = jest.fn();
  (MockDoctor as any).findBySpecialization = jest.fn();
  (MockDoctor as any).findAvailableDoctors = jest.fn();

  return MockDoctor;
});
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((body, init) => ({
        json: async () => body,
        status: init?.status || 200,
        ...init,
      })),
    },
  };
});

describe('Admin Doctor API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET', () => {
    it('should return a list of doctors with pagination', async () => {
      const mockDoctors = [
        {
          _id: 'doc1',
          user: {
            name: 'Dr. jebarsanthacroos',
            email: 'test@example.com',
            phone: '1234567890',
            image: 'img.jpg',
          },
          profile: {
            specialization: 'Cardiology',
            department: 'Cardiology',
            experience: 10,
            consultationFee: 100,
            isVerified: true,
            rating: { average: 4.5, count: 10 },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock Mongoose query chain
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoctors),
      };

      (Doctor.find as jest.Mock).mockReturnValue(mockChain);
      (Doctor.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor?page=1&limit=10'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.count).toBe(1);
      expect(body.data[0].name).toBe('Dr. jebarsanthacroos');
      expect(Doctor.find).toHaveBeenCalled();
    });

    it('should handle topRated query', async () => {
      const mockDoctors = [{ _id: 'doc1', user: { name: 'Top Doc' } }];
      (Doctor as any).findTopRated.mockResolvedValue(mockDoctors);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor?topRated=true'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect((Doctor as any).findTopRated).toHaveBeenCalledWith(10);
    });
  });

  describe('POST', () => {
    const validDoctorData = {
      userId: 'user123',
      profile: {
        specialization: 'Cardiology',
        qualifications: ['MBBS'],
        experience: 5,
        consultationFee: 100,
        availability: { days: ['Monday'] },
        department: 'Cardiology',
        licenseNumber: 'LIC123',
        licenseExpiry: '2030-01-01',
        languages: ['English'],
        services: ['Consultation'],
      },
    };

    it('should create a new doctor profile successfully', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user123' });
      (Doctor.findOne as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn();
      const mockPopulate = jest.fn();

      // Mock Doctor constructor implementation for this test
      (Doctor as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
        _id: 'newDocId',
        user: { name: 'New Doc' },
        profile: validDoctorData.profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify(validDoctorData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('should return 400 if required fields are missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user123' }), // Missing profile
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Missing required fields');
    });
  });
});
