/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '../route';
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
jest.mock('@/models/Appointment');

// Mock Doctor model with static methods
jest.mock('@/models/Doctor', () => {
  return {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

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

describe('Admin Doctor ID API', () => {
  const mockContext = { params: Promise.resolve({ id: 'doc123' }) };
  const mockSession = { user: { id: 'user123', email: 'test@example.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123'
      );
      const response = await GET(req, mockContext);
      expect(response.status).toBe(401);
    });

    it('should return 404 if doctor not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      (Doctor.findById as jest.Mock).mockReturnValue(mockChain);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123'
      );
      const response = await GET(req, mockContext);
      expect(response.status).toBe(404);
    });

    it('should return doctor details with stats', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockDoctor = {
        _id: 'doc123',
        user: { _id: 'user123', name: 'Dr. Test' },
        profile: { specialization: 'Cardiology' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoctor),
      };
      (Doctor.findById as jest.Mock).mockReturnValue(mockChain);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(5);
      (Appointment.distinct as jest.Mock).mockResolvedValue(['p1', 'p2']);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123'
      );
      const response = await GET(req, mockContext);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.id).toBe('doc123');
      expect(body.data.stats.totalAppointments).toBe(5);
      expect(body.data.stats.totalPatients).toBe(2);
    });
  });

  describe('PUT', () => {
    it('should return 403 if user is not admin or owner', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      // Doctor belongs to someone else
      (Doctor.findById as jest.Mock).mockResolvedValue({ user: 'otherUser' });
      // Current user is just a USER
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        role: 'USER',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123',
        {
          method: 'PUT',
          body: JSON.stringify({}),
        }
      );
      const response = await PUT(req, mockContext);
      expect(response.status).toBe(403);
    });

    it('should update doctor profile successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockDoctor = {
        _id: 'doc123',
        user: 'user123', // Matches session user
        profile: { specialization: 'Old' },
        save: jest.fn(),
        populate: jest.fn(),
      };

      (Doctor.findById as jest.Mock).mockResolvedValue(mockDoctor);
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        role: 'USER',
      });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const updateData = {
        profile: {
          specialization: 'New',
          name: 'New Name',
        },
      };

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, mockContext);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(mockDoctor.profile.specialization).toBe('New');
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockDoctor.save).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('should return 403 if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        role: 'USER',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123',
        {
          method: 'DELETE',
        }
      );
      const response = await DELETE(req, mockContext);
      expect(response.status).toBe(403);
    });

    it('should delete doctor and update user role', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user123',
        role: 'ADMIN',
      });
      (Doctor.findByIdAndDelete as jest.Mock).mockResolvedValue({
        user: 'docUser123',
      });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const req = new NextRequest(
        'http://localhost:3000/api/admin/doctor/doc123',
        {
          method: 'DELETE',
        }
      );
      const response = await DELETE(req, mockContext);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(Doctor.findByIdAndDelete).toHaveBeenCalledWith('doc123');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('docUser123', {
        role: 'USER',
      });
    });
  });
});
