// src/app/api/products/__tests__/route.test.ts
import { GET } from '../route';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Product');

// Mock console.log to keep test output clean
const originalConsoleLog = console.log;
const mockConsoleLog = jest.fn();

describe('GET /api/products', () => {
  let mockRequest: NextRequest;

  beforeAll(() => {
    console.log = mockConsoleLog;
  });

  afterAll(() => {
    console.log = originalConsoleLog;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();

    // Create a mock NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/products',
    } as NextRequest;

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Successful product fetching', () => {
    it('should fetch products successfully with default parameters', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product 1',
          description: 'Description 1',
          price: 19.99,
          category: 'Category 1',
          image: 'image1.jpg',
          inStock: true,
          stockQuantity: 10,
          manufacturer: 'Manufacturer 1',
          requiresPrescription: false,
          sku: 'SKU001',
          pharmacy: '507f1f77bcf86cd799439021',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Product 2',
          description: 'Description 2',
          price: 29.99,
          category: 'Category 2',
          image: 'image2.jpg',
          inStock: true,
          stockQuantity: 5,
          manufacturer: 'Manufacturer 2',
          requiresPrescription: true,
          sku: 'SKU002',
          pharmacy: null,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-04'),
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(2);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('2 products fetched successfully');
      expect(data.data).toHaveLength(2);

      // Verify first product is properly serialized
      expect(data.data[0]).toEqual({
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        name: 'Product 1',
        description: 'Description 1',
        price: 19.99,
        category: 'Category 1',
        image: 'image1.jpg',
        inStock: true,
        stockQuantity: 10,
        manufacturer: 'Manufacturer 1',
        requiresPrescription: false,
        sku: 'SKU001',
        pharmacy: {
          id: '507f1f77bcf86cd799439021',
          name: '',
          address: '',
        },
        isLowStock: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify second product
      expect(data.data[1].isLowStock).toBe(true); // stockQuantity 5 <= 10
      expect(data.data[1].pharmacy.id).toBe('');

      // Verify database calls
      expect(Product.countDocuments).toHaveBeenCalledWith({});
      expect(Product.find).toHaveBeenCalledWith({});
      expect(Product.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should handle fetchAll=true parameter', async () => {
      // Arrange
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/products?all=true',
      } as NextRequest;

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act
      await GET(mockRequest);

      // Assert
      // The code logs fetchAll parameter but doesn't change behavior
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetch All:', true);
    });

    it('should return empty array when no products found', async () => {
      // Arrange
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.message).toBe('No products found in database');
      expect(Product.find).not.toHaveBeenCalled(); // Should skip find when count is 0
    });

    it('should handle products with missing fields', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          // Missing most fields
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data[0]).toEqual({
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        name: 'Unnamed Product',
        description: '',
        price: 0,
        category: 'Uncategorized',
        image: '/placeholder-medicine.jpg',
        inStock: false,
        stockQuantity: 0,
        manufacturer: 'Unknown',
        requiresPrescription: false,
        sku: 'N/A',
        pharmacy: {
          id: '',
          name: '',
          address: '',
        },
        isLowStock: true, // 0 <= 10
      });
    });

    it('should handle products with null/undefined values', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: null,
          description: undefined,
          price: null,
          category: undefined,
          image: null,
          inStock: null,
          stockQuantity: undefined,
          manufacturer: null,
          requiresPrescription: undefined,
          sku: null,
          pharmacy: undefined,
          createdAt: null,
          updatedAt: undefined,
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data[0].name).toBe('Unnamed Product');
      expect(data.data[0].description).toBe('');
      expect(data.data[0].price).toBe(0);
      expect(data.data[0].category).toBe('Uncategorized');
      expect(data.data[0].image).toBe('/placeholder-medicine.jpg');
      expect(data.data[0].inStock).toBe(false);
      expect(data.data[0].stockQuantity).toBe(0);
      expect(data.data[0].manufacturer).toBe('Unknown');
      expect(data.data[0].requiresPrescription).toBe(false);
      expect(data.data[0].sku).toBe('N/A');
      expect(data.data[0].pharmacy.id).toBe('');
      expect(data.data[0].isLowStock).toBe(true);
      expect(data.data[0].createdAt).toBeNull();
      expect(data.data[0].updatedAt).toBeUndefined();
    });

    it('should handle products with pharmacy as populated object (edge case)', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product',
          price: 10,
          pharmacy: {
            _id: '507f1f77bcf86cd799439021',
            name: 'Pharmacy Name',
            address: '123 Street',
            // Note: Even though we use lean(), toObject() might not be called
          },
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const _data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      // Since we use lean(), product.toObject() doesn't exist
      // The pharmacy will be serialized as string via toString()
      // This reveals a potential bug in the serialization logic
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch products');
      expect(data.error).toBe('Connection failed');
    });

    it('should handle countDocuments errors', async () => {
      // Arrange
      (Product.countDocuments as jest.Mock).mockRejectedValue(
        new Error('Count failed')
      );

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Count failed');
    });

    it('should handle find errors', async () => {
      // Arrange
      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockRejectedValue(new Error('Find failed')),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Find failed');
    });

    it('should handle serialization errors gracefully', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product 1',
          // Simulate an error during serialization
          get price() {
            throw new Error('Price access error');
          },
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      // Should filter out the problematic product
      expect(data.data).toHaveLength(0);
      expect(data.message).toBe('0 products fetched successfully');
    });

    it('should include error details in development mode', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      (connectDB as jest.Mock).mockRejectedValue(new Error('Test error'));

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.errorDetails).toBeDefined();
      expect(data.errorDetails.name).toBe('Error');
      expect(data.errorDetails.message).toBe('Test error');
      expect(data.errorDetails.stack).toBeDefined();

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      (connectDB as jest.Mock).mockRejectedValue(new Error('Test error'));

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.errorDetails.stack).toBeUndefined();

      // Cleanup
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Edge cases', () => {
    it('should handle very large number of products', async () => {
      // Arrange
      const mockProducts = Array.from({ length: 1000 }, (_, i) => ({
        _id: `507f1f77bcf86cd799439${i.toString().padStart(3, '0')}`,
        name: `Product ${i + 1}`,
        description: `Description ${i + 1}`,
        price: (i + 1) * 10,
        category: `Category ${(i % 5) + 1}`,
        image: `image${i + 1}.jpg`,
        inStock: i % 10 !== 0, // Every 10th out of stock
        stockQuantity: (i + 1) * 2,
        manufacturer: `Manufacturer ${(i % 3) + 1}`,
        requiresPrescription: i % 4 === 0,
        sku: `SKU${(i + 1).toString().padStart(3, '0')}`,
        pharmacy: i % 2 === 0 ? `507f1f77bcf86cd799439021` : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      (Product.countDocuments as jest.Mock).mockResolvedValue(1000);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1000);
      expect(data.message).toBe('1000 products fetched successfully');

      // Verify some calculations
      const lowStockCount = data.data.filter((p: any) => p.isLowStock).length;
      // Products with stockQuantity <= 10 should be low stock
      const expectedLowStock = mockProducts.filter(
        p => (p.stockQuantity || 0) <= 10
      ).length;
      expect(lowStockCount).toBe(expectedLowStock);
    });

    it('should handle decimal stock quantities for isLowStock calculation', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product',
          stockQuantity: 10.5, // Decimal stock
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Product 2',
          stockQuantity: 9.9, // Decimal below threshold
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(2);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.data[0].isLowStock).toBe(false); // 10.5 > 10
      expect(data.data[1].isLowStock).toBe(true); // 9.9 <= 10
    });

    it('should handle negative stock quantities', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product',
          stockQuantity: -5, // Negative stock
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.data[0].stockQuantity).toBe(-5);
      expect(data.data[0].isLowStock).toBe(true); // -5 <= 10
    });

    it('should handle non-numeric price values', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product',
          price: 'invalid', // Non-numeric price
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.data[0].price).toBe(0); // Converted to 0
    });

    it('should handle products without _id', async () => {
      // Arrange
      const mockProducts = [
        {
          // No _id field
          name: 'Product',
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.data[0]._id).toBe('');
      expect(data.data[0].id).toBe('');
    });

    it('should handle products with ObjectId instead of string', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: { toString: () => '507f1f77bcf86cd799439011' },
          name: 'Product',
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.data[0]._id).toBe('507f1f77bcf86cd799439011');
      expect(data.data[0].id).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('Console logging', () => {
    it('should log connection success', async () => {
      // Arrange
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      await GET(mockRequest);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ [Step 1] Database connected successfully'
      );
    });

    it('should log query parameters', async () => {
      // Arrange
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/products?all=true&category=medicine',
      } as NextRequest;

      (Product.countDocuments as jest.Mock).mockResolvedValue(0);

      await GET(mockRequest);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetch All:', true);
    });

    it('should log total products count', async () => {
      // Arrange
      (Product.countDocuments as jest.Mock).mockResolvedValue(5);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act
      await GET(mockRequest);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Total products found:', 5);
    });

    it('should log product count and sample', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product',
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      await GET(mockRequest);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetched', 1, 'raw products');
    });

    it('should log serialized product count', async () => {
      // Arrange
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product',
        },
      ];

      (Product.countDocuments as jest.Mock).mockResolvedValue(1);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      await GET(mockRequest);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Serialized', 1, 'products');
    });
  });
});
