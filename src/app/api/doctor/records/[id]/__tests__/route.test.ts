// src/app/api/doctor/records/[id]/__tests__/route.test.ts
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

describe('Medical Record Detail API', () => {
  let mockRequest: NextRequest;
  let mockContext: { params: Promise<{ id: string }> };

  const originalConsoleError = console.error;
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock NextRequest
    mockRequest = {
      headers: new Headers(),
      json: jest.fn(),
      formData: jest.fn(),
    } as unknown as NextRequest;

    mockContext = {
      params: Promise.resolve({ id: 'record-id-123' }),
    };

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /api/doctor/records/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return 403 if user is not DOCTOR', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'PATIENT',
        },
      });

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Forbidden - Doctor access required',
      });
    });

    it('should return 403 if user has no role', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          // No role
        },
      });

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Forbidden - Doctor access required',
      });
    });

    it('should return 404 if medical record not found', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      // Mock findById returning null
      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Medical record not found',
      });
    });

    it('should return 403 if doctor does not own the record', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      const differentDoctorId = 'doctor-456';

      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      // Mock record owned by different doctor
      const mockRecord = {
        _id: 'record-id-123',
        doctorId: {
          _id: differentDoctorId,
          toString: () => differentDoctorId,
        },
        patientId: {
          _id: 'patient-123',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockRecord),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Access denied to this medical record',
      });
    });

    it('should return medical record if doctor owns it (doctorId as object)', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const mockRecord = {
        _id: 'record-id-123',
        doctorId: {
          _id: mockUserId,
          toString: () => mockUserId,
          name: 'Dr. Smith',
          email: 'dr@example.com',
          specialization: 'Cardiology',
        },
        patientId: {
          _id: 'patient-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          dateOfBirth: '1990-01-01',
          gender: 'MALE',
        },
        title: 'Annual Checkup',
        recordType: 'CONSULTATION',
        description: 'Patient is in good health',
        date: new Date('2024-01-15'),
        status: 'ACTIVE',
        doctorNotes: 'Follow up in 6 months',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockRecord),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const expectedRecord = JSON.parse(JSON.stringify(mockRecord));

      expect(data.data).toEqual(expectedRecord);
    });

    it('should handle doctorId as string', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const mockRecord = {
        _id: 'record-id-123',
        doctorId: mockUserId, // String instead of object
        patientId: {
          _id: 'patient-123',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockRecord),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.doctorId).toBe(mockUserId);
    });

    it('should handle CastError for invalid ID', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      });

      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';

      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(castError),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid medical record ID',
      });
    });

    it('should handle general errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'DOCTOR',
        },
      });

      (MedicalRecord.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/doctor/records/[id]', () => {
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
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return 403 if user is not DOCTOR', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'PATIENT',
        },
      });

      // Act
      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Forbidden - Doctor access required',
      });
    });

    it('should return 404 if record not found or access denied', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Medical record not found or access denied',
      });
    });

    it('should update medical record with JSON data', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const mockRecordId = 'record-id-123';
      const existingRecord = {
        _id: mockRecordId,
        doctorId: mockUserId,
      };

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        recordType: 'FOLLOW_UP',
        date: '2024-01-20',
        status: 'COMPLETED',
        doctorNotes: 'Patient responded well to treatment',
      };

      const updatedRecord = {
        _id: mockRecordId,
        doctorId: { _id: mockUserId, name: 'Dr. Smith' },
        patientId: { _id: 'patient-123', firstName: 'John', lastName: 'Doe' },
        ...updateData,
        date: new Date('2024-01-20'),
        updatedAt: new Date(),
      };

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (mockRequest.json as jest.Mock).mockResolvedValue(updateData);
      (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedRecord),
        }),
      });

      // Act
      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Medical record updated successfully',
        data: {
          ...updatedRecord,
          date: updatedRecord.date.toISOString(),
          updatedAt: updatedRecord.updatedAt.toISOString(),
        },
      });

      expect(MedicalRecord.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRecordId,
        {
          recordType: 'FOLLOW_UP',
          title: 'Updated Title',
          description: 'Updated description',
          date: new Date('2024-01-20'),
          status: 'COMPLETED',
          doctorNotes: 'Patient responded well to treatment',
          updatedAt: expect.any(Date),
        },
        { new: true, runValidators: true }
      );
    });

    it('should update medical record with form-data', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      mockRequest = {
        headers: new Headers({
          'content-type': 'multipart/form-data; boundary=----boundary',
        }),
        json: jest.fn(),
        formData: jest.fn(),
      } as unknown as NextRequest;

      const mockFormData = new FormData();
      mockFormData.append('title', 'Form Data Title');
      mockFormData.append('description', 'Form Data Description');

      const existingRecord = {
        _id: 'record-id-123',
        doctorId: mockUserId,
      };

      const updatedRecord = {
        _id: 'record-id-123',
        title: 'Form Data Title',
        description: 'Form Data Description',
      };

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFormData);
      (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedRecord),
        }),
      });

      // Act
      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedRecord);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const existingRecord = {
        _id: 'record-id-123',
        doctorId: mockUserId,
      };

      // Only update title, leave other fields unchanged
      const updateData = {
        title: 'Only Title Updated',
      };

      const updatedRecord = {
        _id: 'record-id-123',
        title: 'Only Title Updated',
        // Other fields remain unchanged
      };

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (mockRequest.json as jest.Mock).mockResolvedValue(updateData);
      (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedRecord),
        }),
      });

      // Act
      const response = await PUT(mockRequest, mockContext);
      const _data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(MedicalRecord.findByIdAndUpdate).toHaveBeenCalledWith(
        'record-id-123',
        {
          title: 'Only Title Updated',
          updatedAt: expect.any(Date),
        },
        { new: true, runValidators: true }
      );
    });

    it('should handle description as empty string', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const existingRecord = {
        _id: 'record-id-123',
        doctorId: mockUserId,
      };

      const updateData = {
        description: '', // Empty string should be allowed
      };

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (mockRequest.json as jest.Mock).mockResolvedValue(updateData);
      (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({}),
        }),
      });

      // Act
      await PUT(mockRequest, mockContext);

      // Assert
      expect(MedicalRecord.findByIdAndUpdate).toHaveBeenCalledWith(
        'record-id-123',
        {
          description: '',
          updatedAt: expect.any(Date),
        },
        { new: true, runValidators: true }
      );
    });

    it('should handle ValidationError', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const existingRecord = {
        _id: 'record-id-123',
        doctorId: mockUserId,
      };

      const validationError = new Error(
        'Validation failed: status: Invalid value'
      );
      validationError.name = 'ValidationError';

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (mockRequest.json as jest.Mock).mockResolvedValue({ status: 'INVALID' });
      (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(validationError),
        }),
      });

      // Act
      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Validation failed: status: Invalid value',
      });
    });

    it('should handle CastError', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';

      (MedicalRecord.findOne as jest.Mock).mockRejectedValue(castError);

      // Act
      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid medical record ID',
      });
    });

    it('should handle general errors', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      (MedicalRecord.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const response = await PUT(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/doctor/records/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return 403 if user is not DOCTOR', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'PATIENT',
        },
      });

      // Act
      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Forbidden - Doctor access required',
      });
    });

    it('should return 404 if record not found or access denied', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Medical record not found or access denied',
      });
    });

    it('should delete medical record successfully', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const existingRecord = {
        _id: 'record-id-123',
        doctorId: mockUserId,
      };

      (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
      (MedicalRecord.findByIdAndDelete as jest.Mock).mockResolvedValue(true);

      // Act
      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Medical record deleted successfully',
      });

      expect(MedicalRecord.findByIdAndDelete).toHaveBeenCalledWith(
        'record-id-123'
      );
    });

    it('should handle CastError', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';

      (MedicalRecord.findOne as jest.Mock).mockRejectedValue(castError);

      // Act
      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid medical record ID',
      });
    });

    it('should handle general errors', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'DOCTOR',
        },
      });

      (MedicalRecord.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const response = await DELETE(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Edge Cases', () => {
    describe('GET Edge Cases', () => {
      it('should handle doctorId with only toString method', async () => {
        // Arrange
        const mockUserId = 'doctor-123';
        mockGetServerSession.mockResolvedValue({
          user: {
            id: mockUserId,
            role: 'DOCTOR',
          },
        });

        const mockRecord = {
          _id: 'record-id-123',
          doctorId: {
            toString: () => mockUserId,
            // No _id property
          },
          patientId: {
            _id: 'patient-123',
            firstName: 'John',
          },
        };

        (MedicalRecord.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockRecord),
            }),
          }),
        });

        // Act
        const response = await GET(mockRequest, mockContext);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should handle doctorId as object without _id', async () => {
        // Arrange
        const mockUserId = 'doctor-123';
        mockGetServerSession.mockResolvedValue({
          user: {
            id: mockUserId,
            role: 'DOCTOR',
          },
        });

        const mockRecord = {
          _id: 'record-id-123',
          doctorId: {
            name: 'Dr. Smith',
            // No _id, no toString
          },
          patientId: {
            _id: 'patient-123',
            firstName: 'John',
          },
        };

        (MedicalRecord.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockRecord),
            }),
          }),
        });

        // Act
        const response = await GET(mockRequest, mockContext);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(403);
        // doctorIdString becomes '[object Object]' which won't match mockUserId
        expect(data.success).toBe(false); // Will fail authorization
        expect(data.error).toBe('Access denied to this medical record');
      });
    });

    describe('PUT Edge Cases', () => {
      it('should handle undefined values in update data', async () => {
        // Arrange
        const mockUserId = 'doctor-123';
        mockGetServerSession.mockResolvedValue({
          user: {
            id: mockUserId,
            role: 'DOCTOR',
          },
        });

        const existingRecord = {
          _id: 'record-id-123',
          doctorId: mockUserId,
        };

        const updateData = {
          title: 'Updated Title',
          description: undefined, // Should be ignored
          doctorNotes: undefined, // Should be ignored
        };

        (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
        (mockRequest.json as jest.Mock).mockResolvedValue(updateData);
        (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({}),
          }),
        });

        // Act
        await PUT(mockRequest, mockContext);

        // Assert
        expect(MedicalRecord.findByIdAndUpdate).toHaveBeenCalledWith(
          'record-id-123',
          {
            title: 'Updated Title',
            updatedAt: expect.any(Date),
          },
          { new: true, runValidators: true }
        );
      });

      it('should handle null values in update data', async () => {
        // Arrange
        const mockUserId = 'doctor-123';
        mockGetServerSession.mockResolvedValue({
          user: {
            id: mockUserId,
            role: 'DOCTOR',
          },
        });

        const existingRecord = {
          _id: 'record-id-123',
          doctorId: mockUserId,
        };

        const updateData = {
          title: 'Updated Title',
          doctorNotes: null, // Should set to null
        };

        (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
        (mockRequest.json as jest.Mock).mockResolvedValue(updateData);
        (MedicalRecord.findByIdAndUpdate as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({}),
          }),
        });

        // Act
        await PUT(mockRequest, mockContext);

        // Assert
        expect(MedicalRecord.findByIdAndUpdate).toHaveBeenCalledWith(
          'record-id-123',
          {
            title: 'Updated Title',
            doctorNotes: null,
            updatedAt: expect.any(Date),
          },
          { new: true, runValidators: true }
        );
      });
    });

    describe('DELETE Edge Cases', () => {
      it('should handle delete operation returning null', async () => {
        // Arrange
        const mockUserId = 'doctor-123';
        mockGetServerSession.mockResolvedValue({
          user: {
            id: mockUserId,
            role: 'DOCTOR',
          },
        });

        const existingRecord = {
          _id: 'record-id-123',
          doctorId: mockUserId,
        };

        (MedicalRecord.findOne as jest.Mock).mockResolvedValue(existingRecord);
        (MedicalRecord.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

        // Act
        const response = await DELETE(mockRequest, mockContext);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        // Even if findByIdAndDelete returns null, we consider it successful
        expect(data.success).toBe(true);
      });
    });
  });
});
