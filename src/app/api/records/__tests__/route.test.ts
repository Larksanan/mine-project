import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/MedicalRecord');
jest.mock('@/models/Patient', () => ({}));
jest.mock('@/models/User', () => ({}));
jest.mock('@/lib/auth');
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('path');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockJoin = join as jest.MockedFunction<typeof join>;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

describe('Medical Records API', () => {
  let mockRequest: NextRequest;

  beforeAll(() => {
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();

    // Create a mock NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/doctor/records',
      headers: new Headers(),
      formData: jest.fn(),
    } as unknown as NextRequest;

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);

    // Default mock for path.join
    mockJoin.mockImplementation((...args) => args.join('/'));
  });

  describe('GET /api/doctor/records', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return 403 if user role is not allowed', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'PATIENT', // Not allowed role
        },
      });

      // Act
      const response = await GET(mockRequest);
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
          // No role property
        },
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Forbidden - Doctor access required',
      });
    });

    it('should fetch records for RECEPTIONIST role', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'RECEPTIONIST',
        },
      });

      const mockRecords = [
        {
          _id: 'record-1',
          patientId: { _id: 'patient-1', firstName: 'John', lastName: 'Doe' },
          doctorId: { _id: mockUserId, name: 'Dr. Smith' },
          title: 'Checkup',
          recordType: 'CONSULTATION',
        },
      ];

      // Mock the full Mongoose chain
      const mockLean = jest.fn().mockResolvedValue(mockRecords);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

      const mockPopulate = jest.fn();
      // Allow chaining populate, then sort
      const mockQuery = { populate: mockPopulate, sort: mockSort };
      mockPopulate.mockReturnValue(mockQuery);

      const mockFind = jest.fn().mockReturnValue(mockQuery);

      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(1);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRecords);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 100,
        total: 1,
        pages: 1,
      });

      // Verify query
      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: mockUserId,
      });
      expect(mockPopulate).toHaveBeenCalledWith(
        'patientId',
        'firstName lastName email phone dateOfBirth gender'
      );
      expect(mockPopulate).toHaveBeenCalledWith(
        'doctorId',
        'name email specialization'
      );
    });

    it('should filter by patientId when provided', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      mockRequest = {
        url: 'http://localhost:3000/api/doctor/records?patientId=patient-456',
        headers: new Headers(),
        formData: jest.fn(),
      } as unknown as NextRequest;

      (MedicalRecord.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      await GET(mockRequest);

      // Assert
      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: 'doctor-123',
        patientId: 'patient-456',
      });
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      mockRequest = {
        url: 'http://localhost:3000/api/doctor/records?page=2&limit=20',
        headers: new Headers(),
        formData: jest.fn(),
      } as unknown as NextRequest;

      // Mock the chain
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

      const mockPopulate = jest.fn();
      const mockQuery = { populate: mockPopulate, sort: mockSort };
      mockPopulate.mockReturnValue(mockQuery);

      const mockFind = jest.fn().mockReturnValue(mockQuery);

      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(50);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        pages: 3,
      });

      expect(mockSkip).toHaveBeenCalledWith(20); // (page-1) * limit
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('should handle database errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      (MedicalRecord.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest
                    .fn()
                    .mockRejectedValue(new Error('Database error')),
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/doctor/records', () => {
    let mockFormData: FormData;

    beforeEach(() => {
      mockFormData = new FormData();
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFormData);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Session check:',
        'Not authenticated'
      );
    });

    it('should return 403 if user role is not allowed', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          role: 'PATIENT', // Not allowed
        },
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Forbidden - access required',
      });
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'User role check failed:',
        'PATIENT'
      );
    });

    it('should return 400 if FormData parsing fails', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      (mockRequest.formData as jest.Mock).mockRejectedValue(
        new Error('FormData parse error')
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid form data - expected multipart/form-data',
        details: 'FormData parse error',
      });
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      // FormData with missing required fields
      mockFormData.append('title', 'Test Title');
      // Missing patientId, recordType, description, date

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          'Patient ID is required',
          'Record type is required',
          'Description is required',
          'Date is required',
        ])
      );
    });

    it('should successfully create medical record without files', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'RECEPTIONIST',
        },
      });

      // Add all required fields
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Annual Checkup');
      mockFormData.append('description', 'Patient is in good health');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('status', 'ACTIVE');
      mockFormData.append('doctorNotes', 'Follow up in 6 months');

      const savedRecord = {
        _id: 'record-123',
        patientId: 'patient-456',
        doctorId: mockUserId,
        title: 'Annual Checkup',
        description: 'Patient is in good health',
        date: new Date('2024-01-15'),
        status: 'ACTIVE',
        doctorNotes: 'Follow up in 6 months',
        attachments: [],
      };

      const populatedRecord = {
        _id: 'record-123',
        patientId: { _id: 'patient-456', firstName: 'John', lastName: 'Doe' },
        doctorId: {
          _id: mockUserId,
          name: 'Dr. Smith',
          email: 'dr@example.com',
        },
        title: 'Annual Checkup',
        description: 'Patient is in good health',
        date: new Date('2024-01-15'),
        status: 'ACTIVE',
        doctorNotes: 'Follow up in 6 months',
        attachments: [],
      };

      // Mock MedicalRecord constructor and save
      const mockSave = jest.fn().mockResolvedValue(savedRecord);
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      // Mock findById for populated response
      const mockLean = jest.fn().mockResolvedValue(populatedRecord);

      const mockPopulate = jest.fn();
      const mockQuery = { populate: mockPopulate, lean: mockLean };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Medical record created successfully');
      expect(data.data).toEqual({
        ...populatedRecord,
        date: populatedRecord.date.toISOString(),
      });

      // Verify MedicalRecord was called with correct data
      expect(MedicalRecord).toHaveBeenCalledWith({
        patientId: 'patient-456',
        doctorId: mockUserId,
        recordType: 'CONSULTATION',
        title: 'Annual Checkup',
        description: 'Patient is in good health',
        date: new Date('2024-01-15'),
        status: 'ACTIVE',
        attachments: [],
        doctorNotes: 'Follow up in 6 months',
      });
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle file uploads successfully', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'RECEPTIONIST',
        },
      });

      // Create mock files
      const mockFile1 = new File(['test content 1'], 'report.pdf', {
        type: 'application/pdf',
      });
      const mockFile2 = new File(['test content 2'], 'image.jpg', {
        type: 'image/jpeg',
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup with Files');
      mockFormData.append('description', 'Test description');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', mockFile1);
      mockFormData.append('attachments', mockFile2);

      // Mock file system operations
      mockExistsSync.mockReturnValue(false); // Directory doesn't exist
      mockMkdir.mockResolvedValue(undefined);
      mockJoin
        .mockReturnValueOnce('/test/path/uploads/medical-records')
        .mockReturnValueOnce(
          '/test/path/uploads/medical-records/1234567890-report.pdf'
        )
        .mockReturnValueOnce(
          '/test/path/uploads/medical-records/1234567891-image.jpg'
        );

      // Mock arrayBuffer for files
      mockFile1.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(10));
      mockFile2.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(10));

      // Mock Date.now for consistent filename
      const originalDateNow = Date.now;
      Date.now = jest
        .fn()
        .mockReturnValueOnce(1234567890)
        .mockReturnValueOnce(1234567891);

      const savedRecord = {
        _id: 'record-123',
        attachments: [
          '/uploads/medical-records/1234567890-report.pdf',
          '/uploads/medical-records/1234567891-image.jpg',
        ],
      };

      const mockSave = jest.fn().mockResolvedValue(savedRecord);
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      const mockPopulate = jest.fn();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockResolvedValue({}),
      };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await POST(mockRequest);

      // Assert
      expect(mockMkdir).toHaveBeenCalledWith(
        '/test/path/uploads/medical-records',
        { recursive: true }
      );
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/test/path/uploads/medical-records/1234567890-report.pdf',
        expect.any(Buffer)
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/test/path/uploads/medical-records/1234567891-image.jpg',
        expect.any(Buffer)
      );

      // Verify MedicalRecord was called with attachment paths
      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            '/uploads/medical-records/1234567890-report.pdf',
            '/uploads/medical-records/1234567891-image.jpg',
          ],
        })
      );

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should handle empty file attachments gracefully', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      // Add empty file field
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', ''); // Empty file

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      const mockPopulate = jest.fn();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockResolvedValue({}),
      };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await POST(mockRequest);

      // Assert
      // Should not try to process empty files
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [],
        })
      );
    });

    it('should handle file upload errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      const mockFile = new File(['test'], 'report.pdf', {
        type: 'application/pdf',
      });
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', mockFile);

      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(10));
      mockExistsSync.mockReturnValue(true);
      mockWriteFile.mockRejectedValue(new Error('Disk full'));

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'File upload failed',
        details: 'Disk full',
      });
    });

    it('should handle database connection errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Database connection failed',
        details: 'Connection failed',
      });
    });

    it('should handle Mongoose validation errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      const validationError = new Error(
        'Validation failed: patientId: Path `patientId` is required'
      );
      validationError.name = 'ValidationError';

      const mockSave = jest.fn().mockRejectedValue(validationError);
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Validation error',
        details: 'Validation failed: patientId: Path `patientId` is required',
      });
    });

    it('should handle CastError for invalid IDs', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      mockFormData.append('patientId', 'invalid-id');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      const castError = new Error(
        'Cast to ObjectId failed for value "invalid-id"'
      );
      castError.name = 'CastError';

      const mockSave = jest.fn().mockRejectedValue(castError);
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid ID format',
        details: 'Patient ID or Doctor ID is not a valid MongoDB ObjectId',
      });
    });

    it('should handle generic save errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      const saveError = new Error('Unknown save error');
      const mockSave = jest.fn().mockRejectedValue(saveError);
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to save medical record',
        details: 'Unknown save error',
      });
    });

    it('should handle unexpected errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      (mockRequest.formData as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Invalid form data - expected multipart/form-data'
      );
      expect(data.details).toBe('Unexpected error');
    });
  });

  describe('Console logging', () => {
    it('should log session status in POST', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      const mockFile = new FormData();
      mockFile.append('patientId', 'patient-456');
      mockFile.append('recordType', 'CONSULTATION');
      mockFile.append('title', 'Test');
      mockFile.append('description', 'Test');
      mockFile.append('date', '2024-01-15');
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFile);

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      const mockPopulate = jest.fn();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockResolvedValue({}),
      };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await POST(mockRequest);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Session check:',
        'Authenticated'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Authenticated user:',
        'doctor-123',
        'RECEPTIONIST'
      );
    });

    it('should log FormData parsing', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      const mockFile = new FormData();
      mockFile.append('patientId', 'patient-456');
      mockFile.append('recordType', 'CONSULTATION');
      mockFile.append('title', 'Test Title');
      mockFile.append('description', 'Test Description');
      mockFile.append('date', '2024-01-15');
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFile);

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      const mockPopulate = jest.fn();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockResolvedValue({}),
      };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await POST(mockRequest);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Parsing FormData...');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'FormData keys:',
        expect.any(Array)
      );
    });

    it('should log extracted fields', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      const mockFile = new FormData();
      mockFile.append('patientId', 'patient-456');
      mockFile.append('recordType', 'CONSULTATION');
      mockFile.append(
        'title',
        'A very long title that should be truncated in logs'
      );
      mockFile.append(
        'description',
        'A very long description that should be truncated'
      );
      mockFile.append('date', '2024-01-15');
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFile);

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      const mockPopulate = jest.fn();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockResolvedValue({}),
      };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await POST(mockRequest);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Extracted fields:',
        expect.objectContaining({
          title: expect.stringContaining('...'),
          description: expect.stringContaining('...'),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    let mockFormData: FormData;

    beforeEach(() => {
      mockFormData = new FormData();
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFormData);
    });

    it('POST should handle file with special characters in name', async () => {
      // Arrange
      const mockUserId = 'doctor-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          role: 'RECEPTIONIST',
        },
      });

      const mockFile = new File(
        ['test'],
        'report with spaces & special@chars.pdf',
        { type: 'application/pdf' }
      );

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', mockFile);

      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(10));
      mockExistsSync.mockReturnValue(true);

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      const mockPopulate = jest.fn();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockResolvedValue({}),
      };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Mock Date.now
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(1234567890);

      // Act
      await POST(mockRequest);

      // Assert
      expect(mockJoin).toHaveBeenCalledWith(
        expect.stringContaining('medical-records'),
        '1234567890-report-with-spaces---special-chars.pdf'
      );

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('POST should default status to ACTIVE when not provided', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      // No status field

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      const mockPopulate = jest.fn();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockResolvedValue({}),
      };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await POST(mockRequest);

      // Assert
      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ACTIVE',
        })
      );
    });

    it('POST should default doctorNotes to empty string when not provided', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'doctor-123',
          role: 'RECEPTIONIST',
        },
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      // No doctorNotes field

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      const MockMedicalRecord = {
        save: mockSave,
      };
      (MedicalRecord as unknown as jest.Mock).mockImplementation(
        () => MockMedicalRecord
      );

      const mockPopulate = jest.fn();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockResolvedValue({}),
      };
      mockPopulate.mockReturnValue(mockQuery);

      (MedicalRecord.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act
      await POST(mockRequest);

      // Assert
      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          doctorNotes: '',
        })
      );
    });
  });
});
