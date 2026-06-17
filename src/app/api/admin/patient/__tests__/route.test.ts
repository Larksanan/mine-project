/**
 * @jest-environment node
 */
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Patient');
jest.mock('@/models/User');

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: class {
        static isValid(id: string) {
          return /^[0-9a-fA-F]{24}$/.test(id);
        }
        constructor(id: string) {
          return id;
        }
      },
    },
  };
});

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

describe('Admin Patient API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure connectDB is mocked to resolve successfully by default
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET', () => {
    it('should fetch patients with default pagination', async () => {
      const mockPatients = [
        {
          _id: '507f1f77bcf86cd799439011',
          firstName: 'Jebarsn',
          lastName: 'Thatcroos',
          dateOfBirth: new Date('2001-08-05'),
          email: 'jebarsanthatcroos@gmail.com',
          phone: '200121901656',
          nic: '200121901656',
          gender: 'MALE',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (Patient.countDocuments as jest.Mock).mockResolvedValue(1);

      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPatients),
      };
      (Patient.find as jest.Mock).mockReturnValue(mockFindChain);

      const req = new NextRequest('http://localhost:3000/api/admin/patient');
      const response = await GET(req);
      const body = await response.json();

      expect(connectDB).toHaveBeenCalled();
      expect(body.success).toBe(true);
      expect(body.count).toBe(1);
      expect(body.data[0].firstName).toBe('Jebarsn');
    });

    it('should filter patients by search term', async () => {
      (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
      const mockFindChain = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      (Patient.find as jest.Mock).mockReturnValue(mockFindChain);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/patient?search=Jebarsan'
      );
      await GET(req);

      expect(Patient.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: expect.arrayContaining([
            expect.objectContaining({
              $or: expect.arrayContaining([
                { firstName: { $regex: 'Jebarsan', $options: 'i' } },
              ]),
            }),
          ]),
        })
      );
    });

    it('should handle errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(new Error('DB Error'));
      const req = new NextRequest('http://localhost:3000/api/admin/patient');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch patients');
    });
  });

  describe('POST', () => {
    const validPatientData = {
      firstName: 'sovika',
      lastName: 'sovika',
      email: 'jebarsanthatcroos@gmail.com',
      phone: '0760780414',
      nic: '200121901654',
      dateOfBirth: '2002-08-05',
      gender: 'FEMALE',
      address: { street: 'thalaimannar mannar' },
      emergencyContact: { name: 'sovika', phone: '0987654321' },
    };

    it('should create a new patient successfully', async () => {
      // Mock Patient.findOne to return null (no existing patient)
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const mockPatientInstance = {
        _id: '507f1f77bcf86cd799439011',
        ...validPatientData,
        dateOfBirth: new Date(validPatientData.dateOfBirth),
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          ...validPatientData,
          dateOfBirth: new Date(validPatientData.dateOfBirth),
          createdAt: new Date(),
          updatedAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: '507f1f77bcf86cd799439011',
            ...validPatientData,
            dateOfBirth: new Date(validPatientData.dateOfBirth),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        }),
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          ...validPatientData,
          dateOfBirth: new Date(validPatientData.dateOfBirth),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      (Patient as unknown as jest.Mock).mockImplementation(
        () => mockPatientInstance
      );

      const req = new NextRequest('http://localhost:3000/api/admin/patient', {
        method: 'POST',
        body: JSON.stringify(validPatientData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(validPatientData);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(mockPatientInstance.save).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = { firstName: 'Jane' };
      const req = new NextRequest('http://localhost:3000/api/admin/patient', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      jest.spyOn(req, 'json').mockResolvedValue(requestBody);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid email format', async () => {
      const requestBody = { ...validPatientData, email: 'invalid-email' };
      const req = new NextRequest('http://localhost:3000/api/admin/patient', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      jest.spyOn(req, 'json').mockResolvedValue(requestBody);

      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it('should return 409 if patient already exists', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing',
        email: validPatientData.email,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/patient', {
        method: 'POST',
        body: JSON.stringify(validPatientData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(validPatientData);

      const response = await POST(req);
      expect(response.status).toBe(409);
    });

    it('should return 400 if user ID is invalid', async () => {
      // Reset the mock to return null (no existing patient)
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const requestBody = { ...validPatientData, userId: 'invalid-id' };
      const req = new NextRequest('http://localhost:3000/api/admin/patient', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      jest.spyOn(req, 'json').mockResolvedValue(requestBody);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid user ID');
    });
  });
});
