/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

const mockExec = jest.fn();
const mockLean = jest.fn();
const mockSort = jest.fn();
const mockPopulate = jest.fn();

const mockChain = {
  populate: mockPopulate,
  sort: mockSort,
  lean: mockLean,
  exec: mockExec,
};

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      constructor(url: string, init?: any) {
        this.url = url;
        this.method = init?.method || 'GET';
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

jest.mock('@/models/Conversation', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/models/Message', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('GET /api/conversations', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);

    mockPopulate.mockReturnValue(mockChain);
    mockSort.mockReturnValue(mockChain);
    mockLean.mockResolvedValue([]);

    (Conversation.find as jest.Mock).mockReturnValue(mockChain);
    (Message.countDocuments as jest.Mock).mockResolvedValue(0);
  });

  const mockSession = {
    user: {
      id: 'user123',
      email: 'user@example.com',
      role: 'USER',
    },
  };

  const mockConversations = [
    {
      _id: 'conv1',
      participants: ['user123', 'user456'],
      lastMessage: {
        _id: 'msg1',
        content: 'Hello there!',
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      _id: 'conv2',
      participants: ['user123', 'user789'],
      lastMessage: {
        _id: 'msg2',
        content: 'How are you?',
        createdAt: new Date('2024-01-14T10:00:00Z'),
      },
      updatedAt: new Date('2024-01-14T10:00:00Z'),
    },
  ];

  beforeEach(() => {
    getServerSession.mockResolvedValue(mockSession);
  });

  it('should fetch conversations successfully', async () => {
    mockLean.mockResolvedValue(mockConversations);
    (Message.countDocuments as jest.Mock)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);

    const _req = new NextRequest('http://localhost:3000/api/conversations');

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data).toHaveLength(2);
    expect(data.data[0].unreadCount).toBe(2);
    expect(data.data[1].unreadCount).toBe(0);
    expect(Conversation.find).toHaveBeenCalledWith({
      participants: 'user123',
    });
    expect(mockPopulate).toHaveBeenCalledWith('lastMessage');
    expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(mockLean).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
    expect(Conversation.find).not.toHaveBeenCalled();
  });

  it('should return empty array when no conversations exist', async () => {
    mockLean.mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it('should calculate unread counts correctly', async () => {
    mockLean.mockResolvedValue(mockConversations);
    (Message.countDocuments as jest.Mock)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data[0].unreadCount).toBe(5);
    expect(data.data[1].unreadCount).toBe(3);
    expect(Message.countDocuments).toHaveBeenCalledTimes(2);
    expect(Message.countDocuments).toHaveBeenNthCalledWith(1, {
      conversationId: 'conv1',
      receiverId: 'user123',
      read: false,
    });
    expect(Message.countDocuments).toHaveBeenNthCalledWith(2, {
      conversationId: 'conv2',
      receiverId: 'user123',
      read: false,
    });
  });

  it('should sort conversations by updatedAt in descending order', async () => {
    mockLean.mockResolvedValue(mockConversations);

    await GET();

    expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });
  });

  it('should populate lastMessage field', async () => {
    mockLean.mockResolvedValue(mockConversations);

    await GET();

    expect(mockPopulate).toHaveBeenCalledWith('lastMessage');
  });

  it('should handle conversations with zero unread messages', async () => {
    mockLean.mockResolvedValue(mockConversations);
    (Message.countDocuments as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data[0].unreadCount).toBe(0);
    expect(data.data[1].unreadCount).toBe(0);
  });

  it('should handle single conversation', async () => {
    const singleConversation = [mockConversations[0]];
    mockLean.mockResolvedValue(singleConversation);
    (Message.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].unreadCount).toBe(1);
  });

  it('should handle multiple participants in conversation', async () => {
    const multiParticipantConv = [
      {
        _id: 'conv1',
        participants: ['user123', 'user456', 'user789'],
        lastMessage: {
          _id: 'msg1',
          content: 'Group message',
          createdAt: new Date('2024-01-15T10:00:00Z'),
        },
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      },
    ];

    mockLean.mockResolvedValue(multiParticipantConv);
    (Message.countDocuments as jest.Mock).mockResolvedValue(2);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data[0].participants).toHaveLength(3);
    expect(data.data[0].unreadCount).toBe(2);
  });

  it('should handle conversation without lastMessage', async () => {
    const convWithoutMessage = [
      {
        _id: 'conv1',
        participants: ['user123', 'user456'],
        lastMessage: null,
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      },
    ];

    mockLean.mockResolvedValue(convWithoutMessage);
    (Message.countDocuments as jest.Mock).mockResolvedValue(0);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data[0].lastMessage).toBeNull();
    expect(data.data[0].unreadCount).toBe(0);
  });

  it('should handle large number of conversations', async () => {
    const manyConversations = Array.from({ length: 50 }, (_, i) => ({
      _id: `conv${i}`,
      participants: ['user123', `user${i}`],
      lastMessage: {
        _id: `msg${i}`,
        content: `Message ${i}`,
        createdAt: new Date(),
      },
      updatedAt: new Date(),
    }));

    mockLean.mockResolvedValue(manyConversations);
    (Message.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(50);
    expect(Message.countDocuments).toHaveBeenCalledTimes(50);
  });

  it('should handle database connection errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    connectDB.mockRejectedValue(new Error('Database connection failed'));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
    consoleErrorSpy.mockRestore();
  });

  it('should handle Conversation.find errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLean.mockRejectedValue(new Error('Query failed'));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
    consoleErrorSpy.mockRestore();
  });

  it('should handle Message.countDocuments errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockLean.mockResolvedValue(mockConversations);
    (Message.countDocuments as jest.Mock).mockRejectedValue(
      new Error('Count failed')
    );

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
    consoleErrorSpy.mockRestore();
  });

  it('should handle populate errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockPopulate.mockImplementation(() => {
      throw new Error('Populate failed');
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
    consoleErrorSpy.mockRestore();
  });

  it('should handle sort errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockSort.mockImplementation(() => {
      throw new Error('Sort failed');
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
    consoleErrorSpy.mockRestore();
  });

  it('should only fetch conversations where user is a participant', async () => {
    mockLean.mockResolvedValue(mockConversations);

    await GET();

    expect(Conversation.find).toHaveBeenCalledWith({
      participants: 'user123',
    });
  });

  it('should preserve conversation data structure with unread count', async () => {
    mockLean.mockResolvedValue(mockConversations);
    (Message.countDocuments as jest.Mock)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const res = await GET();
    const data = await res.json();

    expect(data.data[0]).toHaveProperty('_id');
    expect(data.data[0]).toHaveProperty('participants');
    expect(data.data[0]).toHaveProperty('lastMessage');
    expect(data.data[0]).toHaveProperty('updatedAt');
    expect(data.data[0]).toHaveProperty('unreadCount');
    expect(data.data[0]._id).toBe('conv1');
    expect(data.data[0].unreadCount).toBe(3);
  });

  it('should handle different user IDs correctly', async () => {
    const differentUserSession = {
      user: {
        id: 'user999',
        email: 'different@example.com',
      },
    };

    getServerSession.mockResolvedValue(differentUserSession);
    mockLean.mockResolvedValue([]);

    await GET();

    expect(Conversation.find).toHaveBeenCalledWith({
      participants: 'user999',
    });
  });

  it('should count only unread messages for the current user', async () => {
    mockLean.mockResolvedValue([mockConversations[0]]);
    (Message.countDocuments as jest.Mock).mockResolvedValue(5);

    await GET();

    expect(Message.countDocuments).toHaveBeenCalledWith({
      conversationId: 'conv1',
      receiverId: 'user123',
      read: false,
    });
  });

  it('should handle conversations with high unread counts', async () => {
    mockLean.mockResolvedValue([mockConversations[0]]);
    (Message.countDocuments as jest.Mock).mockResolvedValue(999);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data[0].unreadCount).toBe(999);
  });

  it('should use lean() to return plain JavaScript objects', async () => {
    mockLean.mockResolvedValue(mockConversations);

    await GET();

    expect(mockLean).toHaveBeenCalled();
  });

  it('should process all conversations in parallel', async () => {
    mockLean.mockResolvedValue(mockConversations);
    const countSpy = jest.spyOn(Message, 'countDocuments');
    countSpy.mockResolvedValue(1);

    await GET();

    // Verify that countDocuments was called for each conversation
    expect(countSpy).toHaveBeenCalledTimes(mockConversations.length);
  });

  it('should handle conversations with recent activity', async () => {
    const recentConversations = [
      {
        _id: 'conv1',
        participants: ['user123', 'user456'],
        lastMessage: {
          _id: 'msg1',
          content: 'Recent message',
          createdAt: new Date(),
        },
        updatedAt: new Date(),
      },
    ];

    mockLean.mockResolvedValue(recentConversations);
    (Message.countDocuments as jest.Mock).mockResolvedValue(10);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data[0].unreadCount).toBe(10);
    expect(data.data[0].lastMessage.content).toBe('Recent message');
  });

  it('should maintain conversation order after adding unread counts', async () => {
    mockLean.mockResolvedValue(mockConversations);
    (Message.countDocuments as jest.Mock)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);

    const res = await GET();
    const data = await res.json();

    expect(data.data[0]._id).toBe('conv1');
    expect(data.data[1]._id).toBe('conv2');
  });

  it('should handle session without user id', async () => {
    getServerSession.mockResolvedValue({
      user: { email: 'user@example.com' },
    });

    const _res = await GET();
    const _data = await _res.json();

    // Should still work as session.user.id will be undefined
    expect(Conversation.find).toHaveBeenCalledWith({
      participants: undefined,
    });
  });
});
