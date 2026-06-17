'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';
import {
  Message,
  Conversation,
  SendMessageData,
  MessagesResponse,
} from '@/types/messages';

export function useMessages() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/messages/conversations');
      const result: MessagesResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch conversations');
      }

      if (result.success && result.data) {
        setConversations(result.data as Conversation[]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch conversations'
      );
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/messages/conversations/${conversationId}`
        );
        const result: MessagesResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch messages');
        }

        if (result.success && result.data) {
          setCurrentMessages(result.data as Message[]);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch messages'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id]
  );

  const sendMessage = useCallback(
    async (messageData: SendMessageData): Promise<boolean> => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        });

        const result: MessagesResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to send message');
        }

        if (result.success) {
          // Refresh messages after sending
          await fetchConversations();
          return true;
        }

        return false;
      } catch (err) {
        console.error('Error sending message:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id, fetchConversations]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/messages/${messageId}/read`, {
          method: 'PUT',
        });

        const result: MessagesResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to mark message as read');
        }

        if (result.success) {
          // Update local state
          setCurrentMessages(prev =>
            prev.map(msg =>
              msg.id === messageId ? { ...msg, read: true } : msg
            )
          );
          setConversations(prev =>
            prev.map(conv => ({
              ...conv,
              unreadCount: Math.max(0, conv.unreadCount - 1),
            }))
          );
        }
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    },
    [session?.user?.id]
  );

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
  }, [session?.user?.id, fetchConversations]);

  return {
    conversations,
    currentMessages,
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
  };
}
