/**
 * @jest-environment node
 */
import { GET, POST, PUT } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Pharmacy from '@/models/Pharmacy';
import User from '@/models/User';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Pharmacy');
jest.mock('@/models/User');

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

describe('Pharmacy API Routes', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const mockPharmacist = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Pharmacist User',
    email: 'pharmacist@example.com',
    role: 'PHARMACIST',
  };

  const mockSession = {
    user: {
      email: 'admin@example.com',
      name: 'Admin User',
    },
  };

  const mockPharmacy = {
    _id: '507f1f77bcf86cd799439020',
    name: 'City Pharmacy',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
    },
    contact: {
      phone: '555-1234',
      email: 'contact@citypharmacy.com',
      emergencyPhone: '555-5678',
    },
    operatingHours: {
      Monday: '9:00 AM - 6:00 PM',
      Tuesday: '9:00 AM - 6:00 PM',
      Wednesday: '9:00 AM - 6:00 PM',
      Thursday: '9:00 AM - 6:00 PM',
      Friday: '9:00 AM - 6:00 PM',
      Saturday: '9:00 AM - 2:00 PM',
      Sunday: 'Closed',
    },
    services: ['Prescription Filling', 'Consultation'],
    pharmacists: [],
    inventory: {
      totalProducts: 100,
      lowStockItems: 5,
      outOfStockItems: 2,
    },
    status: 'ACTIVE',
    is24Hours: false,
    description: 'Your trusted neighborhood pharmacy',
    website: 'https://citypharmacy.com',
    createdBy: mockUser._id,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /api/pharmacy', () => {
    it('should fetch all pharmacies with default pagination', async () => {
      const mockPharmacies = [mockPharmacy];

      (Pharmacy.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPharmacies),
      });

      (Pharmacy.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest('http://localhost:3000/api/pharmacy');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.pharmacies).toHaveLength(1);
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(10);
      expect(body.data.pagination.total).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      (Pharmacy.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      (Pharmacy.countDocuments as jest.Mock).mockResolvedValue(25);

      const req = new NextRequest(
        'http://localhost:3000/api/pharmacy?page=2&limit=5'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.pagination.page).toBe(2);
      expect(body.data.pagination.limit).toBe(5);
      expect(body.data.pagination.pages).toBe(5);
    });

    it('should filter by search query', async () => {
      (Pharmacy.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockPharmacy]),
      });

      (Pharmacy.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest(
        'http://localhost:3000/api/pharmacy?search=City'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(Pharmacy.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'City', $options: 'i' } },
          ]),
        })
      );
    });

    it('should filter by status', async () => {
      (Pharmacy.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockPharmacy]),
      });

      (Pharmacy.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest(
        'http://localhost:3000/api/pharmacy?status=ACTIVE'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(Pharmacy.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' })
      );
    });

    it('should filter by service', async () => {
      (Pharmacy.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockPharmacy]),
      });

      (Pharmacy.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest(
        'http://localhost:3000/api/pharmacy?service=Consultation'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(Pharmacy.find).toHaveBeenCalledWith(
        expect.objectContaining({ services: { $in: ['Consultation'] } })
      );
    });

    it('should handle database errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost:3000/api/pharmacy');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch pharmacies');
    });

    it('should return empty array when no pharmacies found', async () => {
      (Pharmacy.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      (Pharmacy.countDocuments as jest.Mock).mockResolvedValue(0);

      const req = new NextRequest('http://localhost:3000/api/pharmacy');
      const response = await GET(req);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.pharmacies).toHaveLength(0);
      expect(body.data.pagination.total).toBe(0);
    });
  });

  describe('POST /api/pharmacy', () => {
    const validPharmacyData = {
      name: 'New Pharmacy',
      address: {
        street: '456 Oak Ave',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
      },
      contact: {
        phone: '555-9999',
        email: 'info@newpharmacy.com',
      },
    };

    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized access');
    });

    it('should return 404 if user not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return 403 if user is not admin or pharmacist', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'PATIENT',
      });

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Insufficient permissions');
    });

    it('should create pharmacy successfully as admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Pharmacy.findOne as jest.Mock).mockResolvedValue(null);

      const mockSavedPharmacy = {
        ...mockPharmacy,
        ...validPharmacyData,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          ...mockPharmacy,
          createdBy: mockUser,
        }),
      };

      (Pharmacy as any).mockImplementation(() => mockSavedPharmacy);

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Pharmacy created successfully');
    });

    it('should create pharmacy successfully as pharmacist', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'pharmacist@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue(mockPharmacist);
      (Pharmacy.findOne as jest.Mock).mockResolvedValue(null);

      const mockSavedPharmacy = {
        ...mockPharmacy,
        ...validPharmacyData,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          ...mockPharmacy,
          createdBy: mockPharmacist,
        }),
      };

      (Pharmacy as any).mockImplementation(() => mockSavedPharmacy);

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('should return 400 if required fields are missing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const invalidData = {
        name: 'Test Pharmacy',
        // Missing required address fields
      };

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Missing required fields');
    });

    it('should return 409 if pharmacy already exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Pharmacy.findOne as jest.Mock).mockResolvedValue(mockPharmacy);

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.message).toBe('Pharmacy already exists');
    });

    it('should trim whitespace from input fields', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Pharmacy.findOne as jest.Mock).mockResolvedValue(null);

      let capturedData: any;
      const mockSavedPharmacy = {
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(mockPharmacy),
      };

      (Pharmacy as any).mockImplementation((data: any) => {
        capturedData = data;
        return mockSavedPharmacy;
      });

      const dataWithWhitespace = {
        name: '  Pharmacy With Spaces  ',
        address: {
          street: '  123 Main St  ',
          city: '  Boston  ',
          state: '  MA  ',
          zipCode: '  02101  ',
        },
        contact: {
          phone: '  555-1234  ',
        },
      };

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(dataWithWhitespace),
      });

      await POST(req);

      expect(capturedData.name).toBe('Pharmacy With Spaces');
      expect(capturedData.address.street).toBe('123 Main St');
    });

    it('should handle validation errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Pharmacy.findOne as jest.Mock).mockResolvedValue(null);

      const validationError = {
        name: 'ValidationError',
        errors: {
          name: { message: 'Name is required' },
        },
      };

      const mockSavedPharmacy = {
        save: jest.fn().mockRejectedValue(validationError),
      };

      (Pharmacy as any).mockImplementation(() => mockSavedPharmacy);

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Validation failed');
    });

    it('should handle duplicate key errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Pharmacy.findOne as jest.Mock).mockResolvedValue(null);

      const duplicateError = {
        code: 11000,
        message: 'Duplicate key error',
      };

      const mockSavedPharmacy = {
        save: jest.fn().mockRejectedValue(duplicateError),
      };

      (Pharmacy as any).mockImplementation(() => mockSavedPharmacy);

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.message).toBe('Pharmacy already exists');
    });

    it('should set default values correctly', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Pharmacy.findOne as jest.Mock).mockResolvedValue(null);

      let capturedData: any;
      const mockSavedPharmacy = {
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(mockPharmacy),
      };

      (Pharmacy as any).mockImplementation((data: any) => {
        capturedData = data;
        return mockSavedPharmacy;
      });

      const req = new NextRequest('http://localhost:3000/api/pharmacy', {
        method: 'POST',
        body: JSON.stringify(validPharmacyData),
      });

      await POST(req);

      expect(capturedData.status).toBe('ACTIVE');
      expect(capturedData.is24Hours).toBe(false);
      expect(capturedData.address.country).toBe('US');
      expect(capturedData.operatingHours).toBeDefined();
      expect(capturedData.services).toEqual([]);
      expect(capturedData.createdBy).toBe(mockUser._id);
    });
  });

  describe('PUT /api/pharmacy', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await PUT();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized access');
    });

    it('should return success message for authenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const response = await PUT();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should handle database errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await PUT();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to update pharmacy');
    });
  });
});
