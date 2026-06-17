import { GET, PUT, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/MedicalRecord');
jest.mock('@/models/Patient', () => ({}));
jest.mock('@/models/User', () => ({}));
jest.mock('@/lib/auth');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

// Create a clean mock object without toString
const createMockMedicalRecord = (doctorId: string | object) => {
  const record = {
    _id: 'valid-record-id',
    doctorId:
      typeof doctorId === 'string'
        ? doctorId
        : {
            _id: 'doctor-id',
            name: 'Dr. Smith',
            email: 'dr@example.com',
            specialization: 'Cardiology',
          },
    patientId: {
      _id: 'patient-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
    },
    recordType: 'CONSULTATION',
    title: 'Initial Consultation',
    description: 'Patient complaint about headaches',
    date: new Date(),
    status: 'COMPLETED',
    doctorNotes: 'Follow up in 2 weeks',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Remove any toString methods that might be added
  return JSON.parse(JSON.stringify(record));
};

describe('Medical Record API - /api/records/[id]', () => {
  let mockRequest: NextRequest;
  let mockContext: { params: Promise<{ id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock NextRequest
    mockRequest = {
      headers: new Headers(),
      json: jest.fn(),
      formData: jest.fn(),
    } as unknown as NextRequest;

    mockContext = {
      params: Promise.resolve({ id: 'valid-record-id' }),
    };

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /api/records/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not RECEPTIONIST or ADMIN', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-id',
          role: 'PATIENT', // Invalid role
        },
      });

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should return 404 if medical record is not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-id',
          role: 'RECEPTIONIST',
        },
      });

      // Fix the mock chain
      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Medical record not found');
    });

    it('should return medical record if doctor owns it', async () => {
      const mockDoctorId = 'doctor-id';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockDoctorId,
          role: 'RECEPTIONIST',
        },
      });

      const mockMedicalRecord = createMockMedicalRecord({ _id: mockDoctorId });

      // Fix the mock chain
      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockMedicalRecord),
          }),
        }),
      });

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Use toMatchObject for partial comparison
      expect(data.data).toMatchObject({
        _id: 'valid-record-id',
        recordType: 'CONSULTATION',
        title: 'Initial Consultation',
        description: 'Patient complaint about headaches',
      });
    });

    it('should handle CastError for invalid ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-id',
          role: 'RECEPTIONIST',
        },
      });

      // Create a proper CastError
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';

      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(castError),
          }),
        }),
      });

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid medical record ID');
    });

    it('should handle general errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-id',
          role: 'RECEPTIONIST',
        },
      });

      const genericError = new Error('Database error');

      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(genericError),
          }),
        }),
      });

      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/records/[id]', () => {
    beforeEach(() => {
      mockRequest = {
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: jest.fn(),
        formData: jest.fn(),
      } as unknown as NextRequest;
      (mockRequest.json as jest.Mock).mockResolvedValue({});
    });

    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not RECEPTIONIST', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-id',
          role: 'PATIENT',
        },
      });

      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should return 404 if medical record not found or access denied', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-id',
          role: 'RECEPTIONIST',
        },
      });

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(null);

      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Medical record not found or access denied');
    });

    it('should update medical record successfully', async () => {
      const mockDoctorId = 'doctor-id';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockDoctorId,
          role: 'RECEPTIONIST',
        },
      });

      const existingRecord = {
        _id: 'valid-record-id',
        doctorId: mockDoctorId,
      };

      const updatedRecord = {
        _id: 'valid-record-id',
        title: 'Updated Title',
        description: 'Updated description',
        recordType: 'CONSULTATION',
        doctorId: {
          _id: mockDoctorId,
          name: 'Dr. Smith',
          email: 'dr@example.com',
          specialization: 'Cardiology',
        },
        patientId: {
          _id: 'patient-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
        },
      };

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (mockRequest.json as jest.Mock).mockResolvedValue({
        title: 'Updated Title',
        description: 'Updated description',
      });

      // Mock the full chain for findByIdAndUpdate
      (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedRecord),
        }),
      });

      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Medical record updated successfully');
      expect(data.data).toEqual(updatedRecord);
    });

    it('should handle ValidationError from findByIdAndUpdate', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-id',
          role: 'RECEPTIONIST',
        },
      });

      const existingRecord = {
        _id: 'valid-record-id',
        doctorId: 'doctor-id',
      };

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (mockRequest.json as jest.Mock).mockResolvedValue({
        status: 'INVALID_STATUS', // This should trigger validation error
      });

      // Create a proper ValidationError
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';

      // Mock findByIdAndUpdate to throw ValidationError
      (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(validationError),
        }),
      });

      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should handle multipart/form-data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-id',
          role: 'RECEPTIONIST',
        },
      });

      mockRequest = {
        headers: new Headers({
          'content-type': 'multipart/form-data; boundary=----boundary',
        }),
        json: jest.fn(),
        formData: jest.fn(),
      } as unknown as NextRequest;

      const existingRecord = {
        _id: 'valid-record-id',
        doctorId: 'doctor-id',
      };

      const mockFormData = new FormData();
      mockFormData.append('title', 'Form Data Title');
      mockFormData.append('description', 'Form Data Description');

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFormData);

      const updatedRecord = {
        _id: 'valid-record-id',
        title: 'Form Data Title',
        description: 'Form Data Description',
        doctorId: { _id: 'doctor-id', name: 'Dr. Smith' },
        patientId: { _id: 'patient-id', firstName: 'John', lastName: 'Doe' },
      };

      (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedRecord),
        }),
      });

      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Medical record updated successfully');
    });
  });

  describe('DELETE /api/records/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user does not have proper role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-id',
          role: 'PATIENT',
        },
      });

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should return 404 if medical record not found or access denied', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-id',
          role: 'RECEPTIONIST',
        },
      });

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Medical record not found or access denied');
    });

    it('should delete medical record successfully', async () => {
      const mockDoctorId = 'doctor-id';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockDoctorId,
          role: 'RECEPTIONIST',
        },
      });

      const existingRecord = {
        _id: 'valid-record-id',
        doctorId: mockDoctorId,
      };

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (MedicalRecord.findByIdAndDelete as jest.Mock).mockResolvedValue(true);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Medical record deleted successfully');
    });

    it('should handle CastError for invalid ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-id',
          role: 'RECEPTIONIST',
        },
      });

      // Create a proper CastError
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';

      (MedicalRecord.findOne as jest.Mock).mockRejectedValue(castError);

      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid medical record ID');
    });
  });
});
