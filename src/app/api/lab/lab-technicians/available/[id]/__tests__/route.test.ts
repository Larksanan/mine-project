const mockAggregate = jest.fn();
const mockPopulate = jest.fn();
const mockFindById = jest.fn();

jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    private _body: any;

    constructor(url: string, init?: { method?: string; body?: string }) {
      this.url = url;
      this._body = init?.body;
    }

    async json() {
      return this._body ? JSON.parse(this._body) : {};
    }
  },
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '1', email: 'receptionist@test.com', role: 'RECEPTIONIST' },
  }),
}));

jest.mock('@/models/LabTechnician', () => ({
  __esModule: true,
  default: {
    aggregate: mockAggregate,
    populate: mockPopulate,
    findById: mockFindById,
  },
}));

jest.mock('@/models/LabTest', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

import { getServerSession } from 'next-auth';

beforeEach(() => {
  jest.clearAllMocks();

  // Default mocks
  mockAggregate.mockResolvedValue([]);
  mockPopulate.mockResolvedValue([]);
  mockFindById.mockResolvedValue(null);
});

describe('GET /api/lab-technicians/available/[id]', () => {
  const context = {
    params: Promise.resolve({ id: 'test123' }),
  };

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123'
    );
    const res = await GET(req, context);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should fetch available technicians successfully', async () => {
    // Use a context that matches the specialization we're testing
    const hematologyContext = {
      params: Promise.resolve({ id: 'HEMATOLOGY' }),
    };

    const mockTechnicians = [
      {
        _id: 'tech1',
        specialization: 'HEMATOLOGY',
        isAvailable: true,
        currentWorkload: 2,
        maxConcurrentTests: 5,
        performanceScore: 95,
      },
      {
        _id: 'tech2',
        specialization: 'HEMATOLOGY',
        isAvailable: true,
        currentWorkload: 1,
        maxConcurrentTests: 5,
        performanceScore: 90,
      },
    ];

    const populatedTechnicians = mockTechnicians.map(tech => ({
      ...tech,
      user: {
        name: 'Test User',
        email: 'test@test.com',
        phone: '1234567890',
      },
    }));

    mockAggregate.mockResolvedValue(mockTechnicians);
    mockPopulate.mockResolvedValue(populatedTechnicians);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/HEMATOLOGY'
    );
    const res = await GET(req, hematologyContext);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians).toHaveLength(2);
    expect(data.specialization).toBe('HEMATOLOGY');
    expect(data.totalAvailable).toBe(2);
  });

  it('should filter by specialization', async () => {
    const biochemistryContext = {
      params: Promise.resolve({ id: 'BIOCHEMISTRY' }),
    };

    mockAggregate.mockResolvedValue([]);
    mockPopulate.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/BIOCHEMISTRY'
    );
    await GET(req, biochemistryContext);

    // Verify aggregate was called with specialization filter
    expect(mockAggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            isAvailable: true,
            specialization: 'BIOCHEMISTRY',
          }),
        }),
      ])
    );
  });

  it('should include workload when requested', async () => {
    const mockTechnician = {
      _id: 'tech1',
      specialization: 'HEMATOLOGY',
      currentWorkload: 2,
      maxConcurrentTests: 5,
    };

    mockAggregate.mockResolvedValue([mockTechnician]);
    mockPopulate.mockResolvedValue([mockTechnician]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123?includeWorkload=true'
    );
    const res = await GET(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians[0].currentWorkload).toBeDefined();
    expect(data.technicians[0].maxConcurrentTests).toBeDefined();
  });

  it('should exclude workload by default', async () => {
    const mockTechnician = {
      _id: 'tech1',
      specialization: 'HEMATOLOGY',
      currentWorkload: 2,
      maxConcurrentTests: 5,
    };

    mockAggregate.mockResolvedValue([mockTechnician]);
    mockPopulate.mockResolvedValue([mockTechnician]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123'
    );
    const res = await GET(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.technicians[0].currentWorkload).toBeUndefined();
    expect(data.technicians[0].maxConcurrentTests).toBeUndefined();
  });

  it('should handle database errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockAggregate.mockRejectedValue(new Error('Database error'));

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123'
    );
    const res = await GET(req, context);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');

    consoleErrorSpy.mockRestore();
  });

  it('should sort by workload and performance score', async () => {
    mockAggregate.mockResolvedValue([]);
    mockPopulate.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123'
    );
    await GET(req, context);

    // Verify sorting is applied
    expect(mockAggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $sort: { currentWorkload: 1, performanceScore: -1 },
        }),
      ])
    );
  });
});

