/**
 * @jest-environment node
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb');

// Mock Shop model
jest.mock('@/models/shop', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
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

import { GET, PUT, DELETE, PATCH } from '../route';
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import shopModel from '@/models/shop';

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

// Mock console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('Shop [id] API Routes', () => {
  const validShopId = '507f1f77bcf86cd799439011';
  const invalidShopId = 'invalid-id';

  const mockShop = {
    _id: validShopId,
    name: 'Main Pharmacy',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    phone: '555-1234',
    email: 'main@pharmacy.com',
    operatingHours: {
      Monday: '9:00 AM - 6:00 PM',
      Tuesday: '9:00 AM - 6:00 PM',
      Wednesday: '9:00 AM - 6:00 PM',
      Thursday: '9:00 AM - 6:00 PM',
      Friday: '9:00 AM - 6:00 PM',
      Saturday: '10:00 AM - 4:00 PM',
      Sunday: 'Closed',
    },
    services: ['Prescription Filling', 'Vaccination'],
    status: 'ACTIVE',
  };

  const mockDbConnection = {
    connection: {
      readyState: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('GET /api/shop/[id]', () => {
    it('should fetch shop by valid ID', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findById as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockShop);
      expect(shopModel.findById).toHaveBeenCalledWith(validShopId);
    });

    it('should return 400 for invalid ID format', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/shop/${invalidShopId}`
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: invalidShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid shop ID format');
      expect(shopModel.findById).not.toHaveBeenCalled();
    });

    it('should return 400 for empty ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/shop/');
      const response = await GET(req, {
        params: Promise.resolve({ id: '' }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid shop ID format');
    });

    it('should return 404 if shop not found', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Shop not found');
    });

    it('should log fetching shop with ID', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findById as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`
      );
      await GET(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Fetching shop with ID: ${validShopId}`
      );
    });

    it('should log database connection state', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findById as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`
      );
      await GET(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        ' Database connection state:',
        1
      );
    });

    it('should log found shop name', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findById as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`
      );
      await GET(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        ` Found shop: ${mockShop.name}`
      );
    });

    it('should handle database connection errors', async () => {
      const errorMessage = 'Database connection failed';
      (connectDB as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch shop');
      expect(body.error).toBe(errorMessage);
    });

    it('should handle findById errors', async () => {
      const errorMessage = 'Query failed';
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findById as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`
      );
      const response = await GET(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe(errorMessage);
    });

    it('should validate MongoDB ObjectId format with regex', async () => {
      const invalidIds = [
        '123',
        'abc',
        '507f1f77bcf86cd79943901',
        'g07f1f77bcf86cd799439011',
      ];

      for (const id of invalidIds) {
        const req = new NextRequest(`http://localhost:3000/api/shop/${id}`);
        const response = await GET(req, {
          params: Promise.resolve({ id }),
        });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.message).toBe('Invalid shop ID format');
      }
    });
  });

  describe('PUT /api/shop/[id]', () => {
    const updateData = {
      name: 'Updated Pharmacy',
      phone: '555-9999',
    };

    it('should update shop successfully', async () => {
      const updatedShop = { ...mockShop, ...updateData };
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(updateData.name);
      expect(shopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validShopId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
    });

    it('should return 400 for invalid ID format', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/shop/${invalidShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: invalidShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid shop ID format');
    });

    it('should return 404 if shop not found', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Shop not found');
    });

    it('should log updating shop ID', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Updating shop with ID: ${validShopId}`
      );
    });

    it('should log update data', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Update data:', updateData);
    });

    it('should log updated shop name', async () => {
      const updatedShop = { ...mockShop, ...updateData };
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Updated shop: ${updatedShop.name}`
      );
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Update failed';
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe(errorMessage);
    });

    it('should handle invalid JSON', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: 'invalid json',
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('should use runValidators option', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(shopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validShopId,
        updateData,
        expect.objectContaining({
          runValidators: true,
        })
      );
    });

    it('should return new document after update', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(shopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validShopId,
        updateData,
        expect.objectContaining({
          new: true,
        })
      );
    });
  });

  describe('DELETE /api/shop/[id]', () => {
    it('should delete shop successfully', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Shop deleted successfully');
      expect(body.data).toEqual(mockShop);
      expect(shopModel.findByIdAndDelete).toHaveBeenCalledWith(validShopId);
    });

    it('should return 400 for invalid ID format', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/shop/${invalidShopId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: invalidShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid shop ID format');
    });

    it('should return 404 if shop not found', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Shop not found');
    });

    it('should log deleting shop ID', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'DELETE',
        }
      );

      await DELETE(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `🗑️ Deleting shop with ID: ${validShopId}`
      );
    });

    it('should log deleted shop name', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'DELETE',
        }
      );

      await DELETE(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        ` Deleted shop: ${mockShop.name}`
      );
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Delete failed';
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to delete shop');
      expect(body.error).toBe(errorMessage);
    });

    it('should log errors when deletion fails', async () => {
      const error = new Error('Delete failed');
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndDelete as jest.Mock).mockRejectedValue(error);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'DELETE',
        }
      );

      await DELETE(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        ' Error deleting shop:',
        error
      );
    });
  });

  describe('PATCH /api/shop/[id]', () => {
    const partialUpdateData = {
      phone: '555-7777',
    };

    it('should partially update shop successfully', async () => {
      const updatedShop = { ...mockShop, ...partialUpdateData };
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(partialUpdateData),
        }
      );

      const response = await PATCH(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.phone).toBe(partialUpdateData.phone);
      expect(shopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validShopId,
        { $set: partialUpdateData },
        {
          new: true,
          runValidators: true,
        }
      );
    });

    it('should use $set operator for partial updates', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(partialUpdateData),
        }
      );

      await PATCH(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(shopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validShopId,
        { $set: partialUpdateData },
        expect.any(Object)
      );
    });

    it('should return 400 for invalid ID format', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/shop/${invalidShopId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(partialUpdateData),
        }
      );

      const response = await PATCH(req, {
        params: Promise.resolve({ id: invalidShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid shop ID format');
    });

    it('should return 404 if shop not found', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(partialUpdateData),
        }
      );

      const response = await PATCH(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Shop not found');
    });

    it('should log partial update data', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(partialUpdateData),
        }
      );

      await PATCH(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        ' Partial update data:',
        partialUpdateData
      );
    });

    it('should log partially updated shop name', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockShop);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(partialUpdateData),
        }
      );

      await PATCH(req, {
        params: Promise.resolve({ id: validShopId }),
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Partially updated shop: ${mockShop.name}`
      );
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Partial update failed';
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(partialUpdateData),
        }
      );

      const response = await PATCH(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to update shop');
      expect(body.error).toBe(errorMessage);
    });

    it('should handle invalid JSON', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);

      const req = new NextRequest(
        `http://localhost:3000/api/shop/${validShopId}`,
        {
          method: 'PATCH',
          body: 'invalid json',
        }
      );

      const response = await PATCH(req, {
        params: Promise.resolve({ id: validShopId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
