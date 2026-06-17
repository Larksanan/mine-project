jest.mock('nodemailer');

import nodemailer from 'nodemailer';

const mockSendMail = jest.fn();
const mockVerify = jest.fn(callback => callback(null, 'Success'));

(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: mockSendMail,
  verify: mockVerify,
});

import {
  sendWelcomeEmail,
  sendLoginNotification,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../email';

const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const mockConsoleError = jest.fn();
const mockConsoleLog = jest.fn();

describe('Email Utility', () => {
  beforeAll(() => {
    console.error = mockConsoleError;
    console.log = mockConsoleLog;
  });

  afterAll(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set mock environment variables for testing
    process.env.SMTP_USER = 'jebarsanthatcroos@gmail.com';
    process.env.SMTP_FROM = 'jebarsanthatcroos@gmail.com';
  });

  describe('sendWelcomeEmail', () => {
    it('should send a welcome email successfully', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: '123' });

      await sendWelcomeEmail('larksanan0918@gmail.com', 'T larksanan');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const sentMailArgs = mockSendMail.mock.calls[0][0];
      expect(sentMailArgs.to).toBe('larksanan0918@gmail.com');
      expect(sentMailArgs.from).toBe(
        '"Support Team" <jebarsanthatcroos@gmail.com>'
      );
      expect(sentMailArgs.subject).toBe('Welcome to Our Platform!');
      expect(sentMailArgs.html).toContain('Welcome, T larksanan!');
    });

    it('should handle errors when sending a welcome email', async () => {
      const error = new Error('Failed to send');
      mockSendMail.mockRejectedValueOnce(error);

      await sendWelcomeEmail('larksanan0918@gmail.com', 'John Doe');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error sending welcome email to larksanan0918@gmail.com:',
        error
      );
    });
  });

  describe('sendLoginNotification', () => {
    it('should send a login notification email successfully', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: '123' });

      await sendLoginNotification('larksanan0918@gmail.com', 'T larksanan');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const sentMailArgs = mockSendMail.mock.calls[0][0];
      expect(sentMailArgs.to).toBe('larksanan0918@gmail.com');
      expect(sentMailArgs.from).toBe(
        '"Security Team" <jebarsanthatcroos@gmail.com>'
      );
      expect(sentMailArgs.subject).toBe('New Login Detected');
      expect(sentMailArgs.html).toContain('Hello T larksanan');
    });

    it('should handle errors when sending a login notification', async () => {
      const error = new Error('Failed to send');
      mockSendMail.mockRejectedValueOnce(error);

      await sendLoginNotification('larksanan0918@gmail.com', 'T larksanan');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error sending login notification to larksanan0918@gmail.com:',
        error
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email successfully', async () => {
      const code = '123456';
      mockSendMail.mockResolvedValueOnce({ messageId: '123' });

      await sendPasswordResetEmail('larksanan0918@gmail.com', code);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const sentMailArgs = mockSendMail.mock.calls[0][0];
      expect(sentMailArgs.to).toBe('larksanan0918@gmail.com');
      expect(sentMailArgs.subject).toBe('Password Reset Verification Code');
      expect(sentMailArgs.html).toContain(code);
    });

    it('should throw an error if sending fails', async () => {
      const error = new Error('SMTP Error');
      mockSendMail.mockRejectedValueOnce(error);

      await expect(
        sendPasswordResetEmail('larksanan0918@gmail.com', '123456')
      ).rejects.toThrow('Failed to send password reset email');
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email successfully', async () => {
      const code = '654321';
      mockSendMail.mockResolvedValueOnce({ messageId: '123' });

      await sendVerificationEmail('larksanan0918@gmail.com', code, 'Sam Smith');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const sentMailArgs = mockSendMail.mock.calls[0][0];
      expect(sentMailArgs.subject).toBe('Verify Your Email Address');
      expect(sentMailArgs.html).toContain(code);
    });

    it('should throw an error if sending fails', async () => {
      const error = new Error('SMTP Error');
      mockSendMail.mockRejectedValueOnce(error);

      await expect(
        sendVerificationEmail('larksanan0918@gmail.com', '654321', 'Sam Smith')
      ).rejects.toThrow('Failed to send verification email');
    });
  });
});
