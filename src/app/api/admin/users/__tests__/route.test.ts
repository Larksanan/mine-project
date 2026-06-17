/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * @jest-environment node
 */
import { GET, POST, PATCH, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('@/models/Doctor');
jest.mock('@/models/Patient');
jest.mock('@/models/Receptionist');
jest.mock('@/models/Appointment');
jest.mock('bcryptjs');

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

describe('Admin Users API', () => {
  const mockAdminUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    isEmailVerified: true,
  };

  const mockSession = {
    user: {
      email: 'admin@example.com',
      name: 'Admin User',
    },
  };

  const mockUsers = [
    {
      _id: { toString: () => '507f1f77bcf86cd799439012' },
      name: 'Jebarsan Thatcroos',
      email: 'jebarsanthatcroos@gmail.com',
      phone: '1234567890',
      role: 'DOCTOR',
      status: 'ACTIVE',
      isEmailVerified: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      lastLogin: new Date('2026-01-15'),
    },
    {
      _id: { toString: () => '507f1f77bcf86cd799439013' },
      name: 'sovika sovika',
      email: 'sovika@gmail.com',
      phone: '0987654321',
      role: 'PATIENT',
      status: 'ACTIVE',
      isEmailVerified: false,
      createdAt: new Date('2026-01-02'),
      updatedAt: new Date('2026-01-02'),
      lastLogin: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
  });

  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 404 if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return 403 if user is not admin', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockAdminUser,
        role: 'DOCTOR',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Forbidden - Admin access required');
    });

    it('should fetch users with default pagination', async () => {
      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindChain);
      (User.countDocuments as jest.Mock).mockResolvedValue(2);
      (User.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          {
            _id: null,
            totalCount: 2,
            activeCount: 2,
            inactiveCount: 0,
            suspendedCount: 0,
            verifiedCount: 1,
          },
        ])
        .mockResolvedValueOnce([
          { _id: 'DOCTOR', count: 1 },
          { _id: 'PATIENT', count: 1 },
        ]);

      const req = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.total).toBe(2);
    });

    it('should filter users by search term', async () => {
      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUsers[0]]),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindChain);
      (User.countDocuments as jest.Mock).mockResolvedValue(1);
      (User.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          {
            _id: null,
            totalCount: 1,
            activeCount: 1,
            inactiveCount: 0,
            suspendedCount: 0,
            verifiedCount: 1,
          },
        ])
        .mockResolvedValueOnce([{ _id: 'DOCTOR', count: 1 }]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?search=Jebarsan'
      );
      await GET(req);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'Jebarsan', $options: 'i' } },
            { email: { $regex: 'Jebarsan', $options: 'i' } },
            { phone: { $regex: 'Jebarsan', $options: 'i' } },
          ]),
        })
      );
    });

    it('should filter users by role', async () => {
      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUsers[0]]),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindChain);
      (User.countDocuments as jest.Mock).mockResolvedValue(1);
      (User.aggregate as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?role=DOCTOR'
      );
      await GET(req);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'DOCTOR',
        })
      );
    });

    it('should filter users by status', async () => {
      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindChain);
      (User.countDocuments as jest.Mock).mockResolvedValue(2);
      (User.aggregate as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?status=ACTIVE'
      );
      await GET(req);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ACTIVE',
        })
      );
    });

    it('should filter users by email verification', async () => {
      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUsers[0]]),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindChain);
      (User.countDocuments as jest.Mock).mockResolvedValue(1);
      (User.aggregate as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?isEmailVerified=true'
      );
      await GET(req);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isEmailVerified: true,
        })
      );
    });

    it('should handle pagination parameters', async () => {
      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindChain);
      (User.countDocuments as jest.Mock).mockResolvedValue(50);
      (User.aggregate as jest.Mock).mockResolvedValue([]);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?page=2&limit=10'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(mockFindChain.skip).toHaveBeenCalledWith(10);
      expect(mockFindChain.limit).toHaveBeenCalledWith(10);
      expect(body.pagination.page).toBe(2);
      expect(body.pagination.hasNextPage).toBe(true);
      expect(body.pagination.hasPrevPage).toBe(true);
    });

    it('should handle database errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const req = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch users');
    });
  });

  describe('POST', () => {
    const validUserData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'Password123!',
      role: 'DOCTOR',
      phone: '1234567890',
    };

    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(validUserData);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 403 if user is not admin', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockAdminUser,
        role: 'DOCTOR',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(validUserData);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Forbidden - Admin access required');
    });

    it('should create a new user successfully', async () => {
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(null);

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockUserInstance = {
        _id: '507f1f77bcf86cd799439014',
        ...validUserData,
        save: mockSave,
      };

      (User as unknown as jest.Mock).mockImplementation(() => mockUserInstance);

      const mockFindById = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => '507f1f77bcf86cd799439014' },
          ...validUserData,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindById);
      (Doctor.findOne as jest.Mock).mockResolvedValue(null);
      (Doctor.create as jest.Mock).mockResolvedValue({});

      const bcrypt = require('bcryptjs');
      bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(validUserData);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.message).toBe('User created successfully');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { name: 'Test' };

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(invalidData);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toContain('Missing required fields');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(invalidData);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Invalid email format');
    });

    it('should return 409 if user already exists', async () => {
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce({ email: validUserData.email });

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(validUserData);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.message).toBe('User with this email already exists');
    });

    it('should return 400 for invalid role', async () => {
      const invalidData = { ...validUserData, role: 'INVALID_ROLE' };

      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(invalidData);

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Invalid role specified');
    });

    it('should create patient profile for PATIENT role', async () => {
      const patientData = { ...validUserData, role: 'PATIENT' };

      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(null);

      const mockSave = jest.fn().mockResolvedValue(undefined);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        _id: '507f1f77bcf86cd799439014',
        save: mockSave,
      }));

      const mockFindById = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => '507f1f77bcf86cd799439014' },
        }),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindById);
      (Patient.findOne as jest.Mock).mockResolvedValue(null);
      (Patient.create as jest.Mock).mockResolvedValue({});

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(patientData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(patientData);

      await POST(req);

      expect(Patient.create).toHaveBeenCalled();
    });
  });

  describe('PATCH', () => {
    const updateData = {
      userId: '507f1f77bcf86cd799439012',
      updates: {
        name: 'Updated Name',
        status: 'INACTIVE',
      },
    };

    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(updateData);

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should update user successfully', async () => {
      const mockUserToUpdate = {
        _id: { toString: () => '507f1f77bcf86cd799439012' },
        role: 'DOCTOR',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUserToUpdate);

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => '507f1f77bcf86cd799439012' },
          name: 'Updated Name',
          status: 'INACTIVE',
        }),
      };

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(updateData);

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('User updated successfully');
    });

    it('should return 400 if userId is missing', async () => {
      const invalidData = { updates: { name: 'Test' } };

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify(invalidData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(invalidData);

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('User ID is required');
    });

    it('should return 400 for invalid userId format', async () => {
      const invalidData = { userId: 'invalid-id', updates: {} };

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify(invalidData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(invalidData);

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Invalid user id format');
    });

    it('should return 403 if admin tries to demote themselves', async () => {
      const selfDemoteData = {
        userId: '507f1f77bcf86cd799439011',
        updates: { role: 'DOCTOR' },
      };

      (User.findById as jest.Mock).mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        role: 'ADMIN',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify(selfDemoteData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(selfDemoteData);

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('You cannot change your own admin role');
    });

    it('should handle role changes and update profiles', async () => {
      const roleChangeData = {
        userId: '507f1f77bcf86cd799439012',
        updates: { role: 'PATIENT' },
      };

      const mockUserToUpdate = {
        _id: { toString: () => '507f1f77bcf86cd799439012' },
        role: 'DOCTOR',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUserToUpdate);
      (Doctor.findOneAndDelete as jest.Mock).mockResolvedValue({});
      (Patient.findOne as jest.Mock).mockResolvedValue(null);
      (Patient.create as jest.Mock).mockResolvedValue({});

      const mockFindByIdAndUpdate = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => '507f1f77bcf86cd799439012' },
          role: 'PATIENT',
        }),
      };

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify(roleChangeData),
      });
      jest.spyOn(req, 'json').mockResolvedValue(roleChangeData);

      await PATCH(req);

      expect(Doctor.findOneAndDelete).toHaveBeenCalled();
      expect(Patient.create).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?userId=507f1f77bcf86cd799439012'
      );
      const response = await DELETE(req);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('should delete user successfully', async () => {
      const mockUserToDelete = {
        _id: { toString: () => '507f1f77bcf86cd799439012' },
        role: 'DOCTOR',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUserToDelete);
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue({});
      (Doctor.findOneAndDelete as jest.Mock).mockResolvedValue({});
      (Appointment.deleteMany as jest.Mock).mockResolvedValue({});

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?userId=507f1f77bcf86cd799439012'
      );
      const response = await DELETE(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('User deleted successfully');
      expect(Doctor.findOneAndDelete).toHaveBeenCalled();
      expect(Appointment.deleteMany).toHaveBeenCalled();
    });

    it('should return 400 if userId is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await DELETE(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('User ID is required');
    });

    it('should return 400 for invalid userId format', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?userId=invalid-id'
      );
      const response = await DELETE(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Invalid user id format');
    });

    it('should return 404 if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?userId=507f1f77bcf86cd799439012'
      );
      const response = await DELETE(req);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return 403 if admin tries to delete themselves', async () => {
      const mockUserToDelete = {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        role: 'ADMIN',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUserToDelete);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?userId=507f1f77bcf86cd799439011'
      );
      const response = await DELETE(req);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('You cannot delete your own account');
    });

    it('should delete patient profile and appointments', async () => {
      const mockUserToDelete = {
        _id: { toString: () => '507f1f77bcf86cd799439012' },
        role: 'PATIENT',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUserToDelete);
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue({});
      (Patient.findOneAndDelete as jest.Mock).mockResolvedValue({});
      (Appointment.deleteMany as jest.Mock).mockResolvedValue({});

      const req = new NextRequest(
        'http://localhost:3000/api/admin/users?userId=507f1f77bcf86cd799439012'
      );
      await DELETE(req);

      expect(Patient.findOneAndDelete).toHaveBeenCalled();
      expect(Appointment.deleteMany).toHaveBeenCalledWith({
        patient: '507f1f77bcf86cd799439012',
      });
    });
  });
});