describe('POST /api/lab-technicians/available/[id]', () => {
  const context = {
    params: Promise.resolve({ id: 'test123' }),
  };

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'assign' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 for unauthorized roles', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { id: '1', email: 'patient@test.com', role: 'PATIENT' },
    });

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'assign' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 when technicianId is missing', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'assign' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Valid technician ID is required');
  });

  it('should return 404 when technician not found', async () => {
    mockFindById.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'assign' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Lab technician not found');
  });

  it('should assign test successfully', async () => {
    const mockTechnician = {
      _id: 'tech1',
      currentWorkload: 2,
      maxConcurrentTests: 5,
      canAcceptMoreTests: jest.fn().mockReturnValue(true),
      assignTest: jest.fn().mockResolvedValue({
        _id: 'tech1',
        currentWorkload: 3,
        populate: jest.fn().mockResolvedValue({
          _id: 'tech1',
          currentWorkload: 3,
          user: { name: 'Test User' },
        }),
      }),
    };

    mockFindById.mockResolvedValue(mockTechnician);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'assign' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.action).toBe('assign');
    expect(data.message).toBe('Test assigned successfully');
    expect(mockTechnician.canAcceptMoreTests).toHaveBeenCalled();
    expect(mockTechnician.assignTest).toHaveBeenCalled();
  });

  it('should return 400 when technician cannot accept more tests', async () => {
    const mockTechnician = {
      _id: 'tech1',
      currentWorkload: 5,
      maxConcurrentTests: 5,
      canAcceptMoreTests: jest.fn().mockReturnValue(false),
    };

    mockFindById.mockResolvedValue(mockTechnician);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'assign' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Technician cannot accept more tests at this time');
  });

  it('should complete test successfully', async () => {
    const mockTechnician = {
      _id: 'tech1',
      currentWorkload: 3,
      completeTest: jest.fn().mockResolvedValue({
        _id: 'tech1',
        currentWorkload: 2,
        populate: jest.fn().mockResolvedValue({
          _id: 'tech1',
          currentWorkload: 2,
        }),
      }),
    };

    mockFindById.mockResolvedValue(mockTechnician);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'complete' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.action).toBe('complete');
    expect(data.message).toBe('Test completed successfully');
    expect(mockTechnician.completeTest).toHaveBeenCalled();
  });

  it('should update workload successfully', async () => {
    const mockTechnician = {
      _id: 'tech1',
      updateWorkload: jest.fn().mockResolvedValue({
        _id: 'tech1',
        populate: jest.fn().mockResolvedValue({
          _id: 'tech1',
        }),
      }),
    };

    mockFindById.mockResolvedValue(mockTechnician);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'update' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.action).toBe('update');
    expect(data.message).toBe('Test updated successfully');
    expect(mockTechnician.updateWorkload).toHaveBeenCalled();
  });

  it('should return 400 for invalid action', async () => {
    const mockTechnician = {
      _id: 'tech1',
    };

    mockFindById.mockResolvedValue(mockTechnician);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'invalid' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe(
      'Invalid action. Use "assign", "complete", or "update"'
    );
  });

  it('should handle database errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockFindById.mockRejectedValue(new Error('Database error'));

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'assign' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');

    consoleErrorSpy.mockRestore();
  });

  it('should handle "cannot accept more tests" error', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const error = new Error('Technician cannot accept more tests');
    mockFindById.mockRejectedValue(error);

    const req = new NextRequest(
      'http://localhost:3000/api/lab-technicians/available/test123',
      {
        method: 'POST',
        body: JSON.stringify({ technicianId: 'tech1', action: 'assign' }),
      }
    );
    const res = await POST(req, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Technician cannot accept more tests');

    consoleErrorSpy.mockRestore();
  });
});
