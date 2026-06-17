/* eslint-disable @typescript-eslint/no-require-imports */
const mockUpdateMany = jest.fn();
const mockFindOne = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: 'user123', email: 'test@example.com' },
  }),
}));

jest.mock('@/models/Conversation', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
  },
}));

jest.mock('@/models/Message', () => ({
  __esModule: true,
  default: {
    updateMany: mockUpdateMany,
  },
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

import { POST } from '../route';

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateMany.mockResolvedValue({ modifiedCount: 3 });
  mockFindOne.mockResolvedValue({ _id: 'conv123', participants: ['user123'] });
});

describe('POST /api/conversations/:id/read', () => {
  const mockRequest = (body: any) =>
    ({
      json: jest.fn().mockResolvedValue(body),
    }) as unknown as Request;

  const context = {
    params: Promise.resolve({ id: 'conv123' }),
  };

  it('should mark messages as read', async () => {
    const req = mockRequest({ messageIds: ['msg1', 'msg2'] });
    const res = await POST(req, context);

    const data = await res.json();

    expect(mockFindOne).toHaveBeenCalledWith({
      _id: 'conv123',
      participants: 'user123',
    });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      {
        conversationId: 'conv123',
        receiverId: 'user123',
        read: false,
        _id: { $in: ['msg1', 'msg2'] },
      },
      { $set: { read: true, readAt: expect.any(Date) } }
    );

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.modifiedCount).toBe(3);
  });

  it('should handle missing conversation', async () => {
    mockFindOne.mockResolvedValueOnce(null);

    const req = mockRequest({});
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Conversation not found or access denied');
  });

  it('should return 401 if user is not authenticated', async () => {
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValueOnce(null);

    const req = mockRequest({});
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle database errors', async () => {
    // Suppress console.error for this test since we're intentionally triggering an error
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockUpdateMany.mockRejectedValueOnce(new Error('DB error'));

    const req = mockRequest({ messageIds: ['msg1'] });
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');

    // Verify console.error was called (optional)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error marking messages as read:',
      expect.any(Error)
    );

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should mark all unread messages if messageIds not provided', async () => {
    const _req = mockRequest({});
    const _res = await POST(_req, context);

    expect(mockUpdateMany).toHaveBeenCalledWith(
      {
        conversationId: 'conv123',
        receiverId: 'user123',
        read: false,
      },
      { $set: { read: true, readAt: expect.any(Date) } }
    );
  });
});
