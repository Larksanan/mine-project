/**
 * @jest-environment node
 */
import { GET } from '../routes';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import Appointment from '@/models/Appointment';

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
  NextRequest: jest.fn(),
}));

jest.mock('@/models/Appointment', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));

describe('GET /api/appointments/[appointmentsid]/stats', () => {
  const mockAppointmentModel = Appointment as any;
  const mockContext = {
    params: { id: 'apt_123' },
  };

  const mockSession = {
    user: { id: 'doctor_123' },
  };

  const mockAppointment = {
    _id: 'apt_123',
    doctor: 'doctor_123',
    patient: {
      _id: 'patient_123',
      firstName: 'jebarsan',
      lastName: 'thatcroos',
      email: 'jebarsathatcroosgmail.com',
      phone: '0762397951',
    },
    appointmentDate: new Date('2026-01-20'),
    appointmentTime: '10:00',
    duration: 30,
    type: 'CONSULTATION',
    status: 'SCHEDULED',
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2025-12-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    // Setup default successful mocks
    mockAppointmentModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAppointment),
      }),
    });

    // Default counts
    mockAppointmentModel.countDocuments.mockResolvedValue(0);

    // Default history
    mockAppointmentModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
  });

  it('should return 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    mockAppointmentModel.findById.mockReset();
    const req = {} as any;
    const res = await GET(req, mockContext);
    expect(res.status).toBe(401);
  });

  it('should return 404 if appointment not found', async () => {
    mockAppointmentModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = {} as any;
    const res = await GET(req, mockContext);
    expect(res.status).toBe(404);
  });

  it('should return 403 if doctor is unauthorized', async () => {
    const unauthorizedAppointment = {
      ...mockAppointment,
      doctor: 'other_doctor',
    };
    mockAppointmentModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(unauthorizedAppointment),
      }),
    });

    const req = {} as any;
    const res = await GET(req, mockContext);
    expect(res.status).toBe(403);
  });

  it('should return stats successfully', async () => {
    // Mock specific counts for calculations
    // Order of calls in Promise.all array:
    // 1. Total
    // 2. Completed
    // 3. Cancelled
    // 4. Upcoming
    // 5. History (find - not countDocuments)
    // 6. NoShows

    mockAppointmentModel.countDocuments
      .mockResolvedValueOnce(10) // Total
      .mockResolvedValueOnce(5) // Completed
      .mockResolvedValueOnce(2) // Cancelled
      .mockResolvedValueOnce(3) // Upcoming
      .mockResolvedValueOnce(1); // NoShows (called after find in the array order)

    const mockHistory = [
      {
        _id: 'hist_1',
        appointmentDate: new Date('2026-01-20'),
        appointmentTime: '09:00',
        status: 'COMPLETED',
        type: 'FOLLOW_UP',
        reason: 'Checkup',
      },
    ];

    mockAppointmentModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockHistory),
          }),
        }),
      }),
    });

    const req = {} as any;
    const res = await GET(req, mockContext);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.patient.totalAppointments).toBe(10);
    expect(json.data.patient.completedAppointments).toBe(5);
    expect(json.data.patient.cancelledAppointments).toBe(2);
    expect(json.data.patient.upcomingAppointments).toBe(3);
    expect(json.data.patient.noShowCount).toBe(1);
    expect(json.data.patient.history).toHaveLength(1);
    expect(json.data.patient.history[0].id).toBe('hist_1');
  });

  it('should handle errors gracefully', async () => {
    mockAppointmentModel.findById.mockImplementation(() => {
      throw new Error('DB Error');
    });

    const req = {} as any;
    const res = await GET(req, mockContext);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
