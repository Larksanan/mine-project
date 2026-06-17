/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET } from '../route';

// Define interfaces for mocks
interface MockMedicalRecord {
  new (): any;
  find: jest.Mock;
  countDocuments: jest.Mock;
}

// Mock all dependencies
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      constructor(url: string) {
        this.url = url;
      }
    },
    NextResponse: {
      json: (data: any, init?: { status?: number }) => {
        const serialized = JSON.parse(JSON.stringify(data));
        return {
          json: async () => serialized,
          status: init?.status || 200,
        };
      },
    },
  };
});

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/MedicalRecord', () => {
  const MockMedicalRecord = function () {} as any as { new (): any };

  // Add static methods that return chainable query objects
  (MockMedicalRecord as any).find = jest.fn();
  (MockMedicalRecord as any).countDocuments = jest.fn();

  return {
    __esModule: true,
    default: MockMedicalRecord as MockMedicalRecord,
  };
});

// Mock the imported models (they're imported but not directly used in tests)
jest.mock('@/models/Patient', () => ({}));
jest.mock('@/models/User', () => ({}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Medical Records API', () => {
  let MedicalRecord: MockMedicalRecord;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    MedicalRecord = require('@/models/MedicalRecord').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    // Default mock implementations
    connectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/medical-records', () => {
    const mockSession = {
      user: { id: 'doctor123', role: 'RECEPTIONIST' },
    };

    const mockMedicalRecords = [
      {
        _id: 'record1',
        patientId: {
          _id: 'patient1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
        },
        doctorId: {
          _id: 'doctor123',
          name: 'Dr. Smith',
          email: 'smith@example.com',
          specialization: 'Cardiology',
        },
        diagnosis: 'Hypertension',
        treatment: 'Medication',
        notes: 'Follow up in 2 weeks',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        _id: 'record2',
        patientId: {
          _id: 'patient2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '0987654321',
          dateOfBirth: new Date('1985-05-15'),
          gender: 'female',
        },
        doctorId: {
          _id: 'doctor123',
          name: 'Dr. Smith',
          email: 'smith@example.com',
          specialization: 'Cardiology',
        },
        diagnosis: 'Diabetes',
        treatment: 'Insulin therapy',
        notes: 'Monitor blood sugar',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
    ];

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should fetch medical records successfully', async () => {
      // Setup the chain for MedicalRecord.find().populate().populate().sort().skip().limit().lean()
      const mockLean = jest.fn().mockResolvedValue(mockMedicalRecords);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      MedicalRecord.countDocuments.mockResolvedValue(mockMedicalRecords.length);

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 100,
        total: 2,
        pages: 1,
      });

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: 'doctor123',
      });
      expect(mockPopulate1).toHaveBeenCalledWith(
        'patientId',
        'firstName lastName email phone dateOfBirth gender'
      );
      expect(mockPopulate2).toHaveBeenCalledWith(
        'doctorId',
        'name email specialization'
      );
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should filter records by patientId', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockMedicalRecords[0]]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      MedicalRecord.countDocuments.mockResolvedValue(1);

      const req = new NextRequest(
        'http://localhost:3000/api/records/records?patientId=patient1'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: 'doctor123',
        patientId: 'patient1',
      });
    });

    it('should handle pagination parameters', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      MedicalRecord.countDocuments.mockResolvedValue(50);

      const req = new NextRequest(
        'http://localhost:3000/api/records/records?page=2&limit=20'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        pages: 3,
      });
      expect(mockSkip).toHaveBeenCalledWith(20); // (2-1) * 20 = 20
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user', async () => {
      getServerSession.mockResolvedValue({}); // Session without user

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user is not RECEPTIONIST', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'user123', role: 'USER' },
      });

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should return 403 when user has no role', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'user123' }, // No role
      });

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should handle empty records list', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      MedicalRecord.countDocuments.mockResolvedValue(0);

      const req = new NextRequest('http://localhost:3000/api/recordsrecords');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.pages).toBe(0);
    });

    it('should handle database connection errors', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle database query errors', async () => {
      // Mock find to throw error
      MedicalRecord.find.mockImplementation(() => {
        throw new Error('Query error');
      });

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Query error');
    });

    it('should handle countDocuments errors', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockMedicalRecords);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      MedicalRecord.countDocuments.mockRejectedValue(new Error('Count error'));

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle invalid page parameter', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });
      MedicalRecord.countDocuments.mockResolvedValue(0);

      // Default page to 1 when invalid
      const req = new NextRequest(
        'http://localhost:3000/api/records/records?page=invalid'
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.pagination.page).toBeNull();
    });

    it('should handle invalid limit parameter', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });
      MedicalRecord.countDocuments.mockResolvedValue(0);

      // Default limit to 100 when invalid
      const req = new NextRequest(
        'http://localhost:3000/api/records/records?limit=invalid'
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.pagination.limit).toBeNull();
    });

    it('should handle negative page and limit', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });
      MedicalRecord.countDocuments.mockResolvedValue(0);

      const req = new NextRequest(
        'http://localhost:3000/api/records/records?page=-1&limit=-10'
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.pagination.page).toBe(-1);
      expect(data.pagination.limit).toBe(-10);
    });

    it('should handle large limit values', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockMedicalRecords);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      MedicalRecord.countDocuments.mockResolvedValue(1000);

      const req = new NextRequest(
        'http://localhost:3000/api/records/records?limit=1000'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.pagination.limit).toBe(1000);
      expect(mockLimit).toHaveBeenCalledWith(1000);
    });

    it('should handle concurrent requests', async () => {
      const mockLean = jest
        .fn()
        .mockResolvedValueOnce(mockMedicalRecords)
        .mockResolvedValueOnce([mockMedicalRecords[0]]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      MedicalRecord.countDocuments
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const req1 = new NextRequest('http://localhost:3000/api/records/records');
      const req2 = new NextRequest(
        'http://localhost:3000/api/records/records?patientId=patient1'
      );

      const [res1, res2] = await Promise.all([GET(req1), GET(req2)]);
      const data1 = await res1.json();
      const data2 = await res2.json();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(data1.data).toHaveLength(2);
      expect(data2.data).toHaveLength(1);
    });

    it('should handle different doctor IDs in session', async () => {
      const differentSession = {
        user: { id: 'differentDoctor', role: 'RECEPTIONIST' },
      };
      getServerSession.mockResolvedValue(differentSession);

      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      const req = new NextRequest('http://localhost:3000/api/records/records');
      await GET(req);

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: 'differentDoctor',
      });
    });

    it('should serialize dates properly in response', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockMedicalRecords);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      MedicalRecord.find.mockReturnValue({
        populate: mockPopulate1,
      });

      MedicalRecord.countDocuments.mockResolvedValue(2);

      const req = new NextRequest('http://localhost:3000/api/records/records');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      // Dates should be serialized to strings
      expect(typeof data.data[0].createdAt).toBe('string');
      expect(typeof data.data[0].updatedAt).toBe('string');
      expect(typeof data.data[0].patientId.dateOfBirth).toBe('string');
    });
  });
});
