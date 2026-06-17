/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { PATCH } from '../route';

interface MockReceptionist {
  findById: jest.Mock;
}

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      _body?: any;
      headers: any;

      constructor(url: string, init?: { method?: string; body?: any }) {
        this.url = url;
        this.method = init?.method;
        this._body = init?.body;
        this.headers = { get: () => null };
      }

      json() {
        try {
          return Promise.resolve(
            typeof this._body === 'string'
              ? JSON.parse(this._body)
              : this._body || {}
          );
        } catch (error) {
          return Promise.reject(new Error('Invalid JSON'));
        }
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
    findById: jest.fn(),
  },
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

describe('PATCH /api/receptionists/:id/performance', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;
  let Receptionist: MockReceptionist;

  const originalConsoleError = console.error;
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;
    Receptionist = require('@/models/Receptionist').default;

    connectDB.mockResolvedValue(undefined);
  });

  const mockSession = {
    user: {
      id: 'user123',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  };

  const mockReceptionistData = {
    _id: 'receptionist123',
    name: 'Jane Smith',
    email: 'jane@example.com',
    performanceMetrics: {
      averageCheckInTime: 5,
      averageAppointmentTime: 15,
      patientSatisfactionScore: 4.5,
      totalAppointmentsHandled: 100,
      errorRate: 0.02,
    },
    save: jest.fn(),
    getPerformanceRating: jest.fn(),
  };

  beforeEach(() => {
    getServerSession.mockResolvedValue(mockSession);
  });

  it('should update performance metrics successfully', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue(mockReceptionistData),
      getPerformanceRating: jest.fn().mockReturnValue('Excellent'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      averageCheckInTime: 4,
      patientSatisfactionScore: 4.8,
      totalAppointmentsHandled: 150,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Performance metrics updated successfully');
    expect(data.data).toBeDefined();
    expect(data.data.averageCheckInTime).toBe(4);
    expect(data.data.patientSatisfactionScore).toBe(4.8);
    expect(data.data.totalAppointmentsHandled).toBe(150);
    expect(data.rating).toBe('Excellent');
    expect(mockReceptionist.save).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify({ averageCheckInTime: 5 }),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
    expect(Receptionist.findById).not.toHaveBeenCalled();
  });

  it('should return 404 when receptionist not found', async () => {
    Receptionist.findById.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/nonexistent/performance',
      {
        method: 'PATCH',
        body: JSON.stringify({ averageCheckInTime: 5 }),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });

    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Receptionist not found');
  });

  it('should initialize performanceMetrics if it does not exist', async () => {
    const mockReceptionist = {
      _id: 'receptionist123',
      name: 'Jane Smith',
      email: 'jane@example.com',
      performanceMetrics: {},
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Average'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      averageCheckInTime: 5,
      patientSatisfactionScore: 4.0,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.performanceMetrics).toBeDefined();
    expect(
      (mockReceptionist.performanceMetrics as any).averageCheckInTime
    ).toBe(5);
    expect(
      (mockReceptionist.performanceMetrics as any).patientSatisfactionScore
    ).toBe(4.0);
    expect(mockReceptionist.save).toHaveBeenCalled();
  });

  it('should update all performance metrics fields', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      performanceMetrics: {
        averageCheckInTime: 5,
        averageAppointmentTime: 15,
        patientSatisfactionScore: 4.5,
        totalAppointmentsHandled: 100,
        errorRate: 0.02,
      },
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Excellent'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      averageCheckInTime: 3,
      averageAppointmentTime: 12,
      patientSatisfactionScore: 4.9,
      totalAppointmentsHandled: 200,
      errorRate: 0.01,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.performanceMetrics.averageCheckInTime).toBe(3);
    expect(mockReceptionist.performanceMetrics.averageAppointmentTime).toBe(12);
    expect(mockReceptionist.performanceMetrics.patientSatisfactionScore).toBe(
      4.9
    );
    expect(mockReceptionist.performanceMetrics.totalAppointmentsHandled).toBe(
      200
    );
    expect(mockReceptionist.performanceMetrics.errorRate).toBe(0.01);
  });

  it('should update partial performance metrics', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      performanceMetrics: {
        averageCheckInTime: 5,
        averageAppointmentTime: 15,
        patientSatisfactionScore: 4.5,
        totalAppointmentsHandled: 100,
        errorRate: 0.02,
      },
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Good'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      patientSatisfactionScore: 4.7,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.performanceMetrics.patientSatisfactionScore).toBe(
      4.7
    );
    expect(mockReceptionist.performanceMetrics.averageCheckInTime).toBe(5);
    expect(mockReceptionist.performanceMetrics.averageAppointmentTime).toBe(15);
  });

  it('should ignore invalid/unknown fields', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Good'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      averageCheckInTime: 4,
      invalidField: 'should be ignored',
      anotherInvalid: 123,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.averageCheckInTime).toBe(4);
    expect((data.data as any).invalidField).toBeUndefined();
    expect((data.data as any).anotherInvalid).toBeUndefined();
  });

  it('should handle empty update body', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Good'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify({}),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.save).toHaveBeenCalled();
  });

  it('should handle zero values', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Poor'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      averageCheckInTime: 0,
      errorRate: 0,
      patientSatisfactionScore: 0,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.performanceMetrics.averageCheckInTime).toBe(0);
    expect(mockReceptionist.performanceMetrics.errorRate).toBe(0);
    expect(mockReceptionist.performanceMetrics.patientSatisfactionScore).toBe(
      0
    );
  });

  it('should handle negative values', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Poor'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      averageCheckInTime: -1,
      errorRate: -0.5,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.performanceMetrics.averageCheckInTime).toBe(-1);
    expect(mockReceptionist.performanceMetrics.errorRate).toBe(-0.5);
  });

  it('should handle database connection errors', async () => {
    connectDB.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify({ averageCheckInTime: 5 }),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database connection failed');
  });

  it('should handle findById errors', async () => {
    Receptionist.findById.mockRejectedValue(new Error('Query failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify({ averageCheckInTime: 5 }),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Query failed');
  });

  it('should handle save errors', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockRejectedValue(new Error('Save failed')),
      getPerformanceRating: jest.fn().mockReturnValue('Good'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify({ averageCheckInTime: 5 }),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Save failed');
  });

  it('should handle invalid JSON in request body', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: 'invalid json',
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should handle receptionist without getPerformanceRating method', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: undefined,
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      averageCheckInTime: 4,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.rating).toBeUndefined();
  });

  it('should return performance metrics in response', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      performanceMetrics: {
        averageCheckInTime: 5,
        averageAppointmentTime: 15,
        patientSatisfactionScore: 4.5,
        totalAppointmentsHandled: 100,
        errorRate: 0.02,
      },
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Excellent'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      averageCheckInTime: 4,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data).toHaveProperty('averageCheckInTime');
    expect(data.data).toHaveProperty('averageAppointmentTime');
    expect(data.data).toHaveProperty('patientSatisfactionScore');
    expect(data.data).toHaveProperty('totalAppointmentsHandled');
    expect(data.data).toHaveProperty('errorRate');
  });

  it('should handle floating point values correctly', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Good'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      patientSatisfactionScore: 4.75,
      errorRate: 0.015,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.performanceMetrics.patientSatisfactionScore).toBe(
      4.75
    );
    expect(mockReceptionist.performanceMetrics.errorRate).toBe(0.015);
  });

  it('should handle large numbers', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue({}),
      getPerformanceRating: jest.fn().mockReturnValue('Excellent'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      totalAppointmentsHandled: 999999,
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionists/receptionist123/performance',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'receptionist123' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.performanceMetrics.totalAppointmentsHandled).toBe(
      999999
    );
  });
});
