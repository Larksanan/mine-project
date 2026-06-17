/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/patients/new/route';
import Patient from '@/models/Patient';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      nextUrl: URL;
      method: string;
      body: any;
      headers: Headers;
      constructor(url: string, init?: any) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.method = init?.method || 'GET';
        this.body = init?.body;
        this.headers = new Headers(init?.headers);
      }
      async json() {
        return this.body ? JSON.parse(this.body) : {};
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

jest.mock('@/models/Patient', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
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

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  // Mock authenticated session
  mockGetServerSession.mockResolvedValue({
    user: {
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
    },
    expires: '2024-12-31',
  } as any);

  const User = require('@/models/User').default;
  (User.findOne as jest.Mock).mockResolvedValue({
    _id: '1',
    email: 'admin@test.com',
    role: 'ADMIN',
  });
});

describe('POST /api/patients/new', () => {
  const validPatientData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '0712345678',
    nic: '200121901656',
    dateOfBirth: '2001-01-01',
    gender: 'MALE',
    address: {
      street: '123 Main St',
      city: 'Colombo',
      country: 'Sri Lanka',
    },
  };

  it('should create a new patient successfully', async () => {
    // Mock no existing patient
    (Patient.findOne as jest.Mock).mockResolvedValue(null);

    // Mock successful creation
    (Patient.create as jest.Mock).mockResolvedValue({
      _id: 'generated_id_123',
      ...validPatientData,
      isActive: true,
      toObject: () => ({
        _id: 'generated_id_123',
        ...validPatientData,
        isActive: true,
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(validPatientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.patient.firstName).toBe('John');
    expect(data.patient.lastName).toBe('Doe');
    expect(data.patient.email).toBe('john.doe@example.com');
  });

  it('should return 409 for duplicate email', async () => {
    const patientData = {
      ...validPatientData,
      email: 'existing@example.com',
    };

    // Mock: NIC check returns null (no duplicate NIC)
    // Mock: Email check returns existing patient (duplicate email)
    (Patient.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // First call: NIC check
      .mockResolvedValueOnce({
        // Second call: Email check
        _id: 'existing_id',
        email: 'existing@example.com',
      });

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toContain('email');
  });

  it('should return 409 for duplicate NIC', async () => {
    const patientData = {
      ...validPatientData,
      nic: '200121901656', // Duplicate NIC
    };

    // Mock: NIC check returns existing patient (duplicate NIC)
    (Patient.findOne as jest.Mock).mockResolvedValueOnce({
      _id: 'existing_id',
      nic: '200121901656',
    });

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toContain('NIC');
  });

  it('should return 400 for missing required fields', async () => {
    const incompleteData = {
      firstName: 'John',
      // Missing lastName, phone, nic, gender, dateOfBirth
    };

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(incompleteData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Missing required fields');
    expect(data.missingFields).toBeDefined();
    expect(data.missingFields.length).toBeGreaterThan(0);
  });

  it('should return 400 for invalid phone number', async () => {
    const invalidData = {
      ...validPatientData,
      phone: '123', // Too short
    };

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid phone number format');
  });

  it('should return 400 for invalid NIC format', async () => {
    const invalidData = {
      ...validPatientData,
      nic: 'invalid-nic',
    };

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid NIC format');
  });

  it('should return 400 for invalid email format', async () => {
    const invalidData = {
      ...validPatientData,
      email: 'not-an-email',
    };

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email format');
  });

  it('should return 400 for invalid date of birth', async () => {
    const invalidData = {
      ...validPatientData,
      dateOfBirth: 'not-a-date',
    };

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid date of birth');
  });

  it('should return 400 for invalid height', async () => {
    const invalidData = {
      ...validPatientData,
      height: 500, // Too high
    };

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid height value');
  });

  it('should return 400 for invalid weight', async () => {
    const invalidData = {
      ...validPatientData,
      weight: 500, // Too high
    };

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid weight value');
  });

  it('should return 401 for unauthenticated requests', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(validPatientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 403 for unauthorized roles', async () => {
    const User = require('@/models/User').default;
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: '1',
      email: 'user@test.com',
      role: 'PATIENT', // Not allowed to create patients
    });

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(validPatientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Forbidden');
  });

  it('should handle database errors gracefully', async () => {
    (Patient.findOne as jest.Mock).mockResolvedValue(null);
    (Patient.create as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(validPatientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Internal Server Error');
  });

  it('should handle mongoose validation errors', async () => {
    (Patient.findOne as jest.Mock).mockResolvedValue(null);

    const validationError = {
      name: 'ValidationError',
      errors: {
        firstName: { message: 'First name is required' },
        lastName: { message: 'Last name is required' },
      },
    };

    (Patient.create as jest.Mock).mockRejectedValue(validationError);

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(validPatientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Validation failed');
    expect(data.errors).toBeDefined();
  });

  it('should handle duplicate key errors from database', async () => {
    (Patient.findOne as jest.Mock).mockResolvedValue(null);

    const duplicateError = {
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: 'john.doe@example.com' },
    };

    (Patient.create as jest.Mock).mockRejectedValue(duplicateError);

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(validPatientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toContain('email');
  });

  it('should create patient with optional fields', async () => {
    const fullPatientData = {
      ...validPatientData,
      emergencyContact: {
        name: 'Jane Doe',
        phone: '0723456789',
        relationship: 'Wife',
        email: 'jane@example.com',
      },
      insurance: {
        provider: 'Health Insurance Co',
        policyNumber: 'POL123456',
        groupNumber: 'GRP789',
        validUntil: '2025-12-31',
      },
      medicalHistory: 'No major illnesses',
      allergies: ['Penicillin', 'Peanuts'],
      medications: ['Aspirin'],
      bloodType: 'A+',
      height: 175,
      weight: 70,
      maritalStatus: 'MARRIED',
      occupation: 'Engineer',
      preferredLanguage: 'English',
    };

    (Patient.findOne as jest.Mock).mockResolvedValue(null);
    (Patient.create as jest.Mock).mockResolvedValue({
      _id: 'generated_id_123',
      ...fullPatientData,
      isActive: true,
    });

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(fullPatientData),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.patient).toBeDefined();
  });

  it('should accept valid old NIC format (9 digits + V)', async () => {
    const dataWithOldNIC = {
      ...validPatientData,
      nic: '912345678V',
    };

    (Patient.findOne as jest.Mock).mockResolvedValue(null);
    (Patient.create as jest.Mock).mockResolvedValue({
      _id: 'generated_id_123',
      ...dataWithOldNIC,
      isActive: true,
    });

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(dataWithOldNIC),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('should accept valid new NIC format (12 digits)', async () => {
    const dataWithNewNIC = {
      ...validPatientData,
      nic: '200121901656',
    };

    (Patient.findOne as jest.Mock).mockResolvedValue(null);
    (Patient.create as jest.Mock).mockResolvedValue({
      _id: 'generated_id_123',
      ...dataWithNewNIC,
      isActive: true,
    });

    const req = new NextRequest('http://localhost:3000/api/patients/new', {
      method: 'POST',
      body: JSON.stringify(dataWithNewNIC),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
