/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest } from 'next/server';

// Mock dependencies at the top level
const mockExec = jest.fn();

jest.mock('@/models/Patient', () => {
  const mockChain = {
    populate: jest.fn(),
    sort: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
    lean: jest.fn(),
    select: jest.fn(),
    exec: mockExec,
    then: (resolve: (data: any) => void, reject: (err: any) => void) =>
      mockExec().then(resolve, reject),
  };

  mockChain.populate.mockReturnValue(mockChain);
  mockChain.sort.mockReturnValue(mockChain);
  mockChain.limit.mockReturnValue(mockChain);
  mockChain.skip.mockReturnValue(mockChain);
  mockChain.select.mockReturnValue(mockChain);
  mockChain.lean.mockReturnValue(mockChain);

  return {
    __esModule: true,
    default: {
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      getPatientStats: jest.fn(),
      find: jest.fn(() => mockChain),
      findOne: jest.fn(() => mockChain),
      findById: jest.fn(() => mockChain),
    },
  };
});

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    nextUrl: URL;
    constructor(url: string) {
      this.url = url;
      this.nextUrl = new URL(url);
    }
  },
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

describe('GET /api/patients/stats', () => {
  let Patient: any;
  let User: any;
  let getServerSession: jest.Mock;
  let GET: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default exec mock
    mockExec.mockResolvedValue([]);

    // Get fresh instances of mocked modules
    Patient = require('@/models/Patient').default;
    User = require('@/models/User').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;

    const route = require('@/app/api/patients/stats/route');
    GET = route.GET;

    // Default session mock (authenticated admin)
    getServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com' },
    });

    // Default User.findOne mock (admin user)
    User.findOne.mockResolvedValue({
      _id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });
  });

  it('should return patient statistics', async () => {
    const mockStats = {
      total: 100,
      active: 85,
      inactive: 15,
      genderDistribution: {
        male: 45,
        female: 52,
        other: 3,
      },
      ageDistribution: {
        '0-18': 20,
        '19-35': 40,
        '36-50': 25,
        '51+': 15,
      },
      monthlyGrowth: 5,
      topCities: [
        { city: 'Colombo', count: 30 },
        { city: 'Kandy', count: 20 },
        { city: 'Galle', count: 15 },
      ],
    };

    Patient.getPatientStats.mockResolvedValue(mockStats);

    const req = new NextRequest('http://localhost:3000/api/patients/stats');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockStats);
    expect(Patient.getPatientStats).toHaveBeenCalled();
  });

  it('should return basic stats if getPatientStats is not available', async () => {
    // Temporarily replace getPatientStats with undefined
    const originalGetPatientStats = Patient.getPatientStats;
    Patient.getPatientStats = undefined;

    try {
      // Mock the individual method calls that the fallback logic will use
      Patient.countDocuments
        .mockResolvedValueOnce(100) // Total count
        .mockResolvedValueOnce(85); // Active count

      Patient.aggregate
        .mockResolvedValueOnce([
          // Gender distribution
          { _id: 'MALE', count: 45 },
          { _id: 'FEMALE', count: 52 },
          { _id: 'OTHER', count: 3 },
        ])
        .mockResolvedValueOnce([]) // Age distribution
        .mockResolvedValueOnce([]) // Top cities
        .mockResolvedValueOnce([]); // Monthly growth

      const req = new NextRequest('http://localhost:3000/api/patients/stats');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total).toBe(100);
      expect(data.data.active).toBe(85);
      expect(data.data.inactive).toBe(15);
      expect(data.data.genderDistribution.male).toBe(45);
      expect(data.data.genderDistribution.female).toBe(52);
      expect(data.data.genderDistribution.other).toBe(3);
    } finally {
      // Restore the original method
      Patient.getPatientStats = originalGetPatientStats;
    }
  });

  it('should handle empty database', async () => {
    Patient.getPatientStats.mockResolvedValue({
      total: 0,
      active: 0,
      inactive: 0,
      genderDistribution: {
        male: 0,
        female: 0,
        other: 0,
      },
      ageDistribution: {},
      monthlyGrowth: 0,
      topCities: [],
    });

    const req = new NextRequest('http://localhost:3000/api/patients/stats');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.total).toBe(0);
    expect(data.data.active).toBe(0);
    expect(data.data.inactive).toBe(0);
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/patients/stats');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 403 when not admin', async () => {
    User.findOne.mockResolvedValueOnce({
      _id: '1',
      email: 'user@test.com',
      role: 'USER',
    });

    const req = new NextRequest('http://localhost:3000/api/patients/stats');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Forbidden - Insufficient permissions');
  });

  it('should handle database errors', async () => {
    Patient.getPatientStats.mockRejectedValue(new Error('Database error'));

    const req = new NextRequest('http://localhost:3000/api/patients/stats');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Database error');
  });
});
