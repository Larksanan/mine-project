/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock all dependencies
jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    method?: string;
    body?: any;
    headers: any;

    constructor(url: string, init?: { method?: string; body?: any }) {
      this.url = url;
      this.method = init?.method;
      this.body = init?.body;
      this.headers = { get: () => null };
    }

    json() {
      return Promise.resolve(this.body ? JSON.parse(this.body) : {});
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
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/models/LabTechnician', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/LabTestRequest', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}));

describe('Lab Technician Workload API', () => {
  let LabTechnician: any;
  let LabTestRequest: any;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    LabTechnician = require('@/models/LabTechnician').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/lab-technicians/[id]/workload', () => {
    const mockSession = {
      user: { id: 'user123', role: 'ADMIN' },
    };

    const mockTechnician = {
      _id: 'tech123',
      user: {
        name: 'Dr. Smith',
        email: 'smith@lab.com',
      },
      currentWorkload: 3,
      maxConcurrentTests: 5,
      efficiency: 0.85,
      isAvailable: true,
      canAcceptMoreTests: jest.fn().mockReturnValue(true),
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should fetch technician workload successfully', async () => {
      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockTechnician),
        }),
      });

      // Mock LabTestRequest dynamically
      jest.isolateModules(() => {
        const mockLabTestRequest = {
          countDocuments: jest.fn().mockResolvedValue(3),
        };
        jest.doMock('@/models/LabTestRequest', () => ({
          __esModule: true,
          default: mockLabTestRequest,
        }));
      });

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician.name).toBe('Dr. Smith');
      expect(data.technician.currentWorkload).toBe(3);
      expect(data.technician.maxConcurrentTests).toBe(5);
      expect(data.technician.efficiency).toBe(0.85);
      expect(data.technician.isAvailable).toBe(true);
      expect(data.availableSlots).toBe(2); // 5 - 3
      expect(data.canAcceptMore).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when technician not found', async () => {
      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        }),
      });

      const context = { params: Promise.resolve({ id: 'invalid' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/invalid/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Lab technician not found');
    });

    it('should calculate available slots correctly', async () => {
      const fullyLoadedTech = {
        ...mockTechnician,
        currentWorkload: 5,
        maxConcurrentTests: 5,
        canAcceptMoreTests: jest.fn().mockReturnValue(false),
      };

      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(fullyLoadedTech),
        }),
      });

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.availableSlots).toBe(0); // 5 - 5
      expect(data.canAcceptMore).toBe(false);
    });

    it('should handle technician with no active tests', async () => {
      const idleTech = {
        ...mockTechnician,
        currentWorkload: 0,
        canAcceptMoreTests: jest.fn().mockReturnValue(true),
      };

      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(idleTech),
        }),
      });

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician.currentWorkload).toBe(0);
      expect(data.availableSlots).toBe(5); // 5 - 0
    });

    it('should handle unavailable technician', async () => {
      const unavailableTech = {
        ...mockTechnician,
        isAvailable: false,
        canAcceptMoreTests: jest.fn().mockReturnValue(false),
      };

      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(unavailableTech),
        }),
      });

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician.isAvailable).toBe(false);
    });

    it('should handle database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('POST /api/lab-technicians/[id]/workload', () => {
    const mockSession = {
      user: { id: 'user123', role: 'ADMIN' },
    };

    const mockTechnician = {
      _id: 'tech123',
      currentWorkload: 3,
      maxConcurrentTests: 5,
      assignTest: jest.fn(),
      completeTest: jest.fn(),
      updateWorkload: jest.fn(),
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
      mockTechnician.assignTest.mockClear();
      mockTechnician.completeTest.mockClear();
      mockTechnician.updateWorkload.mockClear();
    });

    it('should assign test successfully', async () => {
      const updatedTech = {
        ...mockTechnician,
        currentWorkload: 4,
      };

      mockTechnician.assignTest.mockResolvedValue(updatedTech);
      LabTechnician.findById.mockResolvedValue(mockTechnician);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'assign' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Workload assigned successfully');
      expect(data.technician.currentWorkload).toBe(4);
      expect(mockTechnician.assignTest).toHaveBeenCalled();
    });

    it('should complete test successfully', async () => {
      const updatedTech = {
        ...mockTechnician,
        currentWorkload: 2,
      };

      mockTechnician.completeTest.mockResolvedValue(updatedTech);
      LabTechnician.findById.mockResolvedValue(mockTechnician);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'complete' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Workload completeed successfully');
      expect(data.technician.currentWorkload).toBe(2);
      expect(mockTechnician.completeTest).toHaveBeenCalled();
    });

    it('should update workload successfully', async () => {
      const updatedTech = {
        ...mockTechnician,
        currentWorkload: 3,
      };

      mockTechnician.updateWorkload.mockResolvedValue(updatedTech);
      LabTechnician.findById.mockResolvedValue(mockTechnician);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'update' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Workload updateed successfully');
      expect(mockTechnician.updateWorkload).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'assign' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when technician not found', async () => {
      LabTechnician.findById.mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: 'invalid' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/invalid/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'assign' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Lab technician not found');
    });

    it('should return 400 for invalid action', async () => {
      LabTechnician.findById.mockResolvedValue(mockTechnician);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'invalid_action' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe(
        'Invalid action. Use "assign", "complete", or "update"'
      );
    });

    it('should return 400 when maximum workload exceeded', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Cannot assign test: maximum workload reached');
      mockTechnician.assignTest.mockRejectedValue(error);
      LabTechnician.findById.mockResolvedValue(mockTechnician);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'assign' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('maximum workload');
      consoleErrorSpy.mockRestore();
    });

    it('should handle missing action field', async () => {
      LabTechnician.findById.mockResolvedValue(mockTechnician);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe(
        'Invalid action. Use "assign", "complete", or "update"'
      );
    });

    it('should handle database connection errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'assign' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle general errors during update', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockTechnician.assignTest.mockRejectedValue(
        new Error('Unexpected error')
      );
      LabTechnician.findById.mockResolvedValue(mockTechnician);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'assign' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle complete test when workload is zero', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const techWithNoWorkload = {
        ...mockTechnician,
        currentWorkload: 0,
      };

      const error = new Error('No tests to complete');
      techWithNoWorkload.completeTest = jest.fn().mockRejectedValue(error);
      LabTechnician.findById.mockResolvedValue(techWithNoWorkload);

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'complete' }),
        }
      );

      const res = await POST(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });

    it('should handle concurrent workload updates', async () => {
      const tech1 = {
        ...mockTechnician,
        _id: 'tech1',
        assignTest: jest.fn().mockResolvedValue({ currentWorkload: 4 }),
      };

      const tech2 = {
        ...mockTechnician,
        _id: 'tech2',
        assignTest: jest.fn().mockResolvedValue({ currentWorkload: 3 }),
      };

      LabTechnician.findById
        .mockResolvedValueOnce(tech1)
        .mockResolvedValueOnce(tech2);

      const context1 = { params: Promise.resolve({ id: 'tech1' }) };
      const context2 = { params: Promise.resolve({ id: 'tech2' }) };

      const req1 = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech1/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'assign' }),
        }
      );

      const req2 = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech2/workload',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'assign' }),
        }
      );

      const [res1, res2] = await Promise.all([
        POST(req1, context1),
        POST(req2, context2),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(data1.technician.currentWorkload).toBe(4);
      expect(data2.technician.currentWorkload).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    const mockSession = {
      user: { id: 'user123', role: 'ADMIN' },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should handle technician with very high efficiency', async () => {
      const highEfficiencyTech = {
        _id: 'tech123',
        user: { name: 'Super Tech', email: 'super@lab.com' },
        currentWorkload: 2,
        maxConcurrentTests: 10,
        efficiency: 0.99,
        isAvailable: true,
        canAcceptMoreTests: jest.fn().mockReturnValue(true),
      };

      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(highEfficiencyTech),
        }),
      });

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician.efficiency).toBe(0.99);
      expect(data.availableSlots).toBe(8); // 10 - 2
    });

    it('should handle technician with low efficiency', async () => {
      const lowEfficiencyTech = {
        _id: 'tech123',
        user: { name: 'New Tech', email: 'new@lab.com' },
        currentWorkload: 1,
        maxConcurrentTests: 3,
        efficiency: 0.5,
        isAvailable: true,
        canAcceptMoreTests: jest.fn().mockReturnValue(true),
      };

      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(lowEfficiencyTech),
        }),
      });

      const context = { params: Promise.resolve({ id: 'tech123' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/tech123/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.technician.efficiency).toBe(0.5);
    });

    it('should handle invalid technician ID format', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      LabTechnician.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockRejectedValue(new Error('Invalid ID format')),
        }),
      });

      const context = { params: Promise.resolve({ id: 'invalid-format' }) };
      const req = new NextRequest(
        'http://localhost:3000/api/lab-technicians/invalid-format/workload'
      );

      const res = await GET(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      consoleErrorSpy.mockRestore();
    });
  });
});
