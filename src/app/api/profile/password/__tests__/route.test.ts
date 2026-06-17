/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { POST } from '../route';

// Define interfaces for mocks
interface MockUser {
  new (data: any): any;
  findById: jest.Mock;
  findByIdAndDelete: jest.Mock;
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
  const MockUser = function (this: any, data: any) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  } as any as { new (data: any): any };

  // Add static methods
  (MockUser as any).findById = jest.fn();
  (MockUser as any).findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: MockUser as MockUser,
  };
});

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('Account Deletion API', () => {
  let User: MockUser;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;
  let bcrypt: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    User = require('@/models/User').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;
    bcrypt = require('bcryptjs');

    // Default mock implementations
    connectDB.mockResolvedValue(undefined);
  });

  describe('POST /api/profile/delete', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    const mockRequestBody = {
      password: 'correctPassword123',
      confirmText: 'DELETE',
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should delete account successfully with password', async () => {
      const mockUser = new User({
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        isActive: true,
        updatedAt: new Date('2024-01-01'),
      });

      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      // Mock bcrypt.compare
      bcrypt.compare.mockResolvedValue(true);

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Account deleted successfully');

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('+password');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword123',
        'hashedPassword'
      );
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.email).toMatch(/^deleted_user123@deleted\.com$/);
      expect(mockUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete OAuth account without password', async () => {
      const mockUser = new User({
        _id: 'user123',
        email: 'user@example.com',
        password: null, // OAuth user
        isActive: true,
        updatedAt: new Date('2024-01-01'),
      });

      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const reqBody = {
        confirmText: 'DELETE',
        // No password for OAuth user
      };

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(reqBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Account deleted successfully');

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('+password');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.email).toMatch(/^deleted_user123@deleted\.com$/);
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when confirmText is not DELETE', async () => {
      const reqBody = {
        password: 'correctPassword123',
        confirmText: 'WRONG',
      };

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(reqBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Please type DELETE to confirm account deletion');
    });

    it('should return 400 when password is required but not provided', async () => {
      const mockUser = new User({
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword', // Has password
        isActive: true,
      });

      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const reqBody = {
        confirmText: 'DELETE',
        // Missing password
      };

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(reqBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Password is required');
    });

    it('should return 404 when user not found', async () => {
      // Mock: User.findById().select() returns null
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 401 when password is incorrect', async () => {
      const mockUser = new User({
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        isActive: true,
      });

      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      // Mock bcrypt.compare to return false
      bcrypt.compare.mockResolvedValue(false);

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Incorrect password');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword123',
        'hashedPassword'
      );
    });

    it('should handle bcrypt compare errors', async () => {
      const mockUser = new User({
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        isActive: true,
      });

      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      // Mock bcrypt.compare to throw error
      bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle database save errors', async () => {
      const mockUser = new User({
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        isActive: true,
      });

      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      // Mock bcrypt.compare
      bcrypt.compare.mockResolvedValue(true);

      // Mock save to throw error
      mockUser.save.mockRejectedValue(new Error('Save error'));

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connection errors', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle JSON parse errors', async () => {
      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: 'invalid json',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle empty request body', async () => {
      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Please type DELETE to confirm account deletion');
    });

    it('should perform soft delete (not hard delete)', async () => {
      const mockUser = new User({
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        isActive: true,
        updatedAt: new Date('2024-01-01'),
      });

      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      bcrypt.compare.mockResolvedValue(true);

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify soft delete (not hard delete)
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.email).toMatch(/^deleted_user123@deleted\.com$/);
    });

    it('should handle users with very long IDs', async () => {
      const longUserId = 'user123456789012345678901234567890';
      const sessionWithLongId = {
        user: { id: longUserId },
      };

      getServerSession.mockResolvedValue(sessionWithLongId);

      const mockUser = new User({
        _id: longUserId,
        email: 'user@example.com',
        password: null,
        isActive: true,
      });

      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const reqBody = {
        confirmText: 'DELETE',
      };

      const req = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify(reqBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUser.email).toBe(`deleted_${longUserId}@deleted.com`);
    });

    it('should handle concurrent deletion requests', async () => {
      const mockUser1 = new User({
        _id: 'user123',
        email: 'user1@example.com',
        password: 'hashedPassword1',
        isActive: true,
      });

      const mockUser2 = new User({
        _id: 'user456',
        email: 'user2@example.com',
        password: 'hashedPassword2',
        isActive: true,
      });

      // First request
      getServerSession.mockResolvedValueOnce({ user: { id: 'user123' } });
      const mockSelect1 = jest.fn().mockResolvedValue(mockUser1);
      User.findById.mockReturnValueOnce({
        select: mockSelect1,
      });
      bcrypt.compare.mockResolvedValueOnce(true);

      const req1 = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify({
          password: 'correctPassword123',
          confirmText: 'DELETE',
        }),
      });

      const res1 = await POST(req1);
      const data1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(data1.success).toBe(true);

      // Second request
      getServerSession.mockResolvedValueOnce({ user: { id: 'user456' } });
      const mockSelect2 = jest.fn().mockResolvedValue(mockUser2);
      User.findById.mockReturnValueOnce({
        select: mockSelect2,
      });
      bcrypt.compare.mockResolvedValueOnce(true);

      const req2 = new NextRequest('http://localhost:3000/api/profile/delete', {
        method: 'POST',
        body: JSON.stringify({
          password: 'correctPassword456',
          confirmText: 'DELETE',
        }),
      });

      const res2 = await POST(req2);
      const data2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(data2.success).toBe(true);
    });
  });
});
