import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import User from '@/models/User';
import Pharmacist from '@/models/Pharmacy';

process.env.NEXTAUTH_SECRET = 'K0AtTUHVYS8e59hGvoKJqMwi3STugCr6gz23v1driGE=';
process.env.TEST_DATABASE_URL = 'mongodb://localhost:27017/mini-projet_test';

// Mock data
const mockUserId = 'doctor123';
const mockDoctorId = 'doc456';

const mockAppointments = [
  {
    _id: 'apt1',
    patient: {
      _id: 'patient1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      nic: '123456789V',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'MALE',
      address: '123 Main St',
    },
    doctor: {
      _id: 'doc456',
      user: {
        name: 'Dr. Smith',
        email: 'drsmith@example.com',
        phone: '9876543210',
      },
      profile: {
        specialization: 'CARDIOLOGY',
        department: 'Cardiology',
      },
    },
    appointmentDate: new Date('2024-12-25'),
    appointmentTime: '10:00',
    duration: 30,
    type: 'CONSULTATION',
    status: 'SCHEDULED',
    reason: 'Regular checkup',
    symptoms: 'None',
    diagnosis: '',
    prescription: '',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock functions
const mockPopulate = jest.fn();
const mockSort = jest.fn();
const mockSkip = jest.fn();
const mockLimit = jest.fn();
const mockLean = jest.fn();
const mockExec = jest.fn();

// Mock chain for find queries
const mockFindChain = {
  populate: mockPopulate.mockReturnThis(),
  sort: mockSort.mockReturnThis(),
  skip: mockSkip.mockReturnThis(),
  limit: mockLimit.mockReturnThis(),
  lean: mockLean.mockReturnThis(),
  exec: mockExec,
  then: (resolve: any, reject: any) => mockExec().then(resolve, reject),
};

// Mock chain for findOne queries
const mockFindOneChain = {
  lean: jest.fn().mockResolvedValue({ doctor: mockDoctorId }),
};

// Mock next-auth
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: 'doctor123', email: 'doctor@example.com' },
  }),
}));

// Mock MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock models - needs to be before imports
jest.mock('@/models/Appointment', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Doctor', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Pharmacy', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    nextUrl: URL;
    constructor(url: string) {
      this.url = url;
      this.nextUrl = new URL(url);
    }
  },
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();

  // Setup default mocks
  (Appointment.find as jest.Mock).mockReturnValue(mockFindChain);
  (Appointment.findOne as jest.Mock).mockReturnValue(mockFindOneChain);
  (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
  (Doctor.findOne as jest.Mock).mockReturnValue(mockFindOneChain);
  (Patient.findOne as jest.Mock).mockReturnValue(mockFindOneChain);
  (User.findOne as jest.Mock).mockResolvedValue({
    _id: mockUserId,
    role: 'DOCTOR',
  });
  (Pharmacist.findOne as jest.Mock).mockReturnValue(mockFindOneChain);

  mockExec.mockResolvedValue([]);
  mockFindOneChain.lean.mockResolvedValue({ doctor: mockDoctorId });
});

const mockRequest = (url: string) => new NextRequest(url);

