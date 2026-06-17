/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * @jest-environment node
 */
import { authOptions } from '../option';
import User from '@/models/User';

// Mock dependencies
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/models/User');
jest.mock('bcryptjs');

describe('NextAuth Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database and Connection Edge Cases', () => {
    it('should handle connection errors gracefully', async () => {
      const { connectDB } = require('@/lib/mongodb');
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const providers = Array.isArray(authOptions.providers)
        ? authOptions.providers
        : [];
      const credentialsProvider = providers.find(
        (p: any) => p.id === 'credentials' || p.name === 'Credentials'
      );
      const authorize = (credentialsProvider as any)?.options?.authorize;

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(authorize?.(credentials, {} as any)).rejects.toThrow();
    });

    it('should handle users without password field', async () => {
      const userWithoutPassword = {
        _id: 'user-no-password',
        name: 'No Password User',
        email: 'nopassword@example.com',
        role: 'PATIENT',
        isActive: true,
      };

      (User.findOne as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(userWithoutPassword),
      }));

      const providers = Array.isArray(authOptions.providers)
        ? authOptions.providers
        : [];
      const credentialsProvider = providers.find(
        (p: any) => p.id === 'credentials' || p.name === 'Credentials'
      );
      const authorize = (credentialsProvider as any)?.options?.authorize;

      const credentials = {
        email: 'nopassword@example.com',
        password: 'password123',
      };

      await expect(authorize?.(credentials, {} as any)).rejects.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should handle empty email', async () => {
      const providers = Array.isArray(authOptions.providers)
        ? authOptions.providers
        : [];
      const credentialsProvider = providers.find(
        (p: any) => p.id === 'credentials' || p.name === 'Credentials'
      );
      const authorize = (credentialsProvider as any)?.options?.authorize;

      const credentials = {
        email: '',
        password: 'password123',
      };

      await expect(authorize?.(credentials, {} as any)).rejects.toThrow();
    });

    it('should handle empty password', async () => {
      const providers = Array.isArray(authOptions.providers)
        ? authOptions.providers
        : [];
      const credentialsProvider = providers.find(
        (p: any) => p.id === 'credentials' || p.name === 'Credentials'
      );
      const authorize = (credentialsProvider as any)?.options?.authorize;

      const credentials = {
        email: 'test@example.com',
        password: '',
      };

      await expect(authorize?.(credentials, {} as any)).rejects.toThrow();
    });

    it('should handle malformed email', async () => {
      const providers = Array.isArray(authOptions.providers)
        ? authOptions.providers
        : [];
      const credentialsProvider = providers.find(
        (p: any) => p.id === 'credentials' || p.name === 'Credentials'
      );
      const authorize = (credentialsProvider as any)?.options?.authorize;

      const credentials = {
        email: 'not-an-email',
        password: 'password123',
      };

      await expect(authorize?.(credentials, {} as any)).rejects.toThrow();
    });
  });

  describe('Token and Session Edge Cases', () => {
    it('should handle JWT callback with OAuth providers', async () => {
      const oauthUser = {
        id: 'oauth-user',
        name: 'OAuth User',
        email: 'oauth@example.com',
      };

      const params = {
        token: { email: 'oauth@example.com' },
        user: oauthUser,
        account: { provider: 'google' },
        profile: {},
        isNewUser: false,
      };

      const jwt = await authOptions.callbacks?.jwt?.(params as any);
      // Should not add role for OAuth users
      expect(jwt?.role).toBeUndefined();
    });

    it('should handle session callback with expired token', async () => {
      const expiredSession = {
        user: { name: 'Expired User', email: 'expired@example.com' },
        expires: new Date(Date.now() - 1000).toISOString(),
      };

      const params = {
        session: expiredSession,
        token: { id: 'user-id', role: 'PATIENT' },
        user: {},
      };

      const session = await authOptions.callbacks?.session?.(params as any);
      expect(session?.expires).toBe(expiredSession.expires);
    });
  });
});
