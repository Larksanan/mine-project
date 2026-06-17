// src/app/api/doctor/records/download/__tests__/route.test.ts
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth');
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('path');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockJoin = join as jest.MockedFunction<typeof join>;

describe('GET /api/doctor/records/download', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/doctor/records/download',
    } as NextRequest;

    // Default mocks
    mockGetServerSession.mockResolvedValue(null);
    mockExistsSync.mockReturnValue(false);
    mockJoin.mockImplementation((...args) => args.join('/'));
  });

  const createMockRequest = (url: string): NextRequest => {
    return {
      url,
    } as NextRequest;
  };

  it('should return 401 if user is not authenticated', async () => {
    // Arrange
    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download'
    );
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

  it('should return 401 if session exists but no user', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      // Session exists but no user object
      expires: new Date().toISOString(),
    } as any);

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

  it('should return 403 if user is not a DOCTOR', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'PATIENT', // Not a doctor
      },
    } as any);

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
        name: 'John Doe',
        email: 'john@example.com',
        // No role property
      },
    } as any);

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

  it('should return 400 if filename is missing', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Filename is required',
    });
  });

  it('should return 400 if filename contains path traversal attempt', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=../../etc/passwd'
    );

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Invalid filename - path traversal not allowed',
    });
  });

  it('should return 400 if filename contains forward slashes', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=../uploads/medical-records/report.pdf'
    );

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Invalid filename - path traversal not allowed',
    });
  });

  it('should return 400 if filename contains backslashes', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=..\\uploads\\medical-records\\report.pdf'
    );

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Invalid filename - path traversal not allowed',
    });
  });

  it('should return 404 if file does not exist', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=report.pdf'
    );

    // Mock path construction
    mockJoin.mockReturnValue(
      '/test/path/public/uploads/medical-records/report.pdf'
    );
    mockExistsSync.mockReturnValue(false);

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'File not found',
    });
    expect(mockExistsSync).toHaveBeenCalledWith(
      '/test/path/public/uploads/medical-records/report.pdf'
    );
  });

  it('should successfully download PDF file', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=medical-report.pdf'
    );

    const mockFileBuffer = Buffer.from('PDF file content');
    const mockFilePath =
      '/test/path/public/uploads/medical-records/medical-report.pdf';

    mockJoin.mockReturnValue(mockFilePath);
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(mockFileBuffer);

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="medical-report.pdf"'
    );
    expect(response.headers.get('Content-Length')).toBe(
      mockFileBuffer.length.toString()
    );

    // Verify file was read from correct path
    expect(mockReadFile).toHaveBeenCalledWith(mockFilePath);
  });

  it('should clean filename with /uploads/medical-records/ prefix', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=/uploads/medical-records/report.pdf'
    );

    const mockFilePath = '/test/path/public/uploads/medical-records/report.pdf';

    mockJoin.mockReturnValue(mockFilePath);
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(Buffer.from('test'));

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="report.pdf"'
    );
    expect(mockJoin).toHaveBeenCalledWith(
      expect.any(String), // process.cwd()
      'public',
      'uploads',
      'medical-records',
      'report.pdf'
    );
  });

  it('should clean filename with backslashes in prefix', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=/uploads\\medical-records\\report.pdf'
    );

    const mockFilePath = '/test/path/public/uploads/medical-records/report.pdf';

    mockJoin.mockReturnValue(mockFilePath);
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(Buffer.from('test'));

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="report.pdf"'
    );
    expect(mockJoin).toHaveBeenCalledWith(
      expect.any(String),
      'public',
      'uploads',
      'medical-records',
      'report.pdf'
    );
  });

  it('should handle different file types with correct content type', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    const testCases = [
      { filename: 'report.pdf', expectedType: 'application/pdf' },
      { filename: 'image.jpg', expectedType: 'image/jpeg' },
      { filename: 'image.jpeg', expectedType: 'image/jpeg' },
      { filename: 'image.png', expectedType: 'image/png' },
      { filename: 'image.gif', expectedType: 'image/gif' },
      { filename: 'document.doc', expectedType: 'application/msword' },
      {
        filename: 'document.docx',
        expectedType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      { filename: 'notes.txt', expectedType: 'text/plain' },
      { filename: 'unknown.xyz', expectedType: 'application/octet-stream' },
      { filename: 'nodots', expectedType: 'application/octet-stream' },
    ];

    for (const testCase of testCases) {
      jest.clearAllMocks();

      mockRequest = createMockRequest(
        `http://localhost:3000/api/doctor/records/download?filename=${testCase.filename}`
      );
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(Buffer.from('test'));

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(testCase.expectedType);
      expect(response.headers.get('Content-Disposition')).toBe(
        `attachment; filename="${testCase.filename}"`
      );
    }
  });

  it('should handle read file errors', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=report.pdf'
    );

    mockJoin.mockReturnValue(
      '/test/path/public/uploads/medical-records/report.pdf'
    );
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error('Permission denied'));

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Failed to download file',
      details: 'Permission denied',
    });
  });

  it('should handle unexpected errors', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        role: 'DOCTOR',
      },
    } as any);

    mockRequest = createMockRequest(
      'http://localhost:3000/api/doctor/records/download?filename=report.pdf'
    );

    // Simulate an error that's not an Error instance
    mockExistsSync.mockImplementation(() => {
      throw 'Unknown error string';
    });

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Failed to download file',
      details: 'Unknown error',
    });
  });

  describe('Security Tests', () => {
    it('should prevent absolute path in filename', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      mockRequest = createMockRequest(
        'http://localhost:3000/api/doctor/records/download?filename=/etc/passwd'
      );

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('path traversal');
    });

    it('should prevent encoded path traversal', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      // URL encoded path traversal
      mockRequest = createMockRequest(
        'http://localhost:3000/api/doctor/records/download?filename=..%2F..%2Fetc%2Fpasswd'
      );

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('path traversal');
    });

    it('should prevent double encoded path traversal', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      // Double URL encoded
      mockRequest = createMockRequest(
        'http://localhost:3000/api/doctor/records/download?filename=..%252F..%252Fetc%252Fpasswd'
      );

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      // After URL decoding once, it becomes ..%2F..%2Fetc%2Fpasswd
      // After URL decoding again, it becomes ../../etc/passwd
      // The cleaning logic should catch this
      expect(data.error).toContain('path traversal');
    });

    it('should prevent null byte injection', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(Buffer.from('test'));

      // Note: In JavaScript, URL params automatically decode %00 to null byte
      mockRequest = createMockRequest(
        'http://localhost:3000/api/doctor/records/download?filename=report.pdf%00.jpg'
      );

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid filename');
    });
  });

  describe('Edge Cases', () => {
    it('should handle filename with multiple extensions', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      mockRequest = createMockRequest(
        'http://localhost:3000/api/doctor/records/download?filename=report.final.version.pdf'
      );

      const mockFilePath =
        '/test/path/public/uploads/medical-records/report.final.version.pdf';
      mockJoin.mockReturnValue(mockFilePath);
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(Buffer.from('test'));

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="report.final.version.pdf"'
      );
    });

    it('should handle filename with spaces', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      mockRequest = createMockRequest(
        'http://localhost:3000/api/doctor/records/download?filename=medical%20report.pdf'
      );

      const mockFilePath =
        '/test/path/public/uploads/medical-records/medical report.pdf';
      mockJoin.mockReturnValue(mockFilePath);
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(Buffer.from('test'));

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="medical report.pdf"'
      );
    });

    it('should handle filename with special characters', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      mockRequest = createMockRequest(
        'http://localhost:3000/api/doctor/records/download?filename=report_2024-01-01_v1.2.pdf'
      );

      const mockFilePath =
        '/test/path/public/uploads/medical-records/report_2024-01-01_v1.2.pdf';
      mockJoin.mockReturnValue(mockFilePath);
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(Buffer.from('test'));

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="report_2024-01-01_v1.2.pdf"'
      );
    });

    it('should handle filename with query parameters in filename param', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      // This could happen if someone constructs a malicious URL
      mockRequest = createMockRequest(
        'http://localhost:3000/api/doctor/records/download?filename=report.pdf&evil=param'
      );

      const mockFilePath =
        '/test/path/public/uploads/medical-records/report.pdf';
      mockJoin.mockReturnValue(mockFilePath);
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(Buffer.from('test'));

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      // URLSearchParams will get 'report.pdf' (stops at &)
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="report.pdf"'
      );
    });

    it('should handle very long filenames', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Dr. Smith',
          email: 'doctor@example.com',
          role: 'DOCTOR',
        },
      } as any);

      const longFilename = 'a'.repeat(255) + '.pdf';
      mockRequest = createMockRequest(
        `http://localhost:3000/api/doctor/records/download?filename=${longFilename}`
      );

      const mockFilePath = `/test/path/public/uploads/medical-records/${longFilename}`;
      mockJoin.mockReturnValue(mockFilePath);
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(Buffer.from('test'));

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe(
        `attachment; filename="${longFilename}"`
      );
    });
  });
});
