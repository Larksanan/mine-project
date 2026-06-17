import { NextRequest } from 'next/server';

// Create mock functions before importing
const mockGetServerSession = jest.fn();
const mockConnectDB = jest.fn();
const mockProductFindById = jest.fn();
const mockProductFindOne = jest.fn();
const mockProductFindByIdAndUpdate = jest.fn();
const mockProductFindByIdAndDelete = jest.fn();
const mockUserFindOne = jest.fn();
const mockObjectIdIsValid = jest.fn();

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

// Mock mongodb
jest.mock('@/lib/mongodb', () => ({
  connectDB: mockConnectDB,
}));

// Mock Product model
jest.mock('@/models/Product', () => ({
  __esModule: true,
  default: {
    findById: mockProductFindById,
    findOne: mockProductFindOne,
    findByIdAndUpdate: mockProductFindByIdAndUpdate,
    findByIdAndDelete: mockProductFindByIdAndDelete,
  },
}));

// Mock User model
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: mockUserFindOne,
  },
}));

// Mock auth options
jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: class extends actual.Types.ObjectId {
        static isValid = mockObjectIdIsValid;
      },
    },
  };
});

// Now import after all mocks are set up
import { Types } from 'mongoose';
import { GET, PUT, DELETE } from '../route';

describe('Product API - /api/product/[id]', () => {
  const mockId = '507f1f77bcf86cd799439011';
  const mockUserId = new Types.ObjectId();
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/product/123');
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
  });

  // Helper functions
  const mockAuthenticatedSession = (
    email = 'user@example.com',
    role = 'USER'
  ) => {
    mockGetServerSession.mockResolvedValue({
      user: { email, role },
    });
  };

  const mockUserFound = (role = 'USER', userId = mockUserId) => {
    mockUserFindOne.mockResolvedValue({
      _id: userId,
      email: 'user@example.com',
      role,
    });
  };

  const mockValidObjectId = () => {
    mockObjectIdIsValid.mockReturnValue(true);
  };

  // Helper to create chainable populate mock
  const createPopulateMock = (finalResult: any) => {
    const mockChain = {
      populate: jest.fn(),
      lean: jest.fn(),
    };

    // First populate() returns the chain
    // Second populate() returns the chain
    // lean() returns the final result
    mockChain.populate
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(mockChain);
    mockChain.lean.mockResolvedValue(finalResult);

    return mockChain;
  };

  describe('GET /api/product/[id]', () => {
    it('should return 400 when product ID is missing', async () => {
      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Product ID is required');
    });

    it('should return 400 when product ID is undefined', async () => {
      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: 'undefined' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Product ID is required');
    });

    it('should return 404 when product is not found by ObjectId', async () => {
      mockValidObjectId();
      const populateChain = createPopulateMock(null);
      mockProductFindById.mockReturnValue(populateChain);

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Product not found');
    });

    it('should successfully fetch product by ObjectId', async () => {
      mockValidObjectId();

      const mockProduct = {
        _id: mockId,
        name: 'Aspirin',
        sku: 'ASP-001',
        price: 9.99,
        stockQuantity: 100,
        createdBy: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'PHARMACIST',
        },
        pharmacy: {
          name: 'Main Pharmacy',
          address: '123 Main St',
          phone: '555-0100',
        },
      };

      const populateChain = createPopulateMock(mockProduct);
      mockProductFindById.mockReturnValue(populateChain);

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Product fetched successfully');
      expect(data.data.name).toBe('Aspirin');
      expect(data.data.id).toBe(mockId);
    });

    it('should try finding by SKU when ID is not a valid ObjectId', async () => {
      mockObjectIdIsValid.mockReturnValue(false);

      const mockProduct = {
        _id: mockId,
        name: 'Aspirin',
        sku: 'ASP-001',
        price: 9.99,
      };

      const populateChain = createPopulateMock(mockProduct);
      mockProductFindOne.mockReturnValue(populateChain);

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: 'ASP-001' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockProductFindOne).toHaveBeenCalledWith({ sku: 'ASP-001' });
    });

    it('should convert SKU to uppercase when searching', async () => {
      mockObjectIdIsValid.mockReturnValue(false);
      const populateChain = createPopulateMock(null);
      mockProductFindOne.mockReturnValue(populateChain);

      await GET(mockRequest, {
        params: Promise.resolve({ id: 'asp-001' }),
      });

      expect(mockProductFindOne).toHaveBeenCalledWith({ sku: 'ASP-001' });
    });

    it('should handle database errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockConnectDB.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch product');
      consoleErrorSpy.mockRestore();
    });

    it('should transform product with consistent ID format', async () => {
      mockValidObjectId();

      const mockProduct = {
        _id: new Types.ObjectId(mockId),
        name: 'Aspirin',
      };

      const populateChain = createPopulateMock(mockProduct);
      mockProductFindById.mockReturnValue(populateChain);

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(data.data.id).toBeDefined();
      expect(data.data._id).toBeDefined();
      expect(data.data.id).toBe(data.data._id);
    });
  });

  describe('PUT /api/product/[id]', () => {
    const validUpdateData = {
      name: 'Updated Aspirin',
      price: 12.99,
      stockQuantity: 150,
      description: 'Updated description',
    };

    beforeEach(() => {
      mockAuthenticatedSession();
      mockUserFound();
      mockValidObjectId();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
    });

    it('should return 404 when user is not found', async () => {
      mockUserFindOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 400 when product ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Product ID is required');
    });

    it('should return 404 when product is not found', async () => {
      mockProductFindById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Product not found');
    });

    it('should return 403 when user has insufficient permissions', async () => {
      const otherUserId = new Types.ObjectId();
      mockUserFound('USER', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        name: 'Aspirin',
        createdBy: otherUserId,
      });

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Insufficient permissions');
    });

    it('should allow ADMIN to update any product', async () => {
      const otherUserId = new Types.ObjectId();
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        name: 'Aspirin',
        createdBy: otherUserId,
      });

      const updatedProduct = {
        _id: mockId,
        ...validUpdateData,
      };

      const populateChain = createPopulateMock(updatedProduct);
      mockProductFindByIdAndUpdate.mockReturnValue(populateChain);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should allow creator to update their own product', async () => {
      mockUserFound('USER', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        name: 'Aspirin',
        createdBy: mockUserId,
      });

      const updatedProduct = {
        _id: mockId,
        ...validUpdateData,
      };

      const populateChain = createPopulateMock(updatedProduct);
      mockProductFindByIdAndUpdate.mockReturnValue(populateChain);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 when price is invalid', async () => {
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify({ price: 0 }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid price');
    });

    it('should return 400 when price is negative', async () => {
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify({ price: -5 }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid price');
    });

    it('should return 400 when stock quantity is negative', async () => {
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify({ stockQuantity: -10 }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid stock quantity');
    });

    it('should successfully update product', async () => {
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      const updatedProduct = {
        _id: mockId,
        ...validUpdateData,
      };

      const populateChain = createPopulateMock(updatedProduct);
      mockProductFindByIdAndUpdate.mockReturnValue(populateChain);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Product updated successfully');
      expect(mockProductFindByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          ...validUpdateData,
          updatedAt: expect.any(Date),
        }),
        { new: true, runValidators: true }
      );
    });

    it('should return 409 for duplicate SKU', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      const duplicateError = new Error('Duplicate key');
      (duplicateError as any).code = 11000;

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(duplicateError),
      };
      mockProductFindByIdAndUpdate.mockReturnValue(mockChain);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Product already exists');
      consoleErrorSpy.mockRestore();
    });

    it('should return 404 if product not found after update', async () => {
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      const populateChain = createPopulateMock(null);
      mockProductFindByIdAndUpdate.mockReturnValue(populateChain);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to update product');
    });

    it('should handle general errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Update failed')),
      };
      mockProductFindByIdAndUpdate.mockReturnValue(mockChain);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to update product');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DELETE /api/product/[id]', () => {
    beforeEach(() => {
      mockAuthenticatedSession();
      mockUserFound();
      mockValidObjectId();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
    });

    it('should return 404 when user is not found', async () => {
      mockUserFindOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 400 when product ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Product ID is required');
    });

    it('should return 404 when product is not found', async () => {
      mockProductFindById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Product not found');
    });

    it('should return 403 when user has insufficient permissions', async () => {
      const otherUserId = new Types.ObjectId();
      mockUserFound('USER', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        name: 'Aspirin',
        createdBy: otherUserId,
      });

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Insufficient permissions');
    });

    it('should allow ADMIN to delete any product', async () => {
      const otherUserId = new Types.ObjectId();
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        name: 'Aspirin',
        createdBy: otherUserId,
      });

      mockProductFindByIdAndDelete.mockResolvedValue({ _id: mockId });

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockProductFindByIdAndDelete).toHaveBeenCalledWith(mockId);
    });

    it('should allow creator to delete their own product', async () => {
      mockUserFound('USER', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        name: 'Aspirin',
        createdBy: mockUserId,
      });

      mockProductFindByIdAndDelete.mockResolvedValue({ _id: mockId });

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Product deleted successfully');
    });

    it('should handle deletion errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      mockProductFindByIdAndDelete.mockRejectedValue(
        new Error('Delete failed')
      );

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to delete product');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('GET should handle products with missing populated fields', async () => {
      mockValidObjectId();

      const mockProduct = {
        _id: mockId,
        name: 'Aspirin',
        createdBy: null,
        pharmacy: null,
      };

      const populateChain = createPopulateMock(mockProduct);
      mockProductFindById.mockReturnValue(populateChain);

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('PUT should allow zero stock quantity', async () => {
      mockUserFound('ADMIN', mockUserId);

      mockProductFindById.mockResolvedValue({
        _id: mockId,
        createdBy: mockUserId,
      });

      const updatedProduct = {
        _id: mockId,
        stockQuantity: 0,
      };

      const populateChain = createPopulateMock(updatedProduct);
      mockProductFindByIdAndUpdate.mockReturnValue(populateChain);

      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'PUT',
        body: JSON.stringify({ stockQuantity: 0 }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: mockId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('DELETE should handle undefined product ID string', async () => {
      const request = new NextRequest('http://localhost:3000/api/product/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'undefined' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
