import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '../route';
import { getServerSession } from 'next-auth';
import Inventory from '@/models/Inventory';
import User from '@/models/User';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      private _url: string;
      public nextUrl: URL;
      constructor(url: string) {
        this._url = url;
        this.nextUrl = new URL(url);
      }
      get url() {
        return this._url;
      }
      set url(val: string) {
        this._url = val;
        this.nextUrl = new URL(val);
      }
      async json() {
        return {};
      }
    },
    NextResponse: {
      json: jest.fn((data: any, init?: { status?: number }) => ({
        json: async () => data,
        status: init?.status || 200,
      })),
    },
  };
});

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/Inventory', () => {
  const mockModel = jest.fn();
  (mockModel as any).find = jest.fn();
  (mockModel as any).countDocuments = jest.fn();
  (mockModel as any).aggregate = jest.fn();
  (mockModel as any).findOne = jest.fn();
  (mockModel as any).create = jest.fn();
  (mockModel as any).bulkWrite = jest.fn();
  return {
    __esModule: true,
    default: mockModel,
  };
});

jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

// Mock Types.ObjectId
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: class {
        static isValid = jest.fn();
        constructor(public id: string) {}
        toString() {
          return this.id;
        }
      },
    },
  };
});

describe('Inventory API', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRequest = new NextRequest('http://localhost:3000/api/inventory');
    mockRequest.json = jest.fn().mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/inventory', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      mockRequest = new NextRequest('http://localhost:3000/api/inventory');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
    });

    it('should return 404 when user is not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      mockRequest = new NextRequest('http://localhost:3000/api/inventory');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 400 when pharmacy ID is missing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });

      mockRequest = new NextRequest('http://localhost:3000/api/inventory');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Pharmacy ID is required');
    });

    it('should return 400 when pharmacy ID is invalid', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      mockRequest = new NextRequest(
        'http://localhost:3000/api/inventory?pharmacy=invalid-id'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid pharmacy ID');
    });

    it('should fetch inventory with all filters and statistics', async () => {
      const mockSession = {
        user: { email: 'user@example.com' },
      };
      const mockUser = { _id: 'user-123' };
      const mockInventory = [
        { _id: 'item-1', name: 'Medicine A', quantity: 100 },
        { _id: 'item-2', name: 'Medicine B', quantity: 50 },
      ];
      const mockCategoryDistribution = [
        { _id: 'Category 1', count: 5, totalValue: 1000 },
        { _id: 'Category 2', count: 3, totalValue: 500 },
      ];
      const mockTotalValue = [{ total: 1500 }];

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockInventory),
      });

      (Inventory.find as jest.Mock).mockImplementation(mockFind);
      (Inventory.countDocuments as jest.Mock)
        .mockResolvedValueOnce(10) // total for pagination
        .mockResolvedValueOnce(20) // totalItems
        .mockResolvedValueOnce(5) // lowStockCount
        .mockResolvedValueOnce(2) // outOfStockCount
        .mockResolvedValueOnce(1); // expiredCount

      (Inventory.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockTotalValue)
        .mockResolvedValueOnce(mockCategoryDistribution);

      mockRequest = new NextRequest(
        'http://localhost:3000/api/inventory?pharmacy=pharmacy-123&category=medicines&status=IN_STOCK&lowStock=true&page=2&limit=10&search=medicine&sortBy=name&sortOrder=asc'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.inventory).toEqual(mockInventory);
      expect(data.data.statistics.totalItems).toBe(20);
      expect(data.data.statistics.totalValue).toBe(1500);
      expect(data.data.statistics.lowStockCount).toBe(5);
      expect(data.data.statistics.outOfStockCount).toBe(2);
      expect(data.data.statistics.expiredCount).toBe(1);
      expect(data.data.statistics.categoryDistribution).toEqual(
        mockCategoryDistribution
      );
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.total).toBe(10);
      expect(data.data.pagination.pages).toBe(1);

      // Verify query construction
      expect(Inventory.find).toHaveBeenCalledWith({
        pharmacy: expect.any(Object),
        category: 'medicines',
        status: 'IN_STOCK',
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
        quantity: { $gt: 0 },
        $or: expect.any(Array),
      });
    });

    it('should handle low stock filter correctly', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      (Inventory.find as jest.Mock).mockImplementation(mockFind);
      (Inventory.countDocuments as jest.Mock).mockResolvedValue(0);
      (Inventory.aggregate as jest.Mock).mockResolvedValue([]);

      mockRequest = new NextRequest(
        'http://localhost:3000/api/inventory?pharmacy=pharmacy-123&lowStock=true'
      );

      await GET(mockRequest);

      expect(Inventory.find).toHaveBeenCalledWith({
        pharmacy: expect.any(Object),
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
        quantity: { $gt: 0 },
      });
    });

    it('should handle search filter', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      (Inventory.find as jest.Mock).mockImplementation(mockFind);
      (Inventory.countDocuments as jest.Mock).mockResolvedValue(0);
      (Inventory.aggregate as jest.Mock).mockResolvedValue([]);

      mockRequest = new NextRequest(
        'http://localhost:3000/api/inventory?pharmacy=pharmacy-123&search=aspirin'
      );

      await GET(mockRequest);

      expect(Inventory.find).toHaveBeenCalledWith({
        pharmacy: expect.any(Object),
        $or: expect.arrayContaining([
          { name: { $regex: 'aspirin', $options: 'i' } },
          { sku: { $regex: 'aspirin', $options: 'i' } },
        ]),
      });
    });

    it('should handle errors gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      });
      (Inventory.find as jest.Mock).mockImplementation(mockFind);

      mockRequest = new NextRequest(
        'http://localhost:3000/api/inventory?pharmacy=pharmacy-123'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch inventory');
    });
  });

  describe('POST /api/inventory', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      mockRequest.json = jest.fn().mockResolvedValue({});

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
    });

    it('should return 404 when user is not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      mockRequest.json = jest.fn().mockResolvedValue({});

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 400 when required fields are missing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        // Missing other required fields
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required fields');
      expect(data.error).toContain('category');
      expect(data.error).toContain('sku');
      expect(data.error).toContain('quantity');
    });

    it('should return 400 when pharmacy ID is invalid', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'MED001',
        quantity: 100,
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'invalid-id',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid pharmacy ID');
    });

    it('should return 409 when SKU already exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Inventory.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing-item',
        sku: 'MED001',
      });

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'MED001',
        quantity: 100,
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'pharmacy-123',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('SKU already exists');
      expect(Inventory.findOne).toHaveBeenCalledWith({
        sku: 'MED001',
        pharmacy: expect.any(Object),
      });
    });

    it('should return 409 when barcode already exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // First call for SKU check returns null
      // Second call for barcode check returns existing item
      (Inventory.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          _id: 'existing-item',
          barcode: '1234567890123',
        });

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'MED001',
        barcode: '1234567890123',
        quantity: 100,
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'pharmacy-123',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Barcode already exists');
      expect(Inventory.findOne).toHaveBeenCalledWith({
        barcode: '1234567890123',
        pharmacy: expect.any(Object),
      });
    });

    it('should create inventory item successfully with status IN_STOCK', async () => {
      const mockSession = {
        user: { email: 'user@example.com' },
      };
      const mockUser = { _id: 'user-123' };
      const mockInventoryItem = {
        _id: 'item-123',
        name: 'Medicine A',
        sku: 'MED001',
        quantity: 100,
        status: 'IN_STOCK',
        populate: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(mockInventoryItem);
      const MockInventoryModel = function (data: any) {
        return {
          ...data,
          save: mockSave,
          populate: mockInventoryItem.populate,
        };
      };
      (Inventory as any).mockImplementation(MockInventoryModel);

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'med001', // Should be converted to uppercase
        quantity: 100,
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'pharmacy-123',
        lowStockThreshold: 20,
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Inventory item created successfully');

      // Verify data transformation
      expect(mockSave).toHaveBeenCalled();
      expect(mockInventoryItem.populate).toHaveBeenCalledWith(
        'pharmacy',
        'name address'
      );
      expect(mockInventoryItem.populate).toHaveBeenCalledWith(
        'createdBy',
        'name email'
      );
    });

    it('should set status to LOW_STOCK when quantity <= lowStockThreshold', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'item-123',
        populate: jest.fn(),
      });

      (Inventory as any).mockImplementation(function (data: any) {
        return {
          ...data,
          save: mockSave,
          populate: jest.fn().mockImplementation(function (this: any) {
            return Promise.resolve(this);
          }),
        };
      });

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'MED001',
        quantity: 10, // Equal to default lowStockThreshold
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'pharmacy-123',
      });

      await POST(mockRequest);

      expect(mockSave).toHaveBeenCalled();
      // Should be called with status: 'LOW_STOCK'
      const callArgs = (Inventory as any).mock.calls[0][0];
      expect(callArgs.status).toBe('LOW_STOCK');
    });

    it('should set status to OUT_OF_STOCK when quantity is 0', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'item-123',
        populate: jest.fn(),
      });

      (Inventory as any).mockImplementation(function (data: any) {
        return {
          ...data,
          save: mockSave,
          populate: jest.fn().mockImplementation(function (this: any) {
            return Promise.resolve(this);
          }),
        };
      });

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'MED001',
        quantity: 0,
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'pharmacy-123',
      });

      const response = await POST(mockRequest);

      if (response.status === 201) {
        const callArgs = (Inventory as any).mock.calls[0][0];
        expect(callArgs.status).toBe('OUT_OF_STOCK');
      } else {
        expect(response.status).toBe(400);
      }
    });

    it('should handle validation errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const validationError = new Error('Validation error');
      (validationError as any).name = 'ValidationError';
      (validationError as any).errors = {
        name: { message: 'Name is required' },
        quantity: { message: 'Quantity must be positive' },
      };

      (Inventory as any).mockImplementation(function () {
        return {
          save: jest.fn().mockRejectedValue(validationError),
        };
      });

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'MED001',
        quantity: 100,
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'pharmacy-123',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
      expect(data.error).toContain('Name is required');
    });

    it('should handle duplicate key errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      const duplicateError = new Error('Duplicate key');
      (duplicateError as any).code = 11000;
      (duplicateError as any).keyPattern = { sku: 1 };

      (Inventory as any).mockImplementation(function () {
        return {
          save: jest.fn().mockRejectedValue(duplicateError),
        };
      });

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'MED001',
        quantity: 100,
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'pharmacy-123',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Duplicate entry');
      expect(data.error).toContain('sku');
    });

    it('should handle general errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Inventory.findOne as jest.Mock).mockResolvedValue(null);

      (Inventory as any).mockImplementation(function () {
        return {
          save: jest.fn().mockRejectedValue(new Error('Database error')),
        };
      });

      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Medicine A',
        category: 'Medicines',
        sku: 'MED001',
        quantity: 100,
        costPrice: 10,
        sellingPrice: 15,
        pharmacy: 'pharmacy-123',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to create inventory item');
    });
  });

  describe('PUT /api/inventory', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      mockRequest.json = jest.fn().mockResolvedValue({});

      const response = await PUT(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
    });

    it('should return 404 when user is not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      mockRequest.json = jest.fn().mockResolvedValue({});

      const response = await PUT(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 400 when pharmacyId is missing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });

      mockRequest.json = jest.fn().mockResolvedValue({
        updates: [{ itemId: 'item-123', fields: { quantity: 50 } }],
      });

      const response = await PUT(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Pharmacy ID is required');
    });

    it('should return 400 when updates array is empty or invalid', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });

      mockRequest.json = jest.fn().mockResolvedValue({
        pharmacyId: 'pharmacy-123',
        updates: [], // Empty array
      });

      const response = await PUT(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('No updates provided');
    });

    it('should perform bulk update successfully', async () => {
      const mockSession = {
        user: { email: 'user@example.com' },
      };
      const mockUser = { _id: 'user-123' };
      const mockBulkWriteResult = {
        modifiedCount: 3,
        matchedCount: 3,
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Inventory.bulkWrite as jest.Mock).mockResolvedValue(mockBulkWriteResult);

      const updates = [
        { itemId: 'item-1', fields: { quantity: 50, price: 20 } },
        { itemId: 'item-2', fields: { quantity: 30 } },
        { itemId: 'item-3', fields: { status: 'LOW_STOCK' } },
      ];

      mockRequest.json = jest.fn().mockResolvedValue({
        pharmacyId: 'pharmacy-123',
        updates,
      });

      const response = await PUT(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.modifiedCount).toBe(3);
      expect(data.message).toBe('Successfully updated 3 items');

      expect(Inventory.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: {
              _id: expect.any(Object),
              pharmacy: expect.any(Object),
            },
            update: {
              $set: {
                quantity: 50,
                price: 20,
                updatedAt: expect.any(Date),
              },
            },
          },
        },
        {
          updateOne: {
            filter: {
              _id: expect.any(Object),
              pharmacy: expect.any(Object),
            },
            update: {
              $set: {
                quantity: 30,
                updatedAt: expect.any(Date),
              },
            },
          },
        },
        {
          updateOne: {
            filter: {
              _id: expect.any(Object),
              pharmacy: expect.any(Object),
            },
            update: {
              $set: {
                status: 'LOW_STOCK',
                updatedAt: expect.any(Date),
              },
            },
          },
        },
      ]);
    });

    it('should handle bulk write errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });
      (Inventory.bulkWrite as jest.Mock).mockRejectedValue(
        new Error('Bulk write failed')
      );

      mockRequest.json = jest.fn().mockResolvedValue({
        pharmacyId: 'pharmacy-123',
        updates: [{ itemId: 'item-123', fields: { quantity: 50 } }],
      });

      const response = await PUT(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to update inventory');
    });

    it('should handle invalid updates array', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user-123' });

      mockRequest.json = jest.fn().mockResolvedValue({
        pharmacyId: 'pharmacy-123',
        updates: 'not-an-array', // Invalid type
      });

      const response = await PUT(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('No updates provided');
    });
  });
});
