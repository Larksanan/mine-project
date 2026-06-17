/**
 * @jest-environment node
 */
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

// Mock dependencies
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

// Mock models
jest.mock('@/models/User');
jest.mock('@/models/Doctor');

// Mock NextResponse
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
  });

  describe('GET', () => {
    it('should fetch doctors with default pagination', async () => {
      const mockDoctors = [
        {
          _id: 'doc1',
          user: {
            name: 'Dr. One',
            email: 'dr1@test.com',
            phone: '1234567890',
            image: 'img.jpg',
          },
          profile: {
            specialization: 'General',
            department: 'General',
            experience: 5,
            consultationFee: 100,
            isVerified: true,
            rating: { average: 4.5, count: 10 },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (Doctor.countDocuments as jest.Mock).mockResolvedValue(1);

      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoctors),
      };
      (Doctor.find as jest.Mock).mockReturnValue(mockFindChain);

      const req = new NextRequest('http://localhost:3000/api/admin/doctor');
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.count).toBe(1);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(10);
      expect(Doctor.find).toHaveBeenCalledWith({});
    });

    it('should filter by topRated', async () => {
      const mockDoctors = [{ _id: 'doc1', user: { name: 'Dr. Top' } }];
      // Mock static method findTopRated
      (Doctor as any).findTopRated = jest.fn().mockResolvedValue(mockDoctors);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor?topRated=true'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect((Doctor as any).findTopRated).toHaveBeenCalledWith(10);
    });

    it('should filter by specialization', async () => {
      const mockDoctors = [{ _id: 'doc1', user: { name: 'Dr. Spec' } }];
      // Mock static method findBySpecialization
      (Doctor as any).findBySpecialization = jest
        .fn()
        .mockResolvedValue(mockDoctors);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor?specialization=Cardiology'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect((Doctor as any).findBySpecialization).toHaveBeenCalledWith(
        'Cardiology',
        10
      );
    });

    it('should filter by day (availability)', async () => {
      const mockDoctors = [{ _id: 'doc1', user: { name: 'Dr. Day' } }];
      // Mock static method findAvailableDoctors
      (Doctor as any).findAvailableDoctors = jest
        .fn()
        .mockResolvedValue(mockDoctors);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor?day=Monday&time=10:00'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect((Doctor as any).findAvailableDoctors).toHaveBeenCalledWith(
        'Monday',
        '10:00',
        10
      );
    });

    it('should search doctors by name or email', async () => {
      const mockUsers = [{ _id: 'user1' }];
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });

      (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (Doctor.find as jest.Mock).mockReturnValue(mockFindChain);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor?search=test'
      );
      await GET(req);

      expect(User.find).toHaveBeenCalled();
      expect(Doctor.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { user: { $in: ['user1'] } },
            { 'profile.specialization': { $regex: 'test', $options: 'i' } },
          ]),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      (Doctor.countDocuments as jest.Mock).mockRejectedValue(
        new Error('DB Error')
      );

      const req = new NextRequest('http://localhost:3000/api/admin/doctor');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch doctors');
    });
  });

  describe('POST', () => {
    const validDoctorData = {
      userId: 'user123',
      profile: {
        specialization: 'General',
        qualifications: ['MBBS'],
        experience: 5,
        consultationFee: 500,
        availability: { days: ['Monday'] },
        department: 'General',
        licenseNumber: 'LIC123',
        licenseExpiry: '2030-01-01',
        languages: ['English'],
        services: ['Consultation'],
      },
    };

    it('should return 400 if missing required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it('should return 400 if missing profile fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', profile: {} }),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify(validDoctorData),
      });
      const response = await POST(req);
      expect(response.status).toBe(404);
    });

    it('should return 409 if doctor profile already exists for user', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user123' });
      // First findOne check is for existing doctor by user ID
      (Doctor.findOne as jest.Mock).mockResolvedValueOnce({ _id: 'doc1' });

      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify(validDoctorData),
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toContain('already exists for this user');
    });

    it('should return 409 if license number already exists', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user123' });
      // First findOne (user check) returns null
      (Doctor.findOne as jest.Mock).mockResolvedValueOnce(null);
      // Second findOne (license check) returns existing doctor
      (Doctor.findOne as jest.Mock).mockResolvedValueOnce({ _id: 'doc2' });

      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify(validDoctorData),
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toContain('license number already exists');
    });

    it('should create doctor successfully', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user123' });
      // Both findOne checks return null
      (Doctor.findOne as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn();
      const mockPopulate = jest.fn();
      // Mock the Doctor constructor
      (Doctor as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
        _id: 'newDocId',
        user: { name: 'Test User' },
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

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
      expect(mockPopulate).toHaveBeenCalledWith(
        'user',
        'name email phone image'
      );
    });

    it('should handle validation errors', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user123' });
      (Doctor.findOne as jest.Mock).mockResolvedValue(null);

      const validationError: any = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        field: { message: 'Field error' },
      };

      (Doctor as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(validationError),
      }));

      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify(validDoctorData),
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Validation failed');
    });

    it('should handle duplicate key errors (code 11000)', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user123' });
      (Doctor.findOne as jest.Mock).mockResolvedValue(null);

      const duplicateError: any = new Error('Duplicate key');
      duplicateError.code = 11000;
      duplicateError.keyPattern = { 'profile.licenseNumber': 1 };

      (Doctor as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(duplicateError),
      }));

      const req = new NextRequest('http://localhost:3000/api/admin/doctor', {
        method: 'POST',
        body: JSON.stringify(validDoctorData),
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toContain('license number already exists');
    });
  });
});
