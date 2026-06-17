/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Patient');

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((body, init) => ({
        json: async () => body,
        status: init?.status || 200,
        ...init,
      })),
    },
  };
});

describe('Patient Check API', () => {
  const mockSession = {
    user: {
      email: 'user@example.com',
      name: 'Test User',
    },
  };

  const mockExistingPatient = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    nic: '200121901656V',
    phone: '0760780414',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('Authentication', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 401 if session has no user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: null });

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });
  });

  describe('Input Validation', () => {
    it('should return 400 if neither email nor NIC is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/patient/check');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Either email or NIC parameter is required');
    });

    it('should return 400 for invalid email format', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=invalid-email'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid email format');
    });

    it('should return 400 for invalid NIC format', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?nic=invalid-nic'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid NIC format');
    });

    it('should accept valid old NIC format (9 digits + V/X)', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?nic=123456789V'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exists).toBe(false);
    });

    it('should accept valid new NIC format (12 digits)', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?nic=200121901656'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exists).toBe(false);
    });

    it('should accept NIC with lowercase v/x', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?nic=123456789v'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exists).toBe(false);
    });
  });

  describe('Email Check', () => {
    it('should find existing patient by email', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(mockExistingPatient);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=john.doe@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exists).toBe(true);
      expect(body.field).toBe('email');
      expect(body.value).toBe('john.doe@example.com');
      expect(body.message).toBe('Patient with this email already exists');
      expect(body.patient).toBeDefined();
      expect(body.patient.id).toBe(mockExistingPatient._id);
      expect(body.patient.firstName).toBe('John');
      expect(body.patient.lastName).toBe('Doe');
    });

    it('should return not found if email does not exist', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=nonexistent@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exists).toBe(false);
      expect(body.message).toBe(
        'No patient found with the provided credentials'
      );
    });

    it('should convert email to lowercase for search', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=Test@Example.COM'
      );
      await GET(req);

      expect(Patient.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('should only check active patients', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com'
      );
      await GET(req);

      expect(Patient.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
    });
  });

  describe('NIC Check', () => {
    it('should find existing patient by NIC', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue({
        ...mockExistingPatient,
        nic: '200121901656',
      });

      // Use valid NIC format: 9 digits + V or 12 digits
      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?nic=200121901656'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exists).toBe(true);
      expect(body.field).toBe('NIC');
      expect(body.value).toBe('200121901656');
      expect(body.message).toBe('Patient with this NIC already exists');
      expect(body.patient).toBeDefined();
    });

    it('should return not found if NIC does not exist', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?nic=999999999V'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exists).toBe(false);
      expect(body.message).toBe(
        'No patient found with the provided credentials'
      );
    });

    it('should convert NIC to uppercase for search', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?nic=123456789v'
      );
      await GET(req);

      expect(Patient.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          nic: '123456789V',
        })
      );
    });
  });

  describe('Combined Email and NIC Check', () => {
    it('should check both email and NIC when both provided', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com&nic=123456789V'
      );
      await GET(req);

      expect(Patient.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [{ email: 'test@example.com' }, { nic: '123456789V' }],
          isActive: true,
        })
      );
    });

    it('should return email match when email exists', async () => {
      const patientWithEmail = {
        ...mockExistingPatient,
        email: 'test@example.com',
      };
      (Patient.findOne as jest.Mock).mockResolvedValue(patientWithEmail);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com&nic=999999999V'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.exists).toBe(true);
      expect(body.field).toBe('email');
      expect(body.value).toBe('test@example.com');
    });

    it('should return NIC match when NIC exists', async () => {
      const patientWithNIC = {
        ...mockExistingPatient,
        email: 'different@example.com',
        nic: '123456789V',
      };
      (Patient.findOne as jest.Mock).mockResolvedValue(patientWithNIC);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com&nic=123456789V'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.exists).toBe(true);
      expect(body.field).toBe('NIC');
      expect(body.value).toBe('123456789V');
    });

    it('should validate both email and NIC formats', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=invalid&nic=invalid'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      // Should fail on email validation first
      expect(body.message).toBe('Invalid email format');
    });
  });

  describe('Response Structure', () => {
    it('should include complete patient data when found', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(mockExistingPatient);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=john.doe@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.patient).toEqual({
        id: mockExistingPatient._id,
        firstName: mockExistingPatient.firstName,
        lastName: mockExistingPatient.lastName,
        email: mockExistingPatient.email,
        nic: mockExistingPatient.nic,
      });
    });

    it('should not include patient data when not found', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.exists).toBe(false);
      expect(body.patient).toBeUndefined();
      expect(body.field).toBeUndefined();
      expect(body.value).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Database connection failed');
    });

    it('should handle database query errors', async () => {
      (Patient.findOne as jest.Mock).mockRejectedValue(
        new Error('Query failed')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Query failed');
    });

    it('should handle generic errors', async () => {
      (Patient.findOne as jest.Mock).mockRejectedValue(new Error());

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Internal server error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle email with special characters', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      // Use a valid email format with allowed special characters
      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=test.user@example.com'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exists).toBe(false);
    });

    it('should handle NIC with X instead of V', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?nic=123456789X'
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(Patient.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          nic: '123456789X',
        })
      );
    });

    it('should handle very long email addresses', async () => {
      (Patient.findOne as jest.Mock).mockResolvedValue(null);

      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const req = new NextRequest(
        `http://localhost:3000/api/patient/check?email=${longEmail}`
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
    });

    it('should handle empty string parameters', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/patient/check?email=&nic='
      );
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Either email or NIC parameter is required');
    });
  });
});
