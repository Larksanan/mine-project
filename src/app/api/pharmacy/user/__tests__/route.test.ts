/**
 * @jest-environment node
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb');

// Mock Product model
jest.mock('@/models/Product', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    distinct: jest.fn(),
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

import { GET } from '../route';
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

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

// Mock console.error to avoid cluttering test output
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('Public Products API Routes', () => {
  const mockPharmacy = {
    _id: '507f1f77bcf86cd799439011',
    name: 'City Pharmacy',
    address: '123 Main St, New York, NY',
    contact: '555-1234',
  };

  const mockProductsRaw = [
    {
      _id: '507f1f77bcf86cd799439020',
      name: 'Aspirin 100mg',
      description: 'Pain relief medication',
      price: 9.99,
      category: 'Pain Relief',
      image: 'aspirin.jpg',
      inStock: true,
      stockQuantity: 100,
      manufacturer: 'PharmaCorp',
      requiresPrescription: false,
      sku: 'ASP-100',
      pharmacy: mockPharmacy,
      costPrice: 5.0,
      minStockLevel: 20,
      reservedQuantity: 10,
      createdBy: 'admin123',
      isControlledSubstance: false,
      sideEffects: ['Nausea'],
      dosage: '100mg daily',
      activeIngredients: ['Aspirin'],
      barcode: '1234567890',
      tags: ['pain', 'headache'],
      expiryDate: new Date('2025-12-31'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      toObject: function () {
        return { ...this };
      },
    },
    {
      _id: '507f1f77bcf86cd799439021',
      name: 'Ibuprofen 200mg',
      description: 'Anti-inflammatory medication',
      price: 12.99,
      category: 'Pain Relief',
      image: 'ibuprofen.jpg',
      inStock: true,
      stockQuantity: 50,
      manufacturer: 'MediCo',
      requiresPrescription: false,
      sku: 'IBU-200',
      pharmacy: mockPharmacy,
      costPrice: 7.0,
      minStockLevel: 15,
      reservedQuantity: 5,
      createdBy: 'admin123',
      isControlledSubstance: false,
      sideEffects: ['Stomach upset'],
      dosage: '200mg twice daily',
      activeIngredients: ['Ibuprofen'],
      barcode: '0987654321',
      tags: ['pain', 'inflammation'],
      expiryDate: new Date('2025-06-30'),
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-15'),
      toObject: function () {
        return { ...this };
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('GET /api/products/user', () => {
    it('should fetch products without authentication', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProductsRaw),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(2);
      (Product.distinct as jest.Mock).mockResolvedValue(['Pain Relief']);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback({ price: 9.99 })),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.products).toHaveLength(2);
    });

    it('should only fetch products that are in stock', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      await GET(req);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          inStock: true,
          stockQuantity: { $gt: 0 },
        })
      );
    });

    it('should serialize products and remove sensitive fields', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProductsRaw),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(2);
      (Product.distinct as jest.Mock).mockResolvedValue(['Pain Relief']);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback({ price: 9.99 })),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();

      const product = body.data.products[0];

      // Should include public fields
      expect(product.name).toBe('Aspirin 100mg');
      expect(product.price).toBe(9.99);
      expect(product.category).toBe('Pain Relief');

      // Should exclude sensitive fields
      expect(product.costPrice).toBeUndefined();
      expect(product.minStockLevel).toBeUndefined();
      expect(product.reservedQuantity).toBeUndefined();
      expect(product.createdBy).toBeUndefined();
      expect(product.isControlledSubstance).toBeUndefined();
      expect(product.sideEffects).toBeUndefined();
      expect(product.dosage).toBeUndefined();
      expect(product.activeIngredients).toBeUndefined();
      expect(product.barcode).toBeUndefined();
      expect(product.tags).toBeUndefined();
      expect(product.expiryDate).toBeUndefined();
    });

    it('should include isLowStock calculated field', async () => {
      const lowStockProduct = {
        ...mockProductsRaw[0],
        stockQuantity: 10,
        minStockLevel: 20,
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lowStockProduct]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.distinct as jest.Mock).mockResolvedValue(['Pain Relief']);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback({ price: 9.99 })),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.products[0].isLowStock).toBe(true);
    });

    it('should handle pagination with default values', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProductsRaw),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(2);
      (Product.distinct as jest.Mock).mockResolvedValue(['Pain Relief']);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback({ price: 9.99 })),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(12);
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(12);
    });

    it('should handle custom pagination parameters', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(50);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/products/user?page=3&limit=20'
      );
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.pagination.page).toBe(3);
      expect(body.data.pagination.limit).toBe(20);
      expect(body.data.pagination.pages).toBe(3);
      expect(mockFind.skip).toHaveBeenCalledWith(40);
    });

    it('should filter by search query', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/products/user?search=aspirin'
      );
      await GET(req);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'aspirin', $options: 'i' } },
            { description: { $regex: 'aspirin', $options: 'i' } },
            { manufacturer: { $regex: 'aspirin', $options: 'i' } },
            { category: { $regex: 'aspirin', $options: 'i' } },
            { tags: { $regex: 'aspirin', $options: 'i' } },
          ]),
        })
      );
    });

    it('should filter by category', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/products/user?category=Pain%20Relief'
      );
      await GET(req);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Pain Relief',
        })
      );
    });

    it('should not filter by category when set to "all"', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/products/user?category=all'
      );
      await GET(req);

      expect(Product.find).toHaveBeenCalledWith(
        expect.not.objectContaining({
          category: 'all',
        })
      );
    });

    it('should filter by pharmacy', async () => {
      const pharmacyId = '507f1f77bcf86cd799439011';
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        `http://localhost:3000/api/products/user?pharmacy=${pharmacyId}`
      );
      await GET(req);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          pharmacy: pharmacyId,
        })
      );
    });

    it('should filter by price range', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/products/user?minPrice=10&maxPrice=50'
      );
      await GET(req);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          price: { $gte: 10, $lte: 50 },
        })
      );
    });

    it('should filter by minimum price only', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/products/user?minPrice=15'
      );
      await GET(req);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          price: { $gte: 15 },
        })
      );
    });

    it('should sort by price ascending', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/products/user?sortBy=price&sortOrder=asc'
      );
      await GET(req);

      expect(mockFind.sort).toHaveBeenCalledWith({ price: 1 });
    });

    it('should sort by name descending', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest(
        'http://localhost:3000/api/products/user?sortBy=name&sortOrder=desc'
      );
      await GET(req);

      expect(mockFind.sort).toHaveBeenCalledWith({ name: -1 });
    });

    it('should use default sort (createdAt desc)', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      await GET(req);

      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should populate pharmacy information', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      await GET(req);

      expect(mockFind.populate).toHaveBeenCalledWith(
        'pharmacy',
        'name address contact'
      );
    });

    it('should include filter metadata (categories, manufacturers, price range)', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProductsRaw),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(2);
      (Product.distinct as jest.Mock)
        .mockResolvedValueOnce(['Pain Relief', 'Antibiotics'])
        .mockResolvedValueOnce(['PharmaCorp', 'MediCo']);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback({ price: 9.99 })),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.filters).toBeDefined();
      expect(body.data.filters.categories).toEqual([
        'Pain Relief',
        'Antibiotics',
      ]);
      expect(body.data.filters.manufacturers).toEqual(['PharmaCorp', 'MediCo']);
      expect(body.data.filters.priceRange).toBeDefined();
    });

    it('should serialize pharmacy information correctly', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProductsRaw),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(2);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback({ price: 9.99 })),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();

      const product = body.data.products[0];
      expect(product.pharmacy).toBeDefined();
      expect(product.pharmacy.id).toBe(mockPharmacy._id);
      expect(product.pharmacy.name).toBe(mockPharmacy.name);
      expect(product.pharmacy.address).toBe(mockPharmacy.address);
    });

    it('should handle products without pharmacy', async () => {
      const productWithoutPharmacy = {
        ...mockProductsRaw[0],
        pharmacy: null,
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([productWithoutPharmacy]),
      };

      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback({ price: 9.99 })),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();

      expect(body.data.products[0].pharmacy).toBeNull();
    });

    it('should handle database connection errors', async () => {
      const errorMessage = 'Database connection failed';
      (connectDB as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch products');
      expect(body.error).toBe(errorMessage);
    });

    it('should handle query errors', async () => {
      const errorMessage = 'Query failed';
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error(errorMessage)),
      };
      (Product.find as jest.Mock).mockReturnValue(mockFind);
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);
      (Product.distinct as jest.Mock).mockResolvedValue([]);

      const mockFindOne = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn(callback => callback(null)),
      };
      (Product.findOne as jest.Mock).mockReturnValue(mockFindOne);
      const req = new NextRequest('http://localhost:3000/api/products/user');
      const response = await GET(req);
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch products');
      expect(body.error).toBe(errorMessage);
    });
  });
});
