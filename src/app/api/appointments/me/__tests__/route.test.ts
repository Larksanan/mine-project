import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Patient from '@/models/Patient';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('next/server', () => {
  return {
    NextRequest: class extends Request {
      // eslint-disable-next-line no-undef
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(input, init);
      }
    },
    NextResponse: {
      json: jest.fn((data, init) => ({
        json: async () => data,
        status: init?.status || 200,
      })),
    },
  };
});

// Define mocks inside factories to avoid hoisting issues
jest.mock('@/models/Appointment', () => {
  const mockChain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      find: jest.fn(() => mockChain),
    },
  };
});

jest.mock('@/models/Patient', () => {
  const mockLean = jest.fn();
  return {
    __esModule: true,
    default: {
      findOne: jest.fn(() => ({ lean: mockLean })),
    },
  };
});

jest.mock('mongoose', () => ({
  models: {},
  Schema: class {},
  model: jest.fn(),
}));

describe('GET /api/appointments/me', () => {
  // Access the mocks from the imported modules
  const mockFind = Appointment.find as jest.Mock;
  const mockChain = Appointment.find() as any;
  const mockFindOne = Patient.findOne as jest.Mock;
  let mockLean: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    mockChain.exec.mockResolvedValue([]);
    mockLean = (Patient.findOne() as any).lean;
  });

  it('should return 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/appointments/me');
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  });

  it('should return 404 if patient profile is not found for PATIENT role', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123', role: 'PATIENT', email: 'test@example.com' },
    });

    // Mock Patient.findOne to return null for both lookups (by ID and email)
    mockLean.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/appointments/me');
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Patient profile not found'),
        needsPatientProfile: true,
      }),
      { status: 404 }
    );
  });

  it('should fetch appointments for PATIENT role', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123', role: 'PATIENT', email: 'test@example.com' },
    });

    const mockPatient = { _id: 'patient123' };
    mockLean.mockResolvedValue(mockPatient);

    const mockAppointments = [
      {
        _id: 'apt1',
        patient: {
          _id: 'patient123',
          firstName: 'jebarsan',
          lastName: 'thatcroos',
        },
        doctor: {
          _id: 'doc1',
          name: 'Dr. jebarsanthatcroos',
          email: 'jebarsanthatcroos@gmail.com',
        },
        appointmentDate: new Date('2026-01-01'),
        appointmentTime: '10:00',
        status: 'SCHEDULED',
      },
    ];
    mockChain.exec.mockResolvedValue(mockAppointments);

    const req = new NextRequest('http://localhost:3000/api/appointments/me');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockFindOne).toHaveBeenCalled(); // Checks patient lookup
    expect(mockFind).toHaveBeenCalledWith({
      patient: 'patient123',
      isActive: true,
    });
    expect(mockChain.populate).toHaveBeenCalledTimes(2); // Patient and Doctor populated

    const json = await (res as any).json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].doctor.name).toBe('Dr. jebarsanthatcroos');
  });

  it('should fetch appointments for DOCTOR role', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'jebarsanthatcroos123',
        role: 'DOCTOR',
        email: 'jebarsanthatcroos@gmail.com',
      },
    });

    const req = new NextRequest('http://localhost:3000/api/appointments/me');
    await GET(req);

    expect(mockFind).toHaveBeenCalledWith({
      doctor: 'jebarsanthatcroos123',
      isActive: true,
    });
    // Doctor path populates only patient
    expect(mockChain.populate).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'patient' })
    );
  });

  it('should fetch all active appointments for ADMIN role', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'jebrsanthatcros123',
        role: 'ADMIN',
        email: 'jebarsanthatcroos@gmail.com',
      },
    });

    const req = new NextRequest('http://localhost:3000/api/appointments/me');
    await GET(req);

    expect(mockFind).toHaveBeenCalledWith({ isActive: true });
  });

  it('should fetch all active appointments for STAFF role', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'jebarsanthatcroos',
        role: 'STAFF',
        email: 'jebarsanthatcroos@gmail.com',
      },
    });

    const req = new NextRequest('http://localhost:3000/api/appointments/me');
    await GET(req);

    expect(mockFind).toHaveBeenCalledWith({ isActive: true });
  });

  it('should return 403 for invalid user role', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'jebarsanthatcroos', role: 'UNKNOWN_ROLE' },
    });

    const req = new NextRequest('http://localhost:3000/api/appointments/me');
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, message: 'Invalid user role' },
      { status: 403 }
    );
  });

  it('should handle database errors gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'jebarsanthatcroos', role: 'ADMIN' },
    });

    mockChain.exec.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest('http://localhost:3000/api/appointments/me');
    const res = await GET(req);

    expect(res.status).toBe(500);
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Database connection failed',
      }),
      { status: 500 }
    );
  });
});
