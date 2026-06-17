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

describe('PATCH /api/receptionist/:id/schedule', () => {
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;
  let Receptionist: MockReceptionist;

  beforeEach(() => {
    jest.clearAllMocks();

    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;
    Receptionist = require('@/models/Receptionist').default;

    connectDB.mockResolvedValue(undefined);
  });

  const mockAdminSession = {
    user: {
      id: 'admin123',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  };

  const mockReceptionistData = {
    _id: 'receptionist123',
    name: 'Jane Smith',
    email: 'jane@example.com',

    workSchedule: {
      monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
      tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
    },
    save: jest.fn(),
  };

  beforeEach(() => {
    getServerSession.mockResolvedValue(mockAdminSession);
  });

  it('should update receptionist schedule successfully', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      save: jest.fn().mockResolvedValue(mockReceptionistData),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        monday: { startTime: '08:00', endTime: '16:00', isWorking: true },
        wednesday: { startTime: '10:00', endTime: '18:00', isWorking: true },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Schedule updated successfully');
    expect(data.data).toBeDefined();
    expect(mockReceptionist.save).toHaveBeenCalled();
    expect(Receptionist.findById).toHaveBeenCalledWith('receptionist123');
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({ workSchedule: {} }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
    expect(Receptionist.findById).not.toHaveBeenCalled();
  });

  it('should return 403 when user is not admin', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'user123', email: 'user@example.com', role: 'USER' },
    });

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({ workSchedule: {} }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Forbidden');
    expect(Receptionist.findById).not.toHaveBeenCalled();
  });

  it('should forbid DOCTOR role', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'doctor123', email: 'doctor@example.com', role: 'DOCTOR' },
    });

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({ workSchedule: {} }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Forbidden');
  });

  it('should forbid NURSE role', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'nurse123', email: 'nurse@example.com', role: 'NURSE' },
    });

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({ workSchedule: {} }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 404 when receptionist not found', async () => {
    Receptionist.findById.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/nonexistent/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({
          workSchedule: {
            monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          },
        }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'nonexistent' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Receptionist not found');
  });

  it('should return 400 when workSchedule is missing', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({}),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No schedule data provided');
    expect(Receptionist.findById).not.toHaveBeenCalled();
  });

  it('should return 400 when workSchedule is empty object', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({ workSchedule: {} }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No schedule data provided');
    expect(Receptionist.findById).not.toHaveBeenCalled();
  });

  it('should return 400 when workSchedule has only invalid days', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({
          workSchedule: {
            invalidDay: { startTime: '09:00', endTime: '17:00' },
            anotherInvalid: { startTime: '10:00', endTime: '18:00' },
          },
        }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No schedule data provided');
    expect(Receptionist.findById).not.toHaveBeenCalled();
  });

  it('should filter out invalid days and update only valid ones', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {},
      save: jest.fn().mockResolvedValue(mockReceptionistData),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        invalidDay: { startTime: '10:00', endTime: '18:00', isWorking: true },
        tuesday: { startTime: '08:00', endTime: '16:00', isWorking: true },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect((mockReceptionist.workSchedule as any).monday).toBeDefined();
    expect((mockReceptionist.workSchedule as any).tuesday).toBeDefined();
    expect((mockReceptionist.workSchedule as any).invalidDay).toBeUndefined();
  });

  it('should initialize workSchedule if it does not exist', async () => {
    const mockReceptionist = {
      _id: 'receptionist123',
      name: 'Jane Smith',
      email: 'jane@example.com',
      workSchedule: {},
      save: jest.fn().mockResolvedValue({}),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.workSchedule).toBeDefined();
    expect(mockReceptionist.save).toHaveBeenCalled();
  });

  it('should merge existing schedule with updates', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {
        monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
      },
      save: jest.fn().mockResolvedValue({}),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        monday: { startTime: '08:00', endTime: '16:00', isWorking: false },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.workSchedule.monday.startTime).toBe('08:00');
    expect(mockReceptionist.workSchedule.monday.endTime).toBe('16:00');
    expect(mockReceptionist.workSchedule.monday.isWorking).toBe(false);
    expect(mockReceptionist.workSchedule.tuesday).toBeDefined();
  });

  it('should handle all valid days of the week', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {},
      save: jest.fn().mockResolvedValue({}),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        wednesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        thursday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        friday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        saturday: { startTime: '10:00', endTime: '14:00', isWorking: true },
        sunday: { startTime: '10:00', endTime: '14:00', isWorking: false },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Object.keys(mockReceptionist.workSchedule)).toHaveLength(7);
    expect((mockReceptionist.workSchedule as any).monday).toBeDefined();
    expect((mockReceptionist.workSchedule as any).sunday).toBeDefined();
  });

  it('should handle database connection errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    connectDB.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({
          workSchedule: {
            monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          },
        }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database connection failed');
    consoleErrorSpy.mockRestore();
  });

  it('should handle findById errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    Receptionist.findById.mockRejectedValue(new Error('Database query error'));

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({
          workSchedule: {
            monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          },
        }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database query error');
    consoleErrorSpy.mockRestore();
  });

  it('should handle save errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {},
      save: jest.fn().mockRejectedValue(new Error('Save failed')),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({
          workSchedule: {
            monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          },
        }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Save failed');
    consoleErrorSpy.mockRestore();
  });

  it('should handle invalid JSON in request body', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: 'invalid json',
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    consoleErrorSpy.mockRestore();
  });

  it('should handle partial day updates', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {
        monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
      },
      save: jest.fn().mockResolvedValue({}),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        monday: { endTime: '16:00' },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReceptionist.workSchedule.monday.startTime).toBe('09:00');
    expect(mockReceptionist.workSchedule.monday.endTime).toBe('16:00');
    expect(mockReceptionist.workSchedule.monday.isWorking).toBe(true);
  });

  it('should initialize day schedule if day does not exist', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {
        monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
      },
      save: jest.fn().mockResolvedValue({}),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        wednesday: { startTime: '10:00', endTime: '18:00', isWorking: true },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect((mockReceptionist.workSchedule as any).wednesday).toBeDefined();
    expect((mockReceptionist.workSchedule as any).wednesday.startTime).toBe(
      '10:00'
    );
  });

  it('should handle error without message property', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {},
      save: jest.fn().mockRejectedValue('String error'),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify({
          workSchedule: {
            monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          },
        }),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('String error');
    consoleErrorSpy.mockRestore();
  });

  it('should handle multiple days update at once', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {},
      save: jest.fn().mockResolvedValue({}),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        monday: { startTime: '08:00', endTime: '16:00', isWorking: true },
        tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        wednesday: { startTime: '10:00', endTime: '18:00', isWorking: false },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Object.keys(mockReceptionist.workSchedule)).toHaveLength(3);
    expect(mockReceptionist.save).toHaveBeenCalledTimes(1);
  });

  it('should return schedule data in response', async () => {
    const mockReceptionist = {
      ...mockReceptionistData,
      workSchedule: {
        monday: { startTime: '08:00', endTime: '16:00', isWorking: true },
      },
      save: jest.fn().mockResolvedValue({}),
    };

    Receptionist.findById.mockResolvedValue(mockReceptionist);

    const updateBody = {
      workSchedule: {
        tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
      },
    };

    const req = new NextRequest(
      'http://localhost:3000/api/receptionist/receptionist123/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      }
    );

    const context = {
      params: Promise.resolve({ id: 'receptionist123' }),
    };

    const res = await PATCH(req, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.monday).toBeDefined();
    expect(data.data.tuesday).toBeDefined();
  });
});
