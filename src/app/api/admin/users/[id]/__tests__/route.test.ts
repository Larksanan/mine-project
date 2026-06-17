/**
 * @jest-environment node
 */
import { GET, PUT, DELETE, PATCH } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Receptionist from '@/models/Receptionist';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('@/models/Doctor');
jest.mock('@/models/Patient');
jest.mock('@/models/Receptionist');

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    isValidObjectId: jest.fn((id: string) => /^[0-9a-fA-F]{24}$/.test(id)),
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

describe('Admin User Detail API', () => {
  const validId = '507f1f77bcf86cd799439011';
  const mockAdminUser = {
    _id: { toString: () => validId },
    name: 'Jebarsan Thatcroos',
    email: 'jebarsanthatcroos@gmail.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    isEmailVerified: true,
  };

  const mockSession = {
    user: {
      email: 'jebarsanthatcroos@gmail.com',
      name: 'Jebarsan Thatcroos',
    },
  };

  const mockUser = {
    _id: { toString: () => '507f1f77bcf86cd799439012' },
    name: 'sovika sovika',
    email: 'sovika@gmail.com',
    phone: '1234567890',
    role: 'DOCTOR',
    status: 'ACTIVE',
    isEmailVerified: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    lastLogin: new Date('2026-01-15'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 404 if authenticated user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return 403 if user is not admin', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockAdminUser,
        role: 'DOCTOR',
      });

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Forbidden - Admin access required');
    });

    it('should return 400 for invalid user ID', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const context = { params: Promise.resolve({ id: 'invalid-id' }) };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Invalid user id');
    });

    it('should return 404 if user to fetch not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should fetch user with doctor profile', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const mockDoctorProfile = {
        _id: '507f1f77bcf86cd799439020',
        user: mockUser._id,
        appointments: ['appt1', 'appt2'],
        patients: ['patient1', 'patient2', 'patient3'],
      };

      const mockDoctorChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoctorProfile),
      };
      (Doctor.findOne as jest.Mock).mockReturnValue(mockDoctorChain);

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.name).toBe('sovika sovika');
      expect(body.data.relatedData.profile).toBeDefined();
      expect(body.data.relatedData.totalAppointments).toBe(2);
      expect(body.data.relatedData.totalPatients).toBe(3);
    });

    it('should fetch user with patient profile', async () => {
      const patientUser = { ...mockUser, role: 'PATIENT' };

      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(patientUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const mockPatientProfile = {
        _id: '507f1f77bcf86cd799439021',
        user: patientUser._id,
        appointments: ['appt1'],
      };

      const mockPatientChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPatientProfile),
      };
      (Patient.findOne as jest.Mock).mockReturnValue(mockPatientChain);

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.relatedData.totalAppointments).toBe(1);
    });

    it('should fetch user with receptionist profile', async () => {
      const receptionistUser = { ...mockUser, role: 'RECEPTIONIST' };

      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(receptionistUser),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const mockReceptionistProfile = {
        _id: '507f1f77bcf86cd799439022',
        user: receptionistUser._id,
        currentAppointmentsCount: 5,
      };

      (Receptionist.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReceptionistProfile),
      });

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.relatedData.currentAppointments).toBe(5);
    });

    it('should handle users with no role-specific profile', async () => {
      const adminUserData = { ...mockUser, role: 'ADMIN' };

      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const mockFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(adminUserData),
      };
      (User.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await GET({} as NextRequest, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.relatedData.profile).toBeNull();
    });
  });

  describe('PUT', () => {
    const updateData = {
      name: 'Updated Name',
      phone: '076543210',
      status: 'INACTIVE',
    };

    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as NextRequest;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 400 for invalid user ID', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const request = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as NextRequest;

      const context = { params: Promise.resolve({ id: 'invalid-id' }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Invalid user id');
    });

    it('should update user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockUser, ...updateData }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('User updated successfully');
    });

    it('should return 403 if admin tries to demote themselves', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockAdminUser);

      const request = {
        json: jest.fn().mockResolvedValue({ role: 'DOCTOR' }),
      } as unknown as NextRequest;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('You cannot change your own admin role');
    });

    it('should handle role change from DOCTOR to PATIENT', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      (Doctor.findOneAndDelete as jest.Mock).mockResolvedValue({});
      (Patient.findOne as jest.Mock).mockResolvedValue(null);
      (Patient.create as jest.Mock).mockResolvedValue({});

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockUser, role: 'PATIENT' }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest.fn().mockResolvedValue({ role: 'PATIENT' }),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      await PUT(request, context);

      expect(Doctor.findOneAndDelete).toHaveBeenCalledWith({
        user: '507f1f77bcf86cd799439012',
      });
      expect(Patient.create).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await DELETE({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 400 for invalid user ID', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const context = { params: Promise.resolve({ id: 'invalid-id' }) };
      const response = await DELETE({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Invalid user id');
    });

    it('should return 404 if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await DELETE({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return 403 if admin tries to delete themselves', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockAdminUser);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await DELETE({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('You cannot delete your own account');
    });

    it('should delete user and doctor profile successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (Doctor.findOneAndDelete as jest.Mock).mockResolvedValue({});
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await DELETE({} as NextRequest, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('User and related data deleted successfully');
      expect(Doctor.findOneAndDelete).toHaveBeenCalledWith({
        user: '507f1f77bcf86cd799439012',
      });
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012'
      );
    });

    it('should delete patient profile for patient user', async () => {
      const patientUser = { ...mockUser, role: 'PATIENT' };

      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(patientUser);
      (Patient.findOneAndDelete as jest.Mock).mockResolvedValue({});
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      await DELETE({} as NextRequest, context);

      expect(Patient.findOneAndDelete).toHaveBeenCalled();
    });
  });

  describe('PATCH', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Test' }),
      } as unknown as NextRequest;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should handle suspend action', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockUser, status: 'SUSPENDED' }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest.fn().mockResolvedValue({ action: 'suspend' }),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        { $set: { status: 'SUSPENDED' } },
        { new: true, runValidators: true }
      );
    });

    it('should handle activate action', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockUser, status: 'ACTIVE' }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest.fn().mockResolvedValue({ action: 'activate' }),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      await PATCH(request, context);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        { $set: { status: 'ACTIVE' } },
        { new: true, runValidators: true }
      );
    });

    it('should handle deactivate action', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockUser, status: 'INACTIVE' }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest.fn().mockResolvedValue({ action: 'deactivate' }),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      await PATCH(request, context);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        { $set: { status: 'INACTIVE' } },
        { new: true, runValidators: true }
      );
    });

    it('should handle verify-email action', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest
          .fn()
          .mockResolvedValue({ ...mockUser, isEmailVerified: true }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest.fn().mockResolvedValue({ action: 'verify-email' }),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      await PATCH(request, context);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        { $set: { isEmailVerified: true } },
        { new: true, runValidators: true }
      );
    });

    it('should handle unverify-email action', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest
          .fn()
          .mockResolvedValue({ ...mockUser, isEmailVerified: false }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest.fn().mockResolvedValue({ action: 'unverify-email' }),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      await PATCH(request, context);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        { $set: { isEmailVerified: false } },
        { new: true, runValidators: true }
      );
    });

    it('should return 403 if admin tries to suspend themselves', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockAdminUser);

      const request = {
        json: jest.fn().mockResolvedValue({ action: 'suspend' }),
      } as unknown as NextRequest;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('You cannot suspend your own account');
    });

    it('should return 403 if admin tries to demote themselves via PATCH', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockAdminUser);

      const request = {
        json: jest.fn().mockResolvedValue({ role: 'DOCTOR' }),
      } as unknown as NextRequest;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('You cannot change your own admin role');
    });

    it('should handle role change via PATCH', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      (Doctor.findOneAndDelete as jest.Mock).mockResolvedValue({});
      (Receptionist.findOne as jest.Mock).mockResolvedValue(null);
      (Receptionist.create as jest.Mock).mockResolvedValue({});

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest
          .fn()
          .mockResolvedValue({ ...mockUser, role: 'RECEPTIONIST' }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest.fn().mockResolvedValue({ role: 'RECEPTIONIST' }),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      await PATCH(request, context);

      expect(Doctor.findOneAndDelete).toHaveBeenCalled();
      expect(Receptionist.create).toHaveBeenCalled();
    });

    it('should handle partial updates without action', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockUser, name: 'New Name' }),
      };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const request = {
        json: jest
          .fn()
          .mockResolvedValue({ name: 'New Name', phone: '1111111111' }),
      } as unknown as NextRequest;

      const context = {
        params: Promise.resolve({ id: '507f1f77bcf86cd799439012' }),
      };
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        { $set: { name: 'New Name', phone: '1111111111' } },
        { new: true, runValidators: true }
      );
    });
  });
});
