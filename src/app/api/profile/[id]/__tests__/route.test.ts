/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/profile/[id]/route';

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

describe('Profile API with ID', () => {
  let User: MockUser;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;
  let validateProfileData: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    User = require('@/models/User').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;
    validateProfileData = require('@/validation/profile').validateProfileData;

    // Default mock implementations
    connectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/profile/[id]', () => {
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
      licenseNumber: 'LIC123',
      address: '123 Main St',
      bio: 'Software developer',
      role: 'USER',
      emailVerified: new Date(),
      isActive: true,
      lastLogin: new Date(),
      notificationPreferences: { email: true, push: true },
      settings: { theme: 'light' },
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

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const res = await GET(
        new NextRequest('http://localhost:3000/api/profile/user123'),
        context
      );
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
        licenseNumber: 'LIC123',
        address: '123 Main St',
        bio: 'Software developer',
        role: 'USER',
        emailVerified: mockUser.emailVerified,
        isActive: true,
        lastLogin: mockUser.lastLogin,
        notificationPreferences: { email: true, push: true },
        settings: { theme: 'light' },
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('-password -__v');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const res = await GET(
        new NextRequest('http://localhost:3000/api/profile/user123'),
        context
      );
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when accessing other user profile', async () => {
      const context = { params: Promise.resolve({ id: 'otherUser' }) };
      const res = await GET(
        new NextRequest('http://localhost:3000/api/profile/otherUser'),
        context
      );
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 404 when user not found', async () => {
      // Mock: User.findById().select() returns null
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const res = await GET(
        new NextRequest('http://localhost:3000/api/profile/user123'),
        context
      );
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      // Mock: User.findById().select() throws error
      const mockSelect = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const res = await GET(
        new NextRequest('http://localhost:3000/api/profile/user123'),
        context
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('PUT /api/profile/[id]', () => {
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
      nic: '123456789V',
      image: 'new-profile.jpg',
      phone: '+94123456789',
      department: 'Updated Department',
      specialization: 'Updated Specialization',
      licenseNumber: 'LIC456',
      address: '456 New St',
      bio: 'Updated bio',
      role: 'USER',
      emailVerified: new Date(),
      isActive: true,
      lastLogin: new Date(),
      notificationPreferences: { email: true, push: true },
      settings: { theme: 'light' },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const mockUpdateData = {
      name: 'New Name',
      email: 'new@example.com',
      phone: '+94123456789',
      department: 'Updated Department',
      specialization: 'Updated Specialization',
      licenseNumber: 'LIC456',
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
      // Mock: User.findById() for current user check
      User.findById.mockResolvedValue(mockCurrentUser);

      // Mock: User.findByIdAndUpdate().select() for update
      const mockSelectUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Profile updated successfully');
      expect(data.data).toEqual({
        id: 'user123',
        name: 'New Name',
        email: 'new@example.com',
        nic: '123456789V',
        image: 'new-profile.jpg',
        phone: '+94123456789',
        department: 'Updated Department',
        specialization: 'Updated Specialization',
        licenseNumber: 'LIC456',
        address: '456 New St',
        bio: 'Updated bio',
        role: 'USER',
        emailVerified: mockUpdatedUser.emailVerified,
        isActive: true,
        lastLogin: mockUpdatedUser.lastLogin,
        notificationPreferences: { email: true, push: true },
        settings: { theme: 'light' },
        createdAt: mockUpdatedUser.createdAt,
        updatedAt: mockUpdatedUser.updatedAt,
      });

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: expect.objectContaining(mockUpdateData) },
        { new: true, runValidators: true }
      );
      expect(mockSelectUpdate).toHaveBeenCalledWith('-password -__v');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when updating other user profile', async () => {
      const context = { params: Promise.resolve({ id: 'otherUser' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/profile/otherUser',
        {
          method: 'PUT',
          body: JSON.stringify(mockUpdateData),
        }
      );

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 404 when current user not found', async () => {
      // Mock: User.findById() returns null for current user
      User.findById.mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 400 when validation fails', async () => {
      // Mock: User.findById() for current user check
      User.findById.mockResolvedValue(mockCurrentUser);

      const validationError = {
        success: false,
        errors: [{ message: 'Name is required' }],
      };
      validateProfileData.mockReturnValue(validationError);

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify({ name: '' }),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Name is required');
      expect(data.details).toEqual(validationError.errors);
    });

    it('should return 404 when user not found during update', async () => {
      // Mock: User.findById() for current user check
      User.findById.mockResolvedValue(mockCurrentUser);

      // Mock: User.findByIdAndUpdate().select() returns null for update
      const mockSelectUpdate = jest.fn().mockResolvedValue(null);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle validation errors from Mongoose', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      // Mock: User.findById() for current user check
      User.findById.mockResolvedValue(mockCurrentUser);

      const mongooseError = new Error('Validation error from Mongoose');
      (mongooseError as any).name = 'ValidationError';

      // Mock: User.findByIdAndUpdate().select() throws Mongoose validation error
      const mockSelectUpdate = jest.fn().mockRejectedValue(mongooseError);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      consoleErrorSpy.mockRestore();
    });

    it('should handle general database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      // Mock: User.findById() for current user check
      User.findById.mockResolvedValue(mockCurrentUser);

      // Mock: User.findByIdAndUpdate().select() throws general error
      const mockSelectUpdate = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty request body', async () => {
      // Mock: User.findById() for current user check
      User.findById.mockResolvedValue(mockCurrentUser);

      const validationError = {
        success: false,
        errors: [{ message: 'Validation failed' }],
      };
      validateProfileData.mockReturnValue(validationError);

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle null/undefined values in update', async () => {
      // Mock: User.findById() for current user check
      User.findById.mockResolvedValue(mockCurrentUser);

      const updateDataWithNulls = {
        name: 'New Name',
        email: 'new@example.com',
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

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(updateDataWithNulls),
      });

      const res = await PUT(req, context);
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
      User.findById.mockResolvedValue(adminUser);

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

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.role).toBe('ADMIN');
    });

    it('should update licenseNumber when provided', async () => {
      // Mock: User.findById() for current user check
      User.findById.mockResolvedValue(mockCurrentUser);

      const updateDataWithLicense = {
        ...mockUpdateData,
        licenseNumber: 'NEWLIC123',
      };

      validateProfileData.mockReturnValue({
        success: true,
        data: updateDataWithLicense,
        errors: [],
      });

      const mockUpdatedUserWithLicense = {
        ...mockUpdatedUser,
        licenseNumber: 'NEWLIC123',
      };

      const mockSelectUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedUserWithLicense);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectUpdate,
      });

      const context = { params: Promise.resolve({ id: 'user123' }) };
      const req = new NextRequest('http://localhost:3000/api/profile/user123', {
        method: 'PUT',
        body: JSON.stringify(updateDataWithLicense),
      });

      const res = await PUT(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.licenseNumber).toBe('NEWLIC123');
    });
  });
});
