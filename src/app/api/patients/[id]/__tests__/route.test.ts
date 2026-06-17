/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/patients/[id]/route';
import Patient from '@/models/Patient';

// Mock setup
const mockExec = jest.fn();
const mockChain: any = {
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: mockExec,
};
mockChain.then = (resolve: any, reject: any) =>
  mockExec().then(resolve, reject);

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method: string;
      _body: any;
      constructor(url: string, init?: any) {
        this.url = url;
        this.method = init?.method || 'GET';
        this._body = init?.body;
      }
      async json() {
        try {
          return this._body ? JSON.parse(this._body) : {};
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
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '1', email: 'admin@test.com' },
  }),
}));

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn((id: string) => {
        // Mock validation - returns false only for 'invalid-id', true for everything else
        return id !== 'invalid-id';
      }),
    },
  },
}));

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
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
  mockExec.mockResolvedValue(null);

  (Patient.findById as jest.Mock).mockReturnValue(mockChain);
  (Patient.findByIdAndUpdate as jest.Mock).mockReturnValue(mockChain);

  const User = require('@/models/User').default;
  (User.findOne as jest.Mock).mockResolvedValue({
    _id: '1',
    email: 'admin@test.com',
    role: 'ADMIN',
  });
});

describe('GET /api/patients/[id]', () => {
  it('should return patient by id', async () => {
    const mockPatient = {
      _id: 'patient123',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@test.com',
      isActive: true,
    };

    mockExec.mockResolvedValue(mockPatient);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123'
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data._id).toBe('patient123');
    expect(data.data.firstName).toBe('Alice');
  });

  it('should return 404 if patient not found', async () => {
    mockExec.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/507f1f77bcf86cd799439011'
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Patient not found');
  });

  it('should return 400 for invalid id', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/patients/invalid-id'
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: 'invalid-id' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid patient ID');
  });

  it('should return 401 when not authenticated', async () => {
    const getServerSession = require('next-auth').getServerSession;
    getServerSession.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123'
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should handle database errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockExec.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123'
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Internal server error');
    consoleErrorSpy.mockRestore();
  });
});

describe('PUT /api/patients/[id]', () => {
  it('should update patient successfully', async () => {
    const updatedData = {
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '0712345678',
      address: '456 New Street',
    };

    const mockUpdatedPatient = {
      _id: 'patient123',
      ...updatedData,
      email: 'alice@test.com',
      isActive: true,
    };

    mockExec.mockResolvedValue(mockUpdatedPatient);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123',
      {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('Alice');
    expect(data.data.lastName).toBe('Johnson');
    expect(data.data.phone).toBe('0712345678');
    expect(data.message).toBe('Patient updated successfully');
  });

  it('should return 404 if patient not found for update', async () => {
    mockExec.mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/507f1f77bcf86cd799439011',
      {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'Updated' }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Patient not found');
  });

  it('should handle validation errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const invalidData = {
      email: 'invalid-email',
      phone: '123',
    };

    const validationError = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Invalid email format' },
        phone: { message: 'Phone number must be at least 10 digits' },
      },
    };

    mockExec.mockRejectedValueOnce(validationError);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123',
      {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
    expect(data.errors.email).toBe('Invalid email format');
    expect(data.errors.phone).toBe('Phone number must be at least 10 digits');
    consoleErrorSpy.mockRestore();
  });

  it('should return 400 for invalid id in PUT', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/patients/invalid-id',
      {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'Test' }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: 'invalid-id' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid patient ID');
  });

  it('should return 401 when not authenticated', async () => {
    const getServerSession = require('next-auth').getServerSession;
    getServerSession.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123',
      {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'Test' }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should handle non-validation errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const error = new Error('Database error');

    mockExec.mockRejectedValueOnce(error);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123',
      {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'Test' }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Internal server error');
    consoleErrorSpy.mockRestore();
  });
});

describe('DELETE /api/patients/[id]', () => {
  it('should soft delete patient (set isActive to false)', async () => {
    const mockPatient = {
      _id: 'patient123',
      firstName: 'Alice',
      isActive: true,
    };

    // Mock findById to return a promise that resolves to the patient
    (Patient.findById as jest.Mock).mockResolvedValueOnce(mockPatient);

    // Mock findByIdAndUpdate
    (Patient.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({
      ...mockPatient,
      isActive: false,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123',
      {
        method: 'DELETE',
      }
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Patient deactivated successfully');
  });

  it('should return 404 if patient not found for deletion', async () => {
    (Patient.findById as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/507f1f77bcf86cd799439011',
      {
        method: 'DELETE',
      }
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Patient not found');
  });

  it('should handle already deactivated patient', async () => {
    const deactivatedPatient = {
      _id: 'patient123',
      firstName: 'Alice',
      isActive: false,
    };

    // Mock findById to return the deactivated patient
    (Patient.findById as jest.Mock).mockResolvedValueOnce(deactivatedPatient);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123',
      {
        method: 'DELETE',
      }
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Patient is already deactivated');
    // Ensure findByIdAndUpdate was NOT called
    expect(Patient.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid id in DELETE', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/patients/invalid-id',
      {
        method: 'DELETE',
      }
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'invalid-id' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid patient ID');
  });

  it('should return 401 when not authenticated', async () => {
    const getServerSession = require('next-auth').getServerSession;
    getServerSession.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123',
      {
        method: 'DELETE',
      }
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should handle database errors during deletion', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    (Patient.findById as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    );

    const req = new NextRequest(
      'http://localhost:3000/api/patients/patient123',
      {
        method: 'DELETE',
      }
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'patient123' }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Internal server error');
    consoleErrorSpy.mockRestore();
  });
});
