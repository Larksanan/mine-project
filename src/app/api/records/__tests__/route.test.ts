import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { NextRequest } from 'next/server';

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

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

/** Build a chainable Mongoose find mock that resolves to `records`. */
function buildFindChain(records: unknown[] = []) {
  const mockLean = jest.fn().mockResolvedValue(records);
  const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
  const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
  const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

  const mockPopulate = jest.fn();
  const mockQuery = { populate: mockPopulate, sort: mockSort };
  mockPopulate.mockReturnValue(mockQuery);

  return {
    mockFind: jest.fn().mockReturnValue(mockQuery),
    mockSkip,
    mockLimit,
    mockLean,
  };
}

/** Build a chainable findById mock that resolves to `record`. */
function buildFindByIdChain(record: unknown = {}) {
  const mockPopulate = jest.fn();
  const mockQuery = {
    populate: mockPopulate,
    lean: jest.fn().mockResolvedValue(record),
  };
  mockPopulate.mockReturnValue(mockQuery);
  return mockQuery;
}

/** Create a minimal authenticated session for a given role. */
function sessionFor(role: string, id = 'user-123') {
  return { user: { id, role } };
}

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

    mockRequest = {
      url: 'http://localhost:3000/api/doctor/records',
      headers: new Headers(),
      formData: jest.fn(),
    } as unknown as NextRequest;

    (connectDB as jest.Mock).mockResolvedValue(undefined);
    mockJoin.mockImplementation((...args: string[]) => args.join('/'));
  });

  describe('GET /api/doctor/records', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns 403 when role is not allowed (PATIENT)', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('PATIENT'));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Forbidden - Insufficient permissions',
      });
    });

    it('returns 403 when user has no role', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-123' } });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: 'Forbidden - Insufficient permissions',
      });
    });

    it('returns own records for DOCTOR role', async () => {
      const userId = 'doctor-123';
      mockGetServerSession.mockResolvedValue(sessionFor('DOCTOR', userId));

      const mockRecords = [
        {
          _id: 'record-1',
          patientId: { _id: 'patient-1', firstName: 'John', lastName: 'Doe' },
          doctorId: { _id: userId, name: 'Dr. Smith' },
          title: 'Checkup',
          recordType: 'CONSULTATION',
        },
      ];

      const { mockFind } = buildFindChain(mockRecords);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(1);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRecords);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 100,
        total: 1,
        pages: 1,
      });
      expect(MedicalRecord.find).toHaveBeenCalledWith({ doctorId: userId });
    });

    it('returns own records for RECEPTIONIST role', async () => {
      const userId = 'rec-123';
      mockGetServerSession.mockResolvedValue(
        sessionFor('RECEPTIONIST', userId)
      );

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({ doctorId: userId });
    });

    it('returns own records for LABTECH role', async () => {
      const userId = 'lab-123';
      mockGetServerSession.mockResolvedValue(sessionFor('LABTECH', userId));

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({ doctorId: userId });
    });

    it('returns ALL records for ADMIN role (no base doctorId filter)', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('ADMIN'));

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      // query must NOT contain doctorId from session
      expect(MedicalRecord.find).toHaveBeenCalledWith({});
    });

    it('admin can filter by doctorId query param', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('ADMIN'));
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?doctorId=doc-999',
      } as unknown as NextRequest;

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({ doctorId: 'doc-999' });
    });

    it('admin can filter by recordType', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('ADMIN'));
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?recordType=LAB_RESULT',
      } as unknown as NextRequest;

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        recordType: 'LAB_RESULT',
      });
    });

    it('admin can filter by status', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('ADMIN'));
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?status=ACTIVE',
      } as unknown as NextRequest;

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });

    it('admin can filter by date range', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('ADMIN'));
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?startDate=2025-01-01&endDate=2025-12-31',
      } as unknown as NextRequest;

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        date: {
          $gte: new Date('2025-01-01'),
          $lte: new Date('2025-12-31'),
        },
      });
    });

    it('admin can search by title/description keyword', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('ADMIN'));
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?search=diabetes',
      } as unknown as NextRequest;

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: 'diabetes', $options: 'i' } },
          { description: { $regex: 'diabetes', $options: 'i' } },
        ],
      });
    });

    it('admin combined filters work together', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('ADMIN'));
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?doctorId=doc-1&status=ACTIVE&recordType=CONSULTATION',
      } as unknown as NextRequest;

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: 'doc-1',
        status: 'ACTIVE',
        recordType: 'CONSULTATION',
      });
    });

    it('filters by patientId for non-admin', async () => {
      mockGetServerSession.mockResolvedValue(
        sessionFor('RECEPTIONIST', 'rec-1')
      );
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?patientId=patient-456',
      } as unknown as NextRequest;

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        doctorId: 'rec-1',
        patientId: 'patient-456',
      });
    });

    it('filters by patientId for admin', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('ADMIN'));
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?patientId=patient-456',
      } as unknown as NextRequest;

      const { mockFind } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      expect(MedicalRecord.find).toHaveBeenCalledWith({
        patientId: 'patient-456',
      });
    });

    it('handles pagination parameters correctly', async () => {
      mockGetServerSession.mockResolvedValue(
        sessionFor('RECEPTIONIST', 'doc-1')
      );
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/doctor/records?page=2&limit=20',
      } as unknown as NextRequest;

      const { mockFind, mockSkip, mockLimit } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(50);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        pages: 3,
      });
      expect(mockSkip).toHaveBeenCalledWith(20); // (2-1) * 20
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('defaults to page=1 and limit=100', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('DOCTOR', 'doc-1'));

      const { mockFind, mockSkip, mockLimit } = buildFindChain([]);
      (MedicalRecord.find as jest.Mock).mockImplementation(mockFind);
      (MedicalRecord.countDocuments as jest.Mock).mockResolvedValue(0);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(100);
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it('returns 500 on database error', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));

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

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Database error');
    });
  });

  describe('POST /api/doctor/records', () => {
    let mockFormData: FormData;

    beforeEach(() => {
      mockFormData = new FormData();
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFormData);
    });

    it('returns 401 when unauthenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Session check:',
        'Not authenticated'
      );
    });

    it('returns 403 when role is not allowed', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('PATIENT'));

      const response = await POST(mockRequest);
      const data = await response.json();

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

    it('returns 400 when FormData parsing fails (async rejection)', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      (mockRequest.formData as jest.Mock).mockRejectedValue(
        new Error('FormData parse error')
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid form data - expected multipart/form-data',
        details: 'FormData parse error',
      });
    });

    it('returns 400 when formData() throws synchronously', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      (mockRequest.formData as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected sync error');
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Invalid form data - expected multipart/form-data'
      );
      expect(data.details).toBe('Unexpected sync error');
    });

    it('returns 400 with all missing-field errors', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      // FormData is empty — all required fields missing

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          'Patient ID is required',
          'Record type is required',
          'Title is required',
          'Description is required',
          'Date is required',
        ])
      );
    });

    it('returns 400 when only some fields are missing', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('DOCTOR'));
      mockFormData.append('title', 'Some Title');
      // patientId, recordType, description, date still missing

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toEqual(
        expect.arrayContaining([
          'Patient ID is required',
          'Record type is required',
          'Description is required',
          'Date is required',
        ])
      );
      expect(data.details).not.toContain('Title is required');
    });

    it('creates a medical record without attachments (201)', async () => {
      const userId = 'doctor-123';
      mockGetServerSession.mockResolvedValue(sessionFor('DOCTOR', userId));

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Annual Checkup');
      mockFormData.append('description', 'Patient is in good health');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('status', 'ACTIVE');
      mockFormData.append('doctorNotes', 'Follow up in 6 months');

      const populatedRecord = {
        _id: 'record-123',
        patientId: { _id: 'patient-456', firstName: 'John', lastName: 'Doe' },
        doctorId: { _id: userId, name: 'Dr. Smith', email: 'dr@example.com' },
        title: 'Annual Checkup',
        description: 'Patient is in good health',
        date: new Date('2024-01-15'),
        status: 'ACTIVE',
        doctorNotes: 'Follow up in 6 months',
        attachments: [],
      };

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));
      (MedicalRecord.findById as jest.Mock).mockReturnValue(
        buildFindByIdChain(populatedRecord)
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Medical record created successfully');
      expect(MedicalRecord).toHaveBeenCalledWith({
        patientId: 'patient-456',
        doctorId: userId,
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

    it('defaults status to ACTIVE when not provided', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));
      (MedicalRecord.findById as jest.Mock).mockReturnValue(
        buildFindByIdChain()
      );

      await POST(mockRequest);

      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' })
      );
    });

    it('defaults doctorNotes to empty string when not provided', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));
      (MedicalRecord.findById as jest.Mock).mockReturnValue(
        buildFindByIdChain()
      );

      await POST(mockRequest);

      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({ doctorNotes: '' })
      );
    });

    it('saves uploaded files and stores paths in attachments', async () => {
      const userId = 'doctor-123';
      mockGetServerSession.mockResolvedValue(
        sessionFor('RECEPTIONIST', userId)
      );

      const mockFile1 = new File(['content1'], 'report.pdf', {
        type: 'application/pdf',
      });
      const mockFile2 = new File(['content2'], 'image.jpg', {
        type: 'image/jpeg',
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup with Files');
      mockFormData.append('description', 'Test description');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', mockFile1);
      mockFormData.append('attachments', mockFile2);

      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);
      mockJoin
        .mockReturnValueOnce('/uploads/medical-records')
        .mockReturnValueOnce('/uploads/medical-records/1234567890-report.pdf')
        .mockReturnValueOnce('/uploads/medical-records/1234567891-image.jpg');

      mockFile1.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));
      mockFile2.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));

      const originalDateNow = Date.now;
      Date.now = jest
        .fn()
        .mockReturnValueOnce(1234567890)
        .mockReturnValueOnce(1234567891);

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));
      (MedicalRecord.findById as jest.Mock).mockReturnValue(
        buildFindByIdChain()
      );

      await POST(mockRequest);

      expect(mockMkdir).toHaveBeenCalledWith('/uploads/medical-records', {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            '/uploads/medical-records/1234567890-report.pdf',
            '/uploads/medical-records/1234567891-image.jpg',
          ],
        })
      );

      Date.now = originalDateNow;
    });

    it('skips mkdir when upload directory already exists', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      const mockFile = new File(['data'], 'test.pdf', {
        type: 'application/pdf',
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Test');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', mockFile);

      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(4));
      mockExistsSync.mockReturnValue(true); // directory already exists

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));
      (MedicalRecord.findById as jest.Mock).mockReturnValue(
        buildFindByIdChain()
      );

      await POST(mockRequest);

      expect(mockMkdir).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('skips empty/non-file attachment fields gracefully', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', ''); // empty string, not a File

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));
      (MedicalRecord.findById as jest.Mock).mockReturnValue(
        buildFindByIdChain()
      );

      await POST(mockRequest);

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(MedicalRecord).toHaveBeenCalledWith(
        expect.objectContaining({ attachments: [] })
      );
    });

    it('sanitizes special characters in filenames', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      const mockFile = new File(
        ['data'],
        'report with spaces & special@chars.pdf',
        { type: 'application/pdf' }
      );

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', mockFile);

      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(4));
      mockExistsSync.mockReturnValue(true);

      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(1234567890);

      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));
      (MedicalRecord.findById as jest.Mock).mockReturnValue(
        buildFindByIdChain()
      );

      await POST(mockRequest);

      expect(mockJoin).toHaveBeenCalledWith(
        expect.stringContaining('medical-records'),
        '1234567890-report-with-spaces---special-chars.pdf'
      );

      Date.now = originalDateNow;
    });

    it('returns 500 when writeFile fails (disk full)', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      const mockFile = new File(['data'], 'report.pdf', {
        type: 'application/pdf',
      });

      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');
      mockFormData.append('attachments', mockFile);

      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(4));
      mockExistsSync.mockReturnValue(true);
      mockWriteFile.mockRejectedValue(new Error('Disk full'));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'File upload failed',
        details: 'Disk full',
      });
    });

    it('returns 500 when connectDB fails', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Database connection failed',
        details: 'Connection failed',
      });
    });

    it('returns 400 on Mongoose ValidationError', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      const err = new Error(
        'Validation failed: patientId: Path `patientId` is required'
      );
      err.name = 'ValidationError';
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(err),
      }));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Validation error',
        details: err.message,
      });
    });

    it('returns 400 on Mongoose CastError (invalid ObjectId)', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      mockFormData.append('patientId', 'bad-id');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      const err = new Error('Cast to ObjectId failed for value "bad-id"');
      err.name = 'CastError';
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(err),
      }));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid ID format',
        details: 'Patient ID or Doctor ID is not a valid MongoDB ObjectId',
      });
    });

    it('returns 500 on generic save error', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append('title', 'Checkup');
      mockFormData.append('description', 'Test');
      mockFormData.append('date', '2024-01-15');

      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Unknown save error')),
      }));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to save medical record',
        details: 'Unknown save error',
      });
    });
  });

  describe('Console logging in POST', () => {
    let mockFormData: FormData;

    beforeEach(() => {
      mockFormData = new FormData();
      (mockRequest.formData as jest.Mock).mockResolvedValue(mockFormData);
    });

    function appendRequiredFields(fd: FormData) {
      fd.append('patientId', 'patient-456');
      fd.append('recordType', 'CONSULTATION');
      fd.append('title', 'Test Title');
      fd.append('description', 'Test Description');
      fd.append('date', '2024-01-15');
    }

    function stubSuccessfulSave() {
      const mockSave = jest.fn().mockResolvedValue({ _id: 'record-123' });
      (MedicalRecord as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));
      (MedicalRecord.findById as jest.Mock).mockReturnValue(
        buildFindByIdChain()
      );
    }

    it('logs session status as Authenticated', async () => {
      mockGetServerSession.mockResolvedValue(
        sessionFor('RECEPTIONIST', 'doc-1')
      );
      appendRequiredFields(mockFormData);
      stubSuccessfulSave();

      await POST(mockRequest);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Session check:',
        'Authenticated'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Authenticated user:',
        'doc-1',
        'RECEPTIONIST'
      );
    });

    it('logs FormData parsing steps', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      appendRequiredFields(mockFormData);
      stubSuccessfulSave();

      await POST(mockRequest);

      expect(mockConsoleLog).toHaveBeenCalledWith('Parsing FormData...');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'FormData keys:',
        expect.any(Array)
      );
    });

    it('logs truncated extracted fields', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      mockFormData.append('patientId', 'patient-456');
      mockFormData.append('recordType', 'CONSULTATION');
      mockFormData.append(
        'title',
        'A very long title that should be truncated in the log output'
      );
      mockFormData.append(
        'description',
        'A very long description that should also be truncated here'
      );
      mockFormData.append('date', '2024-01-15');
      stubSuccessfulSave();

      await POST(mockRequest);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Extracted fields:',
        expect.objectContaining({
          title: expect.stringContaining('...'),
          description: expect.stringContaining('...'),
        })
      );
    });

    it('logs file processing count', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      appendRequiredFields(mockFormData);
      stubSuccessfulSave();

      await POST(mockRequest);

      expect(mockConsoleLog).toHaveBeenCalledWith('Processing files:', 0);
    });

    it('logs database connection steps', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      appendRequiredFields(mockFormData);
      stubSuccessfulSave();

      await POST(mockRequest);

      expect(mockConsoleLog).toHaveBeenCalledWith('Connecting to database...');
      expect(mockConsoleLog).toHaveBeenCalledWith('Database connected');
    });

    it('logs record creation step', async () => {
      mockGetServerSession.mockResolvedValue(sessionFor('RECEPTIONIST'));
      appendRequiredFields(mockFormData);
      stubSuccessfulSave();

      await POST(mockRequest);

      expect(mockConsoleLog).toHaveBeenCalledWith('Creating medical record...');
    });
  });
});
