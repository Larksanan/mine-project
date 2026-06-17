import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Message');
jest.mock('@/lib/auth');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockCountDocuments = Message.countDocuments as jest.MockedFunction<
  typeof Message.countDocuments
>;
const mockAggregate = Message.aggregate as jest.MockedFunction<
  typeof Message.aggregate
>;

describe('GET /api/messages/unread/count', () => {
  const originalConsoleError = console.error;
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return 401 if session exists but no user', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        // Session exists but no user object
        expires: new Date().toISOString(),
      } as any);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return 401 if user has no id', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          // No id property
        },
      });

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });
  });

  describe('Successful Response', () => {
    it('should return unread count successfully', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      const mockUnreadCount = 5;
      const mockUnreadByConversation = [
        { _id: 'conversation-1', count: 2 },
        { _id: 'conversation-2', count: 3 },
      ];

      mockCountDocuments.mockResolvedValue(mockUnreadCount);
      mockAggregate.mockResolvedValue(mockUnreadByConversation);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          totalUnread: mockUnreadCount,
          byConversation: mockUnreadByConversation,
        },
      });

      // Verify queries
      expect(mockCountDocuments).toHaveBeenCalledWith({
        receiverId: mockUserId,
        read: false,
      });

      expect(mockAggregate).toHaveBeenCalledWith([
        {
          $match: {
            receiverId: mockUserId,
            read: false,
          },
        },
        {
          $group: {
            _id: '$conversationId',
            count: { $sum: 1 },
          },
        },
      ]);
    });

    it('should handle zero unread messages', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          totalUnread: 0,
          byConversation: [],
        },
      });
    });

    it('should handle single conversation with unread messages', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockResolvedValue(3);
      mockAggregate.mockResolvedValue([{ _id: 'conversation-1', count: 3 }]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.totalUnread).toBe(3);
      expect(data.data.byConversation).toHaveLength(1);
      expect(data.data.byConversation[0].count).toBe(3);
    });

    it('should handle multiple conversations with varying unread counts', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockResolvedValue(10);
      mockAggregate.mockResolvedValue([
        { _id: 'conversation-1', count: 1 },
        { _id: 'conversation-2', count: 3 },
        { _id: 'conversation-3', count: 6 },
      ]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.totalUnread).toBe(10);
      expect(data.data.byConversation).toHaveLength(3);

      // Verify counts sum to total
      const sum = data.data.byConversation.reduce(
        (acc: number, item: any) => acc + item.count,
        0
      );
      expect(sum).toBe(10);
    });

    it('should work with minimal session data', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          // No other properties
        },
      });

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should work with full session data', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'DOCTOR',
          image: 'https://example.com/avatar.jpg',
          customField: 'customValue',
        },
        expires: '2024-12-31T23:59:59.999Z',
      } as any);

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should handle countDocuments errors', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockRejectedValue(new Error('Count query failed'));

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should handle aggregate errors', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockRejectedValue(new Error('Aggregate query failed'));

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should handle unexpected errors', async () => {
      // Arrange
      mockGetServerSession.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large unread counts', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      const largeCount = 9999;
      mockCountDocuments.mockResolvedValue(largeCount);

      // Mock aggregate with many conversations
      const mockConversations = Array.from({ length: 100 }, (_, i) => ({
        _id: `conversation-${i}`,
        count: Math.floor(Math.random() * 100) + 1,
      }));

      const _totalFromAggregate = mockConversations.reduce(
        (sum, item) => sum + item.count,
        0
      );

      mockAggregate.mockResolvedValue(mockConversations);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.totalUnread).toBe(largeCount);
      expect(data.data.byConversation).toHaveLength(100);

      // Note: The total from aggregate might not match countDocuments if there's data inconsistency
      // This could reveal a potential data consistency issue
    });

    it('should handle conversations with null or undefined conversationId', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockResolvedValue(3);

      // Simulate aggregate returning null _id for messages without conversationId
      mockAggregate.mockResolvedValue([
        { _id: null, count: 1 }, // Messages without conversationId
        { _id: 'conversation-1', count: 2 },
      ]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.byConversation).toContainEqual({ _id: null, count: 1 });
    });

    it('should handle empty conversations array in aggregate result', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.byConversation).toEqual([]);
    });

    it('should handle inconsistent data between count and aggregate', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      // Simulate countDocuments returning different value than aggregate sum
      mockCountDocuments.mockResolvedValue(10);
      mockAggregate.mockResolvedValue([
        { _id: 'conversation-1', count: 3 },
        { _id: 'conversation-2', count: 4 },
        // Sum is 7, but countDocuments says 10 - could happen in distributed systems
      ]);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      // Both values are returned as-is, no validation is performed
      expect(data.data.totalUnread).toBe(10);
      const sum = data.data.byConversation.reduce(
        (acc: number, item: any) => acc + item.count,
        0
      );
      expect(sum).toBe(7); // Different from totalUnread
      // This reveals potential data inconsistency that might need addressing
    });

    it('should handle receiverId with special characters', async () => {
      // Arrange
      const mockUserId = 'user-123@domain.com'; // Email as ID
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET();
      const _data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockCountDocuments).toHaveBeenCalledWith({
        receiverId: 'user-123@domain.com',
        read: false,
      });
    });

    it('should handle session with string ID', async () => {
      // Arrange
      const mockUserId = '507f1f77bcf86cd799439011'; // MongoDB ObjectId as string
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockCountDocuments.mockResolvedValue(0);
      mockAggregate.mockResolvedValue([]);

      // Act
      const response = await GET();
      const _data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockCountDocuments).toHaveBeenCalledWith({
        receiverId: '507f1f77bcf86cd799439011',
        read: false,
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain query consistency across both queries', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      const unreadCount = 5;
      const conversationCounts = [
        { _id: 'conversation-1', count: 2 },
        { _id: 'conversation-2', count: 3 },
      ];

      mockCountDocuments.mockResolvedValue(unreadCount);
      mockAggregate.mockResolvedValue(conversationCounts);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);

      // Both queries should use the same receiverId
      expect(mockCountDocuments).toHaveBeenCalledWith({
        receiverId: mockUserId,
        read: false,
      });

      expect(mockAggregate).toHaveBeenCalledWith([
        {
          $match: {
            receiverId: mockUserId,
            read: false,
          },
        },
        {
          $group: {
            _id: '$conversationId',
            count: { $sum: 1 },
          },
        },
      ]);

      // Sum of conversation counts should equal total (in consistent data)
      const sum = conversationCounts.reduce((acc, item) => acc + item.count, 0);
      expect(data.data.totalUnread).toBe(unreadCount);
      expect(sum).toBe(unreadCount);
    });
  });
});
