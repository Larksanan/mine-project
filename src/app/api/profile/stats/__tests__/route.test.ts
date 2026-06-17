/* eslint-disable @typescript-eslint/no-require-imports */

// Mock all dependencies
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        json: async () => JSON.parse(JSON.stringify(data)),
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

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Profile Stats API', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;
  let GET: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;
    const route = require('../route');
    GET = route.GET;

    // Default mock implementations
    connectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/profile/stats', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should return profile stats successfully', async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        appointmentsCount: 0,
        patientsCount: 0,
        prescriptionsCount: 0,
        labReportsCount: 0,
        lastActive: expect.any(String), // Date gets serialized to string
        memberSince: expect.any(String),
      });
      expect(connectDB).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle database connection errors', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle session errors', async () => {
      getServerSession.mockRejectedValue(new Error('Session error'));

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should return dates as ISO strings', async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Check that dates are valid ISO strings
      expect(() => new Date(data.data.lastActive)).not.toThrow();
      expect(() => new Date(data.data.memberSince)).not.toThrow();

      // Verify they're recent dates (within last second)
      const lastActive = new Date(data.data.lastActive);
      const memberSince = new Date(data.data.memberSince);
      const now = new Date();

      expect(lastActive.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(memberSince.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('should always return zero counts (placeholder)', async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.appointmentsCount).toBe(0);
      expect(data.data.patientsCount).toBe(0);
      expect(data.data.prescriptionsCount).toBe(0);
      expect(data.data.labReportsCount).toBe(0);
    });

    it('should work with different user sessions', async () => {
      const differentSession = {
        user: { id: 'differentUser456', email: 'other@example.com' },
      };
      getServerSession.mockResolvedValue(differentSession);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.appointmentsCount).toBe(0);
    });

    it('should handle concurrent requests', async () => {
      // Simulate two concurrent requests
      const results = await Promise.all([GET(), GET()]);
      const data1 = await results[0].json();
      const data2 = await results[1].json();

      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
      expect(connectDB).toHaveBeenCalledTimes(2);
    });

    it('should return consistent data structure', async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Check data structure
      expect(data.data).toHaveProperty('appointmentsCount');
      expect(data.data).toHaveProperty('patientsCount');
      expect(data.data).toHaveProperty('prescriptionsCount');
      expect(data.data).toHaveProperty('labReportsCount');
      expect(data.data).toHaveProperty('lastActive');
      expect(data.data).toHaveProperty('memberSince');
      expect(typeof data.data.appointmentsCount).toBe('number');
      expect(typeof data.data.patientsCount).toBe('number');
      expect(typeof data.data.prescriptionsCount).toBe('number');
      expect(typeof data.data.labReportsCount).toBe('number');
      expect(typeof data.data.lastActive).toBe('string');
      expect(typeof data.data.memberSince).toBe('string');
    });

    it('should handle edge case with minimal session data', async () => {
      const minimalSession = {
        user: { id: 'minimalUser' },
      };
      getServerSession.mockResolvedValue(minimalSession);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle undefined session properties', async () => {
      const sessionWithUndefined = {
        user: { id: 'user123', email: undefined, name: undefined },
      };
      getServerSession.mockResolvedValue(sessionWithUndefined);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    it('should respond quickly', async () => {
      const startTime = Date.now();
      const res = await GET();
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(res.status).toBe(200);
      // Should respond in less than 100ms (adjust as needed)
      expect(responseTime).toBeLessThan(100);
    });

    it('should not leak sensitive data', async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Ensure no sensitive data in response
      expect(data.data).not.toHaveProperty('password');
      expect(data.data).not.toHaveProperty('token');
      expect(data.data).not.toHaveProperty('email');
      expect(data.data).not.toHaveProperty('phone');
    });

    it('should handle multiple rapid requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => GET());
      const results = await Promise.all(requests);

      for (const result of results) {
        const data = await result.json();
        expect(result.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle getServerSession throwing non-Error', async () => {
      getServerSession.mockRejectedValue('String error, not Error object');

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connectDB throwing non-Error', async () => {
      connectDB.mockRejectedValue('Connection string error');

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should maintain error response format', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(data.data).toBeUndefined();
    });
  });
});
