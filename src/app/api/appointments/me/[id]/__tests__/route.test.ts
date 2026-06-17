/* eslint-disable no-undef */
import { GET, PUT, DELETE } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';

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
    },
    NextResponse: {
      json: jest.fn((data, init) => ({
        json: async () => data,
        status: init?.status || 200,
      })),
    },
  };
});

// Mock Mongoose chain
const mockChain: any = {
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

// Make the chain thenable to support await Model.findOne().lean()
mockChain.then = function (resolve: any, reject: any) {
  return this.exec().then(resolve, reject);
};

const mockAppointmentFindOne = jest.fn(() => mockChain);
const mockAppointmentFindByIdAndUpdate = jest.fn(() => mockChain);

jest.mock('@/models/Appointment', () => ({
  default: {
    findOne: (...args: any[]) => mockAppointmentFindOne.apply(null, args),
    findByIdAndUpdate: (...args: any[]) =>
      mockAppointmentFindByIdAndUpdate.apply(null, args),
  },
}));

const mockPatientFindById = jest.fn(() => ({ lean: jest.fn() }));

jest.mock('@/models/Patient', () => ({
  default: {
    findById: (...args: any[]) => mockPatientFindById.apply(null, args),
  },
}));

jest.mock('mongoose', () => ({
  models: {},
  Schema: class {},
  model: jest.fn(),
  Types: {
    ObjectId: class MockObjectId {
      static isValid: (id: string) => boolean = jest.fn(
        (id: string) => id === 'valid_id'
      );
    },
  },
}));

describe('/api/appointments/me/[id]', () => {
  const validId = 'valid_id';
  const params = Promise.resolve({ id: validId });
  let consoleLogSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    mockChain.exec.mockResolvedValue(null);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`
      );
      const res = await GET(req, { params });

      expect(res.status).toBe(401);
    });

    it('should return 400 if ID is invalid', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });
      const invalidParams = Promise.resolve({ id: 'invalid_id' });
      const req = new NextRequest(
        'http://localhost:3000/api/appointments/me/invalid_id'
      );
      const res = await GET(req, { params: invalidParams });

      expect(res.status).toBe(400);
    });

    it('should return 404 if appointment not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', role: 'PATIENT' },
      });
      mockChain.exec.mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`
      );
      const res = await GET(req, { params });

      expect(res.status).toBe(404);
    });

    it('should return 403 if patient does not own the appointment', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', role: 'PATIENT', email: 'user1@test.com' },
      });

      const mockAppointment = {
        _id: validId,
        patient: { _id: 'patient_other' },
      };
      mockChain.exec.mockResolvedValue(mockAppointment);

      // Mock patient lookup returning a different user
      mockPatientFindById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'patient_other',
          createdBy: 'user2',
          email: 'user2@test.com',
        }),
      });

      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`
      );
      const res = await GET(req, { params });

      expect(res.status).toBe(403);
    });

    it('should return 200 and data if patient owns the appointment', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', role: 'PATIENT', email: 'user1@test.com' },
      });

      const mockAppointment = {
        _id: validId,
        patient: {
          _id: 'patient1',
          firstName: 'Jebarsan',
          lastName: 'Thatcroos',
        },
        doctor: {
          _id: 'doc1',
          name: 'Dr. Jebarsan Thatcroos',
        },
        appointmentDate: new Date('2026-01-01'),
        status: 'SCHEDULED',
      };
      mockChain.exec.mockResolvedValue(mockAppointment);

      mockPatientFindById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'patient1',
          createdBy: 'user1', // Matches session user
        }),
      });

      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`
      );
      const res = await GET(req, { params });

      expect(res.status).toBe(200);
      const json = await (res as any).json();
      expect(json.success).toBe(true);
      expect(json.data.patient.firstName).toBe('Jebarsan');
    });

    it('should allow DOCTOR access if assigned', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'doc1', role: 'DOCTOR' },
      });

      const mockAppointment = {
        _id: validId,
        doctor: 'doc1', // Matches session user
        patient: { _id: 'pat1' },
      };
      mockChain.exec.mockResolvedValue(mockAppointment);

      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`
      );
      const res = await GET(req, { params });

      expect(res.status).toBe(200);
    });
  });

  describe('PUT', () => {
    it('should update appointment successfully for authorized user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', role: 'PATIENT' },
      });

      // 1. Find existing
      const existingAppointment = {
        _id: validId,
        patient: { _id: 'patient1' },
      };
      // First call to exec is for findOne (check existence/access)
      // Second call to exec is for findByIdAndUpdate
      mockChain.exec
        .mockResolvedValueOnce(existingAppointment)
        .mockResolvedValueOnce({
          ...existingAppointment,
          reason: 'Updated reason',
        });

      mockPatientFindById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'patient1',
          createdBy: 'user1',
        }),
      });

      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`,
        {
          method: 'PUT',
        }
      );
      // Mock json body
      req.json = jest.fn().mockResolvedValue({ reason: 'Updated reason' });

      const res = await PUT(req, { params });

      expect(res.status).toBe(200);
      expect(mockAppointmentFindByIdAndUpdate).toHaveBeenCalledWith(
        validId,
        expect.objectContaining({ reason: 'Updated reason' }),
        expect.anything()
      );
    });

    it('should filter allowed updates based on role', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1', role: 'PATIENT' },
      });

      mockChain.exec
        .mockResolvedValueOnce({ _id: validId, patient: { _id: 'p1' } }) // findOne
        .mockResolvedValueOnce({}); // update

      mockPatientFindById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'p1', createdBy: 'user1' }),
      });

      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`,
        {
          method: 'PUT',
        }
      );
      // Patient tries to update diagnosis (not allowed) and reason (allowed)
      req.json = jest.fn().mockResolvedValue({
        diagnosis: 'Self diagnosis',
        reason: 'Valid reason',
      });

      await PUT(req, { params });

      // Verify only 'reason' was passed to update
      expect(mockAppointmentFindByIdAndUpdate).toHaveBeenCalledWith(
        validId,
        expect.objectContaining({
          reason: 'Valid reason',
          updatedAt: expect.any(Date),
        }),
        expect.anything()
      );

      const updateCall = mockAppointmentFindByIdAndUpdate.mock
        .calls[0] as any[];
      const updateData = updateCall[1];
      expect(updateData).not.toHaveProperty('diagnosis');
    });
  });

  describe('DELETE', () => {
    it('should cancel appointment for authorized user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      });

      mockChain.exec.mockResolvedValue({ _id: validId }); // findOne

      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`,
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, { params });

      expect(res.status).toBe(200);
      expect(mockAppointmentFindByIdAndUpdate).toHaveBeenCalledWith(
        validId,
        expect.objectContaining({
          status: 'CANCELLED',
          isActive: false,
        })
      );
    });

    it('should return 403 if user does not have permission', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'jebarsanthatcroos',
          role: 'PATIENT',
          email: 'jebarsanthatcroos@example.com',
        },
      });

      mockChain.exec.mockResolvedValue({
        _id: validId,
        patient: { _id: 'p1' },
      });

      mockPatientFindById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'p1',
          createdBy: 'owner',
          email: 'owner@example.com',
        }),
      });

      const req = new NextRequest(
        `http://localhost:3000/api/appointments/me/${validId}`,
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req, { params });

      expect(res.status).toBe(403);
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          message: 'You do not have permission to cancel this appointment',
        },
        { status: 403 }
      );
    });
  });
});
