/**
 * @jest-environment node
 */
import { GET, PATCH, DELETE } from '../route';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('next-auth');
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

// Mock mongoose
jest.mock('mongoose', () => ({
  models: {
    Appointment: {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
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
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

// Mock require calls
jest.mock('@/models/Appointment', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock('@/models/User', () => ({ default: { findById: jest.fn() } }));
jest.mock('@/models/Doctor', () => ({ default: { findOne: jest.fn() } }));
jest.mock('@/models/Patient', () => ({ default: {} }));

// Helper to create chainable mongoose mocks
const createChainableMock = (resolvedValue: any) => {
  const exec = jest.fn().mockResolvedValue(resolvedValue);
  const chain: any = {
    exec,
    then: (resolve: any, reject: any) => exec().then(resolve, reject),
  };
  chain.populate = jest.fn().mockReturnValue(chain);
  chain.select = jest.fn().mockReturnValue(chain);
  chain.lean = jest.fn().mockReturnValue(chain);
  return chain;
};

describe('/api/appointments/[appointmentsid]', () => {
  const mockContext = {
    params: Promise.resolve({ appointmentsid: 'valid_id' }),
  };

  // Access mocks from the mocked mongoose module
  const mockAppointmentModel = mongoose.models.Appointment as any;
  const mockUserModel = mongoose.models.User as any;
  const mockDoctorModel = mongoose.models.Doctor as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = {} as any;
      const res = await GET(req, mockContext);
      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid ID', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);
      const req = {} as any;
      const res = await GET(req, mockContext);
      expect(res.status).toBe(400);
    });

    it('should return 404 if appointment not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });

      const chain = createChainableMock(null);
      mockAppointmentModel.findOne.mockReturnValue(chain);

      const req = {} as any;
      const res = await GET(req, mockContext);
      expect(res.status).toBe(404);
    });

    it('should return 403 if user has no access', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });

      const mockAppointment = { _id: 'valid_id', doctor: 'doc1' };
      const chain = createChainableMock(mockAppointment);
      mockAppointmentModel.findOne.mockReturnValue(chain);

      // Mock User check (PATIENT role)
      const userChain = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ role: 'PATIENT' }),
        }),
      };
      mockUserModel.findById.mockReturnValue(userChain);

      const req = {} as any;
      const res = await GET(req, mockContext);
      expect(res.status).toBe(403);
    });

    it('should return appointment if user is ADMIN', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin1' },
      });

      const mockAppointment = {
        _id: 'valid_id',
        doctor: {
          _id: 'doc1',
          user: { name: 'Dr. jebarsanthatcroos' },
          profile: {},
        },
        patient: { firstName: 'jebarsan' },
        appointmentDate: new Date(),
      };
      const chain = createChainableMock(mockAppointment);
      mockAppointmentModel.findOne.mockReturnValue(chain);

      const userChain = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
        }),
      };
      mockUserModel.findById.mockReturnValue(userChain);

      const req = {} as any;
      const res = await GET(req, mockContext);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data._id).toBe('valid_id');
    });

    it('should return appointment if user is the assigned DOCTOR', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'docUser1' },
      });

      const mockAppointment = {
        _id: 'valid_id',
        doctor: { _id: 'doc1', toString: () => 'doc1' },
      };
      const chain = createChainableMock(mockAppointment);
      mockAppointmentModel.findOne.mockReturnValue(chain);

      // Mock User check (DOCTOR role)
      const userChain = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ role: 'DOCTOR' }),
        }),
      };
      mockUserModel.findById.mockReturnValue(userChain);

      // Mock Doctor check
      mockDoctorModel.findOne.mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValue({ _id: 'doc1', toString: () => 'doc1' }),
      });

      const req = {} as any;
      const res = await GET(req, mockContext);
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = { json: async () => ({}) } as any;
      const res = await PATCH(req, mockContext);
      expect(res.status).toBe(401);
    });

    it('should return 404 if appointment not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });
      mockAppointmentModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = { json: async () => ({ status: 'CONFIRMED' }) } as any;
      const res = await PATCH(req, mockContext);
      expect(res.status).toBe(404);
    });

    it('should update appointment successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin1' },
      });

      const existingAppointment = { _id: 'valid_id' };
      mockAppointmentModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingAppointment),
      });

      const userChain = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
        }),
      };
      mockUserModel.findById.mockReturnValue(userChain);

      const updatedAppointment = {
        _id: 'valid_id',
        status: 'CONFIRMED',
        doctor: { _id: 'doc1' },
      };
      const updateChain = createChainableMock(updatedAppointment);
      mockAppointmentModel.findByIdAndUpdate.mockReturnValue(updateChain);

      const req = { json: async () => ({ status: 'CONFIRMED' }) } as any;
      const res = await PATCH(req, mockContext);

      expect(res.status).toBe(200);
      expect(mockAppointmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'valid_id',
        expect.objectContaining({ status: 'CONFIRMED' }),
        expect.anything()
      );
    });

    it('should return 400 for invalid status', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin1' },
      });

      const existingAppointment = { _id: 'valid_id' };
      mockAppointmentModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingAppointment),
      });

      const userChain = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
        }),
      };
      mockUserModel.findById.mockReturnValue(userChain);

      const req = { json: async () => ({ status: 'INVALID_STATUS' }) } as any;
      const res = await PATCH(req, mockContext);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('should soft delete appointment successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin1' },
      });

      const existingAppointment = { _id: 'valid_id' };
      mockAppointmentModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingAppointment),
      });

      const userChain = {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
        }),
      };
      mockUserModel.findById.mockReturnValue(userChain);

      mockAppointmentModel.findByIdAndUpdate.mockResolvedValue({});

      const req = {} as any;
      const res = await DELETE(req, mockContext);

      expect(res.status).toBe(200);
      expect(mockAppointmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'valid_id',
        expect.objectContaining({ isActive: false })
      );
    });
  });
});
