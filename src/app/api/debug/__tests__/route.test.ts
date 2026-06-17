/* eslint-disable @typescript-eslint/no-require-imports */

import { GET } from '../route';

// Mock all dependencies
jest.mock('next/server', () => {
  return {
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

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Debug API', () => {
  let getServerSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
  });

  describe('GET /api/debug', () => {
    it('should return debug info with authenticated session', async () => {
      const mockSession = {
        user: {
          id: 'user123',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      };

      getServerSession.mockResolvedValue(mockSession);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Debug endpoint working');
      expect(data.session).toEqual({
        userId: 'user123',
        role: 'ADMIN',
        email: 'admin@example.com',
      });
      expect(data.timestamp).toBeDefined();
      expect(() => new Date(data.timestamp)).not.toThrow();
    });

    it('should return debug info with no session', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Debug endpoint working');
      expect(data.session).toBe('No session');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle session with partial user data', async () => {
      const partialSession = {
        user: {
          id: 'user123',
          // Missing role and email
        },
      };

      getServerSession.mockResolvedValue(partialSession);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.session).toEqual({
        userId: 'user123',
        role: undefined,
        email: undefined,
      });
    });

    it('should handle session with null user', async () => {
      const sessionWithNullUser = {
        user: null,
      };

      getServerSession.mockResolvedValue(sessionWithNullUser);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.session).toEqual({
        userId: undefined,
        role: undefined,
        email: undefined,
      });
    });

    it('should handle session with undefined user', async () => {
      const sessionWithUndefinedUser = {
        user: undefined,
      };

      getServerSession.mockResolvedValue(sessionWithUndefinedUser);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.session).toEqual({
        userId: undefined,
        role: undefined,
        email: undefined,
      });
    });

    it('should handle different user roles', async () => {
      const testCases = [
        { role: 'USER', email: 'user@example.com' },
        { role: 'ADMIN', email: 'admin@example.com' },
        { role: 'DOCTOR', email: 'doctor@example.com' },
        { role: 'RECEPTIONIST', email: 'receptionist@example.com' },
        { role: 'PHARMACIST', email: 'pharmacist@example.com' },
        { role: '', email: 'emptyrole@example.com' },
        { role: null, email: 'nullrole@example.com' },
      ];

      for (const testCase of testCases) {
        getServerSession.mockResolvedValue({
          user: {
            id: 'user123',
            role: testCase.role,
            email: testCase.email,
          },
        });

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.session.role).toBe(testCase.role);
        expect(data.session.email).toBe(testCase.email);
      }
    });

    it('should handle session errors', async () => {
      getServerSession.mockRejectedValue(new Error('Session error'));

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Debug endpoint failed');
      expect(data.details).toBe('Session error');
    });

    it('should handle non-Error exceptions', async () => {
      getServerSession.mockRejectedValue('String error, not Error object');

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Debug endpoint failed');
      expect(data.details).toBe('Unknown error');
    });

    it('should include current timestamp', async () => {
      const mockSession = {
        user: { id: 'user123', role: 'USER', email: 'user@example.com' },
      };

      getServerSession.mockResolvedValue(mockSession);

      const beforeCall = Date.now();
      const res = await GET();
      const afterCall = Date.now();
      const data = await res.json();

      expect(res.status).toBe(200);

      const timestamp = new Date(data.timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeCall);
      expect(timestamp).toBeLessThanOrEqual(afterCall);
    });

    it('should handle concurrent requests', async () => {
      const session1 = {
        user: { id: 'user1', role: 'USER', email: 'user1@example.com' },
      };
      const session2 = {
        user: { id: 'user2', role: 'ADMIN', email: 'user2@example.com' },
      };

      getServerSession
        .mockResolvedValueOnce(session1)
        .mockResolvedValueOnce(session2);

      const [res1, res2] = await Promise.all([GET(), GET()]);
      const data1 = await res1.json();
      const data2 = await res2.json();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(data1.session.userId).toBe('user1');
      expect(data2.session.userId).toBe('user2');
    });

    it('should always return JSON response', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(typeof data).toBe('object');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('session');
      expect(data).toHaveProperty('timestamp');
    });

    it('should handle session with extra user properties', async () => {
      const extendedSession = {
        user: {
          id: 'user123',
          role: 'USER',
          email: 'user@example.com',
          name: 'John Doe',
          image: 'profile.jpg',
          customProp: 'customValue',
        },
      };

      getServerSession.mockResolvedValue(extendedSession);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.session).toEqual({
        userId: 'user123',
        role: 'USER',
        email: 'user@example.com',
        // Should only include id, role, email
      });
    });

    it('should return ISO string for timestamp', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);

      // Check if it's a valid ISO string
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(isoRegex.test(data.timestamp)).toBe(true);

      // Should be able to parse it as a Date
      const date = new Date(data.timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should handle empty session object', async () => {
      getServerSession.mockResolvedValue({});

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.session).toEqual({
        userId: undefined,
        role: undefined,
        email: undefined,
      });
    });

    it('should maintain consistent response structure', async () => {
      const testCases = [
        {
          session: {
            user: { id: 'user123', role: 'ADMIN', email: 'admin@example.com' },
          },
        },
        { session: null },
        { session: { user: null } },
        { session: { user: undefined } },
        { session: {} },
      ];

      for (const testCase of testCases) {
        getServerSession.mockResolvedValue(testCase.session);

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('session');
        expect(data).toHaveProperty('timestamp');
        expect(typeof data.message).toBe('string');
        expect(typeof data.timestamp).toBe('string');
      }
    });
  });
});
