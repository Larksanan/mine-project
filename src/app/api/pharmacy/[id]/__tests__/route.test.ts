/**
 * @jest-environment node
 */

// Mock dependencies BEFORE imports
jest.mock('next-auth');
jest.mock('@/lib/mongodb');

// Mock User model
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

// Mock Pharmacy model to prevent Schema.virtual errors
jest.mock('@/models/Pharmacy', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const mockSchema = function () {
    return {
      virtual: jest.fn().mockReturnValue({
        get: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
      }),
      pre: jest.fn().mockReturnThis(),
      post: jest.fn().mockReturnThis(),
      methods: {},
      statics: {},
      index: jest.fn(),
      plugin: jest.fn(),
      set: jest.fn(),
    };
  };

  return {
    Schema: mockSchema,
    model: jest.fn(),
    models: {},
    Types: {
      ObjectId: {
        isValid: jest.fn(),
      },
    },
    connect: jest.fn(),
    connection: {
      readyState: 1,
    },
  };
});

import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Pharmacy from '@/models/Pharmacy';
import User from '@/models/User';
import { Types } from 'mongoose';

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

describe('Pharmacy [id] API Routes', () => {
  const mockAdminUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const mockPharmacistUser = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Pharmacist User',
    email: 'pharmacist@example.com',
    role: 'PHARMACIST',
  };

  const mockOtherUser = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Other User',
    email: 'other@example.com',
    role: 'PHARMACIST',
  };

  const mockPatientUser = {
    _id: '507f1f77bcf86cd799439014',
    name: 'Patient User',
    email: 'patient@example.com',
    role: 'PATIENT',
  };

  const mockAdminSession = {
    user: {
      email: 'admin@example.com',
      name: 'Admin User',
    },
  };

  const mockPharmacistSession = {
    user: {
      email: 'pharmacist@example.com',
      name: 'Pharmacist User',
    },
  };

  const validPharmacyId = '507f1f77bcf86cd799439020';

  const mockPharmacy = {
    _id: validPharmacyId,
    name: 'City Pharmacy',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      toObject: jest.fn().mockReturnValue({
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      }),
    },
    contact: {
      phone: '555-1234',
      email: 'contact@citypharmacy.com',
      emergencyPhone: '555-5678',
      toObject: jest.fn().mockReturnValue({
        phone: '555-1234',
        email: 'contact@citypharmacy.com',
        emergencyPhone: '555-5678',
      }),
    },
    operatingHours: {
      Monday: '9:00 AM - 6:00 PM',
      Tuesday: '9:00 AM - 6:00 PM',
      Wednesday: '9:00 AM - 6:00 PM',
      Thursday: '9:00 AM - 6:00 PM',
      Friday: '9:00 AM - 6:00 PM',
      Saturday: '9:00 AM - 2:00 PM',
      Sunday: 'Closed',
      toObject: jest.fn().mockReturnValue({
        Monday: '9:00 AM - 6:00 PM',
        Tuesday: '9:00 AM - 6:00 PM',
        Wednesday: '9:00 AM - 6:00 PM',
        Thursday: '9:00 AM - 6:00 PM',
        Friday: '9:00 AM - 6:00 PM',
        Saturday: '9:00 AM - 2:00 PM',
        Sunday: 'Closed',
      }),
    },
    services: ['Prescription Filling', 'Consultation'],
    pharmacists: [],
    inventory: {
      totalProducts: 100,
      lowStockItems: 5,
      outOfStockItems: 2,
      toObject: jest.fn().mockReturnValue({
        totalProducts: 100,
        lowStockItems: 5,
        outOfStockItems: 2,
      }),
    },
    status: 'ACTIVE',
    is24Hours: false,
    description: 'Your trusted neighborhood pharmacy',
    website: 'https://citypharmacy.com',
    createdBy: mockPharmacistUser._id,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /api/pharmacy/[id]', () => {
    it('should return 400 if pharmacy ID is not provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/pharmacy/');
      const response = await GET(req, { params: Promise.resolve({ id: '' }) });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Pharmacy ID is required');
    });

    it('should fetch pharmacy by valid ObjectId', async () => {
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPharmacy),
      };

      (Pharmacy.findById as jest.Mock).mockReturnValue(mockFindById);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('City Pharmacy');
      expect(Pharmacy.findById).toHaveBeenCalledWith(validPharmacyId);
    });

    it('should search pharmacy by name if ID is not a valid ObjectId', async () => {
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      const mockFindOne = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPharmacy),
      };

      (Pharmacy.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/pharmacy/CityPharmacy'
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: 'CityPharmacy' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Pharmacy.findOne).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'CityPharmacy', $options: 'i' } },
          { _id: 'CityPharmacy' },
        ],
      });
    });

    it('should return 404 if pharmacy not found', async () => {
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };

      (Pharmacy.findById as jest.Mock).mockReturnValue(mockFindById);

      const req = new NextRequest(
        'http://localhost:3000/api/pharmacy/nonexistent'
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('Pharmacy not found');
    });

    it('should handle database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch pharmacy');
      consoleErrorSpy.mockRestore();
    });

    it('should populate createdBy field', async () => {
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          ...mockPharmacy,
          createdBy: mockPharmacistUser,
        }),
      };

      (Pharmacy.findById as jest.Mock).mockReturnValue(mockFindById);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`
      );
      await GET(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });

      expect(mockFindById.populate).toHaveBeenCalledWith(
        'createdBy',
        'name email role'
      );
    });
  });

  describe('PUT /api/pharmacy/[id]', () => {
    const updateData = {
      name: 'Updated Pharmacy',
      contact: {
        phone: '555-9999',
      },
    };

    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized access');
    });

    it('should return 404 if user not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return 400 if pharmacy ID is not provided', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const req = new NextRequest('http://localhost:3000/api/pharmacy/', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(req, {
        params: Promise.resolve({ id: '' }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Pharmacy ID is required');
    });

    it('should return 404 if pharmacy not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('Pharmacy not found');
    });

    it('should allow admin to update any pharmacy', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const mockUpdatedPharmacy = {
        ...mockPharmacy,
        ...updateData,
      };

      const mockFindByIdAndUpdate = {
        populate: jest.fn().mockResolvedValue(mockUpdatedPharmacy),
      };

      (Pharmacy.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Pharmacy updated successfully');
    });

    it('should allow creator to update their own pharmacy', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockPharmacistSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockPharmacistUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const mockUpdatedPharmacy = {
        ...mockPharmacy,
        ...updateData,
      };

      const mockFindByIdAndUpdate = {
        populate: jest.fn().mockResolvedValue(mockUpdatedPharmacy),
      };

      (Pharmacy.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should return 403 if user tries to update pharmacy they did not create', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'other@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue(mockOtherUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Insufficient permissions');
    });

    it('should merge nested address updates', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const partialAddressUpdate = {
        address: {
          street: '456 New St',
        },
      };

      const mockFindByIdAndUpdate = {
        populate: jest.fn().mockResolvedValue(mockPharmacy),
      };

      (Pharmacy.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(partialAddressUpdate),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });

      expect(Pharmacy.findByIdAndUpdate).toHaveBeenCalledWith(
        validPharmacyId,
        expect.objectContaining({
          address: expect.objectContaining({
            street: '456 New St',
            city: 'New York',
            state: 'NY',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should merge nested contact updates', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const partialContactUpdate = {
        contact: {
          phone: '555-7777',
        },
      };

      const mockFindByIdAndUpdate = {
        populate: jest.fn().mockResolvedValue(mockPharmacy),
      };

      (Pharmacy.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(partialContactUpdate),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });

      expect(Pharmacy.findByIdAndUpdate).toHaveBeenCalledWith(
        validPharmacyId,
        expect.objectContaining({
          contact: expect.objectContaining({
            phone: '555-7777',
            email: 'contact@citypharmacy.com',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should update with validators enabled', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const mockFindByIdAndUpdate = {
        populate: jest.fn().mockResolvedValue(mockPharmacy),
      };

      (Pharmacy.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });

      expect(Pharmacy.findByIdAndUpdate).toHaveBeenCalledWith(
        validPharmacyId,
        expect.any(Object),
        expect.objectContaining({
          new: true,
          runValidators: true,
        })
      );
    });

    it('should set updatedAt timestamp', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const mockFindByIdAndUpdate = {
        populate: jest.fn().mockResolvedValue(mockPharmacy),
      };

      (Pharmacy.findByIdAndUpdate as jest.Mock).mockReturnValue(
        mockFindByIdAndUpdate
      );

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });

      expect(Pharmacy.findByIdAndUpdate).toHaveBeenCalledWith(
        validPharmacyId,
        expect.objectContaining({
          updatedAt: expect.any(Date),
        }),
        expect.any(Object)
      );
    });

    it('should handle database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to update pharmacy');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DELETE /api/pharmacy/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.message).toBe('Unauthorized access');
    });

    it('should return 404 if user not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('User not found');
    });

    it('should return 400 if pharmacy ID is not provided', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);

      const req = new NextRequest('http://localhost:3000/api/pharmacy/', {
        method: 'DELETE',
      });

      const response = await DELETE(req, {
        params: Promise.resolve({ id: '' }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe('Pharmacy ID is required');
    });

    it('should return 404 if pharmacy not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.message).toBe('Pharmacy not found');
    });

    it('should return 403 if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'patient@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue(mockPatientUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Insufficient permissions');
    });

    it('should soft delete pharmacy (set status to INACTIVE)', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);
      (Pharmacy.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockPharmacy);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Pharmacy deleted successfully');
      expect(Pharmacy.findByIdAndUpdate).toHaveBeenCalledWith(
        validPharmacyId,
        expect.objectContaining({
          status: 'INACTIVE',
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should only allow admin to delete', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockPharmacistSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockPharmacistUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.message).toBe('Insufficient permissions');
      expect(body.error).toBe('Only administrators can delete pharmacies');
    });

    it('should handle database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to delete pharmacy');
      consoleErrorSpy.mockRestore();
    });

    it('should set updatedAt when deleting', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockAdminUser);
      (Pharmacy.findById as jest.Mock).mockResolvedValue(mockPharmacy);
      (Pharmacy.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockPharmacy);

      const req = new NextRequest(
        `http://localhost:3000/api/pharmacy/${validPharmacyId}`,
        {
          method: 'DELETE',
        }
      );

      await DELETE(req, {
        params: Promise.resolve({ id: validPharmacyId }),
      });

      expect(Pharmacy.findByIdAndUpdate).toHaveBeenCalledWith(
        validPharmacyId,
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );
    });
  });
});
