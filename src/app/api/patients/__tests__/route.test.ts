import { NextRequest } from 'next/server';
import Patient from '../../../../models/Patient';
import UserModel from '../../../../models/User';
import { GET } from '../route';
import { getServerSession } from 'next-auth';

const mockLean = jest.fn();

const mockChain = {
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: mockLean,
};

jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  },
  NextResponse: {
    json: jest.fn((data: any, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '1', email: 'admin@test.com' },
  }),
}));

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});

  // Default mocks
  (Patient.find as jest.Mock).mockReturnValue(mockChain);
  mockLean.mockResolvedValue([]);
  (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
  (Patient.aggregate as jest.Mock).mockResolvedValue([]);

  (UserModel.findOne as jest.Mock).mockResolvedValue({
    _id: '1',
    email: 'admin@test.com',
    role: 'ADMIN',
  });
});

describe('GET /api/patients', () => {
  it('should return patients with pagination, statistics, and search', async () => {
    const mockPatients = [
      {
        _id: '1',
        firstName: 'sovika',
        lastName: 'sovika',
        email: 'sovika@test.com',
        isActive: true,
        gender: 'FEMALE',
        dateOfBirth: '1990-01-01',
        createdAt: '2023-01-01T00:00:00.000Z',
      },
      {
        _id: '2',
        firstName: 'larksanan',
        lastName: 'larksanan',
        email: 'larksanan@test.com',
        isActive: true,
        gender: 'MALE',
        dateOfBirth: '2001-06-15',
        createdAt: '2023-02-01T00:00:00.000Z',
      },
    ];

    mockLean.mockResolvedValue(mockPatients);
    (Patient.countDocuments as jest.Mock).mockResolvedValue(2);
    (Patient.aggregate as jest.Mock)
      .mockResolvedValueOnce([
        {
          totalCount: 2,
          activeCount: 2,
          maleCount: 1,
          femaleCount: 1,
          otherGenderCount: 0,
        },
      ])
      .mockResolvedValueOnce([
        { _id: 'A+', count: 1 },
        { _id: 'B+', count: 1 },
      ]);

    const req = new NextRequest(
      'http://localhost:3000/api/patients?search=Alice&page=1&limit=10'
    );
    const res = await GET(req);
    const data = await res.json();

    // Check response status
    expect(res.status).toBe(200);

    // Check success
    expect(data.success).toBe(true);

    // Check pagination
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.pages).toBe(1);
    expect(data.pagination.hasNextPage).toBe(false);
    expect(data.pagination.hasPrevPage).toBe(false);

    expect(data.data).toHaveLength(2);
    expect(data.data[0].firstName).toBe('sovika');
    expect(data.data[0].age).toBeGreaterThan(30);

    expect(data.statistics.total).toBe(2);
    expect(data.statistics.active).toBe(2);
    expect(data.statistics.genders.male).toBe(1);
    expect(data.statistics.genders.female).toBe(1);

    expect(data.statistics.bloodTypes['A+']).toBe(1);
    expect(data.statistics.bloodTypes['B+']).toBe(1);

    expect(data.filters.search).toBe('Alice');
    expect(data.filters.page).toBe(undefined);
  });

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/patients');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 403 when user does not have permission', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValueOnce({
      _id: '1',
      email: 'user@test.com',
      role: 'USER',
    });

    const req = new NextRequest('http://localhost:3000/api/patients');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Forbidden - Insufficient permissions');
  });
});
