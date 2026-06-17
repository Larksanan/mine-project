let mockExec: jest.Mock;
let mockChain: any;

jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    nextUrl: URL;
    headers: Headers;
    method?: string;
    private _body: any;

    constructor(
      url: string,
      init?: { method?: string; body?: any; headers?: any }
    ) {
      this.url = url;
      this.nextUrl = new URL(url);
      this.method = init?.method;
      this._body = init?.body;
      this.headers = new Headers(init?.headers);
    }

    async json() {
      try {
        return Promise.resolve(
          typeof this._body === 'string'
            ? JSON.parse(this._body)
            : this._body || {}
        );
      } catch {
        return Promise.reject(new Error('Invalid JSON'));
      }
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
    user: { id: '1', email: 'jebarsanthatcroos@gmail.com' },
  }),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Doctor', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/Receptionist', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Receptionist from '@/models/Receptionist';
import { getServerSession } from 'next-auth';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  mockExec = jest.fn();
  mockChain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: mockExec,
    then: (resolve: any, reject: any) => mockExec().then(resolve, reject),
  };

  // Default User mock
  (User.findOne as jest.Mock).mockResolvedValue({
    _id: '1',
    email: 'jebarsanthatcroos@gmail.com',
    role: 'ADMIN',
  });

  mockExec.mockResolvedValue([]);
  (User.find as jest.Mock).mockReturnValue(mockChain);
  (Doctor.find as jest.Mock).mockReturnValue(mockChain);
  (Patient.find as jest.Mock).mockReturnValue(mockChain);
  (Receptionist.find as jest.Mock).mockReturnValue(mockChain);
  (User.countDocuments as jest.Mock).mockResolvedValue(0);
  (Doctor.countDocuments as jest.Mock).mockResolvedValue(0);
  (Patient.countDocuments as jest.Mock).mockResolvedValue(0);
  (Receptionist.countDocuments as jest.Mock).mockResolvedValue(0);
});

describe('GET /api/search', () => {
  it('returns 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/search?q=test');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('returns 403 if user is not admin', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: '2',
      email: 'jebarsanthatcroosuser@gmail.com',
      role: 'USER',
    });

    const req = new NextRequest('http://localhost:3000/api/search?q=test');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Forbidden - Admin access required');
  });

  it('returns results with pagination for admin', async () => {
    // Add type=user to search only users, not all entity types
    const req = new NextRequest(
      'http://localhost:3000/api/search?q=Alice&page=1&limit=10&type=user'
    );
    mockExec.mockResolvedValue([
      { _id: '1', name: 'Alice', email: 'jebarsanthatcroosalice@gamil.com' },
    ]);
    (User.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.pagination.total).toBe(1);
    expect(data.pagination.page).toBe(1);
    expect(data.data.results).toHaveLength(1);
    expect(data.data.results[0].name).toBe('Alice');
    expect(data.data.results[0].type).toBe('USER');
  });

  it('returns results for doctors', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/search?q=Dr&type=doctor'
    );

    // Mock doctor results with populated user field
    const results = [
      {
        _id: 'd1',
        user: {
          name: 'Dr. jebarsanthatcroos',
          email: 'jebrsanthatcroos@gmail.com',
          phone: '1234567890',
          image: 'profile.jpg',
          status: 'active',
        },
        profile: {
          specialization: 'Cardiology',
          department: 'Internal Medicine',
          experience: 10,
          rating: 4.5,
          isVerified: true,
        },
      },
    ];

    const doctorMockExec = jest.fn().mockResolvedValue(results);
    const doctorMockChain = {
      ...mockChain,
      exec: doctorMockExec,
      then: (resolve: any, reject: any) =>
        doctorMockExec().then(resolve, reject),
    };
    (Doctor.find as jest.Mock).mockReturnValue(doctorMockChain);
    (Doctor.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.results).toHaveLength(1);
    expect(Doctor.find).toHaveBeenCalled();
  });

  it('returns results for patients', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/search?q=Pat&type=patient'
    );
    mockExec.mockResolvedValue([
      {
        _id: 'p1',
        firstName: 'Jebarsan',
        lastName: 'Thatcroos',
        email: 'jebarsanthatcroospatient@gmail.com',
        phone: '1234567890',
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
        bloodType: 'O+',
        isActive: true,
      },
    ]);
    (Patient.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.results).toHaveLength(1);
    expect(Patient.find).toHaveBeenCalled();
  });

  it('returns results for receptionists', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/search?q=Rec&type=receptionist'
    );

    // Mock receptionist results with populated user field
    const results = [
      {
        _id: 'r1',
        user: {
          name: 'Receptionist One',
          email: 'r@test.com',
          phone: '1234567890',
          image: 'profile.jpg',
          status: 'active',
        },
        employeeId: 'EMP001',
        department: 'Front Desk',
        shift: 'Morning',
        employmentStatus: 'Full-time',
      },
    ];

    const receptionistMockExec = jest.fn().mockResolvedValue(results);
    const receptionistMockChain = {
      ...mockChain,
      exec: receptionistMockExec,
      then: (resolve: any, reject: any) =>
        receptionistMockExec().then(resolve, reject),
    };
    (Receptionist.find as jest.Mock).mockReturnValue(receptionistMockChain);
    (Receptionist.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.results).toHaveLength(1);
    expect(Receptionist.find).toHaveBeenCalled();
  });

  it('handles database errors', async () => {
    const req = new NextRequest('http://localhost:3000/api/search?q=error');
    mockExec.mockRejectedValue(new Error('DB Error'));

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('POST /api/search', () => {
  it('returns 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'Alice' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns 403 if user is not admin', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: '2',
      email: 'user@test.com',
      role: 'USER',
    });

    const req = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'Alice' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns search results with pagination for admin', async () => {
    const req = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'Alice',
        pagination: { page: 1, limit: 10 },
      }),
    });

    mockExec.mockResolvedValue([
      { _id: '1', name: 'Alice', email: 'alice@test.com' },
    ]);
    (User.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.pagination.total).toBe(1);
    expect(data.data).toHaveLength(1);
  });

  it('returns results for doctors via POST', async () => {
    const req = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'Dr',
        type: 'doctor',
        pagination: { page: 1, limit: 10 },
      }),
    });

    mockExec.mockResolvedValue([
      { _id: 'd1', name: 'Dr. Smith', email: 'dr@test.com' },
    ]);
    (Doctor.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });

  it('handles database errors via POST', async () => {
    const req = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'error' }),
    });
    mockExec.mockRejectedValue(new Error('DB Error'));

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
