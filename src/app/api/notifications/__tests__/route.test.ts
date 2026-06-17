import { GET, PATCH } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';

jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Notification');
jest.mock('@/lib/auth', () => ({ authOptions: {} }));

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      constructor(url: string) {
        this.url = url;
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

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /api/notifications', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/notifications');
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return notifications for authenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });
      const mockNotifications = [{ id: 1, title: 'Test' }];
      const mockSort = jest.fn().mockResolvedValue(mockNotifications);
      (Notification.find as jest.Mock).mockReturnValue({
        sort: mockSort,
      });

      const req = new NextRequest('http://localhost:3000/api/notifications');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockNotifications);
      expect(Notification.find).toHaveBeenCalledWith({ recipient: 'user1' });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should handle errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });
      (Notification.find as jest.Mock).mockImplementation(() => {
        throw new Error('DB Error');
      });

      const req = new NextRequest('http://localhost:3000/api/notifications');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Failed to fetch notifications');
    });
  });

  describe('PATCH /api/notifications', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/notifications');
      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it('should mark notifications as read', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });
      (Notification.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });

      const req = new NextRequest('http://localhost:3000/api/notifications');
      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Notification.updateMany).toHaveBeenCalledWith(
        { recipient: 'user1', read: false },
        { $set: { read: true } }
      );
    });

    it('should handle errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user1' },
      });
      (Notification.updateMany as jest.Mock).mockRejectedValue(
        new Error('DB Error')
      );

      const req = new NextRequest('http://localhost:3000/api/notifications');
      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Failed to mark notifications as read');
    });
  });
});
