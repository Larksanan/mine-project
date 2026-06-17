/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import Receptionist from '@/models/Receptionist';

const mockLean = jest.fn();
const mockPopulate = jest.fn();

const mockChain = {
  populate: mockPopulate,
  lean: mockLean,
};

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      constructor(url: string, init?: any) {
        this.url = url;
        this.method = init?.method || 'GET';
      }
    },
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

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/Receptionist', () => ({
  __esModule: true,
  default: {
    findAvailableReceptionists: jest.fn(),
  },
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

describe('GET /api/receptionists/available', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);

    mockPopulate.mockReturnValue(mockChain);
    mockLean.mockResolvedValue([]);

    (Receptionist.findAvailableReceptionists as jest.Mock).mockReturnValue(
      mockChain
    );
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const mockSession = {
    user: {
      id: 'user123',
      email: 'user@example.com',
      role: 'USER',
    },
  };

  const mockReceptionists = [
    {
      _id: 'receptionist1',
      user: {
        _id: 'user1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0771234567',
        image: '/images/jane.jpg',
      },
      assignedDoctor: {
        _id: 'doctor1',
        name: 'Dr. John Doe',
        specialization: 'Cardiology',
        email: 'john@example.com',
      },
      isAvailable: true,
      currentStatus: 'available',
    },
    {
      _id: 'receptionist2',
      user: {
        _id: 'user2',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '0779876543',
        image: '/images/alice.jpg',
      },
      assignedDoctor: {
        _id: 'doctor2',
        name: 'Dr. Sarah Williams',
        specialization: 'Neurology',
        email: 'sarah@example.com',
      },
      isAvailable: true,
      currentStatus: 'available',
    },
  ];

  beforeEach(() => {
    getServerSession.mockResolvedValue(mockSession);
  });

  it('should fetch available receptionists successfully', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data).toHaveLength(2);
    expect(data.count).toBe(2);
    expect(data.data[0]._id).toBe('receptionist1');
    expect(data.data[1]._id).toBe('receptionist2');
    expect(Receptionist.findAvailableReceptionists).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
    expect(Receptionist.findAvailableReceptionists).not.toHaveBeenCalled();
  });

  it('should populate user fields correctly', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    await GET(req);

    expect(mockPopulate).toHaveBeenCalledWith('user', 'name email phone image');
  });

  it('should populate assignedDoctor fields correctly', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    await GET(req);

    expect(mockPopulate).toHaveBeenCalledWith(
      'assignedDoctor',
      'name specialization email'
    );
  });

  it('should call both populate methods', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    await GET(req);

    expect(mockPopulate).toHaveBeenCalledTimes(2);
  });

  it('should return empty array when no receptionists are available', async () => {
    mockLean.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.count).toBe(0);
  });

  it('should handle single available receptionist', async () => {
    const singleReceptionist = [mockReceptionists[0]];
    mockLean.mockResolvedValue(singleReceptionist);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.count).toBe(1);
  });

  it('should include user details in response', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(data.data[0].user).toBeDefined();
    expect(data.data[0].user.name).toBe('Jane Smith');
    expect(data.data[0].user.email).toBe('jane@example.com');
    expect(data.data[0].user.phone).toBe('0771234567');
    expect(data.data[0].user.image).toBe('/images/jane.jpg');
  });

  it('should include assignedDoctor details in response', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(data.data[0].assignedDoctor).toBeDefined();
    expect(data.data[0].assignedDoctor.name).toBe('Dr. John Doe');
    expect(data.data[0].assignedDoctor.specialization).toBe('Cardiology');
    expect(data.data[0].assignedDoctor.email).toBe('john@example.com');
  });

  it('should handle receptionist without assigned doctor', async () => {
    const receptionistWithoutDoctor = [
      {
        ...mockReceptionists[0],
        assignedDoctor: null,
      },
    ];

    mockLean.mockResolvedValue(receptionistWithoutDoctor);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data[0].assignedDoctor).toBeNull();
  });

  it('should handle receptionist without user details', async () => {
    const receptionistWithoutUser = [
      {
        ...mockReceptionists[0],
        user: null,
      },
    ];

    mockLean.mockResolvedValue(receptionistWithoutUser);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data[0].user).toBeNull();
  });

  it('should handle database connection errors', async () => {
    connectDB.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database connection failed');
  });

  it('should handle findAvailableReceptionists errors', async () => {
    (Receptionist.findAvailableReceptionists as jest.Mock).mockImplementation(
      () => {
        throw new Error('Query failed');
      }
    );

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Query failed');
  });

  it('should handle populate errors', async () => {
    mockPopulate.mockImplementation(() => {
      throw new Error('Populate failed');
    });

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Populate failed');
  });

  it('should handle lean errors', async () => {
    mockLean.mockRejectedValue(new Error('Lean operation failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Lean operation failed');
  });

  it('should use lean() to return plain JavaScript objects', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    await GET(req);

    expect(mockLean).toHaveBeenCalled();
  });

  it('should return correct count matching array length', async () => {
    const threeReceptionists = [
      ...mockReceptionists,
      {
        _id: 'receptionist3',
        user: {
          _id: 'user3',
          name: 'Bob Brown',
          email: 'bob@example.com',
          phone: '0771112222',
          image: '/images/bob.jpg',
        },
        assignedDoctor: null,
        isAvailable: true,
        currentStatus: 'available',
      },
    ];

    mockLean.mockResolvedValue(threeReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(data.count).toBe(3);
    expect(data.data).toHaveLength(3);
  });

  it('should work for any authenticated user role', async () => {
    const adminSession = {
      user: {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    };

    getServerSession.mockResolvedValue(adminSession);
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle large number of available receptionists', async () => {
    const manyReceptionists = Array.from({ length: 50 }, (_, i) => ({
      _id: `receptionist${i}`,
      user: {
        _id: `user${i}`,
        name: `Receptionist ${i}`,
        email: `receptionist${i}@example.com`,
        phone: `077${String(i).padStart(7, '0')}`,
        image: `/images/receptionist${i}.jpg`,
      },
      assignedDoctor: {
        _id: `doctor${i}`,
        name: `Dr. Doctor ${i}`,
        specialization: 'General Medicine',
        email: `doctor${i}@example.com`,
      },
      isAvailable: true,
      currentStatus: 'available',
    }));

    mockLean.mockResolvedValue(manyReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(50);
    expect(data.count).toBe(50);
  });

  it('should call findAvailableReceptionists static method', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    await GET(req);

    expect(Receptionist.findAvailableReceptionists).toHaveBeenCalledTimes(1);
  });

  it('should chain populate and lean correctly', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    await GET(req);

    // Verify the chain: findAvailableReceptionists -> populate -> populate -> lean
    expect(Receptionist.findAvailableReceptionists).toHaveBeenCalled();
    expect(mockPopulate).toHaveBeenCalledTimes(2);
    expect(mockLean).toHaveBeenCalled();
  });

  it('should maintain receptionist data structure', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(data.data[0]).toHaveProperty('_id');
    expect(data.data[0]).toHaveProperty('user');
    expect(data.data[0]).toHaveProperty('assignedDoctor');
    expect(data.data[0]).toHaveProperty('isAvailable');
    expect(data.data[0]).toHaveProperty('currentStatus');
  });

  it('should handle receptionist with different current statuses', async () => {
    const receptionistsWithStatuses = [
      { ...mockReceptionists[0], currentStatus: 'on_break' },
      { ...mockReceptionists[1], currentStatus: 'in_meeting' },
    ];

    mockLean.mockResolvedValue(receptionistsWithStatuses);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data[0].currentStatus).toBe('on_break');
    expect(data.data[1].currentStatus).toBe('in_meeting');
  });

  it('should handle error without message property', async () => {
    mockLean.mockRejectedValue('String error');

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeUndefined();
  });

  it('should return response with all three expected properties', async () => {
    mockLean.mockResolvedValue(mockReceptionists);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('count');
    expect(data.success).toBe(true);
  });

  it('should handle receptionists with partial user data', async () => {
    const partialUserData = [
      {
        ...mockReceptionists[0],
        user: {
          _id: 'user1',
          name: 'Jane Smith',
          email: 'jane@example.com',
          // Missing phone and image
        },
      },
    ];

    mockLean.mockResolvedValue(partialUserData);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data[0].user.name).toBe('Jane Smith');
  });
});
