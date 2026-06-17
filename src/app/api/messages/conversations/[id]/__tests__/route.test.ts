/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import Message from '@/models/Message';

const mockExec = jest.fn();
const mockLean = jest.fn();
const mockSort = jest.fn();

const mockChain = {
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

jest.mock('@/models/Message', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

describe('GET /api/messages/[id]', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

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

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);

    mockSort.mockReturnValue(mockChain);
    mockLean.mockReturnValue(mockChain);
    mockExec.mockResolvedValue([]);

    (Message.find as jest.Mock).mockReturnValue(mockChain);
  });

  const mockSession = {
    user: {
      id: 'user123',
      email: 'user@example.com',
      role: 'USER',
    },
  };

  const mockMessages = [
    {
      _id: 'msg1',
      conversationId: 'conv123',
      senderId: 'user1',
      content: 'Hello',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      _id: 'msg2',
      conversationId: 'conv123',
      senderId: 'user2',
      content: 'Hi there!',
      createdAt: new Date('2024-01-01T10:01:00Z'),
    },
    {
      _id: 'msg3',
      conversationId: 'conv123',
      senderId: 'user1',
      content: 'How are you?',
      createdAt: new Date('2024-01-01T10:02:00Z'),
    },
  ];

  beforeEach(() => {
    getServerSession.mockResolvedValue(mockSession);
  });

  it('should fetch messages for a conversation successfully', async () => {
    mockLean.mockResolvedValue(mockMessages);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data).toHaveLength(3);
    expect(data.data[0]._id).toBe('msg1');
    expect(data.data[1]._id).toBe('msg2');
    expect(data.data[2]._id).toBe('msg3');
    expect(Message.find).toHaveBeenCalledWith({ conversationId: 'conv123' });
    expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
    expect(mockLean).toHaveBeenCalled();
  });

  it('should return empty array when no messages exist', async () => {
    mockLean.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data).toHaveLength(0);
    expect(data.data).toEqual([]);
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
    expect(Message.find).not.toHaveBeenCalled();
  });

  it('should sort messages by createdAt in ascending order', async () => {
    const unsortedMessages = [
      {
        _id: 'msg3',
        conversationId: 'conv123',
        content: 'Third',
        createdAt: new Date('2024-01-01T10:02:00Z'),
      },
      {
        _id: 'msg1',
        conversationId: 'conv123',
        content: 'First',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        _id: 'msg2',
        conversationId: 'conv123',
        content: 'Second',
        createdAt: new Date('2024-01-01T10:01:00Z'),
      },
    ];

    mockLean.mockResolvedValue(unsortedMessages);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
  });

  it('should handle messages from different senders', async () => {
    const multiSenderMessages = [
      {
        _id: 'msg1',
        conversationId: 'conv123',
        senderId: 'user1',
        content: 'From user 1',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        _id: 'msg2',
        conversationId: 'conv123',
        senderId: 'user2',
        content: 'From user 2',
        createdAt: new Date('2024-01-01T10:01:00Z'),
      },
      {
        _id: 'msg3',
        conversationId: 'conv123',
        senderId: 'user3',
        content: 'From user 3',
        createdAt: new Date('2024-01-01T10:02:00Z'),
      },
    ];

    mockLean.mockResolvedValue(multiSenderMessages);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(3);
    expect(data.data[0].senderId).toBe('user1');
    expect(data.data[1].senderId).toBe('user2');
    expect(data.data[2].senderId).toBe('user3');
  });

  it('should handle different conversation IDs', async () => {
    mockLean.mockResolvedValue(mockMessages);

    const req = new NextRequest(
      'http://localhost:3000/api/messages/different-conv'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: 'different-conv' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Message.find).toHaveBeenCalledWith({
      conversationId: 'different-conv',
    });
  });

  it('should handle database connection errors', async () => {
    connectDB.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle message find errors', async () => {
    mockLean.mockRejectedValue(new Error('Query failed'));

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle sort errors', async () => {
    mockSort.mockImplementation(() => {
      throw new Error('Sort failed');
    });

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle lean errors', async () => {
    mockLean.mockRejectedValue(new Error('Lean operation failed'));

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle messages with various content types', async () => {
    const mixedContentMessages = [
      {
        _id: 'msg1',
        conversationId: 'conv123',
        senderId: 'user1',
        content: 'Text message',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        _id: 'msg2',
        conversationId: 'conv123',
        senderId: 'user1',
        content: 'Message with emoji 😊',
        createdAt: new Date('2024-01-01T10:01:00Z'),
      },
      {
        _id: 'msg3',
        conversationId: 'conv123',
        senderId: 'user1',
        content: 'Long message '.repeat(100),
        createdAt: new Date('2024-01-01T10:02:00Z'),
      },
    ];

    mockLean.mockResolvedValue(mixedContentMessages);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(3);
  });

  it('should handle large number of messages', async () => {
    const largeMessageArray = Array.from({ length: 1000 }, (_, i) => ({
      _id: `msg${i}`,
      conversationId: 'conv123',
      senderId: `user${i % 10}`,
      content: `Message ${i}`,
      createdAt: new Date(
        `2024-01-01T${String(10 + (i % 14)).padStart(2, '0')}:00:00Z`
      ),
    }));

    mockLean.mockResolvedValue(largeMessageArray);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1000);
  });

  it('should work for authenticated users with different roles', async () => {
    const adminSession = {
      user: {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    };

    getServerSession.mockResolvedValue(adminSession);
    mockLean.mockResolvedValue(mockMessages);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('should handle messages with additional metadata', async () => {
    const messagesWithMetadata = [
      {
        _id: 'msg1',
        conversationId: 'conv123',
        senderId: 'user1',
        content: 'Hello',
        read: false,
        attachments: [],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        _id: 'msg2',
        conversationId: 'conv123',
        senderId: 'user2',
        content: 'Hi',
        read: true,
        attachments: ['file1.pdf'],
        createdAt: new Date('2024-01-01T10:01:00Z'),
        updatedAt: new Date('2024-01-01T10:01:00Z'),
      },
    ];

    mockLean.mockResolvedValue(messagesWithMetadata);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toHaveProperty('read');
    expect(data.data[0]).toHaveProperty('attachments');
    expect(data.data[1].attachments).toContain('file1.pdf');
  });

  it('should handle special characters in conversation ID', async () => {
    mockLean.mockResolvedValue(mockMessages);

    const req = new NextRequest(
      'http://localhost:3000/api/messages/conv-123-abc'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv-123-abc' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Message.find).toHaveBeenCalledWith({
      conversationId: 'conv-123-abc',
    });
  });

  it('should handle messages with timestamps at the same time', async () => {
    const sameTimeMessages = [
      {
        _id: 'msg1',
        conversationId: 'conv123',
        senderId: 'user1',
        content: 'First',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        _id: 'msg2',
        conversationId: 'conv123',
        senderId: 'user2',
        content: 'Second',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
    ];

    mockLean.mockResolvedValue(sameTimeMessages);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });

  it('should return lean documents without mongoose methods', async () => {
    mockLean.mockResolvedValue(mockMessages);

    const req = new NextRequest('http://localhost:3000/api/messages/conv123');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'conv123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockLean).toHaveBeenCalled();
    // Lean documents should be plain JavaScript objects
    expect(data.data[0]).not.toHaveProperty('save');
    expect(data.data[0]).not.toHaveProperty('toObject');
  });
});
