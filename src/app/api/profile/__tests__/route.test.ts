/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/profile/route';

// Define interfaces for mocks
interface MockUser {
  new (): any;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
}

// Mock all dependencies
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      body?: any;

      constructor(url: string, init?: { method?: string; body?: any }) {
        this.url = url;
        this.method = init?.method;
        this.body = init?.body;
      }

      json() {
        return Promise.resolve(this.body ? JSON.parse(this.body) : {});
      }
    },
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        json: async () => data,
        status: init?.status || 200,
      }),
    },
  };
});

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/User', () => {
  const MockUser = function () {} as any as { new (): any };

  // Add static methods that return chainable query objects
  (MockUser as any).findById = jest.fn();
  (MockUser as any).findByIdAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: MockUser as MockUser,
  };
});

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('@/validation/profile', () => ({
  validateProfileData: jest.fn(),
}));

describe('Profile API', () => {
  let User: MockUser;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;
  let validateProfileData: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    User = require('@/models/User').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;
    validateProfileData = require('@/validation/profile').validateProfileData;

    // Default mock implementations
    connectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/profile', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      nic: '123456789V',
      image: 'profile.jpg',
      phone: '+94123456789',
      department: 'IT',
      specialization: 'Software Development',
      address: '123 Main St',
      bio: 'Software developer',
      role: 'USER',
      emailVerified: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should fetch user profile successfully', async () => {
      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        nic: '123456789V',
        image: 'profile.jpg',
        phone: '+94123456789',
        department: 'IT',
        specialization: 'Software Development',
        address: '123 Main St',
        bio: 'Software developer',
        role: 'USER',
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('-password');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      // Mock: User.findById().select() returns null
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      // Mock: User.findById().select() throws error
      const mockSelect = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/profile', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    const mockCurrentUser = {
      _id: 'user123',
      name: 'Old Name',
      email: 'old@example.com',
      role: 'USER',
    };

    const mockUpdatedUser = {
      _id: 'user123',
      name: 'New Name',
      email: 'new@example.com',
      image: 'new-profile.jpg',
      phone: '+94123456789',
      department: 'Updated Department',
      specialization: 'Updated Specialization',
      address: '456 New St',
      bio: 'Updated bio',
      role: 'USER',
      emailVerified: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const mockUpdateData = {
      name: 'New Name',
      phone: '+94123456789',
      department: 'Updated Department',
      specialization: 'Updated Specialization',
      address: '456 New St',
      bio: 'Updated bio',
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
      validateProfileData.mockReturnValue({
        success: true,
        data: mockUpdateData,
        errors: [],
      });
    });

    it('should update user profile successfully', async () => {
      // Mock: User.findById().select() for current user check
      const mockSelectCurrent = jest.fn().mockResolvedValue(mockCurrentUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      // Mock: User.findByIdAndUpdate().select() for update
      const mockSelectUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Profile updated successfully');
      expect(data.data).toEqual({
        id: 'user123',
        name: 'New Name',
        email: 'new@example.com',
        image: 'new-profile.jpg',
        phone: '+94123456789',
        department: 'Updated Department',
        specialization: 'Updated Specialization',
        address: '456 New St',
        bio: 'Updated bio',
        role: 'USER',
        emailVerified: mockUpdatedUser.emailVerified,
        createdAt: mockUpdatedUser.createdAt,
        updatedAt: mockUpdatedUser.updatedAt,
      });

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelectCurrent).toHaveBeenCalledWith('-password');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: expect.objectContaining(mockUpdateData) },
        { new: true, runValidators: true }
      );
      expect(mockSelectUpdate).toHaveBeenCalledWith('-password');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when current user not found', async () => {
      // Mock: User.findById().select() returns null for current user
      const mockSelectCurrent = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 400 when validation fails', async () => {
      // Mock: User.findById().select() for current user check
      const mockSelectCurrent = jest.fn().mockResolvedValue(mockCurrentUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      const validationError = {
        success: false,
        errors: [{ message: 'Name is required' }],
      };
      validateProfileData.mockReturnValue(validationError);

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '' }),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Name is required');
      expect(data.details).toEqual(validationError.errors);
    });

    it('should return 404 when user not found during update', async () => {
      // Mock: User.findById().select() for current user check
      const mockSelectCurrent = jest.fn().mockResolvedValue(mockCurrentUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      // Mock: User.findByIdAndUpdate().select() returns null for update
      const mockSelectUpdate = jest.fn().mockResolvedValue(null);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle validation errors from Mongoose', async () => {
      // Mock: User.findById().select() for current user check
      const mockSelectCurrent = jest.fn().mockResolvedValue(mockCurrentUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      const mongooseError = {
        name: 'ValidationError',
        errors: { name: { message: 'Name is required' } },
      };

      // Mock: User.findByIdAndUpdate().select() throws Mongoose validation error
      const mockSelectUpdate = jest.fn().mockRejectedValue(mongooseError);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
      expect(data.details).toEqual(mongooseError.errors);
    });

    it('should handle duplicate email error', async () => {
      // Mock: User.findById().select() for current user check
      const mockSelectCurrent = jest.fn().mockResolvedValue(mockCurrentUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      const duplicateError = {
        code: 11000,
        message: 'Duplicate key error',
      };

      // Mock: User.findByIdAndUpdate().select() throws duplicate key error
      const mockSelectUpdate = jest.fn().mockRejectedValue(duplicateError);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email already exists');
    });

    it('should handle general database errors', async () => {
      // Mock: User.findById().select() for current user check
      const mockSelectCurrent = jest.fn().mockResolvedValue(mockCurrentUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      // Mock: User.findByIdAndUpdate().select() throws general error
      const mockSelectUpdate = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle empty request body', async () => {
      // Mock: User.findById().select() for current user check
      const mockSelectCurrent = jest.fn().mockResolvedValue(mockCurrentUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      const validationError = {
        success: false,
        errors: [{ message: 'Validation failed' }],
      };
      validateProfileData.mockReturnValue(validationError);

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle null/undefined values in update', async () => {
      // Mock: User.findById().select() for current user check
      const mockSelectCurrent = jest.fn().mockResolvedValue(mockCurrentUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      const updateDataWithNulls = {
        name: 'New Name',
        phone: null,
        department: null,
        specialization: null,
        address: null,
        bio: null,
      };

      validateProfileData.mockReturnValue({
        success: true,
        data: updateDataWithNulls,
        errors: [],
      });

      // Mock the update query with null values
      const mockUpdatedUserWithNulls = {
        ...mockUpdatedUser,
        phone: null,
        department: null,
        specialization: null,
        address: null,
        bio: null,
      };

      const mockSelectUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedUserWithNulls);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updateDataWithNulls),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.phone).toBeNull();
      expect(data.data.department).toBeNull();
    });

    it('should handle different user roles', async () => {
      const adminUser = {
        ...mockCurrentUser,
        role: 'ADMIN',
      };

      // Mock current user fetch as admin
      const mockSelectCurrent = jest.fn().mockResolvedValue(adminUser);
      User.findById.mockReturnValue({
        select: mockSelectCurrent,
      });

      validateProfileData.mockReturnValue({
        success: true,
        data: mockUpdateData,
        errors: [],
      });

      // Mock updated user as admin
      const mockUpdatedAdminUser = {
        ...mockUpdatedUser,
        role: 'ADMIN',
      };

      const mockSelectUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedAdminUser);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const req = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.role).toBe('ADMIN');
    });
  });
});
