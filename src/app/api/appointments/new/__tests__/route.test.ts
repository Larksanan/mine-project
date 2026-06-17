/* eslint-disable no-undef */
import { POST } from '../route';
import { NextRequest } from 'next/server';
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
    NextRequest: class extends Request {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(input, init);
      }
      json = jest.fn();
    },
    NextResponse: {
      json: jest.fn((data, init) => ({
        json: async () => data,
        status: init?.status || 200,
      })),
    },
  };
});

// Mock Mongoose Models
jest.mock('@/models/Appointment', () => {
  const mockSave = jest.fn();
  const mockPopulate = jest.fn();
  const mockFindOne = jest.fn();

  const MockAppointment = jest.fn().mockImplementation(data => {
    return {
      ...data,
      _id: 'new_appointment_id',
      save: mockSave,
      populate: mockPopulate,
      // Ensure properties accessed directly exist
      patient: data.patient,
      doctor: data.doctor,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      duration: data.duration,
      type: data.type,
      status: data.status,
      reason: data.reason,
      symptoms: data.symptoms,
      diagnosis: data.diagnosis,
      prescription: data.prescription,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
  (MockAppointment as any).findOne = mockFindOne;
  (MockAppointment as any).mockSave = mockSave;
  (MockAppointment as any).mockPopulate = mockPopulate;
  return {
    __esModule: true,
    default: MockAppointment,
  };
});

jest.mock('@/models/Doctor', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

describe('/api/appointments/new', () => {
  let mockAppointmentSave: any;
  let mockAppointmentPopulate: any;
  let mockAppointmentFindOne: any;
  let mockDoctorFindById: any;
  let mockPatientFindById: any;

  const validBody = {
    patientId: 'patient1',
    doctorId: 'doctor1',
    appointmentDate: '2030-01-01', // Future date
    appointmentTime: '10:00',
    type: 'Consultation',
    reason: 'Regular checkup',
    duration: 30,
  };

  beforeEach(() => {
    mockAppointmentSave = (Appointment as any).mockSave;
    mockAppointmentPopulate = (Appointment as any).mockPopulate;
    mockAppointmentFindOne = (Appointment as any).findOne;
    mockDoctorFindById = Doctor.findById;
    mockPatientFindById = Patient.findById;

    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user1' },
    });

    // Default successful mocks
    mockPatientFindById.mockResolvedValue({ _id: 'patient1' });
    mockDoctorFindById.mockResolvedValue({ _id: 'doctor1' });
    mockAppointmentFindOne.mockResolvedValue(null); // No conflict
    mockAppointmentSave.mockResolvedValue(undefined);

    // Mock populate to simulate data structure after population
    mockAppointmentPopulate.mockImplementation(function (this: any) {
      this.patient = {
        _id: 'patient1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'p@test.com',
      };
      this.doctor = {
        _id: 'doctor1',
        user: {
          name: 'Dr. Smith',
          email: 'd@test.com',
          phone: '1234567890',
        },
        profile: {
          specialization: 'General',
          department: 'General',
        },
      };
      return this;
    });
  });

  it('should return 401 if unauthorized', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest
      .fn()
      .mockResolvedValue({ ...validBody, patientId: undefined });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await (res as any).json();
    expect(json.message).toContain('patientId is required');
  });

  it('should return 404 if patient not found', async () => {
    mockPatientFindById.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest.fn().mockResolvedValue(validBody);

    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await (res as any).json();
    expect(json.message).toBe('Patient not found');
  });

  it('should return 404 if doctor not found', async () => {
    mockDoctorFindById.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest.fn().mockResolvedValue(validBody);

    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await (res as any).json();
    expect(json.message).toBe('Doctor not found');
  });

  it('should return 400 if appointment date is in the past', async () => {
    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest.fn().mockResolvedValue({
      ...validBody,
      appointmentDate: '2000-01-01',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await (res as any).json();
    expect(json.message).toBe('Appointment date cannot be in the past');
  });

  it('should return 400 if time format is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest.fn().mockResolvedValue({
      ...validBody,
      appointmentTime: '25:00',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await (res as any).json();
    expect(json.message).toContain('Invalid time format');
  });

  it('should return 409 if there is a conflicting appointment', async () => {
    mockAppointmentFindOne.mockResolvedValue({ _id: 'existing_appt' });
    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest.fn().mockResolvedValue(validBody);

    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await (res as any).json();
    expect(json.message).toContain('This time slot is already booked');
  });

  it('should create appointment successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest.fn().mockResolvedValue(validBody);

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await (res as any).json();
    expect(json.success).toBe(true);
    expect(json.data.patient.firstName).toBe('John');
    expect(json.data.doctor.name).toBe('Dr. Smith');
    expect(mockAppointmentSave).toHaveBeenCalled();
    expect(mockAppointmentPopulate).toHaveBeenCalled();
  });

  it('should handle validation errors from mongoose', async () => {
    const validationError: any = new Error('Validation failed');
    validationError.name = 'ValidationError';
    validationError.errors = {
      field: { message: 'Field error' },
    };
    mockAppointmentSave.mockRejectedValue(validationError);

    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest.fn().mockResolvedValue(validBody);

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await (res as any).json();
    expect(json.message).toContain('Validation error');
  });

  it('should handle duplicate key errors', async () => {
    const duplicateError: any = new Error('Duplicate key');
    duplicateError.code = 11000;
    mockAppointmentSave.mockRejectedValue(duplicateError);

    const req = new NextRequest('http://localhost:3000/api/appointments/new', {
      method: 'POST',
    });
    req.json = jest.fn().mockResolvedValue(validBody);

    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await (res as any).json();
    expect(json.message).toBe('An appointment already exists at this time');
  });
});