describe('GET /api/appointments', () => {
  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const req = mockRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should fetch appointments successfully', async () => {
    mockExec.mockResolvedValue(mockAppointments);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(1);

    const req = mockRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.appointments).toHaveLength(1);
    expect(data.data.appointments[0].patient.firstName).toBe('John');
    expect(data.data.appointments[0].doctor.name).toBe('Dr. Smith');
  });

  it('should filter by status', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest(
      'http://localhost:3000/api/appointments?status=SCHEDULED'
    );
    await GET(req);

    expect(Appointment.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'SCHEDULED',
      })
    );
  });

  it('should filter by type', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest(
      'http://localhost:3000/api/appointments?type=CONSULTATION'
    );
    await GET(req);

    expect(Appointment.find).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CONSULTATION',
      })
    );
  });

  it('should filter by date', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest(
      'http://localhost:3000/api/appointments?date=2024-12-25'
    );
    await GET(req);

    expect(Appointment.find).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentDate: expect.objectContaining({
          $gte: expect.any(Date),
          $lt: expect.any(Date),
        }),
      })
    );
  });

  it('should apply pagination with default limit', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest('http://localhost:3000/api/appointments');
    await GET(req);

    expect(mockLimit).toHaveBeenCalledWith(100);
    expect(mockSkip).toHaveBeenCalledWith(0);
  });

  it('should apply custom pagination', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest(
      'http://localhost:3000/api/appointments?page=2&limit=20'
    );
    await GET(req);

    expect(mockLimit).toHaveBeenCalledWith(20);
    expect(mockSkip).toHaveBeenCalledWith(20); // (page-1) * limit
  });

  it('should query by doctor field when user is a doctor', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: mockUserId,
      role: 'DOCTOR',
    });
    mockFindOneChain.lean.mockResolvedValue({ doctor: mockDoctorId });
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest('http://localhost:3000/api/appointments');
    await GET(req);

    expect(Appointment.find).toHaveBeenCalledWith(
      expect.objectContaining({
        doctor: mockUserId,
        isActive: true,
      })
    );
  });

  it('should query by pharmacist field when user is a pharmacist', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: mockUserId,
      role: 'PHARMACIST',
    });
    mockFindOneChain.lean.mockResolvedValue({ pharmacist: 'pharm123' });
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest('http://localhost:3000/api/appointments');
    await GET(req);

    expect(Appointment.find).toHaveBeenCalledWith(
      expect.objectContaining({
        pharmacist: mockUserId,
        isActive: true,
      })
    );
  });

  it('should populate patient data', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest('http://localhost:3000/api/appointments');
    await GET(req);

    expect(mockPopulate).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'patient',
        model: 'Patient',
      })
    );
  });

  it('should populate doctor data with nested user', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest('http://localhost:3000/api/appointments');
    await GET(req);

    expect(mockPopulate).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'doctor',
        model: 'Doctor',
        populate: expect.objectContaining({
          path: 'user',
          model: 'User',
        }),
      })
    );
  });

  it('should sort by appointment date and time descending', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest('http://localhost:3000/api/appointments');
    await GET(req);

    expect(mockSort).toHaveBeenCalledWith({
      appointmentDate: -1,
      appointmentTime: -1,
    });
  });

  it('should return pagination metadata', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(45);

    const req = mockRequest(
      'http://localhost:3000/api/appointments?page=2&limit=20'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(data.data.pagination).toEqual({
      total: 45,
      page: 2,
      limit: 20,
      pages: 3,
    });
  });

  it('should format appointment data correctly', async () => {
    mockExec.mockResolvedValue(mockAppointments);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(1);

    const req = mockRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    const data = await res.json();

    const appointment = data.data.appointments[0];

    expect(appointment).toHaveProperty('_id');
    expect(appointment).toHaveProperty('id');
    expect(appointment).toHaveProperty('patient');
    expect(appointment).toHaveProperty('doctor');
    expect(appointment.appointmentDate).toBe('2024-12-25');
    expect(appointment.appointmentTime).toBe('10:00');
    expect(appointment.duration).toBe(30);
    expect(appointment.type).toBe('CONSULTATION');
    expect(appointment.status).toBe('SCHEDULED');
  });

  it('should handle null patient data', async () => {
    const appointmentWithoutPatient = [
      {
        ...mockAppointments[0],
        patient: null,
      },
    ];

    mockExec.mockResolvedValue(appointmentWithoutPatient);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(1);

    const req = mockRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    const data = await res.json();

    expect(data.data.appointments[0].patient).toBeNull();
  });

  it('should handle unpopulated doctor (string ID)', async () => {
    const appointmentWithDoctorId = [
      {
        ...mockAppointments[0],
        doctor: 'doctorId123',
      },
    ];

    mockExec.mockResolvedValue(appointmentWithDoctorId);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(1);

    const req = mockRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    const data = await res.json();

    expect(data.data.appointments[0].doctor).toEqual({
      _id: 'doctorId123',
      id: 'doctorId123',
      name: 'Unknown',
      email: '',
      phone: '',
      specialization: '',
      department: '',
    });
  });

  it('should not filter by status when status is "all"', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest(
      'http://localhost:3000/api/appointments?status=all'
    );
    await GET(req);

    const query = (Appointment.find as jest.Mock).mock.calls[0][0];
    expect(query).not.toHaveProperty('status');
  });

  it('should not filter by type when type is "all"', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest('http://localhost:3000/api/appointments?type=all');
    await GET(req);

    const query = (Appointment.find as jest.Mock).mock.calls[0][0];
    expect(query).not.toHaveProperty('type');
  });

  it('should handle database errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockExec.mockRejectedValue(new Error('Database error'));

    const req = mockRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should handle invalid date format gracefully', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest(
      'http://localhost:3000/api/appointments?date=invalid-date'
    );
    const res = await GET(req);
    const data = await res.json();

    // Should still succeed, just ignore invalid date
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should always include isActive: true in query', async () => {
    mockExec.mockResolvedValue([]);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);

    const req = mockRequest('http://localhost:3000/api/appointments');
    await GET(req);

    expect(Appointment.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
      })
    );
  });

  it('should handle appointments with missing optional fields', async () => {
    const minimalAppointment = [
      {
        _id: 'apt2',
        patient: null,
        doctor: null,
        appointmentDate: null,
        appointmentTime: null,
        duration: null,
        type: null,
        status: null,
        reason: null,
        symptoms: null,
        diagnosis: null,
        prescription: null,
        notes: null,
        createdAt: null,
        updatedAt: null,
      },
    ];

    mockExec.mockResolvedValue(minimalAppointment);
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(1);

    const req = mockRequest('http://localhost:3000/api/appointments');
    const res = await GET(req);
    const data = await res.json();

    const appointment = data.data.appointments[0];
    expect(appointment.appointmentDate).toBe('');
    expect(appointment.appointmentTime).toBe('');
    expect(appointment.duration).toBe(30);
    expect(appointment.type).toBe('');
    expect(appointment.status).toBe('SCHEDULED');
  });
});
