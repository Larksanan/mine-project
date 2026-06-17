/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';

// Define shared mocks for Product instance methods
const mockProductSave = jest.fn();
const mockProductPopulate = jest.fn();
const mockProductToObject = jest.fn();

// Define interface for Product mock
interface MockProduct {
  new (data: any): any;
  findOne: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findById: jest.Mock;
}

// Define interface for Pharmacy mock
interface MockPharmacy {
  new (): any;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
}

// Define interface for User mock
interface MockUser {
  new (): any;
  findOne: jest.Mock;
}

// Mock all dependencies
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      body?: any;

      constructor(url: string, init?: { method?: string; body?: any }) {
        this.url = url;
        this.method = init?.method;
        this.body = init?.body;
      }

      json() {
        return Promise.resolve(this.body ? JSON.parse(this.body) : {});
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
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

// Mock Product model
jest.mock('@/models/Product', () => {
  const MockProduct = function (this: any, data: any) {
    Object.assign(this, data);
    this.save = mockProductSave;
    this.populate = mockProductPopulate;
    this.toObject = mockProductToObject;
  } as any as { new (data: any): any };

  // Add static methods
  (MockProduct as any).findOne = jest.fn();
  (MockProduct as any).find = jest.fn();
  (MockProduct as any).countDocuments = jest.fn();
  (MockProduct as any).findByIdAndUpdate = jest.fn();
  (MockProduct as any).findById = jest.fn();

  return {
    __esModule: true,
    default: MockProduct as MockProduct,
  };
});

jest.mock('@/models/Pharmacy', () => {
  const MockPharmacy = function () {} as any as { new (): any };

  // Add static methods
  (MockPharmacy as any).findById = jest.fn();
  (MockPharmacy as any).findByIdAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: MockPharmacy as MockPharmacy,
  };
});

jest.mock('@/models/User', () => {
  const MockUser = function () {} as any as { new (): any };

  // Add static methods
  (MockUser as any).findOne = jest.fn();

  return {
    __esModule: true,
    default: MockUser as MockUser,
  };
});

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

