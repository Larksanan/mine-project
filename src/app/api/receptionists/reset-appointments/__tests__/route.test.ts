import { POST } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/Receptionist', () => ({
  updateMany: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

describe('POST /api/receptionists/reset-appointments', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest(
      'http://localhost:3000/api/receptionists/reset-appointments',
      {
        method: 'POST',
      }
    );
    jest.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user is not an ADMIN', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          email: 'jebrsanthatcroos16@gmai.com',
          role: 'RECEPTIONIST',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden - Insufficient permissions');
    });
  });

  describe('Successful Reset', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          email: 'jebarsanthatcroos@gmail.com',
          role: 'ADMIN',
        },
      });
      (connectDB as jest.Mock).mockResolvedValue(undefined);
    });

    it('should successfully reset appointment counts for all receptionists', async () => {
      const mockUpdateResult = {
        modifiedCount: 42,
        acknowledged: true,
        upsertedCount: 0,
        upsertedId: null,
        matchedCount: 42,
      };

      (Receptionist.updateMany as jest.Mock).mockResolvedValue(
        mockUpdateResult
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Daily appointment counts reset successfully');
      expect(data.modified).toBe(42);
      expect(data.resetAt).toBeDefined();
      expect(new Date(data.resetAt).getTime()).toBeLessThanOrEqual(Date.now());

      expect(Receptionist.updateMany).toHaveBeenCalledWith(
        {},
        {
          currentAppointmentsCount: 0,
          lastReset: expect.any(Date),
        }
      );
    });

    it('should handle case where no receptionists are modified', async () => {
      const mockUpdateResult = {
        modifiedCount: 0,
        acknowledged: true,
        upsertedCount: 0,
        upsertedId: null,
        matchedCount: 0,
      };

      (Receptionist.updateMany as jest.Mock).mockResolvedValue(
        mockUpdateResult
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.modified).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          email: 'jebarsanthatcroos@gmail.com',
          role: 'ADMIN',
        },
      });
    });

    it('should return 500 when database connection fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error resetting appointment counts:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should return 500 when updateMany operation fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (Receptionist.updateMany as jest.Mock).mockRejectedValue(
        new Error('Update operation failed')
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Update operation failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error resetting appointment counts:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should handle MongoDB specific errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (Receptionist.updateMany as jest.Mock).mockRejectedValue(
        new Error('MongoError: E11000 duplicate key error')
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('MongoError: E11000 duplicate key error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error resetting appointment counts:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          email: 'jebarsanthatcroos@gmail.com',
          role: 'ADMIN',
        },
      });
      (connectDB as jest.Mock).mockResolvedValue(undefined);
    });

    it('should handle empty database (no receptionists)', async () => {
      const mockUpdateResult = {
        modifiedCount: 0,
        acknowledged: true,
        upsertedCount: 0,
        upsertedId: null,
        matchedCount: 0,
      };

      (Receptionist.updateMany as jest.Mock).mockResolvedValue(
        mockUpdateResult
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.modified).toBe(0);
    });

    it('should ensure resetAt timestamp is recent', async () => {
      const mockUpdateResult = {
        modifiedCount: 10,
        acknowledged: true,
        upsertedCount: 0,
        upsertedId: null,
        matchedCount: 10,
      };

      (Receptionist.updateMany as jest.Mock).mockResolvedValue(
        mockUpdateResult
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      const resetAt = new Date(data.resetAt);
      const now = new Date();
      const timeDifference = now.getTime() - resetAt.getTime();

      expect(timeDifference).toBeLessThan(1000);
    });
  });
});
