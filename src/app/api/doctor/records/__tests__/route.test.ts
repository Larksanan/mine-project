import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import MedicalRecord from '@/models/MedicalRecord';
import { connectDB } from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/MedicalRecord');
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/models/Patient', () => ({}));
jest.mock('@/models/User', () => ({}));

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((data, options) => ({
        json: async () => data,
        status: options?.status || 200,
      })),
    },
  };
});

describe('Medical Records API', () => {
  let mockRequest: any;
  const mockSession = {
    user: { id: 'doctor-123', role: 'DOCTOR' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (connectDB as jest.Mock).mockResolvedValue(undefined);

    // Setup MedicalRecord mock chain
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    (MedicalRecord.find as jest.Mock).mockReturnValue(mockChain);
    (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);
    (MedicalRecord.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({}),
    });
  });

  describe('GET', () => {
    beforeEach(() => {
      mockRequest = {
        url: 'http://localhost:3000/api/doctor/records?page=1&limit=10',
      };
    });

    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const response = await GET(mockRequest);
      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not a doctor', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', role: 'USER' },
      });
      const response = await GET(mockRequest);
      expect(response.status).toBe(403);
    });

    it('should fetch medical records successfully', async () => {
      const mockRecords = [{ _id: 'record-1', title: 'Test Record' }];
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockRecords),
      };
      (MedicalRecord.find as jest.Mock).mockReturnValue(mockChain);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(1);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRecords);
      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: 'doctor-123',
      });
    });

    it('should filter by patientId if provided', async () => {
      mockRequest.url =
        'http://localhost:3000/api/doctor/records?patientId=patient-123';

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: 'doctor-123',
        patientId: 'patient-123',
      });
    });

    it('should handle database errors', async () => {
      (MedicalRecord.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST', () => {
    let mockFormData: Map<string, any>;

    beforeEach(() => {
      mockFormData = new Map();
      mockFormData.set('patientId', 'patient-123');
      mockFormData.set('recordType', 'CONSULTATION');
      mockFormData.set('title', 'Test Record');
      mockFormData.set('description', 'Test Description');
      mockFormData.set('date', '2024-01-01');
      mockFormData.set('status', 'ACTIVE');

      mockRequest = {
        url: 'http://localhost:3000/api/doctor/records',
        formData: jest.fn().mockResolvedValue({
          get: (key: string) => mockFormData.get(key),
          getAll: (key: string) => {
            if (key === 'attachments') return [];
            return [mockFormData.get(key)];
          },
          keys: () => mockFormData.keys(),
        }),
      };

      // Mock MedicalRecord constructor and save
      (MedicalRecord as unknown as jest.Mock).mockImplementation(data => ({
        ...data,
        _id: 'new-record-123',
        save: jest.fn().mockResolvedValue(true),
      }));
    });

    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
    });

    it('should return 400 if required fields are missing', async () => {
      mockFormData.delete('title');
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should create medical record successfully', async () => {
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-123',
          doctorId: 'doctor-123',
          title: 'Test Record',
        })
      );
    });

    it('should handle file uploads', async () => {
      const mockFile = {
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      };

      mockRequest.formData.mockResolvedValue({
        get: (key: string) => mockFormData.get(key),
        getAll: (key: string) => {
          if (key === 'attachments') return [mockFile];
          return [mockFormData.get(key)];
        },
        keys: () => mockFormData.keys(),
      });

      (existsSync as jest.Mock).mockReturnValue(false);
      (mkdir as jest.Mock).mockResolvedValue(undefined);
      (writeFile as jest.Mock).mockResolvedValue(undefined);

      const response = await POST(mockRequest);

      expect(response.status).toBe(201);
      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();

      // Verify attachments path was added
      const constructorCall = (MedicalRecord as unknown as jest.Mock).mock
        .calls[0][0];
      expect(constructorCall.attachments).toHaveLength(1);
      expect(constructorCall.attachments[0]).toContain('test.pdf');
    });

    it('should handle database errors during save', async () => {
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      }));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save medical record');
    });

    it('should handle validation errors during save', async () => {
      const validationError = new Error('Validation failed');
      (validationError as any).name = 'ValidationError';

      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(validationError),
      }));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });
});
