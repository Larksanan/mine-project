/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import Notification from '@/models/Notification';

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      _body?: any;
      headers: any;

      constructor(url: string, init?: { method?: string; body?: any }) {
        this.url = url;
        this.method = init?.method;
        this._body = init?.body;
        this.headers = { get: () => null };
      }

      json() {
        try {
          return Promise.resolve(
            typeof this._body === 'string'
              ? JSON.parse(this._body)
              : this._body || {}
          );
        } catch (error) {
          return Promise.reject(new Error('Invalid JSON'));
        }
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

jest.mock('@/models/Notification', () => ({
  __esModule: true,
  default: {
    updateMany: jest.fn(),
  },
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('POST /api/notifications/mark', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);
  });

  const mockSession = {
    user: {
      id: 'user123',
      email: 'user@example.com',
      role: 'USER',
    },
  };

  beforeEach(() => {
    getServerSession.mockResolvedValue(mockSession);
  });

  it('should mark notifications as read successfully', async () => {
    const notificationIds = ['notif1', 'notif2', 'notif3'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 3,
      matchedCount: 3,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Notifications updated successfully');
    expect(data.data.modifiedCount).toBe(3);
    expect(Notification.updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: notificationIds },
        userId: 'user123',
      },
      {
        $set: {
          read: true,
          readAt: expect.any(Date),
        },
      }
    );
  });

  it('should mark notifications as unread successfully', async () => {
    const notificationIds = ['notif1', 'notif2'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 2,
      matchedCount: 2,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: false,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.modifiedCount).toBe(2);
    expect(Notification.updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: notificationIds },
        userId: 'user123',
      },
      {
        $set: {
          read: false,
          readAt: null,
        },
      }
    );
  });

  it('should default to read=true when not specified', async () => {
    const notificationIds = ['notif1'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
      matchedCount: 1,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Notification.updateMany).toHaveBeenCalledWith(expect.any(Object), {
      $set: {
        read: true,
        readAt: expect.any(Date),
      },
    });
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: ['notif1'],
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
    expect(Notification.updateMany).not.toHaveBeenCalled();
  });

  it('should return 401 when session has no user', async () => {
    getServerSession.mockResolvedValue({ user: null });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: ['notif1'],
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 when session user has no id', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'user@example.com' } });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: ['notif1'],
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 when notificationIds is missing', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid notification IDs');
    expect(Notification.updateMany).not.toHaveBeenCalled();
  });

  it('should return 400 when notificationIds is not an array', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: 'notif1',
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid notification IDs');
  });

  it('should return 400 when notificationIds is null', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: null,
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid notification IDs');
  });

  it('should handle empty notificationIds array', async () => {
    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 0,
      matchedCount: 0,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: [],
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.modifiedCount).toBe(0);
  });

  it('should handle single notification ID', async () => {
    const notificationIds = ['notif1'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
      matchedCount: 1,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.modifiedCount).toBe(1);
  });

  it('should handle large number of notification IDs', async () => {
    const notificationIds = Array.from({ length: 100 }, (_, i) => `notif${i}`);

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 100,
      matchedCount: 100,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.modifiedCount).toBe(100);
  });

  it('should only update notifications belonging to the user', async () => {
    const notificationIds = ['notif1', 'notif2'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 2,
      matchedCount: 2,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: true,
        }),
      }
    );

    await POST(req);

    expect(Notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user123',
      }),
      expect.any(Object)
    );
  });

  it('should handle partial updates when some notifications do not exist', async () => {
    const notificationIds = ['notif1', 'notif2', 'notif3'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 2,
      matchedCount: 2,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.modifiedCount).toBe(2);
  });

  it('should handle database connection errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    connectDB.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: ['notif1'],
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error marking notifications:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should handle updateMany errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    (Notification.updateMany as jest.Mock).mockRejectedValue(
      new Error('Update failed')
    );

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: ['notif1'],
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error marking notifications:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should handle invalid JSON in request body', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: 'invalid json',
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error marking notifications:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should handle when no notifications are modified', async () => {
    const notificationIds = ['notif1', 'notif2'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 0,
      matchedCount: 0,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: true,
        }),
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.modifiedCount).toBe(0);
  });

  it('should handle boolean true for read parameter', async () => {
    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
      matchedCount: 1,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: ['notif1'],
          read: true,
        }),
      }
    );

    await POST(req);

    expect(Notification.updateMany).toHaveBeenCalledWith(expect.any(Object), {
      $set: {
        read: true,
        readAt: expect.any(Date),
      },
    });
  });

  it('should handle boolean false for read parameter', async () => {
    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
      matchedCount: 1,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: ['notif1'],
          read: false,
        }),
      }
    );

    await POST(req);

    expect(Notification.updateMany).toHaveBeenCalledWith(expect.any(Object), {
      $set: {
        read: false,
        readAt: null,
      },
    });
  });

  it('should use $in operator for notificationIds', async () => {
    const notificationIds = ['notif1', 'notif2', 'notif3'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 3,
      matchedCount: 3,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: true,
        }),
      }
    );

    await POST(req);

    expect(Notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: { $in: notificationIds },
      }),
      expect.any(Object)
    );
  });

  it('should set readAt to Date when marking as read', async () => {
    const notificationIds = ['notif1'];
    const beforeDate = new Date();

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
      matchedCount: 1,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: true,
        }),
      }
    );

    await POST(req);

    const afterDate = new Date();
    const updateCall = (Notification.updateMany as jest.Mock).mock.calls[0][1];
    const readAtDate = updateCall.$set.readAt;

    expect(readAtDate).toBeInstanceOf(Date);
    expect(readAtDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
    expect(readAtDate.getTime()).toBeLessThanOrEqual(afterDate.getTime());
  });

  it('should set readAt to null when marking as unread', async () => {
    const notificationIds = ['notif1'];

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
      matchedCount: 1,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          read: false,
        }),
      }
    );

    await POST(req);

    expect(Notification.updateMany).toHaveBeenCalledWith(expect.any(Object), {
      $set: {
        read: false,
        readAt: null,
      },
    });
  });

  it('should handle different user IDs correctly', async () => {
    const differentUserSession = {
      user: {
        id: 'user456',
        email: 'different@example.com',
      },
    };

    getServerSession.mockResolvedValue(differentUserSession);

    (Notification.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
      matchedCount: 1,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/notifications/mark',
      {
        method: 'POST',
        body: JSON.stringify({
          notificationIds: ['notif1'],
          read: true,
        }),
      }
    );

    await POST(req);

    expect(Notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user456',
      }),
      expect.any(Object)
    );
  });
});
