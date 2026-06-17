import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { POST, GET } from '../route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';

// Mock dependencies
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock('@/models/PasswordResetToken', () => ({
  findOne: jest.fn(),
  deleteOne: jest.fn(),
}));

describe('Reset Password API', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 for missing token', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({ password: 'newpassword123' }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Token and password are required' });
    });

    it('should return 400 for missing password', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({ token: 'valid-token' }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Token and password are required' });
    });

    it('should return 400 for password less than 6 characters', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          token: 'valid-token',
          password: '12345',
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Password must be at least 6 characters long',
      });
    });

    it('should return 400 for invalid or expired token', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          token: 'invalid-token',
          password: 'newpassword123',
        }),
      } as any;

      (PasswordResetToken.findOne as jest.Mock).mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid or expired reset token' });
      expect(PasswordResetToken.findOne).toHaveBeenCalledWith({
        token: 'invalid-token',
        used: false,
        expiresAt: { $gt: expect.any(Date) },
      });
    });

    it('should return 404 when user not found', async () => {
      const mockToken = {
        _id: 'token-123',
        token: 'valid-token',
        email: 'user@example.com',
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          token: 'valid-token',
          password: 'newpassword123',
        }),
      } as any;

      (PasswordResetToken.findOne as jest.Mock).mockResolvedValue(mockToken);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'User not found' });
      expect(User.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
    });

    it('should reset password successfully', async () => {
      const mockToken = {
        _id: 'token-123',
        token: 'valid-token',
        email: 'user@example.com',
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
      };

      const mockUser = {
        _id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
      };

      const hashedPassword = 'hashed-password-123';

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          token: 'valid-token',
          password: 'newpassword123',
        }),
      } as any;

      (PasswordResetToken.findOne as jest.Mock).mockResolvedValue(mockToken);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (User.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
      (PasswordResetToken.deleteOne as jest.Mock).mockResolvedValue({
        deletedCount: 1,
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Password reset successfully' });

      expect(connectDB).toHaveBeenCalled();
      expect(PasswordResetToken.findOne).toHaveBeenCalledWith({
        token: 'valid-token',
        used: false,
        expiresAt: { $gt: expect.any(Date) },
      });
      expect(User.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(User.updateOne).toHaveBeenCalledWith(
        { email: 'user@example.com' },
        {
          password: hashedPassword,
          updatedAt: expect.any(Date),
        }
      );
      expect(PasswordResetToken.deleteOne).toHaveBeenCalledWith({
        _id: 'token-123',
      });
    });

    it('should handle expired token', async () => {
      const expiredToken = {
        _id: 'token-123',
        token: 'expired-token',
        email: 'user@example.com',
        used: false,
        expiresAt: new Date(Date.now() - 3600000), // Past date
      };

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          token: 'expired-token',
          password: 'newpassword123',
        }),
      } as any;

      // Mock findOne to return null for expired token
      (PasswordResetToken.findOne as jest.Mock).mockImplementation(query => {
        // Check if the expiresAt condition would filter out expired token
        if (query.expiresAt && query.expiresAt.$gt) {
          const currentDate = new Date();
          if (expiredToken.expiresAt < currentDate) {
            return null;
          }
        }
        return expiredToken;
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid or expired reset token' });
    });

    it('should handle used token', async () => {
      const usedToken = {
        _id: 'token-123',
        token: 'used-token',
        email: 'user@example.com',
        used: true, // Marked as used
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          token: 'used-token',
          password: 'newpassword123',
        }),
      } as any;

      // Mock findOne to return null for used token
      (PasswordResetToken.findOne as jest.Mock).mockImplementation(query => {
        if (query.used === false) {
          return null;
        }
        return usedToken;
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid or expired reset token' });
    });

    it('should handle database connection errors', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          token: 'valid-token',
          password: 'newpassword123',
        }),
      } as any;

      (connectDB as jest.Mock).mockRejectedValue(
        new Error('DB connection failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Reset password error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle bcrypt hash errors', async () => {
      const mockToken = {
        _id: 'token-123',
        token: 'valid-token',
        email: 'user@example.com',
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
      };

      const mockUser = {
        _id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
      };

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          token: 'valid-token',
          password: 'newpassword123',
        }),
      } as any;

      (PasswordResetToken.findOne as jest.Mock).mockResolvedValue(mockToken);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /api/auth/reset-password', () => {
    it('should return 400 for missing token parameter', async () => {
      mockRequest = new NextRequest(
        'http://localhost:3000/api/auth/reset-password'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Token is required' });
    });

    it('should return valid token response', async () => {
      const mockToken = {
        _id: 'token-123',
        token: 'valid-token',
        email: 'user@example.com',
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockRequest = new NextRequest(
        'http://localhost:3000/api/auth/reset-password?token=valid-token'
      );

      (PasswordResetToken.findOne as jest.Mock).mockResolvedValue(mockToken);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        valid: true,
        email: 'user@example.com',
      });
      expect(PasswordResetToken.findOne).toHaveBeenCalledWith({
        token: 'valid-token',
        used: false,
        expiresAt: { $gt: expect.any(Date) },
      });
    });

    it('should return invalid token response for non-existent token', async () => {
      mockRequest = new NextRequest(
        'http://localhost:3000/api/auth/reset-password?token=invalid-token'
      );

      (PasswordResetToken.findOne as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        valid: false,
        error: 'Invalid or expired token',
      });
    });

    it('should return invalid token response for expired token', async () => {
      const expiredToken = {
        _id: 'token-123',
        token: 'expired-token',
        email: 'user@example.com',
        used: false,
        expiresAt: new Date(Date.now() - 3600000),
      };

      mockRequest = new NextRequest(
        'http://localhost:3000/api/auth/reset-password?token=expired-token'
      );

      // Mock findOne to return null for expired token
      (PasswordResetToken.findOne as jest.Mock).mockImplementation(query => {
        if (query.expiresAt && query.expiresAt.$gt) {
          const currentDate = new Date();
          if (expiredToken.expiresAt < currentDate) {
            return null;
          }
        }
        return expiredToken;
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        valid: false,
        error: 'Invalid or expired token',
      });
    });

    it('should return invalid token response for used token', async () => {
      const usedToken = {
        _id: 'token-123',
        token: 'used-token',
        email: 'user@example.com',
        used: true,
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockRequest = new NextRequest(
        'http://localhost:3000/api/auth/reset-password?token=used-token'
      );

      (PasswordResetToken.findOne as jest.Mock).mockImplementation(query => {
        if (query.used === false) {
          return null;
        }
        return usedToken;
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        valid: false,
        error: 'Invalid or expired token',
      });
    });

    it('should handle database connection errors', async () => {
      mockRequest = new NextRequest(
        'http://localhost:3000/api/auth/reset-password?token=valid-token'
      );

      (connectDB as jest.Mock).mockRejectedValue(
        new Error('DB connection failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Token validation error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple query parameters gracefully', async () => {
      const mockToken = {
        _id: 'token-123',
        token: 'valid-token',
        email: 'user@example.com',
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockRequest = new NextRequest(
        'http://localhost:3000/api/auth/reset-password?token=valid-token&other=param'
      );

      (PasswordResetToken.findOne as jest.Mock).mockResolvedValue(mockToken);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        valid: true,
        email: 'user@example.com',
      });
    });

    it('should handle malformed URLs', async () => {
      // This tests that URL parsing doesn't crash
      mockRequest = {
        url: 'invalid-url',
      } as any;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET(mockRequest);
      const data = await response.json();

      // Depending on implementation, this might return 400 or 500
      // Either is acceptable as long as it doesn't crash
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.error).toBeDefined();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty string token', async () => {
      mockRequest = new NextRequest(
        'http://localhost:3000/api/auth/reset-password?token='
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Token is required' });
    });
  });
});