describe('Products API', () => {
  let Product: MockProduct;
  let Pharmacy: MockPharmacy;
  let User: MockUser;
  let getServerSession: jest.Mock;
  let GET: any;
  let POST: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    Product = require('@/models/Product').default;
    Pharmacy = require('@/models/Pharmacy').default;
    User = require('@/models/User').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;

    const route = require('@/app/api/products/route');
    GET = route.GET;
    POST = route.POST;

    // Mock connectDB
    require('@/lib/mongodb').connectDB.mockResolvedValue(undefined);
  });

  describe('POST /api/products', () => {
    const mockProductData = {
      name: 'Test Product',
      description: 'Test Description',
      price: '19.99',
      category: 'Medication',
      image: 'test.jpg',
      stockQuantity: '100',
      pharmacy: 'pharmacy123',
      sku: 'TEST123',
      manufacturer: 'Test Manufacturer',
      barcode: '123456789',
      costPrice: '10.00',
      minStockLevel: '10',
      tags: ['test', 'medication'],
    };

    beforeEach(() => {
      // Default authenticated user setup
      getServerSession.mockResolvedValue({
        user: { email: 'admin@test.com' },
      });

      User.findOne.mockResolvedValue({
        _id: 'user123',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'ADMIN',
      });

      Pharmacy.findById.mockResolvedValue({
        _id: 'pharmacy123',
        name: 'Test Pharmacy',
        createdBy: 'user123',
        pharmacists: [],
        inventory: {
          totalProducts: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
        },
      });

      Product.findOne.mockResolvedValue(null);
    });

    it('should create a new product successfully', async () => {
      // Setup the mock find chain for GET method mock
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });

      // Create a fresh product instance
      const productInstance = new Product({
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 19.99,
        costPrice: 10.0,
        stockQuantity: 100,
        minStockLevel: 10,
        reservedQuantity: 0,
        inStock: true,
        isLowStock: false,
      });

      // Setup the instance methods
      productInstance.save.mockResolvedValue(productInstance);
      productInstance.populate.mockResolvedValue(productInstance);
      productInstance.toObject.mockReturnValue({
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 19.99,
        costPrice: 10.0,
        stockQuantity: 100,
        minStockLevel: 10,
        pharmacy: {
          _id: 'pharmacy123',
          name: 'Test Pharmacy',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'Testland',
          },
          contact: {
            phone: '555-1111',
            email: 'test@pharmacy.com',
          },
        },
        createdBy: {
          _id: 'user123',
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'ADMIN',
        },
        reservedQuantity: 0,
        inStock: true,
        isLowStock: false,
      });

      // Mock Promise.all calls for duplicate checks
      Product.findOne
        .mockResolvedValueOnce(null) // sku check
        .mockResolvedValueOnce(null) // name check
        .mockResolvedValueOnce(null); // barcode check

      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockProductData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Product created successfully');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockProductData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized access');
    });

    it('should return 403 when user is not admin or pharmacist', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user123',
        email: 'user@test.com',
        role: 'USER',
      });

      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockProductData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Insufficient permissions');
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        name: 'Test Product',
        // Missing other required fields
      };

      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required fields');
    });

    it('should return 404 when pharmacy not found', async () => {
      Pharmacy.findById.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockProductData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Pharmacy not found');
    });

    it('should return 409 when SKU already exists', async () => {
      Product.findOne.mockResolvedValue({
        _id: 'existingProduct',
        sku: 'TEST123',
      });

      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockProductData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('SKU already exists');
    });

    it('should handle validation errors - invalid price', async () => {
      const invalidData = {
        ...mockProductData,
        price: '-10', // Invalid price
      };

      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid price');
    });

    it('should handle database errors', async () => {
      // Create a product instance that will throw on save
      const productInstance = new Product({});
      productInstance.save.mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockProductData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to create product');
    });
  });

  describe('GET /api/products', () => {
    const mockProducts = [
      {
        _id: 'product1',
        name: 'Product 1',
        description: 'Description 1',
        price: 19.99,
        category: 'Medication',
        stockQuantity: 100,
        pharmacy: {
          _id: 'pharmacy1',
          name: 'Pharmacy 1',
          address: 'Address 1',
        },
        createdBy: {
          _id: 'user1',
          name: 'User 1',
          email: 'user1@test.com',
          role: 'ADMIN',
        },
        sku: 'SKU001',
        manufacturer: 'Manufacturer 1',
        barcode: '123456',
        inStock: true,
        reservedQuantity: 0,
        minStockLevel: 10,
      },
      {
        _id: 'product2',
        name: 'Product 2',
        description: 'Description 2',
        price: 29.99,
        category: 'Equipment',
        stockQuantity: 50,
        pharmacy: {
          _id: 'pharmacy2',
          name: 'Pharmacy 2',
          address: 'Address 2',
        },
        createdBy: {
          _id: 'user2',
          name: 'User 2',
          email: 'user2@test.com',
          role: 'PHARMACIST',
        },
        sku: 'SKU002',
        manufacturer: 'Manufacturer 2',
        barcode: '654321',
        inStock: true,
        reservedQuantity: 5,
        minStockLevel: 5,
      },
    ];

    beforeEach(() => {
      // Setup the chain for Product.find().populate().populate().sort().skip().limit().lean()
      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      Product.find.mockReturnValue({
        populate: mockPopulate1,
      });

      Product.countDocuments.mockResolvedValue(mockProducts.length);
    });

    it('should fetch products with pagination', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/products?page=1&limit=10'
      );
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.products).toHaveLength(2);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.total).toBe(2);
    });

    it('should handle empty product list', async () => {
      // Override the mock for this test
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      Product.find.mockReturnValueOnce({
        populate: mockPopulate1,
      });

      Product.countDocuments.mockResolvedValueOnce(0);

      const req = new NextRequest('http://localhost:3000/api/products');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.products).toHaveLength(0);
      expect(data.data.pagination.total).toBe(0);
    });

    it('should handle database errors when fetching products', async () => {
      // Override the mock for this test to throw an error
      const mockLean = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockLimit = jest.fn(() => ({ lean: mockLean }));
      const mockSkip = jest.fn(() => ({ limit: mockLimit }));
      const mockSort = jest.fn(() => ({ skip: mockSkip }));
      const mockPopulate2 = jest.fn(() => ({ sort: mockSort }));
      const mockPopulate1 = jest.fn(() => ({ populate: mockPopulate2 }));

      Product.find.mockReturnValueOnce({
        populate: mockPopulate1,
      });

      const req = new NextRequest('http://localhost:3000/api/products');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch products');
    });
  });
});
