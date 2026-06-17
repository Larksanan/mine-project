/* eslint-disable @typescript-eslint/no-require-imports */

import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock all dependencies
jest.mock('next/server', () => {
  class NextResponseMock {
    body: any;
    headers: any;
    status: number;
    constructor(body: any, init?: { status?: number; headers?: any }) {
      this.body = body;
      this.status = init?.status || 200;
      const headers = init?.headers || {};
      this.headers = {
        get: (key: string) => {
          const foundKey = Object.keys(headers).find(
            k => k.toLowerCase() === key.toLowerCase()
          );
          return foundKey ? headers[foundKey] : null;
        },
      };
    }
    async json() {
      return this.body;
    }
    static json(data: any, init?: { status?: number; headers?: any }) {
      const headers = { 'Content-Type': 'application/json', ...init?.headers };
      return new NextResponseMock(data, { ...init, headers });
    }
  }
  return {
    NextRequest: class {
      url: string;
      nextUrl: URL;
      constructor(url: string) {
        this.url = url;
        this.nextUrl = new URL(url);
      }
    },
    NextResponse: NextResponseMock,
  };
});

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn(),
}));

describe('File Download API', () => {
  let getServerSession: jest.Mock;
  let readFile: jest.Mock;
  let existsSync: jest.Mock;
  let join: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    readFile = require('fs/promises').readFile;
    existsSync = require('fs').existsSync;
    join = require('path').join as jest.Mock;
  });

  describe('GET /api/files/download', () => {
    const mockSession = {
      user: { id: 'user123', role: 'RECEPTIONIST' },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should download PDF file successfully', async () => {
      const filename = 'medical-report.pdf';
      const mockFileBuffer = Buffer.from('PDF content');
      const expectedFilepath = '/mock/path/to/medical-report.pdf';

      // Setup mocks
      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(mockFileBuffer);
      join.mockReturnValue(expectedFilepath);

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${filename}`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.body).toBe(mockFileBuffer);
      expect(existsSync).toHaveBeenCalledWith(expectedFilepath);
      expect(readFile).toHaveBeenCalledWith(expectedFilepath);
      expect(join).toHaveBeenCalledWith(
        process.cwd(),
        'public',
        'uploads',
        'medical-records',
        'medical-report.pdf'
      );
    });

    it('should handle files with uploads/medical-records/ prefix', async () => {
      const filename = '/uploads/medical-records/medical-report.pdf';
      const mockFileBuffer = Buffer.from('PDF content');
      const expectedFilepath = '/mock/path/to/medical-report.pdf';

      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(mockFileBuffer);
      join.mockReturnValue(expectedFilepath);

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${encodeURIComponent(filename)}`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(existsSync).toHaveBeenCalledWith(expectedFilepath);
      expect(readFile).toHaveBeenCalledWith(expectedFilepath);
      expect(join).toHaveBeenCalledWith(
        process.cwd(),
        'public',
        'uploads',
        'medical-records',
        'medical-report.pdf'
      );
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/records/download?filename=test.pdf'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user', async () => {
      getServerSession.mockResolvedValue({}); // Session without user

      const req = new NextRequest(
        'http://localhost:3000/api/records/download?filename=test.pdf'
      );
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

      const req = new NextRequest(
        'http://localhost:3000/api/records/download?filename=test.pdf'
      );
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

      const req = new NextRequest(
        'http://localhost:3000/api/records/download?filename=test.pdf'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should return 400 when filename is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/records/download');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Filename is required');
    });

    it('should return 400 when filename is empty', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/records/download?filename='
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Filename is required');
    });

    it('should return 404 when file does not exist', async () => {
      const filename = 'non-existent.pdf';
      const expectedFilepath = '/mock/path/to/non-existent.pdf';

      existsSync.mockReturnValue(false);
      join.mockReturnValue(expectedFilepath);

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${filename}`
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('File not found');
      expect(existsSync).toHaveBeenCalledWith(expectedFilepath);
    });

    it('should handle readFile errors', async () => {
      const filename = 'test.pdf';
      const expectedFilepath = '/mock/path/to/test.pdf';

      existsSync.mockReturnValue(true);
      join.mockReturnValue(expectedFilepath);
      readFile.mockRejectedValue(new Error('Read error'));

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${filename}`
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to download file');
    });

    it('should set correct content type for different file extensions', async () => {
      const testCases = [
        { filename: 'file.pdf', expectedType: 'application/pdf' },
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
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        getServerSession.mockResolvedValue(mockSession);

        const mockFileBuffer = Buffer.from('content');
        existsSync.mockReturnValue(true);
        readFile.mockResolvedValue(mockFileBuffer);

        const req = new NextRequest(
          `http://localhost:3000/api/records/download?filename=${testCase.filename}`
        );
        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe(testCase.expectedType);
      }
    });

    it('should handle filenames with spaces and special characters', async () => {
      const filename = 'medical report (2024).pdf';
      const mockFileBuffer = Buffer.from('PDF content');
      const expectedFilepath = '/mock/path/to/medical report (2024).pdf';

      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(mockFileBuffer);
      join.mockReturnValue(expectedFilepath);

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${encodeURIComponent(filename)}`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(existsSync).toHaveBeenCalledWith(expectedFilepath);
      expect(readFile).toHaveBeenCalledWith(expectedFilepath);
      expect(join).toHaveBeenCalledWith(
        process.cwd(),
        'public',
        'uploads',
        'medical-records',
        'medical report (2024).pdf'
      );
    });

    it('should handle Windows-style file paths in input', async () => {
      const filename = 'uploads\\medical-records\\report.pdf';
      const mockFileBuffer = Buffer.from('PDF content');
      const expectedFilepath = '/mock/path/to/report.pdf';

      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(mockFileBuffer);
      join.mockReturnValue(expectedFilepath);

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${encodeURIComponent(filename)}`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(existsSync).toHaveBeenCalledWith(expectedFilepath);
      expect(readFile).toHaveBeenCalledWith(expectedFilepath);
      // Should convert backslashes to forward slashes and extract filename
      expect(join).toHaveBeenCalledWith(
        process.cwd(),
        'public',
        'uploads',
        'medical-records',
        'report.pdf'
      );
    });

    it('should handle concurrent download requests', async () => {
      const filename1 = 'file1.pdf';
      const filename2 = 'file2.jpg';

      const mockFileBuffer1 = Buffer.from('PDF content');
      const mockFileBuffer2 = Buffer.from('JPEG content');

      // Setup mocks to return different values for each call
      existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true);
      readFile
        .mockResolvedValueOnce(mockFileBuffer1)
        .mockResolvedValueOnce(mockFileBuffer2);

      const req1 = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${filename1}`
      );
      const req2 = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${filename2}`
      );

      const [res1, res2] = await Promise.all([GET(req1), GET(req2)]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(existsSync).toHaveBeenCalledTimes(2);
      expect(readFile).toHaveBeenCalledTimes(2);
    });

    it('should handle large file downloads', async () => {
      const filename = 'large-file.pdf';
      // Create a large buffer (1MB)
      const largeBuffer = Buffer.alloc(1024 * 1024, 'x');
      const expectedFilepath = '/mock/path/to/large-file.pdf';

      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(largeBuffer);
      join.mockReturnValue(expectedFilepath);

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${filename}`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Length')).toBe(
        largeBuffer.length.toString()
      );
      expect(readFile).toHaveBeenCalledWith(expectedFilepath);
    });

    it('should handle error in path.join', async () => {
      const filename = 'test.pdf';
      join.mockImplementation(() => {
        throw new Error('Path join error');
      });

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${filename}`
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to download file');
    });

    it('should handle error in existsSync', async () => {
      const filename = 'test.pdf';
      const expectedFilepath = '/mock/path/to/test.pdf';

      join.mockReturnValue(expectedFilepath);
      existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const req = new NextRequest(
        `http://localhost:3000/api/records/download?filename=${filename}`
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to download file');
    });
  });
});
