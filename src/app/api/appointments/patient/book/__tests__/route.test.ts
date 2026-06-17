import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock NextRequest/NextResponse
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: URL;
      json: () => Promise<any>;
      constructor(url: string, init?: any) {
        this.url = new URL(url);
        this.json = jest.fn().mockResolvedValue(init?.body);
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

// Mock Mongoose
jest.mock('mongoose', () => ({
  models: {},
  Types: {
    ObjectId: class {
      constructor(private id: string) {}
      toString() {
        return this.id;
      }
    },
  },
}));

// Mock Models
jest.mock('@/models/Appointment', () => {
  const mockSave = jest.fn();
  const mockChain: any = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockModel = jest.fn().mockImplementation(data => ({
    ...data,
    _id: 'new_appt_id',
    save: mockSave,
  }));
  (mockModel as any).findOne = jest.fn();
  (mockModel as any).find = jest.fn(() => mockChain);
  (mockModel as any).findById = jest.fn(() => mockChain);
  (mockModel as any).countDocuments = jest.fn();
  (mockModel as any).mockSave = mockSave;
  (mockModel as any).mockChain = mockChain;
  return {
    __esModule: true,
    default: mockModel,
  };
});

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/models/Doctor', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

// Import mocked models to control behavior in tests
import Appointment from '@/models/Appointment';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';

describe('/api/appointments/patient/book', () => {
  let mockAppointmentSave: any;
  let mockAppointmentChain: any;

  const mockSession = {
    user: { id: 'user123', email: 'test@test.com' },
  };

  const validBody = {
    doctorId: 'doctor123',
    appointmentDate: '2030-01-01',
    appointmentTime: '10:00',
    reason: 'Checkup',
    type: 'CONSULTATION',
  };

  beforeEach(() => {
    mockAppointmentSave = (Appointment as any).mockSave;
    mockAppointmentChain = (Appointment as any).mockChain;

    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    // Default successful mocks
    (Patient.findOne as jest.Mock).mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({ _id: 'patient123', firstName: 'John' }),
    });
    (Doctor.findById as jest.Mock).mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({ _id: 'doctor123', user: { name: 'Dr. Smith' } }),
    });
    (Appointment.findOne as jest.Mock).mockResolvedValue(null); // No conflict
    mockAppointmentSave.mockResolvedValue(undefined);

    // Setup chain for findById (used in POST response formatting)
    mockAppointmentChain.exec.mockResolvedValue({
      _id: 'new_appt_id',
      patient: { _id: 'patient123', firstName: 'John' },
      doctor: { _id: 'doctor123', user: { name: 'Dr. Smith' } },
      appointmentDate: new Date('2030-01-01'),
      status: 'SCHEDULED',
    });
  });

  describe('POST', () => {
    it('should return 401 if unauthorized', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api', { method: 'POST' });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 if required fields are missing', async () => {
      const req = new NextRequest('http://localhost/api', {
        body: { ...validBody, doctorId: undefined },
      } as any);
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 404 if patient profile not found', async () => {
      (Patient.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      const req = new NextRequest('http://localhost/api', {
        body: validBody,
      } as any);
      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    it('should return 404 if doctor not found', async () => {
      (Doctor.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      const req = new NextRequest('http://localhost/api', {
        body: validBody,
      } as any);
      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    it('should return 400 if date is invalid', async () => {
      const req = new NextRequest('http://localhost/api', {
        body: { ...validBody, appointmentDate: 'invalid-date' },
      } as any);
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 400 if date is in the past', async () => {
      const req = new NextRequest('http://localhost/api', {
        body: { ...validBody, appointmentDate: '2000-01-01' },
      } as any);
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 409 if time slot is booked', async () => {
      (Appointment.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });
      const req = new NextRequest('http://localhost/api', {
        body: validBody,
      } as any);
      const res = await POST(req);
      expect(res.status).toBe(409);
    });

    it('should return 400 if appointment type is invalid', async () => {
      const req = new NextRequest('http://localhost/api', {
        body: { ...validBody, type: 'INVALID_TYPE' },
      } as any);
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should create appointment successfully', async () => {
      const req = new NextRequest('http://localhost/api', {
        body: validBody,
      } as any);
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockAppointmentSave).toHaveBeenCalled();
      const json = await (res as any).json();
      expect(json.success).toBe(true);
    });
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api', { method: 'GET' });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should return 404 if patient profile not found', async () => {
      (Patient.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      const req = new NextRequest('http://localhost/api', { method: 'GET' });
      const res = await GET(req);
      expect(res.status).toBe(404);
    });

    it('should return appointments successfully', async () => {
      const mockAppointments = [
        {
          _id: 'appt1',
          doctor: {
            _id: 'doc1',
            user: { name: 'Dr. A', email: 'a@test.com', phone: '123' },
            profile: { specialization: 'Gen', department: 'Dept' },
          },
          appointmentDate: new Date('2030-01-01'),
          status: 'SCHEDULED',
        },
      ];

      mockAppointmentChain.exec.mockResolvedValue(mockAppointments);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest('http://localhost/api?page=1&limit=10', {
        method: 'GET',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await (res as any).json();
      expect(json.success).toBe(true);
      expect(json.data.appointments).toHaveLength(1);
      expect(json.data.pagination.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockAppointmentChain.exec.mockResolvedValue([]);
      (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest('http://localhost/api?status=scheduled', {
        method: 'GET',
      });
      await GET(req);

      expect(Appointment.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SCHEDULED',
        })
      );
    });
  });
});
