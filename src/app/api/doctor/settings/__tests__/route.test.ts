/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';

// Mock all dependencies
jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    method?: string;
    body?: any;
    headers: any;

    constructor(url: string, init?: { method?: string; body?: any }) {
      this.url = url;
      this.method = init?.method;
      this.body = init?.body;
      this.headers = { get: () => null };
    }

    json() {
      return Promise.resolve(this.body ? JSON.parse(this.body) : {});
    }
  },
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe('Doctor Settings API', () => {
  let User: any;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    User = require('@/models/User').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/doctor/settings', () => {
    const mockSession = {
      user: { id: 'doctor123', role: 'DOCTOR' },
    };

    const mockDoctor = {
      _id: 'doctor123',
      name: 'Dr. John Smith',
      email: 'john@hospital.com',
      phone: '+1234567890',
      specialization: 'Cardiology',
      licenseNumber: 'LIC123456',
      hospital: 'City Hospital',
      bio: 'Experienced cardiologist with 10 years of practice',
      consultationFee: 150,
      availableHours: { start: '09:00', end: '17:00' },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should fetch doctor settings successfully', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockDoctor),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Dr. John Smith');
      expect(data.data.email).toBe('john@hospital.com');
      expect(data.data.specialization).toBe('Cardiology');
      expect(data.data.consultationFee).toBe(150);
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-doctor users', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'user123', role: 'USER' },
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should return 404 when doctor not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Doctor not found');
    });

    it('should return default values for missing fields', async () => {
      const minimalDoctor = {
        _id: 'doctor123',
        email: 'john@hospital.com',
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(minimalDoctor),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.name).toBe('');
      expect(data.data.phone).toBe('');
      expect(data.data.specialization).toBe('');
      expect(data.data.consultationFee).toBe(0);
      expect(data.data.availableHours).toEqual({
        start: '09:00',
        end: '17:00',
      });
      expect(data.data.workingDays).toEqual([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
      ]);
    });

    it('should handle database connection errors', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle database query errors', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Query failed')),
        }),
      });
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should select only specific fields', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockDoctor),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      await GET(req);

      expect(User.findById).toHaveBeenCalledWith('doctor123');
      expect(User.findById().select).toHaveBeenCalledWith(
        'name email phone specialization licenseNumber hospital bio consultationFee availableHours workingDays'
      );
    });

    it('should return all working days when provided', async () => {
      const doctorWithAllDays = {
        ...mockDoctor,
        workingDays: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(doctorWithAllDays),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.workingDays).toHaveLength(7);
    });

    it('should handle custom available hours', async () => {
      const doctorWithCustomHours = {
        ...mockDoctor,
        availableHours: { start: '08:00', end: '20:00' },
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(doctorWithCustomHours),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.availableHours).toEqual({
        start: '08:00',
        end: '20:00',
      });
    });
  });

  describe('PUT /api/doctor/settings', () => {
    const mockSession = {
      user: { id: 'doctor123', role: 'DOCTOR' },
    };

    const validUpdateData = {
      name: 'Dr. Jane Doe',
      phone: '+9876543210',
      specialization: 'Neurology',
      licenseNumber: 'LIC789012',
      hospital: 'Medical Center',
      bio: 'Neurologist with expertise in brain disorders',
      consultationFee: 200,
      availableHours: { start: '10:00', end: '18:00' },
      workingDays: ['monday', 'wednesday', 'friday'],
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should update doctor settings successfully', async () => {
      const updatedDoctor = {
        _id: 'doctor123',
        email: 'jane@hospital.com',
        ...validUpdateData,
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedDoctor),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Settings updated successfully');
      expect(data.data.name).toBe('Dr. Jane Doe');
      expect(data.data.specialization).toBe('Neurology');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-doctor users', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'user123', role: 'USER' },
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should return 404 when doctor not found', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Doctor not found');
    });

    it('should call findByIdAndUpdate with correct parameters', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'doctor123' }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      await PUT(req);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'doctor123',
        expect.objectContaining({
          name: 'Dr. Jane Doe',
          phone: '+9876543210',
          specialization: 'Neurology',
        }),
        { new: true, runValidators: true }
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(validationError),
      });
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBe('Validation failed');
      consoleErrorSpy.mockRestore();
    });

    it('should handle database connection errors', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should update partial fields', async () => {
      const partialUpdate = {
        name: 'Dr. Updated Name',
        consultationFee: 250,
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue({ _id: 'doctor123', ...partialUpdate }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update available hours correctly', async () => {
      const updateWithHours = {
        ...validUpdateData,
        availableHours: { start: '06:00', end: '22:00' },
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue({ _id: 'doctor123', ...updateWithHours }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(updateWithHours),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.availableHours).toEqual({
        start: '06:00',
        end: '22:00',
      });
    });

    it('should update working days array', async () => {
      const updateWithDays = {
        ...validUpdateData,
        workingDays: ['tuesday', 'thursday', 'saturday'],
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue({ _id: 'doctor123', ...updateWithDays }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(updateWithDays),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.workingDays).toEqual([
        'tuesday',
        'thursday',
        'saturday',
      ]);
    });

    it('should handle empty body gracefully', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'doctor123' }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should select only specific fields in response', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'doctor123' }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      await PUT(req);

      expect(User.findByIdAndUpdate().select).toHaveBeenCalledWith(
        'name email phone specialization licenseNumber hospital bio consultationFee availableHours workingDays'
      );
    });

    it('should handle general database errors', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should update consultation fee to zero', async () => {
      const updateWithZeroFee = {
        ...validUpdateData,
        consultationFee: 0,
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue({ _id: 'doctor123', ...updateWithZeroFee }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(updateWithZeroFee),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.consultationFee).toBe(0);
    });

    it('should handle undefined values in update', async () => {
      const updateWithUndefined = {
        name: 'Dr. Test',
        phone: undefined,
        specialization: undefined,
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue({ _id: 'doctor123', name: 'Dr. Test' }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(updateWithUndefined),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update long bio text', async () => {
      const longBio = 'A'.repeat(1000);
      const updateWithLongBio = {
        ...validUpdateData,
        bio: longBio,
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'doctor123', bio: longBio }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(updateWithLongBio),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.bio).toBe(longBio);
    });

    it('should handle JSON parse errors gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: 'invalid json',
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    const mockSession = {
      user: { id: 'doctor123', role: 'DOCTOR' },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should handle session without user object', async () => {
      getServerSession.mockResolvedValue({ user: null });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle session with missing role', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'doctor123' },
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Forbidden - Doctor access required');
    });

    it('should handle very large consultation fee', async () => {
      const updateWithLargeFee = {
        consultationFee: 999999,
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'doctor123',
          consultationFee: 999999,
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(updateWithLargeFee),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.consultationFee).toBe(999999);
    });

    it('should handle empty working days array', async () => {
      const updateWithNoWorkingDays = {
        workingDays: [],
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'doctor123',
          workingDays: [],
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/doctor/settings', {
        method: 'PUT',
        body: JSON.stringify(updateWithNoWorkingDays),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.workingDays).toEqual([]);
    });
  });
});
