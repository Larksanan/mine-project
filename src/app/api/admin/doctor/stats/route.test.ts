/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * @jest-environment node
 */
import { GET } from './route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import Appointment from '@/models/Appointment';

// Mock dependencies
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

// Mock NextResponse
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
  const mockSession = { user: { id: 'user123', email: 'test@example.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/stats'
      );
      const response = await GET(req);
      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        role: 'USER',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/stats'
      );
      const response = await GET(req);
      expect(response.status).toBe(403);
    });

    it('should return stats successfully for admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      // Mock User.findById for auth check and for busiest doctors loop
      (User.findById as jest.Mock).mockImplementation(id => {
        const userObj = {
          _id: id,
          role: id === 'user123' ? 'ADMIN' : 'USER',
          name: 'User',
          email: 'u@e.com',
        };
        return {
          select: jest.fn().mockResolvedValue(userObj),
          then: (resolve: Function) => resolve(userObj),
        };
      });

      // Mock Doctor counts
      (Doctor.countDocuments as jest.Mock).mockResolvedValue(10);

      // Mock Doctor aggregates (specialization, department, experience, fee, rating)
      (Doctor.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ _id: 'Cardiology', count: 5 }]) // specialization
        .mockResolvedValueOnce([{ _id: 'Cardiology', count: 5 }]) // department
        .mockResolvedValueOnce([{ avgExperience: 10 }]) // experience
        .mockResolvedValueOnce([{ avgFee: 500 }]) // fee
        .mockResolvedValueOnce([{ avgRating: 4.5 }]); // rating

      // Mock Doctor find (top rated and recent)
      const mockDoctor = {
        _id: 'doc1',
        user: { _id: 'u1', name: 'Dr. Test' },
        profile: {
          specialization: 'Cardiology',
          department: 'Cardiology',
          rating: { average: 4.5, count: 10 },
          experience: 10,
          consultationFee: 500,
          isVerified: true,
        },
        createdAt: new Date(),
      };

      const mockDoctorChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockDoctor]),
      };
      (Doctor.find as jest.Mock).mockReturnValue(mockDoctorChain);

      // Mock Doctor findOne for busiest doctors details
      const mockDoctorOneChain = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            profile: { specialization: 'Spec', department: 'Dept' },
          }),
        }),
      };
      (Doctor.findOne as jest.Mock).mockReturnValue(mockDoctorOneChain);

      // Mock Appointment counts
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(100);

      // Mock Appointment distinct
      (Appointment.distinct as jest.Mock).mockResolvedValue(['p1', 'p2']);

      // Mock Appointment aggregates (status, type, trend, busiest)
      (Appointment.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ _id: 'COMPLETED', count: 50 }]) // status
        .mockResolvedValueOnce([{ _id: 'CONSULTATION', count: 50 }]) // type
        .mockResolvedValueOnce([{ _id: { year: 2023, month: 1 }, count: 10 }]) // trend
        .mockResolvedValueOnce([{ _id: 'u1', appointmentCount: 20 }]); // busiest

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/stats'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.overview.totalDoctors).toBe(10);
      expect(body.data.overview.totalAppointments).toBe(100);
      expect(body.data.specializations[0].name).toBe('Cardiology');
      expect(body.data.topPerformers.busiest[0].appointmentCount).toBe(20);
    });

    it('should handle errors gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/stats'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch doctor statistics');
    });
  });
});
