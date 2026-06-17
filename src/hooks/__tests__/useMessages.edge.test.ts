/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useMessages } from '../messages';
import { useSession } from 'next-auth/react';
import { SendMessageData } from '@/types/messages';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

global.fetch = jest.fn();
console.error = jest.fn();

describe('useMessages Hook Edge Cases with New Interface', () => {
  const mockSession = {
    data: {
      user: { id: 'user-123' },
    },
    status: 'authenticated',
  };

  const createMockResponse = (data: any) => ({
    ok: true,
    json: async () => ({
      success: true,
      data,
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue(mockSession);
  });

  describe('Message Type Edge Cases', () => {
    it('should handle invalid message types gracefully', async () => {
      const invalidMessage = {
        id: 'invalid-msg',
        conversationId: 'conv-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        content: 'Test',
        messageType: 'invalid-type', // Invalid type
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Mount
        .mockResolvedValueOnce(createMockResponse([invalidMessage])); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      // Should still accept the message even with invalid type
      expect(result.current.currentMessages).toHaveLength(1);
      expect(result.current.currentMessages[0].messageType).toBe(
        'invalid-type'
      );
    });

    it('should handle missing optional fields', async () => {
      const minimalConversation = {
        id: 'min-conv',
        participants: ['user-1', 'user-2'],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // No lastMessage
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Mount
        .mockResolvedValueOnce(createMockResponse([minimalConversation])); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.conversations[0].lastMessage).toBeUndefined();
    });
  });

  describe('Data Validation', () => {
    it('should handle conversations with empty participants array', async () => {
      const emptyConversation = {
        id: 'empty-conv',
        participants: [], // Empty array
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Mount
        .mockResolvedValueOnce(createMockResponse([emptyConversation])); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.conversations[0].participants).toEqual([]);
    });

    it('should handle messages with long content', async () => {
      const longContent = 'A'.repeat(10000); // Very long message
      const longMessage = {
        id: 'long-msg',
        conversationId: 'conv-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        content: longContent,
        messageType: 'text',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([])) // Mount
        .mockResolvedValueOnce(createMockResponse([longMessage])); // Manual fetch

      const { result } = renderHook(() => useMessages());

      await act(async () => {
        await result.current.fetchMessages('conv-1');
      });

      expect(result.current.currentMessages[0].content.length).toBe(10000);
    });
  });

  describe('Timing and Race Conditions', () => {
    it('should handle multiple concurrent message sends', async () => {
      // Mock for all calls (mount, sends, refreshes)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const { result } = renderHook(() => useMessages());

      const messageData1: SendMessageData = {
        receiverId: 'user-2',
        content: 'Message 1',
      };

      const messageData2: SendMessageData = {
        receiverId: 'user-2',
        content: 'Message 2',
      };

      const messageData3: SendMessageData = {
        receiverId: 'user-2',
        content: 'Message 3',
      };

      await act(async () => {
        await Promise.all([
          result.current.sendMessage(messageData1),
          result.current.sendMessage(messageData2),
          result.current.sendMessage(messageData3),
        ]);
      });

      // Check specifically for POST calls to /api/messages
      const postCalls = (global.fetch as jest.Mock).mock.calls.filter(
        call => call[0] === '/api/messages' && call[1]?.method === 'POST'
      );
      expect(postCalls).toHaveLength(3);
    });
  });
});
