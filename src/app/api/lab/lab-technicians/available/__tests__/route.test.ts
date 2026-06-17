/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import LabTechnician from '@/models/LabTechnician';

const mockSort = jest.fn();
const mockPopulate = jest.fn();

const mockChain = {
  populate: mockPopulate,
  sort: mockSort,
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

jest.mock('@/models/LabTechnician', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('GET /api/lab-technicians/available', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);

    mockPopulate.mockReturnValue(mockChain);
    mockSort.mockResolvedValue([]);

    (LabTechnician.find as jest.Mock).mockReturnValue(mockChain);
  });

  const mockSession = {
    user: {
      id: 'user123',
      email: 'user@example.com',
      role: 'USER',
    },
  };

  const mockTechnicians = [
    {
      _id: 'tech1',
      user: {
        _id: 'user1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '0771234567',
      },
      specialization: 'Hematology',
      isAvailable: true,
      currentWorkload: 2,
      maxConcurrentTests: 5,
      performanceScore: 95,
    },
    {
      _id: 'tech2',
      user: {
        _id: 'user2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '0779876543',
      },
      specialization: 'Microbiology',
      isAvailable: true,
      currentWorkload: 1,
      maxConcurrentTests: 5,
      performanceScore: 92,
    },
  ];

  beforeEach(() => {
    getServerSession.mockResolvedValue(mockSession);
  });

  it('should fetch available technicians successfully', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians).toBeDefined();
    expect(data.technicians).toHaveLength(2);
    expect(data.technicians[0]._id).toBe('tech1');
    expect(data.technicians[1]._id).toBe('tech2');
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(LabTechnician.find).not.toHaveBeenCalled();
  });

  it('should filter by specialization when provided', async () => {
    mockSort.mockResolvedValue([mockTechnicians[0]]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available?specialization=Hematology'
    );

    const res = await GET(req);
    const _data = await res.json();

    expect(res.status).toBe(200);
    expect(LabTechnician.find).toHaveBeenCalledWith({
      isAvailable: true,
      specialization: 'Hematology',
      $expr: { $lt: ['$currentWorkload', '$maxConcurrentTests'] },
    });
  });

  it('should not filter by specialization when not provided', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const _res = await GET(req);

    expect(LabTechnician.find).toHaveBeenCalledWith({
      isAvailable: true,
      $expr: { $lt: ['$currentWorkload', '$maxConcurrentTests'] },
    });
  });

  it('should only return available technicians', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    await GET(req);

    expect(LabTechnician.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isAvailable: true,
      })
    );
  });

  it('should only return technicians with workload less than max', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    await GET(req);

    expect(LabTechnician.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $expr: { $lt: ['$currentWorkload', '$maxConcurrentTests'] },
      })
    );
  });

  it('should populate user fields correctly', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    await GET(req);

    expect(mockPopulate).toHaveBeenCalledWith('user', 'name email phone');
  });

  it('should sort by currentWorkload ascending and performanceScore descending', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    await GET(req);

    expect(mockSort).toHaveBeenCalledWith({
      currentWorkload: 1,
      performanceScore: -1,
    });
  });

  it('should return empty array when no technicians are available', async () => {
    mockSort.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians).toEqual([]);
  });

  it('should handle single available technician', async () => {
    const singleTechnician = [mockTechnicians[0]];
    mockSort.mockResolvedValue(singleTechnician);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians).toHaveLength(1);
    expect(data.technicians[0]._id).toBe('tech1');
  });

  it('should include user details in response', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(data.technicians[0].user).toBeDefined();
    expect(data.technicians[0].user.name).toBe('John Smith');
    expect(data.technicians[0].user.email).toBe('john@example.com');
    expect(data.technicians[0].user.phone).toBe('0771234567');
  });

  it('should handle multiple specializations query', async () => {
    mockSort.mockResolvedValue([mockTechnicians[1]]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available?specialization=Microbiology'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians).toHaveLength(1);
    expect(data.technicians[0].specialization).toBe('Microbiology');
  });

  it('should handle database connection errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    connectDB.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching available technicians:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should handle find errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    (LabTechnician.find as jest.Mock).mockImplementation(() => {
      throw new Error('Query failed');
    });

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching available technicians:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should handle populate errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockPopulate.mockImplementation(() => {
      throw new Error('Populate failed');
    });

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching available technicians:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should handle sort errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockSort.mockRejectedValue(new Error('Sort failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching available technicians:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
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
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians).toBeDefined();
  });

  it('should handle technicians with different workloads', async () => {
    const techniciansWithDifferentWorkloads = [
      { ...mockTechnicians[0], currentWorkload: 0 },
      { ...mockTechnicians[1], currentWorkload: 4 },
    ];

    mockSort.mockResolvedValue(techniciansWithDifferentWorkloads);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians[0].currentWorkload).toBe(0);
    expect(data.technicians[1].currentWorkload).toBe(4);
  });

  it('should handle technicians with different performance scores', async () => {
    const techniciansWithDifferentScores = [
      { ...mockTechnicians[0], performanceScore: 100 },
      { ...mockTechnicians[1], performanceScore: 85 },
    ];

    mockSort.mockResolvedValue(techniciansWithDifferentScores);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians[0].performanceScore).toBe(100);
    expect(data.technicians[1].performanceScore).toBe(85);
  });

  it('should handle large number of available technicians', async () => {
    const manyTechnicians = Array.from({ length: 50 }, (_, i) => ({
      _id: `tech${i}`,
      user: {
        _id: `user${i}`,
        name: `Technician ${i}`,
        email: `tech${i}@example.com`,
        phone: `077${String(i).padStart(7, '0')}`,
      },
      specialization: i % 2 === 0 ? 'Hematology' : 'Microbiology',
      isAvailable: true,
      currentWorkload: i % 5,
      maxConcurrentTests: 5,
      performanceScore: 90 - i,
    }));

    mockSort.mockResolvedValue(manyTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians).toHaveLength(50);
  });

  it('should handle empty specialization parameter', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available?specialization='
    );

    const _res = await GET(req);

    // Empty string should not add specialization to query
    expect(LabTechnician.find).toHaveBeenCalledWith({
      isAvailable: true,
      $expr: { $lt: ['$currentWorkload', '$maxConcurrentTests'] },
    });
  });

  it('should handle technician with null user', async () => {
    const technicianWithNullUser = [
      {
        ...mockTechnicians[0],
        user: null,
      },
    ];

    mockSort.mockResolvedValue(technicianWithNullUser);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians[0].user).toBeNull();
  });

  it('should chain find, populate, and sort correctly', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    await GET(req);

    expect(LabTechnician.find).toHaveBeenCalled();
    expect(mockPopulate).toHaveBeenCalled();
    expect(mockSort).toHaveBeenCalled();
  });

  it('should use $expr for comparing currentWorkload with maxConcurrentTests', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    await GET(req);

    expect(LabTechnician.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $expr: expect.objectContaining({
          $lt: ['$currentWorkload', '$maxConcurrentTests'],
        }),
      })
    );
  });

  it('should maintain technician data structure', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(data.technicians[0]).toHaveProperty('_id');
    expect(data.technicians[0]).toHaveProperty('user');
    expect(data.technicians[0]).toHaveProperty('specialization');
    expect(data.technicians[0]).toHaveProperty('isAvailable');
    expect(data.technicians[0]).toHaveProperty('currentWorkload');
    expect(data.technicians[0]).toHaveProperty('maxConcurrentTests');
    expect(data.technicians[0]).toHaveProperty('performanceScore');
  });

  it('should handle special characters in specialization parameter', async () => {
    mockSort.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available?specialization=Hematology%20%26%20Blood'
    );

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(LabTechnician.find).toHaveBeenCalledWith(
      expect.objectContaining({
        specialization: 'Hematology & Blood',
      })
    );
  });

  it('should prioritize technicians with lower workload', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    await GET(req);

    const sortCall = mockSort.mock.calls[0][0];
    expect(sortCall.currentWorkload).toBe(1); // Ascending order
  });

  it('should prioritize technicians with higher performance score as secondary sort', async () => {
    mockSort.mockResolvedValue(mockTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    await GET(req);

    const sortCall = mockSort.mock.calls[0][0];
    expect(sortCall.performanceScore).toBe(-1); // Descending order
  });

  it('should handle technicians at maximum capacity', async () => {
    // These should not be returned since currentWorkload equals maxConcurrentTests
    mockSort.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available'
    );

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians).toEqual([]);
  });

  it('should handle case-sensitive specialization filtering', async () => {
    mockSort.mockResolvedValue([mockTechnicians[0]]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available?specialization=HEMATOLOGY'
    );

    await GET(req);

    expect(LabTechnician.find).toHaveBeenCalledWith(
      expect.objectContaining({
        specialization: 'HEMATOLOGY',
      })
    );
  });
});
