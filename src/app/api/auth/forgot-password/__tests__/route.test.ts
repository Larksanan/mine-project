import { POST } from '../route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('@/lib/email');
jest.mock('crypto');

describe('POST /api/auth/forgot-password', () => {
  let mockRequest: Partial<Request>;
  let mockJson: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request
    mockJson = jest.fn();
    mockRequest = {
      json: mockJson,
    };

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);

    // Mock crypto.randomInt
    (crypto.randomInt as jest.Mock).mockReturnValue(123456);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return 400 if email is not provided', async () => {
      mockJson.mockResolvedValue({});

      const response = await POST(mockRequest as Request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email is required');
    });

    it('should return 400 if email is empty string', async () => {
      mockJson.mockResolvedValue({ email: '' });

      const response = await POST(mockRequest as Request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email is required');
    });
  });

  describe('User not found', () => {
    it('should return success message even if user does not exist (security)', async () => {
      mockJson.mockResolvedValue({ email: 'nonexistent@example.com' });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await POST(mockRequest as Request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'If an account exists with this email, a verification code has been sent.'
      );
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should trim and lowercase email when searching for user', async () => {
      mockJson.mockResolvedValue({ email: '  TEST@EXAMPLE.COM  ' });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await POST(mockRequest as Request);

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('Successful password reset request', () => {
    let mockUser: any;
    let mockSave: jest.Mock;

    beforeEach(() => {
      mockSave = jest.fn().mockResolvedValue(undefined);
      mockUser = {
        email: 'user@example.com',
        resetPasswordToken: null,
        resetPasswordExpires: null,
        save: mockSave,
      };
    });

    it('should generate reset token and send email for existing user', async () => {
      mockJson.mockResolvedValue({ email: 'user@example.com' });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      const response = await POST(mockRequest as Request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'If an account exists with this email, a verification code has been sent.'
      );
      expect(crypto.randomInt).toHaveBeenCalledWith(100000, 999999);
      expect(mockUser.resetPasswordToken).toBe('123456');
      expect(mockUser.resetPasswordExpires).toBeInstanceOf(Date);
      expect(mockSave).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        'user@example.com',
        '123456'
      );
    });

    it('should set token expiration to 10 minutes from now', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      mockJson.mockResolvedValue({ email: 'user@example.com' });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await POST(mockRequest as Request);

      const expectedExpiry = new Date(now + 10 * 60 * 1000);
      expect(mockUser.resetPasswordExpires).toEqual(expectedExpiry);

      jest.spyOn(Date, 'now').mockRestore();
    });

    it('should handle email with different casing and whitespace', async () => {
      mockJson.mockResolvedValue({ email: '  USER@EXAMPLE.COM  ' });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await POST(mockRequest as Request);

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        'user@example.com',
        '123456'
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 if database connection fails', async () => {
      mockJson.mockResolvedValue({ email: 'user@example.com' });
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(mockRequest as Request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Forgot password error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return 500 if User.findOne fails', async () => {
      mockJson.mockResolvedValue({ email: 'user@example.com' });
      (User.findOne as jest.Mock).mockRejectedValue(
        new Error('Database query failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(mockRequest as Request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');

      consoleErrorSpy.mockRestore();
    });

    it('should return 500 if user.save fails', async () => {
      const mockUser = {
        email: 'user@example.com',
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      };

      mockJson.mockResolvedValue({ email: 'user@example.com' });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(mockRequest as Request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');

      consoleErrorSpy.mockRestore();
    });

    it('should return 500 if sendPasswordResetEmail fails', async () => {
      const mockUser = {
        email: 'user@example.com',
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockJson.mockResolvedValue({ email: 'user@example.com' });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(
        new Error('Email service failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(mockRequest as Request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Security considerations', () => {
    it('should return same message for existing and non-existing users', async () => {
      // Test with non-existing user
      mockJson.mockResolvedValue({ email: 'nonexistent@example.com' });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response1 = await POST(mockRequest as Request);
      const data1 = await response1.json();

      // Test with existing user
      const mockUser = {
        email: 'existing@example.com',
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockJson.mockResolvedValue({ email: 'existing@example.com' });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      const response2 = await POST(mockRequest as Request);
      const data2 = await response2.json();

      expect(data1.message).toBe(data2.message);
      expect(response1.status).toBe(response2.status);
    });

    it('should generate a 6-digit code', async () => {
      const mockUser: any = {
        email: 'user@example.com',
        resetPasswordToken: null,
        resetPasswordExpires: null,
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockJson.mockResolvedValue({ email: 'user@example.com' });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await POST(mockRequest as Request);

      expect(crypto.randomInt).toHaveBeenCalledWith(100000, 999999);
      expect(mockUser.resetPasswordToken).toHaveLength(6);
    });
  });
});
