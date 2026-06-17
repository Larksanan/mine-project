/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import Appointment from '@/models/Appointment';

jest.mock('next-auth');
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));
jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

jest.mock('@/models/User');
jest.mock('@/models/Doctor');
jest.mock('@/models/Appointment');

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((body, init) => ({
        json: async () => body,
        status: init?.status || 200,
        ...init,
      })),
    },
  };
});

describe('Admin Doctor Stats API', () => {
  const mockContext = { params: Promise.resolve({ id: 'doc123' }) };
  const mockSession = { user: { id: 'user123', email: 'test@example.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123/stats'
      );
      const response = await GET(req, mockContext);
      expect(response.status).toBe(401);
    });

    it('should return 404 if doctor not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockDoctorChain = {
        populate: jest.fn().mockResolvedValue(null),
      };
      (Doctor.findById as jest.Mock).mockReturnValue(mockDoctorChain);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123/stats'
      );
      const response = await GET(req, mockContext);
      expect(response.status).toBe(404);
    });

    it('should return 403 if user is not admin or owner', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockDoctor = {
        _id: 'doc123',
        user: { _id: 'otherUser' },
      };
      const mockDoctorChain = {
        populate: jest.fn().mockResolvedValue(mockDoctor),
      };
      (Doctor.findById as jest.Mock).mockReturnValue(mockDoctorChain);

      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        role: 'USER',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123/stats'
      );
      const response = await GET(req, mockContext);
      expect(response.status).toBe(403);
    });

    it('should return stats successfully for admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockDoctor = {
        _id: 'doc123',
        user: { _id: 'docUser123' },
        profile: {
          specialization: 'Cardiology',
          consultationFee: 100,
          experience: 10,
          isVerified: true,
          licenseExpiry: new Date(Date.now() + 10000000),
          availability: {
            days: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ],
          },
          rating: { average: 4.5, count: 10 },
        },
      };
      const mockDoctorChain = {
        populate: jest.fn().mockResolvedValue(mockDoctor),
      };
      (Doctor.findById as jest.Mock).mockReturnValue(mockDoctorChain);

      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        role: 'ADMIN',
      });

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
        then: (resolve: Function) => resolve([1, 2, 3]),
      };
      (Appointment.find as jest.Mock).mockReturnValue(mockQuery);

      (Appointment.countDocuments as jest.Mock).mockResolvedValue(5);
      (Appointment.distinct as jest.Mock).mockResolvedValue(['p1', 'p2']);
      (Appointment.aggregate as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123/stats'
      );
      const response = await GET(req, mockContext);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.overview.totalAppointments).toBe(3);
      expect(body.data.overview.totalPatients).toBe(2);
      expect(body.data.profile.specialization).toBe('Cardiology');
    });

    it('should return stats successfully for doctor owner', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockDoctor = {
        _id: 'doc123',
        user: { _id: 'user123' },
        profile: {
          specialization: 'Cardiology',
          consultationFee: 100,
          experience: 10,
          isVerified: true,
          licenseExpiry: new Date(),
          availability: { days: [] },
          rating: { average: 4.5, count: 10 },
        },
      };
      const mockDoctorChain = {
        populate: jest.fn().mockResolvedValue(mockDoctor),
      };
      (Doctor.findById as jest.Mock).mockReturnValue(mockDoctorChain);

      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        role: 'DOCTOR',
      });

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
        then: (resolve: Function) => resolve([]),
      };
      (Appointment.find as jest.Mock).mockReturnValue(mockQuery);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
      (Appointment.distinct as jest.Mock).mockResolvedValue([]);
      (Appointment.aggregate as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123/stats'
      );
      const response = await GET(req, mockContext);
      const body = await response.json();

      expect(body.success).toBe(true);
    });
  });
});
