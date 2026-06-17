import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import User from '@/models/User';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/Inventory', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

// Mock mongoose Types
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: class extends actual.Types.ObjectId {
        static isValid = jest.fn();
      },
    },
  };
});

describe('Inventory API - /api/inventory/[id]', () => {
  const mockId = '507f1f77bcf86cd799439011';
  const mockUserId = new Types.ObjectId();
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/inventory/123');
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  // Helper functions
  const mockAuthenticatedSession = (email = 'user@example.com') => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email },
    });
  };

  const mockUserFound = () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: mockUserId,
      email: 'user@example.com',
    });
  };

  const mockDBSuccess = () => {
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  };

  const mockValidObjectId = () => {
    (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
  };

  // Helper to create chainable populate mock
  const createPopulateMock = (finalResult: any) => {
    const mockChain = {
      populate: jest.fn(),
    };

    // First populate() call returns the chain itself
    // Second populate() call returns a promise that resolves to finalResult
    mockChain.populate
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(Promise.resolve(finalResult));

    return mockChain;
  };

  const createPopulateErrorMock = (error: any) => {
    const mockChain = {
      populate: jest.fn(),
    };

    mockChain.populate
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(Promise.reject(error));

    return mockChain;
  };

  describe('GET /api/inventory/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      mockDBSuccess();

      const response = await GET(mockRequest, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
      expect(data.error).toBe('You must be logged in to view inventory');
    });

    it('should return 404 when user is not found in database', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 400 when inventory ID is missing', async () => {
      mockAuthenticatedSession();
      mockUserFound();
      mockDBSuccess();

      const response = await GET(mockRequest, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Inventory ID is required');
    });

    it('should return 400 when inventory ID is invalid', async () => {
      mockAuthenticatedSession();
      mockUserFound();
      mockDBSuccess();
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      const response = await GET(mockRequest, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid inventory ID');
    });

    it('should return 404 when inventory item is not found', async () => {
      mockAuthenticatedSession();
      mockUserFound();
      mockDBSuccess();
      mockValidObjectId();

      const populateChain = createPopulateMock(null);
      (Inventory.findById as jest.Mock).mockReturnValue(populateChain);

      const response = await GET(mockRequest, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Inventory item not found');
    });

    it('should successfully return inventory item with populated fields', async () => {
      mockAuthenticatedSession();
      mockUserFound();
      mockDBSuccess();
      mockValidObjectId();

      const mockInventoryItem = {
        _id: mockId,
        name: 'Aspirin',
        sku: 'ASP-001',
        quantity: 100,
        status: 'IN_STOCK',
        pharmacy: { name: 'Main Pharmacy', address: '123 Main St' },
        createdBy: { name: 'Admin User', email: 'admin@example.com' },
      };

      const populateChain = createPopulateMock(mockInventoryItem);
      (Inventory.findById as jest.Mock).mockReturnValue(populateChain);

      const response = await GET(mockRequest, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Inventory item fetched successfully');
      expect(data.data).toEqual(mockInventoryItem);
    });

    it('should handle general database errors', async () => {
      mockAuthenticatedSession();
      mockUserFound();
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await GET(mockRequest, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch inventory item');
    });
  });

  describe('PUT /api/inventory/[id]', () => {
    const validUpdateData = {
      name: 'Updated Aspirin',
      sku: 'ASP-001-UPDATED',
      quantity: 50,
      lowStockThreshold: 10,
      price: 15.99,
      category: 'Pain Relief',
    };

    beforeEach(() => {
      mockAuthenticatedSession();
      mockUserFound();
      mockDBSuccess();
      mockValidObjectId();
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
    });

    it('should return 404 when inventory item is not found', async () => {
      (Inventory.findById as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Inventory item not found');
    });

    it('should calculate status based on quantity update', async () => {
      const mockInventoryItem = {
        _id: mockId,
        sku: 'OLD-SKU',
        pharmacy: new Types.ObjectId(),
        lowStockThreshold: 20,
        quantity: 100,
        status: 'IN_STOCK',
      };

      const updatedItem = {
        ...mockInventoryItem,
        quantity: 5,
        status: 'LOW_STOCK',
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const populateChain = createPopulateMock(updatedItem);
      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(populateChain);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify({ quantity: 5 }),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          quantity: 5,
          status: 'LOW_STOCK',
          updatedAt: expect.any(Date),
        }),
        { new: true, runValidators: true }
      );
    });

    it('should set status to OUT_OF_STOCK when quantity is 0', async () => {
      const mockInventoryItem = {
        _id: mockId,
        sku: 'OLD-SKU',
        pharmacy: new Types.ObjectId(),
        quantity: 100,
        status: 'IN_STOCK',
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const updatedItem = {
        ...mockInventoryItem,
        quantity: 0,
        status: 'OUT_OF_STOCK',
      };

      const populateChain = createPopulateMock(updatedItem);
      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(populateChain);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify({ quantity: 0 }),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      await response.json();

      expect(response.status).toBe(200);
      expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          quantity: 0,
          status: 'OUT_OF_STOCK',
        }),
        expect.any(Object)
      );
    });

    it('should check SKU uniqueness when updating SKU', async () => {
      const mockInventoryItem = {
        _id: mockId,
        sku: 'OLD-SKU',
        pharmacy: new Types.ObjectId(),
        quantity: 100,
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue({
        _id: 'different-id',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify({ sku: 'NEW-SKU' }),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('SKU already exists');
      expect(data.error).toContain('An item with this SKU already exists');
    });

    it('should check barcode uniqueness when updating barcode', async () => {
      const mockInventoryItem = {
        _id: mockId,
        barcode: 'OLD-BARCODE',
        pharmacy: new Types.ObjectId(),
        quantity: 100,
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue({
        _id: 'different-id',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify({ barcode: 'NEW-BARCODE' }),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Barcode already exists');
    });

    it('should format SKU, barcode, and batchNumber to uppercase and trim', async () => {
      const mockInventoryItem = {
        _id: mockId,
        sku: 'old',
        pharmacy: new Types.ObjectId(),
        quantity: 100,
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const populateChain = createPopulateMock(mockInventoryItem);
      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(populateChain);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify({
            sku: '  new-sku  ',
            barcode: '  123456  ',
            batchNumber: '  batch-001  ',
          }),
        }
      );

      await PUT(request, { params: { id: mockId } });

      expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          sku: 'NEW-SKU',
          barcode: '123456',
          batchNumber: 'BATCH-001',
          updatedAt: expect.any(Date),
        }),
        expect.any(Object)
      );
    });

    it('should handle validation errors from mongoose', async () => {
      const mockInventoryItem = {
        _id: mockId,
        pharmacy: new Types.ObjectId(),
        quantity: 100,
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const validationError = new Error('ValidationError');
      validationError.name = 'ValidationError';
      (validationError as any).errors = {
        name: { message: 'Name is required' },
        price: { message: 'Price must be positive' },
      };

      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(
        createPopulateErrorMock(validationError)
      );

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
      expect(data.error).toContain('Name is required');
    });

    it('should handle duplicate key errors', async () => {
      const mockInventoryItem = {
        _id: mockId,
        pharmacy: new Types.ObjectId(),
        quantity: 100,
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const duplicateError = new Error('Duplicate key');
      (duplicateError as any).code = 11000;
      (duplicateError as any).keyPattern = { sku: 1 };

      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(
        createPopulateErrorMock(duplicateError)
      );

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Duplicate entry');
      expect(data.error).toContain('An item with this sku already exists');
    });

    it('should handle general errors', async () => {
      const mockInventoryItem = {
        _id: mockId,
        pharmacy: new Types.ObjectId(),
        quantity: 100,
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);
      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(
        createPopulateErrorMock(new Error('General error'))
      );

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
        }
      );

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to update inventory item');
    });
  });

  describe('DELETE /api/inventory/[id]', () => {
    beforeEach(() => {
      mockAuthenticatedSession();
      mockUserFound();
      mockDBSuccess();
      mockValidObjectId();
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
    });

    it('should return 404 when inventory item is not found', async () => {
      (Inventory.findById as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Inventory item not found');
    });

    it('should perform soft delete by setting status to DISCONTINUED', async () => {
      const mockInventoryItem = {
        _id: mockId,
        name: 'Aspirin',
        quantity: 100,
        status: 'IN_STOCK',
      };

      const softDeletedItem = {
        ...mockInventoryItem,
        status: 'DISCONTINUED',
        quantity: 0,
        deletedAt: new Date(),
        deletedBy: mockUserId,
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);

      const populateChain = createPopulateMock(softDeletedItem);
      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(populateChain);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Inventory item deleted successfully');

      expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        {
          status: 'DISCONTINUED',
          quantity: 0,
          updatedAt: expect.any(Date),
          deletedAt: expect.any(Date),
          deletedBy: mockUserId,
        },
        { new: true }
      );
    });

    it('should handle general errors during deletion', async () => {
      (Inventory.findById as jest.Mock).mockResolvedValue({ _id: mockId });
      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(
        createPopulateErrorMock(new Error('Deletion error'))
      );

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to delete inventory item');
    });
  });

  describe('Edge Cases', () => {
    it('GET should handle case where session has email but user not in DB', async () => {
      mockAuthenticatedSession();
      mockDBSuccess();
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('User not found');
    });

    it('PUT should not update status if quantity is not provided', async () => {
      mockAuthenticatedSession();
      mockUserFound();
      mockValidObjectId();

      const mockInventoryItem = {
        _id: mockId,
        sku: 'OLD-SKU',
        pharmacy: new Types.ObjectId(),
        quantity: 100,
        status: 'IN_STOCK',
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const populateChain = createPopulateMock(mockInventoryItem);
      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(populateChain);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'New Name' }),
        }
      );

      await PUT(request, { params: { id: mockId } });

      expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          name: 'New Name',
          updatedAt: expect.any(Date),
        }),
        expect.any(Object)
      );

      const updateCall = (Inventory.findByIdAndUpdate as jest.Mock).mock
        .calls[0][1];
      expect(updateCall.status).toBeUndefined();
    });

    it('PUT should use provided lowStockThreshold for status calculation', async () => {
      mockAuthenticatedSession();
      mockUserFound();
      mockValidObjectId();

      const mockInventoryItem = {
        _id: mockId,
        sku: 'OLD-SKU',
        pharmacy: new Types.ObjectId(),
        lowStockThreshold: 20,
        quantity: 100,
        status: 'IN_STOCK',
      };

      (Inventory.findById as jest.Mock).mockResolvedValue(mockInventoryItem);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const updatedItem = {
        ...mockInventoryItem,
        quantity: 15,
        lowStockThreshold: 10,
        status: 'IN_STOCK',
      };

      const populateChain = createPopulateMock(updatedItem);
      (Inventory.findByIdAndUpdate as jest.Mock).mockReturnValue(populateChain);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'PUT',
          body: JSON.stringify({
            quantity: 15,
            lowStockThreshold: 10,
          }),
        }
      );

      await PUT(request, { params: { id: mockId } });

      expect(Inventory.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          quantity: 15,
          lowStockThreshold: 10,
          status: 'IN_STOCK',
        }),
        expect.any(Object)
      );
    });

    it('DELETE should return 400 for invalid ID format', async () => {
      mockAuthenticatedSession();
      mockUserFound();
      mockDBSuccess();
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/123',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid inventory ID');
    });
  });
});
