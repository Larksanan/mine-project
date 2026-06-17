/**
 * @jest-environment node
 */
import { GET } from '../route';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('next-auth');
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
      ...init,
    })),
  },
  NextRequest: jest.fn().mockImplementation(url => ({
    url,
    nextUrl: new URL(url),
  })),
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    models: {
      Appointment: {
        find: jest.fn(),
        countDocuments: jest.fn(),
      },
      User: {
        findById: jest.fn(),
      },
      Doctor: {
        findOne: jest.fn(),
      },
      Patient: {},
    },
    Types: {
      ObjectId: jest.fn().mockImplementation(id => ({
        toString: () => id,
        equals: (other: any) => id === other.toString(),
      })),
    },
  };
});

// Mock require calls for models
jest.mock('@/models/Appointment', () => ({
  default: { find: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock('@/models/User', () => ({ default: { findById: jest.fn() } }));
jest.mock('@/models/Doctor', () => ({ default: { findOne: jest.fn() } }));
jest.mock('@/models/Patient', () => ({ default: {} }));

describe('GET /api/appointments', () => {
  const mockSession = {
    user: { id: 'user123', email: 'test@example.com' },
  };

  const mockAppointmentModel = (mongoose.models as any).Appointment;
  const mockUserModel = (mongoose.models as any).User;
  const mockDoctorModel = (mongoose.models as any).Doctor;

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  // Helper to create chainable mongoose mocks
  const createChainableMock = (resolvedValue: any) => {
    const exec = jest.fn().mockResolvedValue(resolvedValue);
    const lean = jest.fn().mockReturnValue({ exec });
    const limit = jest.fn().mockReturnValue({ lean });
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });

    const chain: any = {
      sort,
      populate: jest.fn().mockReturnThis(),
    };

    return chain;
  };

  it('should return 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 404 if user not found', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('should return 403 for unauthorized roles', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ role: 'PATIENT' }),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('should fetch all appointments for ADMIN', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
      }),
    });

    const mockAppointments = [
      {
        _id: 'apt1',
        appointmentDate: new Date(),
        patient: { firstName: 'John', lastName: 'Doe' },
        doctor: { user: { name: 'Dr. Smith' } },
      },
    ];

    const chain = createChainableMock(mockAppointments);
    mockAppointmentModel.find.mockReturnValue(chain);
    mockAppointmentModel.countDocuments.mockResolvedValue(1);

    const req = new NextRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.appointments).toHaveLength(1);
    // Verify query was empty/default for admin
    expect(mockAppointmentModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true })
    );
  });

  it('should fetch doctor specific appointments for DOCTOR', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ role: 'DOCTOR' }),
      }),
    });

    mockDoctorModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'doc123' }),
    });

    const mockAppointments: any[] = [];
    const chain = createChainableMock(mockAppointments);
    mockAppointmentModel.find.mockReturnValue(chain);
    mockAppointmentModel.countDocuments.mockResolvedValue(0);

    const req = new NextRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);

    expect(res.status).toBe(200);
    // Verify query contained doctor ID
    expect(mockAppointmentModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [{ doctor: 'doc123' }, { pharmacist: expect.anything() }],
      })
    );
  });

  it('should return 404 if doctor profile not found for DOCTOR role', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ role: 'DOCTOR' }),
      }),
    });

    mockDoctorModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = new NextRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it('should apply filters correctly', async () => {
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
      }),
    });

    const chain = createChainableMock([]);
    mockAppointmentModel.find.mockReturnValue(chain);
    mockAppointmentModel.countDocuments.mockResolvedValue(0);

    const url =
      'http://localhost:3000/api/appointments?status=scheduled&type=consultation&date=2024-01-01';
    const req = new NextRequest(url);
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockAppointmentModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'SCHEDULED',
        type: 'CONSULTATION',
        appointmentDate: expect.any(Object),
      })
    );
  });

  it('should handle errors gracefully', async () => {
    mockUserModel.findById.mockImplementation(() => {
      throw new Error('Database error');
    });

    const req = new NextRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
