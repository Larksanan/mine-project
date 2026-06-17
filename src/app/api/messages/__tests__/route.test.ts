import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Message');
jest.mock('@/models/Conversation');
jest.mock('@/lib/auth');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe('Messages API', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create a mock NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/messages',
      headers: new Headers(),
      json: jest.fn(),
    } as unknown as NextRequest;

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /api/messages', () => {
    beforeEach(() => {
      (mockRequest.json as jest.Mock).mockResolvedValue({});
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return 400 if receiverId is missing', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        content: 'Hello there',
        // Missing receiverId
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Receiver ID and content are required',
      });
    });

    it('should return 400 if content is missing', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        receiverId: 'user-456',
        // Missing content
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Receiver ID and content are required',
      });
    });

    it('should create new conversation and send message when no conversation exists', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockReceiverId = 'user-456';
      const mockContent = 'Hello, how are you?';

      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        receiverId: mockReceiverId,
        content: mockContent,
        messageType: 'text',
      });

      // Mock: No existing conversation found
      (Conversation.findOne as jest.Mock).mockResolvedValue(null);

      // Mock: Create new conversation
      const mockConversation = {
        _id: 'conversation-123',
        participants: [mockUserId, mockReceiverId],
      };
      (Conversation.create as jest.Mock).mockResolvedValue(mockConversation);

      // Mock: Create message
      const mockMessage = {
        _id: 'message-123',
        conversationId: mockConversation._id,
        senderId: mockUserId,
        receiverId: mockReceiverId,
        content: mockContent,
        messageType: 'text',
        read: false,
        createdAt: new Date(),
      };
      (Message.create as jest.Mock).mockResolvedValue(mockMessage);

      // Mock: Update conversation
      (Conversation.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: mockConversation._id,
        lastMessage: mockMessage._id,
        updatedAt: new Date(),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          ...mockMessage,
          createdAt: mockMessage.createdAt.toISOString(),
        },
        message: 'Message sent successfully',
      });

      // Verify Conversation.findOne was called with correct query
      expect(Conversation.findOne).toHaveBeenCalledWith({
        participants: { $all: [mockUserId, mockReceiverId] },
      });

      // Verify Conversation.create was called
      expect(Conversation.create).toHaveBeenCalledWith({
        participants: [mockUserId, mockReceiverId],
      });

      // Verify Message.create was called with correct data
      expect(Message.create).toHaveBeenCalledWith({
        conversationId: mockConversation._id,
        senderId: mockUserId,
        receiverId: mockReceiverId,
        content: mockContent,
        messageType: 'text',
        read: false,
      });

      // Verify Conversation.findByIdAndUpdate was called
      expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith(
        mockConversation._id,
        {
          lastMessage: mockMessage._id,
          updatedAt: expect.any(Date),
        }
      );
    });

    it('should use existing conversation and send message', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockReceiverId = 'user-456';
      const mockContent = 'Hello, how are you?';

      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        receiverId: mockReceiverId,
        content: mockContent,
        messageType: 'image', // Different message type
      });

      // Mock: Existing conversation found
      const mockConversation = {
        _id: 'existing-conversation-123',
        participants: [mockUserId, mockReceiverId],
      };
      (Conversation.findOne as jest.Mock).mockResolvedValue(mockConversation);

      // Mock: Create message
      const mockMessage = {
        _id: 'message-123',
        conversationId: mockConversation._id,
        senderId: mockUserId,
        receiverId: mockReceiverId,
        content: mockContent,
        messageType: 'image',
        read: false,
        createdAt: new Date(),
      };
      (Message.create as jest.Mock).mockResolvedValue(mockMessage);

      // Mock: Update conversation
      (Conversation.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: mockConversation._id,
        lastMessage: mockMessage._id,
        updatedAt: new Date(),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify Conversation.create was NOT called
      expect(Conversation.create).not.toHaveBeenCalled();

      // Verify Message.create was called with correct data
      expect(Message.create).toHaveBeenCalledWith({
        conversationId: mockConversation._id,
        senderId: mockUserId,
        receiverId: mockReceiverId,
        content: mockContent,
        messageType: 'image',
        read: false,
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        receiverId: 'user-456',
        content: 'Hello',
        messageType: 'text',
      });

      // Mock: Conversation.findOne throws error
      (Conversation.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should handle connection errors', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        receiverId: 'user-456',
        content: 'Hello',
      });

      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should handle message creation errors', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockReceiverId = 'user-456';

      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        receiverId: mockReceiverId,
        content: 'Hello',
        messageType: 'text',
      });

      // Mock: Conversation found
      const mockConversation = {
        _id: 'conversation-123',
        participants: [mockUserId, mockReceiverId],
      };
      (Conversation.findOne as jest.Mock).mockResolvedValue(mockConversation);

      // Mock: Message.create throws error
      (Message.create as jest.Mock).mockRejectedValue(
        new Error('Message creation failed')
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('GET /api/messages', () => {
    beforeEach(() => {
      mockRequest = {
        url: 'http://localhost:3000/api/messages',
        headers: new Headers(),
        json: jest.fn(),
      } as unknown as NextRequest;
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should fetch conversations with pagination', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      const mockConversations = [
        {
          _id: 'conversation-1',
          participants: [
            { _id: 'user-123', name: 'John Doe', email: 'john@example.com' },
            { _id: 'user-456', name: 'Jane Smith', email: 'jane@example.com' },
          ],
          lastMessage: {
            _id: 'message-1',
            content: 'Hello there',
            createdAt: new Date(),
          },
          updatedAt: new Date('2024-01-01'),
        },
        {
          _id: 'conversation-2',
          participants: [
            { _id: 'user-123', name: 'John Doe', email: 'john@example.com' },
            { _id: 'user-789', name: 'Bob Johnson', email: 'bob@example.com' },
          ],
          lastMessage: {
            _id: 'message-2',
            content: 'See you tomorrow',
            createdAt: new Date(),
          },
          updatedAt: new Date('2024-01-02'),
        },
      ];

      // Mock Conversation.find chain
      const mockLean = jest.fn().mockResolvedValue(mockConversations);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

      const mockQueryObj: any = {
        sort: mockSort,
      };
      mockQueryObj.populate = jest.fn().mockReturnValue(mockQueryObj);
      const mockFind = jest.fn().mockReturnValue(mockQueryObj);

      (Conversation.find as jest.Mock).mockImplementation(mockFind);
      (Conversation.countDocuments as jest.Mock).mockResolvedValue(2);

      // Mock Message.countDocuments for each conversation
      (Message.countDocuments as jest.Mock)
        .mockResolvedValueOnce(3) // Unread count for conversation-1
        .mockResolvedValueOnce(0); // Unread count for conversation-2

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        pages: 1,
      });

      // Verify Conversation.find was called with correct query
      expect(Conversation.find).toHaveBeenCalledWith({
        participants: mockUserId,
      });

      // Verify populate calls
      expect(mockQueryObj.populate).toHaveBeenCalledWith({
        path: 'participants',
        select: '_id name email role avatar',
      });
      expect(mockQueryObj.populate).toHaveBeenCalledWith('lastMessage');

      // Verify sorting
      expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });

      // Verify pagination
      expect(mockSkip).toHaveBeenCalledWith(0); // (page-1) * limit = 0
      expect(mockLimit).toHaveBeenCalledWith(20);

      // Verify unread count queries
      expect(Message.countDocuments).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        receiverId: mockUserId,
        read: false,
      });
      expect(Message.countDocuments).toHaveBeenCalledWith({
        conversationId: 'conversation-2',
        receiverId: mockUserId,
        read: false,
      });
    });

    it('should handle custom pagination parameters', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockRequest = {
        url: 'http://localhost:3000/api/messages?page=2&limit=10',
        headers: new Headers(),
        json: jest.fn(),
      } as unknown as NextRequest;

      const mockConversations: any[] = [];
      const mockLean = jest.fn().mockResolvedValue(mockConversations);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

      const mockQueryObj: any = {
        sort: mockSort,
      };
      mockQueryObj.populate = jest.fn().mockReturnValue(mockQueryObj);
      const mockFind = jest.fn().mockReturnValue(mockQueryObj);

      (Conversation.find as jest.Mock).mockImplementation(mockFind);
      (Conversation.countDocuments as jest.Mock).mockResolvedValue(15);

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.pagination).toEqual({
        total: 15,
        page: 2,
        limit: 10,
        pages: 2,
      });

      // Verify pagination calculations
      expect(mockSkip).toHaveBeenCalledWith(10); // (2-1) * 10 = 10
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should handle conversations without other participants', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      // Conversation where all participants have the same ID (edge case)
      const mockConversations = [
        {
          _id: 'conversation-1',
          participants: [
            { _id: 'user-123', name: 'John Doe' },
            // No other participant with different ID
          ],
          lastMessage: null,
          updatedAt: new Date(),
        },
      ];

      const mockLean = jest.fn().mockResolvedValue(mockConversations);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

      const mockQueryObj: any = {
        sort: mockSort,
      };
      mockQueryObj.populate = jest.fn().mockReturnValue(mockQueryObj);
      const mockFind = jest.fn().mockReturnValue(mockQueryObj);

      (Conversation.find as jest.Mock).mockImplementation(mockFind);
      (Conversation.countDocuments as jest.Mock).mockResolvedValue(1);
      (Message.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should handle edge case without crashing
      expect(data.data[0].otherParticipant).toEqual(
        mockConversations[0].participants[0]
      );
    });

    it('should handle empty conversations list', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      const mockConversations: any[] = [];
      const mockLean = jest.fn().mockResolvedValue(mockConversations);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

      const mockQueryObj: any = {
        sort: mockSort,
      };
      mockQueryObj.populate = jest.fn().mockReturnValue(mockQueryObj);
      const mockFind = jest.fn().mockReturnValue(mockQueryObj);

      (Conversation.find as jest.Mock).mockImplementation(mockFind);
      (Conversation.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.pages).toBe(0);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      // Mock Conversation.find to throw error
      const mockQueryObj: any = {
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      };
      mockQueryObj.populate = jest.fn().mockReturnValue(mockQueryObj);

      (Conversation.find as jest.Mock).mockReturnValue(mockQueryObj);

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should handle invalid pagination parameters', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      // Test with invalid page/limit values
      mockRequest = {
        url: 'http://localhost:3000/api/messages?page=abc&limit=xyz',
        headers: new Headers(),
        json: jest.fn(),
      } as unknown as NextRequest;

      const mockConversations: any[] = [];
      const mockLean = jest.fn().mockResolvedValue(mockConversations);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockQueryObj: any = {
        sort: mockSort,
      };
      mockQueryObj.populate = jest.fn().mockReturnValue(mockQueryObj);
      const mockFind = jest.fn().mockReturnValue(mockQueryObj);

      (Conversation.find as jest.Mock).mockImplementation(mockFind);
      (Conversation.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const _data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      // parseInt('abc') gives NaN, skip becomes NaN
      // Your code should handle NaN values
    });
  });

  describe('Edge Cases', () => {
    it('POST should handle self-messages (senderId === receiverId)', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        receiverId: mockUserId, // Same as sender
        content: 'Note to self',
        messageType: 'text',
      });

      // Mock conversation with same participant twice
      const mockConversation = {
        _id: 'conversation-123',
        participants: [mockUserId, mockUserId], // Same ID appears twice
      };
      (Conversation.findOne as jest.Mock).mockResolvedValue(mockConversation);

      const mockMessage = {
        _id: 'message-123',
        conversationId: mockConversation._id,
        senderId: mockUserId,
        receiverId: mockUserId,
        content: 'Note to self',
        messageType: 'text',
        read: false,
        createdAt: new Date(),
      };
      (Message.create as jest.Mock).mockResolvedValue(mockMessage);
      (Conversation.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('GET should handle conversations without lastMessage', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      const mockConversations = [
        {
          _id: 'conversation-1',
          participants: [
            { _id: 'user-123', name: 'John Doe' },
            { _id: 'user-456', name: 'Jane Smith' },
          ],
          lastMessage: null, // No last message
          updatedAt: new Date(),
        },
      ];

      const mockLean = jest.fn().mockResolvedValue(mockConversations);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockQueryObj: any = {
        sort: mockSort,
      };
      mockQueryObj.populate = jest.fn().mockReturnValue(mockQueryObj);
      const mockFind = jest.fn().mockReturnValue(mockQueryObj);

      (Conversation.find as jest.Mock).mockImplementation(mockFind);
      (Conversation.countDocuments as jest.Mock).mockResolvedValue(1);
      (Message.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0].lastMessage).toBeNull();
    });

    it('POST should handle different message types', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockReceiverId = 'user-456';

      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      const testCases = [
        { type: 'text', content: 'Hello' },
        { type: 'image', content: 'image.jpg' },
        { type: 'file', content: 'document.pdf' },
        { type: 'audio', content: 'audio.mp3' },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        (mockRequest.json as jest.Mock).mockResolvedValue({
          receiverId: mockReceiverId,
          content: testCase.content,
          messageType: testCase.type,
        });

        const mockConversation = {
          _id: 'conversation-123',
          participants: [mockUserId, mockReceiverId],
        };
        (Conversation.findOne as jest.Mock).mockResolvedValue(mockConversation);

        const mockMessage = {
          _id: 'message-123',
          conversationId: mockConversation._id,
          senderId: mockUserId,
          receiverId: mockReceiverId,
          content: testCase.content,
          messageType: testCase.type,
          read: false,
          createdAt: new Date(),
        };
        (Message.create as jest.Mock).mockResolvedValue(mockMessage);
        (Conversation.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

        // Act
        const response = await POST(mockRequest);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.messageType).toBe(testCase.type);
      }
    });

    it('GET should handle large number of conversations efficiently', async () => {
      // Arrange
      const mockUserId = 'user-123';
      mockGetServerSession.mockResolvedValue({
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      mockRequest = {
        url: 'http://localhost:3000/api/messages?limit=50',
        headers: new Headers(),
        json: jest.fn(),
      } as unknown as NextRequest;

      // Create mock for 50 conversations
      const mockConversations = Array(50)
        .fill(0)
        .map((_, i) => ({
          _id: `conversation-${i}`,
          participants: [
            { _id: 'user-123', name: 'John Doe' },
            { _id: `user-${i}`, name: `User ${i}` },
          ],
          lastMessage: { _id: `message-${i}`, content: `Message ${i}` },
          updatedAt: new Date(),
        }));

      const mockLean = jest.fn().mockResolvedValue(mockConversations);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockQueryObj: any = {
        sort: mockSort,
      };
      mockQueryObj.populate = jest.fn().mockReturnValue(mockQueryObj);
      const mockFind = jest.fn().mockReturnValue(mockQueryObj);

      (Conversation.find as jest.Mock).mockImplementation(mockFind);
      (Conversation.countDocuments as jest.Mock).mockResolvedValue(100);

      // Mock Message.countDocuments for each conversation
      (Message.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      const response = await GET(mockRequest as unknown as Request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(50);
      expect(data.pagination.limit).toBe(50);
      expect(Message.countDocuments).toHaveBeenCalledTimes(50);
    });
  });
});
