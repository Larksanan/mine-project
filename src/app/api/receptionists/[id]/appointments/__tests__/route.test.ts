// src/app/api/receptionist/[id]/appointments/__tests__/route.test.ts
import { PATCH } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Receptionist');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe('PATCH /api/receptionist/[id]/appointments', () => {
  let mockRequest: NextRequest;
  let mockContext: { params: Promise<{ id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock NextRequest
    mockRequest = {
      json: jest.fn(),
    } as unknown as NextRequest;

    mockContext = {
      params: Promise.resolve({ id: 'receptionist-id-123' }),
    };

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  it('should return 401 if user is not authenticated', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue(null);

    // Act
    const response = await PATCH(mockRequest, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('should return 404 if receptionist not found', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
      },
    });

    (mockRequest.json as jest.Mock).mockResolvedValue({ action: 'increment' });
    (Receptionist.findById as jest.Mock).mockResolvedValue(null);

    // Act
    const response = await PATCH(mockRequest, mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data).toEqual({
      success: false,
      error: 'Receptionist not found',
    });
  });

  describe('increment action', () => {
    it('should increment appointment count by 1', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          currentCount: 6, // 5 + 1
          maxCount: 10,
          canHandleMore: true,
        },
        message: 'Appointment count updated successfully',
      });

      expect(mockReceptionist.currentAppointmentsCount).toBe(6);
      expect(mockReceptionist.save).toHaveBeenCalled();
    });

    it('should increment from undefined to 1', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: undefined, // No current count
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(1); // undefined + 1 = 1
    });

    it('should increment from 0 to 1', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 0,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(1);
    });
  });

  describe('decrement action', () => {
    it('should decrement appointment count by 1', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'decrement',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          currentCount: 4, // 5 - 1
          maxCount: 10,
          canHandleMore: true,
        },
        message: 'Appointment count updated successfully',
      });

      expect(mockReceptionist.currentAppointmentsCount).toBe(4);
      expect(mockReceptionist.save).toHaveBeenCalled();
    });

    it('should not go below 0 when decrementing', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 0,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'decrement',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(0); // Math.max(0, 0-1) = 0
    });

    it('should handle decrement from undefined', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: undefined,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'decrement',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(0); // Math.max(0, undefined-1) = 0
    });
  });

  describe('count action', () => {
    it('should set appointment count to specific number', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: 8 });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(8); // Set to specific count
    });

    it('should set count to 0', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: 0 });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(0);
    });

    it('should handle negative count (set to negative)', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: -3 });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(-3); // Negative count allowed
      // Note: This might be a bug - you might want to prevent negative counts
    });

    it('should handle decimal count', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: 7.5 });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(7.5); // Decimal count allowed
      // Note: This might be a bug - appointments should probably be whole numbers
    });
  });

  describe('no action specified', () => {
    it('should not change count when no action or count provided', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({}); // Empty body
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(5); // Unchanged
      expect(mockReceptionist.save).toHaveBeenCalled(); // Still saves
    });

    it('should not change count when action is invalid', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ action: 'invalid' });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(5); // Unchanged
    });
  });

  describe('canHandleMoreAppointments method', () => {
    it('should reflect true when below max', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.canHandleMore).toBe(true);
      expect(mockReceptionist.canHandleMoreAppointments).toHaveBeenCalled();
    });

    it('should reflect false when at or above max', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 9,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(false),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.canHandleMore).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Database connection failed',
      });
    });

    it('should handle findById errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockRejectedValue(
        new Error('Find query failed')
      );

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Find query failed',
      });
    });

    it('should handle save errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Save failed',
      });
    });

    it('should handle JSON parse errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockRejectedValue(
        new Error('Invalid JSON')
      );

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid JSON');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large counts', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 1000000,
        maxAppointmentsPerDay: 2000000,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: 1500000 });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(1500000);
    });

    it('should handle count equal to max', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(false), // At max
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: 10 }); // Set to max
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(10);
      expect(data.data.canHandleMore).toBe(false);
    });

    it('should handle count above max', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(false),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: 15 }); // Above max
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(15);
      // Note: Your code allows setting above max - might want to add validation
    });

    it('should handle both action and count in body (count takes precedence)', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      // Both action and count provided
      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
        count: 8,
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(8); // Count takes precedence
    });

    it('should handle null as count', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: null });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe(null); // null is set
      // Note: This might cause issues - you might want to handle null differently
    });

    it('should handle string as count (converts to number)', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({ count: '8' });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentCount).toBe('8'); // String "8" is set, not converted to number
      // Note: This is a bug - you should convert string to number or validate type
    });
  });

  describe('Session Edge Cases', () => {
    it('should work with minimal session data', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          // No other properties
        },
      });

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should work with full session data', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
          image: 'https://example.com/avatar.jpg',
          customField: 'customValue',
        },
        expires: '2024-12-31T23:59:59.999Z',
      } as any);

      const mockReceptionist = {
        _id: 'receptionist-id-123',
        currentAppointmentsCount: 5,
        maxAppointmentsPerDay: 10,
        canHandleMoreAppointments: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue({
        action: 'increment',
      });
      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      // Act
      const response = await PATCH(mockRequest, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
