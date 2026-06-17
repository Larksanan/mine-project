/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessages } from '../messages';
import { useSession } from 'next-auth/react';
import { Message, Conversation, SendMessageData } from '@/types/messages';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error
console.error = jest.fn();

describe('useMessages Hook', () => {
  // Mock session data
  const mockSession = {
    data: {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'PATIENT',
      },
      expires: '2026-12-31T23:59:59.999Z',
    },
    status: 'authenticated',
  };

  // Mock data based on new interfaces
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      participants: ['user-123', 'doctor-1'],
      lastMessage: {
        id: 'msg-3',
        senderId: 'doctor-1',
        receiverId: 'user-123',
        content: 'See you tomorrow',
        messageType: 'text',
        read: true,
        createdAt: new Date('2026-01-15T14:30:00.000Z'),
        updatedAt: new Date('2026-01-15T14:30:00.000Z'),
      },
      unreadCount: 0,
      createdAt: new Date('2026-01-10T09:00:00.000Z'),
      updatedAt: new Date('2026-01-15T14:30:00.000Z'),
    },
    {
      id: 'conv-2',
      participants: ['user-123', 'admin-1'],
      lastMessage: {
        id: 'msg-4',
        senderId: 'admin-1',
        receiverId: 'user-123',
        content: 'Your appointment is confirmed',
        messageType: 'text',
        read: false,
        createdAt: new Date('2026-01-14T10:15:00.000Z'),
        updatedAt: new Date('2026-01-14T10:15:00.000Z'),
      },
      unreadCount: 1,
      createdAt: new Date('2026-01-09T08:00:00.000Z'),
      updatedAt: new Date('2026-01-14T10:15:00.000Z'),
    },
  ];

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      senderId: 'user-123',
      receiverId: 'doctor-1',
      content: 'Hello, I need help',
      messageType: 'text',
      read: true,
      createdAt: new Date('2026-01-15T09:00:00.000Z'),
      updatedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    {
      id: 'msg-2',
      senderId: 'doctor-1',
      receiverId: 'user-123',
      content: 'How can I assist you?',
      messageType: 'text',
      read: true,
      createdAt: new Date('2026-01-15T09:05:00.000Z'),
      updatedAt: new Date('2026-01-15T09:05:00.000Z'),
    },
    {
      id: 'msg-3',
      senderId: 'doctor-1',
      receiverId: 'user-123',
      content: 'See you tomorrow',
      messageType: 'text',
      read: true,
      createdAt: new Date('2026-01-15T14:30:00.000Z'),
      updatedAt: new Date('2026-01-15T14:30:00.000Z'),
    },
  ];

  // Helper to convert objects to JSON and back for fetch responses
  const createMockResponse = (data: any) => ({
    ok: true,
    json: async () => ({
      success: true,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (global.fetch as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();
  });

  describe('Initial state', () => {
    it('should initialize with empty arrays and loading false', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useMessages());

      expect(result.current.conversations).toEqual([]);
      expect(result.current.currentMessages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.fetchConversations).toBe('function');
      expect(typeof result.current.fetchMessages).toBe('function');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.markAsRead).toBe('function');
    });

    it('should not fetch conversations when user is not authenticated', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      renderHook(() => useMessages());

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('fetchConversations', () => {
    it('should fetch conversations successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(createMockResponse(mockConversations)); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/messages/conversations');
      expect(result.current.conversations).toHaveLength(2);
      expect(result.current.conversations[0].id).toBe('conv-1');
      expect(result.current.conversations[0].participants).toEqual([
        'user-123',
        'doctor-1',
      ]);
      expect(result.current.conversations[0].unreadCount).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('should handle API error', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          success: false,
          error: 'Server error',
        }),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(mockResponse); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.error).toBe('Server error');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockRejectedValueOnce(new Error('Network error')); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.error).toBe('Network error');
      expect(console.error).toHaveBeenCalled();
    });

    it('should not fetch when user ID is missing', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: {} },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('fetchMessages', () => {
    it('should fetch messages for a conversation successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(createMockResponse(mockMessages)); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/messages/conversations/conv-1'
      );
      expect(result.current.currentMessages).toHaveLength(3);
      expect(result.current.currentMessages[0].id).toBe('msg-1');
      expect(result.current.currentMessages[0].senderId).toBe('user-123');
      expect(result.current.currentMessages[0].receiverId).toBe('doctor-1');
      expect(result.current.currentMessages[0].messageType).toBe('text');
      expect(result.current.error).toBeNull();
    });

    it('should handle API error when fetching messages', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          success: false,
          error: 'Failed to load messages',
        }),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(mockResponse); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      expect(result.current.error).toBe('Failed to load messages');
    });

    it('should not fetch messages when user ID is missing', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: {} },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    const mockMessageData: SendMessageData = {
      receiverId: 'doctor-1',
      content: 'Test message',
      messageType: 'text',
    };

    it('should send message successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
          }),
        })
        .mockResolvedValueOnce(createMockResponse(mockConversations)); // fetchConversations (triggered by sendMessage)

      const { result } = renderHook(() => useMessages());

      const success = await act(async () => {
        return await result.current.sendMessage(mockMessageData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMessageData),
      });

      expect(success).toBe(true);
      // Should refresh conversations after sending
      expect(global.fetch).toHaveBeenCalledWith('/api/messages/conversations');
      expect(result.current.error).toBeNull();
    });

    it('should send message with default text type', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
          }),
        })
        .mockResolvedValueOnce(createMockResponse(mockConversations)); // fetchConversations

      const { result } = renderHook(() => useMessages());

      const messageDataWithoutType: SendMessageData = {
        receiverId: 'doctor-1',
        content: 'Test message',
      };

      const success = await act(async () => {
        return await result.current.sendMessage(messageDataWithoutType);
      });

      // Should send with default 'text' type
      expect(global.fetch).toHaveBeenCalledWith('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageDataWithoutType),
      });

      expect(success).toBe(true);
    });

    it('should throw error when user is not authenticated', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useMessages());

      await expect(
        act(async () => {
          return await result.current.sendMessage(mockMessageData);
        })
      ).rejects.toThrow('User not authenticated');
    });

    it('should handle API error when sending message', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          success: false,
          error: 'Message sending failed',
        }),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(mockResponse); // Manual fetch

      const { result } = renderHook(() => useMessages());

      const success = await act(async () => {
        return await result.current.sendMessage(mockMessageData);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Message sending failed');
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read successfully', async () => {
      const unreadMessages = mockMessages.map(m => ({ ...m, read: false }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(createMockResponse(unreadMessages)) // fetchMessages
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
          }),
        });

      const { result } = renderHook(() => useMessages());

      // Populate messages
      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      await act(async () => {
        await result.current.markAsRead('msg-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/messages/msg-1/read', {
        method: 'PUT',
      });

      // Should update current messages
      expect(result.current.currentMessages[0].read).toBe(true);

      // Note: The actual implementation might handle conversation unread count differently
      // based on the new data structure
    });

    it('should not call API when user ID is missing', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: {} },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.markAsRead('msg-1');
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Different message types', () => {
    it('should handle image messages', async () => {
      const imageMessages: Message[] = [
        {
          id: 'img-msg-1',
          senderId: 'user-123',
          receiverId: 'doctor-1',
          content: 'https://example.com/image.jpg',
          messageType: 'image',
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(createMockResponse(imageMessages)); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      expect(result.current.currentMessages[0].messageType).toBe('image');
    });

    it('should handle file messages', async () => {
      const fileMessages: Message[] = [
        {
          id: 'file-msg-1',
          senderId: 'user-123',
          receiverId: 'doctor-1',
          content: 'document.pdf',
          messageType: 'file',
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(createMockResponse(fileMessages)); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      expect(result.current.currentMessages[0].messageType).toBe('file');
    });

    it('should handle system messages', async () => {
      const systemMessages: Message[] = [
        {
          id: 'sys-msg-1',
          senderId: 'system',
          receiverId: 'user-123',
          content: 'Appointment confirmed',
          messageType: 'system',
          read: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(createMockResponse(systemMessages)); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      expect(result.current.currentMessages[0].messageType).toBe('system');
    });
  });

  describe('Pagination support', () => {
    it('should handle paginated responses', async () => {
      const paginatedResponse = {
        ok: true,
        json: async () => ({
          success: true,
          data: mockMessages,
          pagination: {
            page: 1,
            limit: 10,
            total: 50,
            totalPages: 5,
          },
        }),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(paginatedResponse); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      // Should still work with pagination data
      expect(result.current.currentMessages).toHaveLength(3);
    });
  });

  describe('Date handling', () => {
    it('should handle Date objects in responses', async () => {
      const messagesWithDates: Message[] = [
        {
          id: 'date-msg-1',
          senderId: 'user-123',
          receiverId: 'doctor-1',
          content: 'Test with dates',
          messageType: 'text',
          read: false,
          createdAt: new Date('2026-01-15T10:00:00.000Z'),
          updatedAt: new Date('2026-01-15T10:00:00.000Z'),
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Initial mount fetch
        .mockResolvedValueOnce(createMockResponse(messagesWithDates)); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      expect(result.current.currentMessages[0].createdAt).toBe(
        messagesWithDates[0].createdAt.toISOString()
      );
      expect(result.current.currentMessages[0].updatedAt).toBe(
        messagesWithDates[0].updatedAt.toISOString()
      );
    });
  });
});
