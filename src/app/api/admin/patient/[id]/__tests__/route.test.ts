/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '../route';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Patient');

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: class {
        static isValid(id: string) {
          return /^[0-9a-fA-F]{24}$/.test(id);
        }
        constructor(id: string) {
          return id;
        }
      },
    },
  };
});

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

describe('Admin Patient Detail API', () => {
  const validId = '507f1f77bcf86cd799439011';
  const mockPatient = {
    _id: validId,
    firstName: 'Jebarsan',
    lastName: 'Thatcroos',
    email: 'jebarsanthatcroos@gmail.com',
    phone: '0762397951',
    nic: '200121901654',
    dateOfBirth: new Date('2001-08-06'),
    gender: 'MALE',
    bloodType: 'O+',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    address: { street: 'NO23 thalaimannar mannar.' },
    emergencyContact: { name: ' sovika ', phone: '0702397952' },
    allergies: ['Penicillin'],
    medications: ['Aspirin'],
    height: 175,
    weight: 70,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET', () => {
    it('should fetch a patient by valid ID', async () => {
      const mockFindByIdChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPatient),
      };
      (Patient.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET({} as Request, context);
      const body = await response.json();

      expect(connectDB).toHaveBeenCalled();
      expect(Patient.findById).toHaveBeenCalledWith(validId);
      expect(body.success).toBe(true);
      expect(body.data.firstName).toBe('Jebarsan');
      expect(body.data.age).toBeDefined();
      expect(body.data.bmi).toBeDefined();
    });

    it('should return 400 for invalid patient ID', async () => {
      const context = { params: Promise.resolve({ id: 'invalid-id' }) };
      const response = await GET({} as Request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid patient ID');
    });

    it('should return 404 when patient not found', async () => {
      const mockFindByIdChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      (Patient.findById as jest.Mock).mockReturnValue(mockFindByIdChain);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET({} as Request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Patient not found');
    });

    it('should handle database errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await GET({} as Request, context);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch patient');
    });
  });

  describe('PUT', () => {
    const updateData = {
      firstName: 'Jebarsan',
      lastName: 'Thatcroos',
      phone: '0762397951',
    };

    it('should update a patient successfully', async () => {
      const mockPatientInstance = {
        ...mockPatient,
        email: mockPatient.email,
        nic: mockPatient.nic,
        insurance: {},
        address: mockPatient.address,
        emergencyContact: mockPatient.emergencyContact,
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue({
          ...mockPatient,
          ...updateData,
          toObject: jest.fn().mockReturnValue({
            ...mockPatient,
            ...updateData,
          }),
        }),
        toObject: jest.fn().mockReturnValue({
          ...mockPatient,
          ...updateData,
        }),
      };

      (Patient.findById as jest.Mock).mockResolvedValue(mockPatientInstance);

      const request = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as Request;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockPatientInstance.save).toHaveBeenCalled();
    });

    it('should return 400 for invalid patient ID', async () => {
      const request = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as Request;

      const context = { params: Promise.resolve({ id: 'invalid-id' }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid patient ID');
    });

    it('should return 404 when patient not found', async () => {
      (Patient.findById as jest.Mock).mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as Request;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Patient not found');
    });

    it('should return 409 if email already in use', async () => {
      const mockPatientInstance = {
        ...mockPatient,
        email: mockPatient.email,
        nic: mockPatient.nic,
        save: jest.fn(),
      };

      (Patient.findById as jest.Mock).mockResolvedValue(mockPatientInstance);
      (Patient.findOne as jest.Mock).mockResolvedValue({
        _id: 'different-id',
        email: 'jebarsanthatcroos16@gmail.com',
      });

      const request = {
        json: jest
          .fn()
          .mockResolvedValue({ email: 'jebarsanthatcroos16@gmail.com' }),
      } as unknown as Request;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toBe('Email already in use');
    });

    it('should return 409 if NIC already in use', async () => {
      const mockPatientInstance = {
        ...mockPatient,
        email: mockPatient.email,
        nic: mockPatient.nic,
        save: jest.fn(),
      };

      (Patient.findById as jest.Mock).mockResolvedValue(mockPatientInstance);

      // Mock findOne to handle different queries
      (Patient.findOne as jest.Mock).mockImplementation(query => {
        // If querying by email, return null (no conflict)
        if (query.email) {
          return Promise.resolve(null);
        }
        // If querying by NIC, return a different patient (conflict)
        if (query.nic) {
          return Promise.resolve({
            _id: 'different-id',
            nic: '200121901656',
          });
        }
        return Promise.resolve(null);
      });

      const request = {
        json: jest.fn().mockResolvedValue({ nic: '200121901656' }),
      } as unknown as Request;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toBe('NIC already in use');
    });

    it('should return 400 for future date of birth', async () => {
      const mockPatientInstance = {
        ...mockPatient,
        email: mockPatient.email,
        nic: mockPatient.nic,
        save: jest.fn(),
      };

      (Patient.findById as jest.Mock).mockResolvedValue(mockPatientInstance);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const request = {
        json: jest
          .fn()
          .mockResolvedValue({ dateOfBirth: futureDate.toISOString() }),
      } as unknown as Request;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Date of birth must be in the past');
    });

    it('should merge address updates correctly', async () => {
      const mockPatientInstance = {
        ...mockPatient,
        email: mockPatient.email,
        nic: mockPatient.nic,
        address: { street: 'Old Street', city: 'Old City' },
        insurance: {},
        emergencyContact: mockPatient.emergencyContact,
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue(mockPatient),
        }),
      };

      (Patient.findById as jest.Mock).mockResolvedValue(mockPatientInstance);

      const request = {
        json: jest.fn().mockResolvedValue({
          address: { city: 'New City' },
        }),
      } as unknown as Request;

      const context = { params: Promise.resolve({ id: validId }) };
      await PUT(request, context);

      expect(mockPatientInstance.save).toHaveBeenCalled();
      expect(mockPatientInstance.address).toEqual({
        street: 'Old Street',
        city: 'New City',
      });
    });

    it('should handle validation errors', async () => {
      const mockPatientInstance = {
        ...mockPatient,
        email: mockPatient.email,
        nic: mockPatient.nic,
        insurance: {},
        address: mockPatient.address,
        emergencyContact: mockPatient.emergencyContact,
        save: jest.fn().mockRejectedValue({
          name: 'ValidationError',
          errors: {
            phone: { message: 'Invalid phone number' },
          },
        }),
      };

      (Patient.findById as jest.Mock).mockResolvedValue(mockPatientInstance);

      const request = {
        json: jest.fn().mockResolvedValue({ phone: 'invalid' }),
      } as unknown as Request;

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await PUT(request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();
    });
  });

  describe('DELETE', () => {
    it('should soft delete a patient successfully', async () => {
      const mockPatientInstance = {
        ...mockPatient,
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined),
      };

      (Patient.findById as jest.Mock).mockResolvedValue(mockPatientInstance);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await DELETE({} as Request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Patient deactivated successfully');
      expect(mockPatientInstance.isActive).toBe(false);
      expect(mockPatientInstance.save).toHaveBeenCalled();
    });

    it('should return 400 for invalid patient ID', async () => {
      const context = { params: Promise.resolve({ id: 'invalid-id' }) };
      const response = await DELETE({} as Request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid patient ID');
    });

    it('should return 404 when patient not found', async () => {
      (Patient.findById as jest.Mock).mockResolvedValue(null);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await DELETE({} as Request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Patient not found');
    });

    it('should handle database errors during deletion', async () => {
      const mockPatientInstance = {
        ...mockPatient,
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (Patient.findById as jest.Mock).mockResolvedValue(mockPatientInstance);

      const context = { params: Promise.resolve({ id: validId }) };
      const response = await DELETE({} as Request, context);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to deactivate patient');
    });
  });
});
