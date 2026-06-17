/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../route';

// Mock all dependencies
jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    method?: string;
    body?: any;
    headers: any;
    nextUrl: any;

    constructor(url: string, init?: { method?: string; body?: any }) {
      this.url = url;
      this.method = init?.method;
      this.body = init?.body;
      this.headers = { get: () => null };

      // Parse URL for searchParams
      const urlObj = new URL(url);
      this.nextUrl = {
        searchParams: urlObj.searchParams,
      };
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
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

describe('Users API', () => {
  let User: any;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    User = require('@/models/User').default;
    const nextAuth = require('next-auth/next');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/users', () => {
    const mockUsers = [
      {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        nic: '123456789V',
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'ADMIN',
        nic: '987654321V',
        isActive: true,
        createdAt: new Date(),
      },
    ];

    it('should fetch all users with pagination', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      });
      User.countDocuments.mockResolvedValue(2);

      const req = new NextRequest('http://localhost:3000/api/users');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should filter users by role', async () => {
      const adminUsers = [mockUsers[1]];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(adminUsers),
      });
      User.countDocuments.mockResolvedValue(1);

      const req = new NextRequest('http://localhost:3000/api/users?role=ADMIN');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'ADMIN' })
      );
    });

    it('should filter users by isActive status', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      });
      User.countDocuments.mockResolvedValue(2);

      const req = new NextRequest(
        'http://localhost:3000/api/users?isActive=true'
      );
      const res = await GET(req);
      await res.json();

      expect(res.status).toBe(200);
      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });

    it('should filter users by department', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      });
      User.countDocuments.mockResolvedValue(2);

      const req = new NextRequest(
        'http://localhost:3000/api/users?department=IT'
      );
      const res = await GET(req);
      await res.json();

      expect(res.status).toBe(200);
      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({ department: 'IT' })
      );
    });

    it('should search users by name, email, or nic', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUsers[0]]),
      });
      User.countDocuments.mockResolvedValue(1);

      const req = new NextRequest(
        'http://localhost:3000/api/users?search=john'
      );
      const res = await GET(req);
      await res.json();

      expect(res.status).toBe(200);
      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'john', $options: 'i' } },
            { email: { $regex: 'john', $options: 'i' } },
            { nic: { $regex: 'john', $options: 'i' } },
          ]),
        })
      );
    });

    it('should handle pagination with custom limit and page', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      });
      User.countDocuments.mockResolvedValue(20);

      const req = new NextRequest(
        'http://localhost:3000/api/users?limit=5&page=2'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.pagination.limit).toBe(5);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.totalPages).toBe(4); // 20 / 5
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should transform users with id field', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      });
      User.countDocuments.mockResolvedValue(2);

      const req = new NextRequest('http://localhost:3000/api/users');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data[0].id).toBe('user1');
      expect(data.data[1].id).toBe('user2');
    });

    it('should handle database errors', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const req = new NextRequest('http://localhost:3000/api/users');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch users');
    });
  });

  describe('POST /api/users', () => {
    const mockSession = {
      user: { email: 'admin@example.com' },
    };

    const mockAdminUser = {
      _id: 'admin123',
      email: 'admin@example.com',
      hasRole: jest.fn().mockReturnValue(true),
    };

    const validUserData = {
      name: 'New User',
      email: 'newuser@example.com',
      nic: '111222333V',
      role: 'USER',
      phone: '0771234567',
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should create user successfully', async () => {
      User.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(null);

      const newUser = {
        ...validUserData,
        _id: 'newuser123',
        isActive: true,
        toJSON: jest
          .fn()
          .mockReturnValue({ ...validUserData, _id: 'newuser123' }),
      };

      User.create.mockResolvedValue(newUser);

      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('User created successfully');
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validUserData.name,
          email: validUserData.email,
          nic: validUserData.nic,
          isActive: true,
        })
      );
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for insufficient permissions', async () => {
      const regularUser = {
        email: 'user@example.com',
        hasRole: jest.fn().mockReturnValue(false),
      };
      User.findOne.mockResolvedValue(regularUser);

      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Insufficient permissions');
    });

    it('should return 400 when required fields are missing', async () => {
      User.findOne.mockResolvedValue(mockAdminUser);
      const invalidData = { email: 'test@example.com' };

      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields: name, email, nic');
    });

    it('should return 409 when email already exists', async () => {
      const existingUser = {
        email: validUserData.email,
        nic: 'different',
      };

      User.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(existingUser);

      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email already registered');
    });

    it('should return 409 when NIC already exists', async () => {
      const existingUser = {
        email: 'different@example.com',
        nic: validUserData.nic,
      };

      User.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(existingUser);

      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('NIC already registered');
    });

    it('should set default role to USER if not provided', async () => {
      User.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(null);

      const { role: _role, ...dataWithoutRole } = validUserData;

      const newUser = {
        ...dataWithoutRole,
        role: 'USER',
        toJSON: jest.fn().mockReturnValue({ ...dataWithoutRole, role: 'USER' }),
      };

      User.create.mockResolvedValue(newUser);

      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(dataWithoutRole),
      });

      const res = await POST(req);
      await res.json();

      expect(res.status).toBe(201);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'USER' })
      );
    });
  });

  describe('PUT /api/users', () => {
    const mockSession = {
      user: { email: 'user@example.com' },
    };

    const mockCurrentUser = {
      _id: { toString: () => 'user123' },
      email: 'user@example.com',
      hasRole: jest.fn(),
    };

    const mockTargetUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should update own profile successfully', async () => {
      User.findOne.mockResolvedValue(mockCurrentUser);
      User.findById.mockResolvedValue(mockTargetUser);

      const updatedUser = {
        ...mockTargetUser,
        name: 'Updated Name',
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser),
      });

      const updateData = { name: 'Updated Name' };

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=user123',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('User updated successfully');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=user123',
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Test' }),
        }
      );

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when user ID is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User ID is required');
    });

    it('should return 404 when user not found', async () => {
      User.findOne.mockResolvedValue(mockCurrentUser);
      User.findById.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=invalid',
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Test' }),
        }
      );

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return 403 when updating another user without admin role', async () => {
      const otherUser = {
        _id: 'other123',
        email: 'other@example.com',
      };

      mockCurrentUser.hasRole.mockReturnValue(false);
      User.findOne.mockResolvedValue(mockCurrentUser);
      User.findById.mockResolvedValue(otherUser);

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=other123',
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Test' }),
        }
      );

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Insufficient permissions');
    });

    it('should allow admin to update any user', async () => {
      const otherUser = {
        _id: 'other123',
        email: 'other@example.com',
      };

      mockCurrentUser.hasRole.mockReturnValue(true);
      User.findOne.mockResolvedValue(mockCurrentUser);
      User.findById.mockResolvedValue(otherUser);
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({ ...otherUser, name: 'Updated' }),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=other123',
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        }
      );

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept user ID from request body', async () => {
      User.findOne.mockResolvedValue(mockCurrentUser);
      User.findById.mockResolvedValue(mockTargetUser);
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockTargetUser),
      });

      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'PUT',
        body: JSON.stringify({ id: 'user123', name: 'Updated' }),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should not update protected fields', async () => {
      User.findOne.mockResolvedValue(mockCurrentUser);
      User.findById.mockResolvedValue(mockTargetUser);
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockTargetUser),
      });

      const updateData = {
        name: 'Updated',
        password: 'newpassword',
        _id: 'fake',
        createdAt: new Date(),
      };

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=user123',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(req);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          $set: expect.not.objectContaining({
            password: expect.anything(),
            _id: expect.anything(),
            createdAt: expect.anything(),
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('DELETE /api/users', () => {
    const mockSession = {
      user: { email: 'admin@example.com' },
    };

    const mockAdminUser = {
      _id: 'admin123',
      email: 'admin@example.com',
      hasRole: jest.fn().mockReturnValue(true),
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
      User.findOne.mockResolvedValue(mockAdminUser);
    });

    it('should soft delete user successfully', async () => {
      const deletedUser = {
        _id: 'user123',
        name: 'Test User',
        isActive: false,
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(deletedUser),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=user123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('User deactivated successfully');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { isActive: false } },
        { new: true }
      );
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=user123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when user ID is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User ID is required');
    });

    it('should return 403 for non-admin users', async () => {
      const regularUser = {
        email: 'user@example.com',
        hasRole: jest.fn().mockReturnValue(false),
      };
      User.findOne.mockResolvedValue(regularUser);

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=user123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Admin access required');
    });

    it('should return 404 when user not found', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=invalid',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/users?id=user123',
        {
          method: 'DELETE',
        }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to delete user');
    });
  });

  describe('Edge Cases and Combined Filters', () => {
    beforeEach(() => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      User.countDocuments.mockResolvedValue(0);
    });

    it('should handle multiple filters combined', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/users?role=ADMIN&isActive=true&department=IT'
      );

      await GET(req);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'ADMIN',
          isActive: true,
          department: 'IT',
        })
      );
    });

    it('should handle search with other filters', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/users?search=john&role=USER&isActive=true'
      );

      await GET(req);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'USER',
          isActive: true,
          $or: expect.any(Array),
        })
      );
    });

    it('should handle empty results', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/users?role=NONEXISTENT'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });

    it('should handle large page numbers', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/users?page=100&limit=10'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.pagination.page).toBe(100);
    });

    it('should handle isActive=false filter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/users?isActive=false'
      );

      await GET(req);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });
  });
});
