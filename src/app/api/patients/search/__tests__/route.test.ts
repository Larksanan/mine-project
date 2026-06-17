/* eslint-disable @typescript-eslint/no-require-imports */
process.env.NEXTAUTH_SECRET = 'K0AtTUHVYS8e59hGvoKJqMwi3STugCr6gz23v1driGE=';
process.env.TEST_DATABASE_URL = 'mongodb://localhost:27017/mini-projet_test';

const mockFindOne = jest.fn();

// Mock next-auth session
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '1', email: 'test@example.com' },
  }),
}));

// Mock MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock User model
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

// Mock Patient model
jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
  },
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  },
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/patients/search/route';
import User from '@/models/User';

// -------------------- BEFORE EACH --------------------
beforeEach(() => {
  jest.clearAllMocks();

  // Default: authenticated user with appropriate role
  (User.findOne as jest.Mock).mockResolvedValue({
    _id: 'user1',
    email: 'test@example.com',
    role: 'DOCTOR',
  });

  mockFindOne.mockResolvedValue(null);
});

// -------------------- HELPER --------------------
const mockRequest = (url: string) => new NextRequest(url);

// -------------------- TESTS --------------------
describe('GET /api/patients/search', () => {
  it('should return 401 when not authenticated', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValueOnce(null);

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789V'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 404 when user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(null);

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789V'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('User not found');
  });

  it('should return 403 for unauthorized roles', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: 'user1',
      email: 'test@example.com',
      role: 'PATIENT',
    });

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789V'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Forbidden - Insufficient permissions');
  });

  it('should return 400 when NIC is missing', async () => {
    const req = mockRequest('http://localhost:3000/api/patients/search');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('NIC number is required');
  });

  it('should return 400 when NIC is empty string', async () => {
    const req = mockRequest('http://localhost:3000/api/patients/search?q=');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('NIC number is required');
  });

  it('should search patient by NIC successfully', async () => {
    const mockPatient = {
      _id: 'patient1',
      firstName: 'John',
      lastName: 'Doe',
      nic: '123456789V',
      email: 'john@example.com',
    };
    mockFindOne.mockResolvedValue(mockPatient);

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789V'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockPatient);
    expect(data.data.nic).toBe('123456789V');
  });

  it('should search patient using nic parameter', async () => {
    const mockPatient = {
      _id: 'patient1',
      firstName: 'Jane',
      lastName: 'Smith',
      nic: '987654321V',
      email: 'jane@example.com',
    };
    mockFindOne.mockResolvedValue(mockPatient);

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?nic=987654321V'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.nic).toBe('987654321V');
  });

  it('should return 404 when patient not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=NOTFOUND123'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Patient not found with this NIC number');
  });

  it('should perform case-insensitive NIC search', async () => {
    const mockPatient = {
      _id: 'patient1',
      firstName: 'John',
      lastName: 'Doe',
      nic: '123456789V',
    };
    mockFindOne.mockResolvedValue(mockPatient);

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789v'
    );
    await GET(req);

    expect(mockFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        nic: expect.objectContaining({
          $regex: expect.any(RegExp),
        }),
      })
    );
  });

  it('should escape special regex characters in NIC', async () => {
    mockFindOne.mockResolvedValue(null);

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123.456*789V'
    );
    await GET(req);

    // Verify that special characters are escaped
    expect(mockFindOne).toHaveBeenCalled();
    const callArg = mockFindOne.mock.calls[0][0];
    expect(callArg.nic.$regex.source).toContain('\\.');
    expect(callArg.nic.$regex.source).toContain('\\*');
  });

  it('should handle database errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockFindOne.mockRejectedValue(new Error('Database error'));

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789V'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Database error');

    consoleErrorSpy.mockRestore();
  });

  it('should allow ADMIN role', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: 'user1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    mockFindOne.mockResolvedValue({ _id: 'patient1', nic: '123456789V' });

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789V'
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('should allow NURSE role', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: 'user1',
      email: 'nurse@example.com',
      role: 'NURSE',
    });
    mockFindOne.mockResolvedValue({ _id: 'patient1', nic: '123456789V' });

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789V'
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('should allow RECEPTIONIST role', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: 'user1',
      email: 'receptionist@example.com',
      role: 'RECEPTIONIST',
    });
    mockFindOne.mockResolvedValue({ _id: 'patient1', nic: '123456789V' });

    const req = mockRequest(
      'http://localhost:3000/api/patients/search?q=123456789V'
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});
