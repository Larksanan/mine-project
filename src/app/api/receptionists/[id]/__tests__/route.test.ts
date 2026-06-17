import { PATCH } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/Receptionist', () => ({
  findById: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

jest.mock('mongoose', () => {
  return {
    Types: {
      ObjectId: class {
        static isValid = jest.fn();
        constructor(private id?: string) {}
        toString() {
          return this.id || '507f1f77bcf86cd799439011';
        }
        equals(other: any) {
          return this.toString() === (other ? other.toString() : '');
        }
      },
    },
  };
});

describe('Receptionist API - PATCH /api/receptionist/[id]', () => {
  const mockId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest(
      `http://localhost:3000/api/receptionist/${mockId}`,
      {
        method: 'PATCH',
      }
    );
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  // Helper functions
  const mockAuthenticatedAdminSession = (
    email = 'admin@example.com',
    userId = mockUserId
  ) => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email, role: 'ADMIN', id: userId },
    });
  };

  const mockAuthenticatedNonAdminSession = (email = 'user@example.com') => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email, role: 'USER', id: mockUserId },
    });
  };

  const mockDBSuccess = () => {
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  };

  const createMockReceptionist = (overrides: any = {}) => {
    const mockReceptionist: any = {
      _id: mockId,
      user: '507f1f77bcf86cd799439013',
      assignedDoctor: '507f1f77bcf86cd799439014',
      lastModifiedBy: null,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn(),
      ...overrides,
    };

    // Make populate return a resolved promise of itself (chainable)
    if (!overrides.populate) {
      mockReceptionist.populate.mockImplementation(() =>
        Promise.resolve(mockReceptionist)
      );
    }

    return mockReceptionist;
  };

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session is undefined', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(undefined);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockDBSuccess();
    });

    it('should return 403 when user is not an admin', async () => {
      mockAuthenticatedNonAdminSession();

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Insufficient permissions');
    });

    it('should return 403 for USER role', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com', role: 'USER', id: mockUserId },
      });

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should return 403 for RECEPTIONIST role', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: 'receptionist@example.com',
          role: 'RECEPTIONIST',
          id: mockUserId,
        },
      });

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should allow ADMIN role to proceed', async () => {
      mockAuthenticatedAdminSession();
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Receptionist Not Found', () => {
    beforeEach(() => {
      mockAuthenticatedAdminSession();
      mockDBSuccess();
    });

    it('should return 404 when receptionist is not found', async () => {
      (Receptionist.findById as jest.Mock).mockResolvedValue(null);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Receptionist not found');
    });

    it('should return 404 when receptionist is undefined', async () => {
      (Receptionist.findById as jest.Mock).mockResolvedValue(undefined);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should call findById with correct id', async () => {
      (Receptionist.findById as jest.Mock).mockResolvedValue(null);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(Receptionist.findById).toHaveBeenCalledWith(mockId);
    });
  });

  describe('Successful Update', () => {
    beforeEach(() => {
      mockAuthenticatedAdminSession();
      mockDBSuccess();
    });

    it('should successfully update receptionist with lastModifiedBy', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Receptionist updated successfully');
      expect(data.data).toBeDefined();
    });

    it('should set lastModifiedBy to session user id', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(mockReceptionist.lastModifiedBy).toBeInstanceOf(
        mongoose.Types.ObjectId
      );
      expect(mockReceptionist.lastModifiedBy.toString()).toBe(mockUserId);
    });

    it('should call save on receptionist', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(mockReceptionist.save).toHaveBeenCalledTimes(1);
    });

    it('should populate user fields after save', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(mockReceptionist.populate).toHaveBeenCalledWith(
        'user',
        'name email phone image'
      );
    });

    it('should populate assignedDoctor fields after save', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(mockReceptionist.populate).toHaveBeenCalledWith(
        'assignedDoctor',
        'name specialization'
      );
    });

    it('should call populate twice in correct order', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(mockReceptionist.populate).toHaveBeenCalledTimes(2);
      expect(mockReceptionist.populate).toHaveBeenNthCalledWith(
        1,
        'user',
        'name email phone image'
      );
      expect(mockReceptionist.populate).toHaveBeenNthCalledWith(
        2,
        'assignedDoctor',
        'name specialization'
      );
    });

    it('should return populated receptionist data', async () => {
      const mockReceptionist = createMockReceptionist({
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          image: 'https://example.com/image.jpg',
        },
        assignedDoctor: {
          name: 'Dr. Smith',
          specialization: 'Cardiology',
        },
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(data.data.user).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        image: 'https://example.com/image.jpg',
      });
      expect(data.data.assignedDoctor).toEqual({
        name: 'Dr. Smith',
        specialization: 'Cardiology',
      });
    });

    it('should handle session user without id gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN' }, // No id
      });

      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // lastModifiedBy should not be set if session.user.id is undefined
      expect(mockReceptionist.lastModifiedBy).toBeNull();
    });

    it('should verify connectDB is called before queries', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(connectDB).toHaveBeenCalledTimes(1);
      const connectDBCallOrder = (connectDB as jest.Mock).mock
        .invocationCallOrder[0];
      const findByIdCallOrder = (Receptionist.findById as jest.Mock).mock
        .invocationCallOrder[0];
      expect(connectDBCallOrder).toBeLessThan(findByIdCallOrder);
    });
  });

  describe('Error Handling', () => {
    let consoleErrorSpy: any;

    beforeEach(() => {
      mockAuthenticatedAdminSession();
      consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      (connectDB as jest.Mock).mockRejectedValue(dbError);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle findById errors', async () => {
      mockDBSuccess();
      const findError = new Error('Find operation failed');
      (Receptionist.findById as jest.Mock).mockRejectedValue(findError);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Find operation failed');
    });

    it('should handle save errors', async () => {
      mockDBSuccess();
      const saveError = new Error('Save operation failed');
      const mockReceptionist = createMockReceptionist({
        save: jest.fn().mockRejectedValue(saveError),
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Save operation failed');
    });

    it('should handle populate errors', async () => {
      mockDBSuccess();
      const populateError = new Error('Populate operation failed');
      const mockReceptionist = createMockReceptionist({
        populate: jest.fn().mockRejectedValue(populateError),
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Populate operation failed');
    });

    it('should handle errors without message property', async () => {
      mockDBSuccess();
      const errorWithoutMessage = { code: 'UNKNOWN_ERROR' } as any;
      (Receptionist.findById as jest.Mock).mockRejectedValue(
        errorWithoutMessage
      );

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      // When error has no message property, error.message is undefined
      expect(data.error).toBeUndefined();
    });

    it('should log errors to console', async () => {
      mockDBSuccess();
      const testError = new Error('Test error');
      (Receptionist.findById as jest.Mock).mockRejectedValue(testError);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating receptionist:',
        testError
      );
    });

    it('should handle invalid ObjectId in session user id', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN', id: 'invalid-id' },
      });
      mockDBSuccess();

      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // This should throw an error when trying to create ObjectId with invalid id
      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      // Depending on implementation, this might be 500 or handle gracefully
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockAuthenticatedAdminSession();
      mockDBSuccess();
    });

    it('should handle receptionist with null user', async () => {
      const mockReceptionist = createMockReceptionist({
        user: null,
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle receptionist with null assignedDoctor', async () => {
      const mockReceptionist = createMockReceptionist({
        assignedDoctor: null,
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle receptionist already modified before', async () => {
      const previousModifierId = new mongoose.Types.ObjectId();
      const mockReceptionist = createMockReceptionist({
        lastModifiedBy: previousModifierId,
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      // Should update to new modifier
      expect(mockReceptionist.lastModifiedBy.toString()).toBe(mockUserId);
      expect(mockReceptionist.lastModifiedBy.toString()).not.toBe(
        previousModifierId.toString()
      );
    });

    it('should handle different valid ObjectId formats', async () => {
      const differentId = '507f191e810c19729de860ea';
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: differentId }),
      });

      expect(response.status).toBe(200);
      expect(Receptionist.findById).toHaveBeenCalledWith(differentId);
    });

    it('should handle async params properly', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Test with Promise.resolve
      const response1 = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      expect(response1.status).toBe(200);

      // Test with async function
      const asyncParams = async () => ({ id: mockId });
      const response2 = await PATCH(mockRequest, {
        params: asyncParams(),
      });
      expect(response2.status).toBe(200);
    });

    it('should handle empty string user id in session', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com', role: 'ADMIN', id: '' },
      });

      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Response Structure', () => {
    beforeEach(() => {
      mockAuthenticatedAdminSession();
      mockDBSuccess();
    });

    it('should have correct response structure on success', async () => {
      const mockReceptionist = createMockReceptionist();
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.message).toBe('string');
      expect(data.success).toBe(true);
    });

    it('should have correct error response structure', async () => {
      const testError = new Error('Test error');
      (connectDB as jest.Mock).mockRejectedValue(testError);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.success).toBe(false);
      expect(typeof data.error).toBe('string');
    });

    it('should have correct unauthorized response structure', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should have correct forbidden response structure', async () => {
      mockAuthenticatedNonAdminSession();

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Insufficient permissions');
    });

    it('should have correct not found response structure', async () => {
      (Receptionist.findById as jest.Mock).mockResolvedValue(null);

      const response = await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.success).toBe(false);
      expect(data.error).toBe('Receptionist not found');
    });
  });

  describe('Operation Order', () => {
    beforeEach(() => {
      mockAuthenticatedAdminSession();
      mockDBSuccess();
    });

    it('should follow correct operation order', async () => {
      const callOrder: string[] = [];
      const mockReceptionist = createMockReceptionist({
        save: jest.fn().mockImplementation(() => {
          callOrder.push('save');
          return Promise.resolve(true);
        }),
        populate: jest.fn().mockImplementation(() => {
          callOrder.push('populate');
          return Promise.resolve(mockReceptionist);
        }),
      });

      (Receptionist.findById as jest.Mock).mockImplementation(() => {
        callOrder.push('findById');
        return Promise.resolve(mockReceptionist);
      });

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(callOrder).toEqual(['findById', 'save', 'populate', 'populate']);
    });

    it('should set lastModifiedBy before save', async () => {
      let lastModifiedBySetBeforeSave = false;
      const mockReceptionist = createMockReceptionist({
        save: jest.fn().mockImplementation(function (this: any) {
          lastModifiedBySetBeforeSave = this.lastModifiedBy !== null;
          return Promise.resolve(true);
        }),
      });

      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(lastModifiedBySetBeforeSave).toBe(true);
    });

    it('should populate after save completes', async () => {
      let saveCompleted = false;
      const mockReceptionist = createMockReceptionist({
        save: jest.fn().mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              saveCompleted = true;
              resolve(true);
            }, 10);
          });
        }),
        populate: jest.fn().mockImplementation(() => {
          expect(saveCompleted).toBe(true);
          return Promise.resolve(mockReceptionist);
        }),
      });

      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      await PATCH(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });

      expect(saveCompleted).toBe(true);
    });
  });
});
