/* eslint-disable @typescript-eslint/no-require-imports */
const mockLean = jest.fn();
const mockChain: any = {
  populate: jest.fn().mockReturnThis(),
  lean: mockLean,
};

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '1', email: 'test@example.com' },
  }),
}));

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

import { GET } from '@/app/api/patients/me/route';
import Patient from '@/models/Patient';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  (Patient.findOne as jest.Mock).mockReturnValue(mockChain);
  mockLean.mockResolvedValue(null);

  const User = require('@/models/User').default;
  (User.findOne as jest.Mock).mockResolvedValue({
    _id: '1',
    email: 'test@example.com',
    role: 'PATIENT',
  });
});

describe('GET /api/patients/me', () => {
  it('should return current patient profile', async () => {
    const mockPatient = {
      _id: 'patient123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      user: {
        _id: '1',
        name: 'John Doe',
        email: 'test@example.com',
        role: 'PATIENT',
      },
      toObject: () => ({}),
    };

    mockLean.mockResolvedValue(mockPatient);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('John');
    expect(data.data.user.role).toBe('PATIENT');
  });

  it('should return 404 if patient not found', async () => {
    mockLean.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Patient profile not found');
  });

  it('should return 401 when not authenticated', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValueOnce(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 403 when user role is not PATIENT', async () => {
    const User = require('@/models/User').default;
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: '1',
      email: 'doc@test.com',
      role: 'DOCTOR',
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Access denied: Patient only');
  });

  it('should handle database errors', async () => {
    // Suppress console.error for this test
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockLean.mockRejectedValue(new Error('DB error'));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Internal server error');

    // Verify error was logged (optional)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching current patient:',
      expect.any(Error)
    );

    // Restore console methods
    consoleErrorSpy.mockRestore();
  });
});
