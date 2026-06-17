import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn((data, init) => ({
        json: async () => data,
        status: init?.status || 200,
      })),
    },
  };
});

jest.mock('mongoose', () => ({
  models: {},
}));

// Mock Models
jest.mock('@/models/Appointment', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Doctor', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

describe('/api/appointments/stats', () => {
  const mockLean = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (connectDB as jest.Mock).mockResolvedValue(undefined);

    // Setup default chainable behavior for findOne
    (Doctor.findOne as jest.Mock).mockReturnValue({ lean: mockLean });
    (Patient.findOne as jest.Mock).mockReturnValue({ lean: mockLean });
  });

  it('should return 401 if unauthorized', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  describe('Doctor Role', () => {
    const session = {
      user: { id: 'doc1', role: 'DOCTOR', email: 'doc@test.com' },
    };

    it('should return 404 if doctor profile not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(session);
      mockLean.mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(404);
      const json = await (res as any).json();
      expect(json.message).toContain('Doctor profile not found');
    });

    it('should return stats if doctor profile exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(session);
      mockLean.mockResolvedValue({ _id: 'doctorProfileId' });
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(5);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await (res as any).json();
      expect(json.success).toBe(true);
      expect(json.data.total).toBe(5);
      expect(Doctor.findOne).toHaveBeenCalledWith({ user: 'doc1' });
      expect(Appointment.countDocuments).toHaveBeenCalledTimes(6); // 5 statuses + today
    });
  });

  describe('Patient Role', () => {
    const session = {
      user: { id: 'pat1', role: 'PATIENT', email: 'pat@test.com' },
    };

    it('should return empty stats (200) if patient profile not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(session);
      mockLean.mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await (res as any).json();
      expect(json.success).toBe(true);
      expect(json.needsPatientProfile).toBe(true);
      expect(json.data.total).toBe(0);
    });

    it('should return stats if patient profile exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(session);
      mockLean.mockResolvedValue({ _id: 'patientProfileId' });
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(3);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await (res as any).json();
      expect(json.success).toBe(true);
      expect(json.data.total).toBe(3);
      expect(Patient.findOne).toHaveBeenCalled();
    });
  });

  describe('Admin/Receptionist Role', () => {
    it('should return global stats for ADMIN', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      });
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(10);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await (res as any).json();
      expect(json.success).toBe(true);
      expect(json.data.total).toBe(10);
      expect(Doctor.findOne).not.toHaveBeenCalled();
    });

    it('should return global stats for RECEPTIONIST', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'rec1', role: 'RECEPTIONIST' },
      });
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(8);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await (res as any).json();
      expect(json.success).toBe(true);
      expect(json.data.total).toBe(8);
    });
  });

  it('should return 403 for invalid role', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user1', role: 'UNKNOWN_ROLE' },
    });

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('should handle errors gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin1', role: 'ADMIN' },
    });
    (Appointment.countDocuments as jest.Mock).mockRejectedValue(
      new Error('DB Error')
    );

    const res = await GET();
    expect(res.status).toBe(500);
    const json = await (res as any).json();
    expect(json.message).toBe('DB Error');
  });
});
