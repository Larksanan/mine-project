/* eslint-disable @typescript-eslint/no-require-imports */

// Define interfaces for mocks
interface MockUser {
  new (): any;
  findByIdAndUpdate: jest.Mock;
}

// Mock all dependencies
jest.mock('next/server', () => {
  return {
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

  // Add static methods
  (MockUser as any).findByIdAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: MockUser as MockUser,
  };
});

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Profile Image API', () => {
  let User: MockUser;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;
  let POST: any;
  let DELETE: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    User = require('@/models/User').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;
    const route = require('@/app/api/profile/image/route');
    POST = route.POST;
    DELETE = route.DELETE;

    // Default mock implementations
    connectDB.mockResolvedValue(undefined);
  });

  describe('POST /api/profile/image', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should return placeholder image URL for upload', async () => {
      const res = await POST();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.imageUrl).toBe('/images/placeholder-avatar.jpg');
      expect(data.message).toBe('Image upload functionality coming soon');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await POST();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle errors', async () => {
      getServerSession.mockRejectedValue(new Error('Session error'));

      const res = await POST();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/profile/image', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    const mockUpdatedUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should remove user profile image successfully', async () => {
      // Mock the update query: User.findByIdAndUpdate().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const res = await DELETE();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Image removed successfully');

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { image: null } },
        { new: true }
      );
      expect(mockSelect).toHaveBeenCalledWith('-password');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await DELETE();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle database errors', async () => {
      // Mock the update query to throw an error
      const mockSelect = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const res = await DELETE();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connection errors', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const res = await DELETE();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle empty session user ID', async () => {
      getServerSession.mockResolvedValue({
        user: { id: '' }, // Empty ID
      });

      const res = await DELETE();
      const _data = await res.json();

      // The route will try to call findByIdAndUpdate with empty string
      // This will likely result in a database error
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle undefined session user', async () => {
      // Mock session with undefined user property
      getServerSession.mockResolvedValue({
        user: undefined,
      });

      const res = await DELETE();
      const _data = await res.json();

      // The route will throw a TypeError when trying to access session.user.id
      // This gets caught and returns 500
      expect(res.status).toBe(500);
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should update image to null in database', async () => {
      // Mock the update query
      const mockSelect = jest.fn().mockResolvedValue({
        _id: 'user123',
        image: null,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const res = await DELETE();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { image: null } },
        { new: true }
      );
    });

    it('should not return password in response', async () => {
      // Mock the update query to return user without password
      const mockSelect = jest.fn().mockResolvedValue({
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        image: null,
        // No password field
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const res = await DELETE();
      const _data = await res.json();

      expect(res.status).toBe(200);
      expect(mockSelect).toHaveBeenCalledWith('-password');
    });

    it('should use new: true option to return updated document', async () => {
      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      await DELETE();

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $set: { image: null } },
        { new: true }
      );
    });
  });

  describe('Edge Cases', () => {
    it('POST should work with different user IDs', async () => {
      const differentSession = {
        user: { id: 'differentUser456' },
      };
      getServerSession.mockResolvedValue(differentSession);

      const res = await POST();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.imageUrl).toBe('/images/placeholder-avatar.jpg');
    });

    it('DELETE should work with different user IDs', async () => {
      const differentSession = {
        user: { id: 'differentUser456' },
      };
      getServerSession.mockResolvedValue(differentSession);

      const mockSelect = jest.fn().mockResolvedValue({
        _id: 'differentUser456',
        image: null,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const res = await DELETE();
      const _data = await res.json();

      expect(res.status).toBe(200);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'differentUser456',
        { $set: { image: null } },
        { new: true }
      );
    });

    it('should handle multiple consecutive calls', async () => {
      // Test POST then DELETE
      getServerSession.mockResolvedValue({ user: { id: 'user123' } });

      // First POST call
      const postRes = await POST();
      const postData = await postRes.json();
      expect(postRes.status).toBe(200);
      expect(postData.success).toBe(true);

      // Setup DELETE mock
      const mockSelect = jest.fn().mockResolvedValue({
        _id: 'user123',
        image: null,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      // Then DELETE call
      const deleteRes = await DELETE();
      const deleteData = await deleteRes.json();
      expect(deleteRes.status).toBe(200);
      expect(deleteData.success).toBe(true);
    });
  });
});
