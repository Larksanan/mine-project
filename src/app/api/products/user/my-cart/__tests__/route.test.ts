import { POST, GET } from '../route';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { Types } from 'mongoose';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Product');

describe('Cart Validation API', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock NextRequest
    mockRequest = {
      json: jest.fn(),
      url: 'http://localhost:3000/api/products/user/my-cart',
    } as unknown as NextRequest;

    // Mock connectDB
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /api/products/user/my-cart', () => {
    beforeEach(() => {
      (mockRequest.json as jest.Mock).mockResolvedValue({ items: [] });
    });

    it('should return 400 if items are missing', async () => {
      // Arrange
      (mockRequest.json as jest.Mock).mockResolvedValue({});

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message: 'Cart items are required',
      });
    });

    it('should return 400 if items is not an array', async () => {
      // Arrange
      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: 'not-an-array',
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message: 'Cart items are required',
      });
    });

    it('should return 400 if items array is empty', async () => {
      // Arrange
      (mockRequest.json as jest.Mock).mockResolvedValue({ items: [] });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message: 'Cart items are required',
      });
    });

    it('should return 400 for invalid item format - missing _id', async () => {
      // Arrange
      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: [{ quantity: 2 }], // Missing _id
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message:
          'Invalid cart item format. Each item must have _id and quantity',
      });
    });

    it('should return 400 for invalid item format - missing quantity', async () => {
      // Arrange
      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: [{ _id: 'product-123' }], // Missing quantity
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message:
          'Invalid cart item format. Each item must have _id and quantity',
      });
    });

    it('should return 400 for invalid item format - invalid quantity type', async () => {
      // Arrange
      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: [{ _id: 'product-123', quantity: 'two' }], // Invalid quantity type
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message:
          'Invalid cart item format. Each item must have _id and quantity',
      });
    });

    it('should return 400 for invalid item format - quantity <= 0', async () => {
      // Arrange
      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: [{ _id: 'product-123', quantity: 0 }], // Invalid quantity
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message:
          'Invalid cart item format. Each item must have _id and quantity',
      });
    });

    it('should successfully validate cart with all valid items', async () => {
      // Arrange
      const mockCartItems = [
        { _id: '507f1f77bcf86cd799439011', quantity: 2 },
        { _id: '507f1f77bcf86cd799439012', quantity: 1 },
      ];

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
          name: 'Product 1',
          description: 'Description 1',
          price: 19.99,
          category: 'Category 1',
          image: 'image1.jpg',
          images: ['image1-1.jpg', 'image1-2.jpg'],
          inStock: true,
          stockQuantity: 10,
          manufacturer: 'Manufacturer 1',
          requiresPrescription: false,
          sku: 'SKU001',
          isLowStock: false,
          pharmacy: null,
        },
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
          name: 'Product 2',
          description: 'Description 2',
          price: 29.99,
          category: 'Category 2',
          image: 'image2.jpg',
          images: [],
          inStock: true,
          stockQuantity: 5,
          manufacturer: 'Manufacturer 2',
          requiresPrescription: true,
          sku: 'SKU002',
          isLowStock: true,
          pharmacy: null,
        },
      ];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      // Mock Product.find with populate
      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cart validated successfully');
      expect(data.data.items).toHaveLength(2);
      expect(data.data.summary.totalItems).toBe(2);
      expect(data.data.summary.totalPrice).toBeCloseTo(19.99 * 2 + 29.99);
      expect(data.data.validation.valid).toBe(true);
      expect(data.data.validation.unavailableItems).toEqual([]);
      expect(data.data.validation.outOfStockItems).toEqual([]);
      expect(data.data.validation.insufficientStockItems).toEqual([]);

      // Verify the find query
      expect(Product.find).toHaveBeenCalledWith({
        _id: {
          $in: [
            new Types.ObjectId('507f1f77bcf86cd799439011'),
            new Types.ObjectId('507f1f77bcf86cd799439012'),
          ],
        },
      });
      expect(mockPopulate).toHaveBeenCalledWith(
        'pharmacy',
        'name address contact phone email'
      );
    });

    it('should handle unavailable products', async () => {
      // Arrange
      const mockCartItems = [
        { _id: '507f1f77bcf86cd799439011', quantity: 2 }, // Available
        { _id: '507f1f77bcf86cd799439013', quantity: 1 }, // Not found in DB
      ];

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
          isLowStock: false,
          pharmacy: null,
        },
      ];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Some items in your cart have issues');
      expect(data.data.items).toHaveLength(1); // Only valid item
      expect(data.data.validation.valid).toBe(false);
      expect(data.data.validation.unavailableItems).toEqual([
        '507f1f77bcf86cd799439013',
      ]);
      expect(data.data.summary.hasUnavailableItems).toBe(true);
    });

    it('should handle out of stock products', async () => {
      // Arrange
      const mockCartItems = [
        { _id: '507f1f77bcf86cd799439011', quantity: 2 }, // In stock
        { _id: '507f1f77bcf86cd799439012', quantity: 1 }, // Out of stock
      ];

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
          isLowStock: false,
          pharmacy: null,
        },
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
          name: 'Out of Stock Product',
          description: 'Description 2',
          price: 29.99,
          category: 'Category 2',
          image: 'image2.jpg',
          inStock: false, // Out of stock
          stockQuantity: 0,
          manufacturer: 'Manufacturer 2',
          requiresPrescription: true,
          sku: 'SKU002',
          isLowStock: true,
          pharmacy: null,
        },
      ];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.validation.valid).toBe(false);
      expect(data.data.validation.outOfStockItems).toEqual([
        'Out of Stock Product',
      ]);
      expect(data.data.summary.hasOutOfStockItems).toBe(true);
    });

    it('should handle insufficient stock', async () => {
      // Arrange
      const mockCartItems = [
        { _id: '507f1f77bcf86cd799439011', quantity: 2 }, // Valid
        { _id: '507f1f77bcf86cd799439012', quantity: 6 }, // Only 5 in stock
      ];

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
          isLowStock: false,
          pharmacy: null,
        },
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
          name: 'Low Stock Product',
          description: 'Description 2',
          price: 29.99,
          category: 'Category 2',
          image: 'image2.jpg',
          inStock: true,
          stockQuantity: 5, // Only 5 available
          manufacturer: 'Manufacturer 2',
          requiresPrescription: true,
          sku: 'SKU002',
          isLowStock: true,
          pharmacy: null,
        },
      ];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.validation.valid).toBe(false);
      expect(data.data.validation.insufficientStockItems).toEqual([
        {
          productId: '507f1f77bcf86cd799439012',
          name: 'Low Stock Product',
          requested: 6,
          available: 5,
        },
      ]);
      expect(data.data.summary.hasInsufficientStock).toBe(true);
    });

    it('should handle populated pharmacy data', async () => {
      // Arrange
      const mockCartItems = [{ _id: '507f1f77bcf86cd799439011', quantity: 2 }];

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
          isLowStock: false,
          pharmacy: {
            _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
            name: 'Main Pharmacy',
            address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA',
            },
            contact: 'John Doe',
            phone: '555-1234',
            email: 'pharmacy@example.com',
          },
        },
      ];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.items[0].pharmacy).toEqual({
        id: '507f1f77bcf86cd799439021',
        name: 'Main Pharmacy',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        contact: 'John Doe',
        phone: '555-1234',
        email: 'pharmacy@example.com',
      });
    });

    it('should handle unpopulated pharmacy (ObjectId only)', async () => {
      // Arrange
      const mockCartItems = [{ _id: '507f1f77bcf86cd799439011', quantity: 2 }];

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
          isLowStock: false,
          pharmacy: new Types.ObjectId('507f1f77bcf86cd799439021'), // Just ObjectId
        },
      ];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.items[0].pharmacy).toEqual({
        id: '507f1f77bcf86cd799439021',
        name: 'Unknown Pharmacy',
        address: 'Address not available',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockCartItems = [{ _id: '507f1f77bcf86cd799439011', quantity: 2 }];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      // Mock Product.find to throw error
      (Product.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Database query failed')),
        }),
      });

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        message: 'Failed to validate cart',
        error: 'Database query failed',
      });
    });

    it('should handle connection errors', async () => {
      // Arrange
      const mockCartItems = [{ _id: '507f1f77bcf86cd799439011', quantity: 2 }];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        message: 'Failed to validate cart',
        error: 'Connection failed',
      });
    });
  });

  describe('GET /api/products/user/my-cart', () => {
    beforeEach(() => {
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart',
      } as unknown as NextRequest;
    });

    it('should return 400 if ids parameter is missing', async () => {
      // Arrange
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart',
      } as unknown as NextRequest;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message: 'Product IDs are required',
      });
    });

    it('should return 400 if no valid product IDs provided', async () => {
      // Arrange
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart?ids=invalid,123',
      } as unknown as NextRequest;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        message: 'No valid product IDs provided',
      });
    });

    it('should successfully fetch cart items', async () => {
      // Arrange
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart?ids=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012',
      } as unknown as NextRequest;

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
          name: 'Product 1',
          description: 'Description 1',
          price: 19.99,
          category: 'Category 1',
          image: 'image1.jpg',
          images: ['image1-1.jpg', 'image1-2.jpg'],
          inStock: true,
          stockQuantity: 10,
          manufacturer: 'Manufacturer 1',
          requiresPrescription: false,
          sku: 'SKU001',
          isLowStock: false,
          pharmacy: null,
        },
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
          name: 'Product 2',
          description: 'Description 2',
          price: 29.99,
          category: 'Category 2',
          image: 'image2.jpg',
          images: [],
          inStock: true,
          stockQuantity: 5,
          manufacturer: 'Manufacturer 2',
          requiresPrescription: true,
          sku: 'SKU002',
          isLowStock: true,
          pharmacy: null,
        },
      ];

      // Mock Product.find with populate
      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cart items fetched successfully');
      expect(data.data).toHaveLength(2);

      // Verify the find query
      expect(Product.find).toHaveBeenCalledWith({
        _id: {
          $in: [
            new Types.ObjectId('507f1f77bcf86cd799439011'),
            new Types.ObjectId('507f1f77bcf86cd799439012'),
          ],
        },
      });
      expect(mockPopulate).toHaveBeenCalledWith(
        'pharmacy',
        'name address contact phone email'
      );
    });

    it('should handle empty result set', async () => {
      // Arrange
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart?ids=507f1f77bcf86cd799439011',
      } as unknown as NextRequest;

      const mockProducts: any[] = [];

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
    });

    it('should handle malformed IDs in query string', async () => {
      // Arrange
      // Mix of valid and invalid IDs
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart?ids=507f1f77bcf86cd799439011,invalid-id,507f1f77bcf86cd799439012,123',
      } as unknown as NextRequest;

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
          isLowStock: false,
          pharmacy: null,
        },
      ];

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1); // Only one valid product
      // Should only query for valid IDs
      expect(Product.find).toHaveBeenCalledWith({
        _id: {
          $in: [
            new Types.ObjectId('507f1f77bcf86cd799439011'),
            new Types.ObjectId('507f1f77bcf86cd799439012'),
          ],
        },
      });
    });

    it('should handle database errors in GET', async () => {
      // Arrange
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart?ids=507f1f77bcf86cd799439011',
      } as unknown as NextRequest;

      // Mock Product.find to throw error
      (Product.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Database query failed')),
        }),
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        message: 'Failed to fetch cart items',
        error: 'Database query failed',
      });
    });

    it('should handle connection errors in GET', async () => {
      // Arrange
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart?ids=507f1f77bcf86cd799439011',
      } as unknown as NextRequest;
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        message: 'Failed to fetch cart items',
        error: 'Connection failed',
      });
    });
  });

  describe('Edge Cases', () => {
    it('POST should handle very large cart with many items', async () => {
      // Arrange
      const mockCartItems = Array.from({ length: 100 }, (_, i) => ({
        _id: `507f1f77bcf86cd7994390${i.toString().padStart(2, '0')}`,
        quantity: i + 1,
      }));

      const mockProducts = mockCartItems.map((item, i) => ({
        _id: new Types.ObjectId(item._id),
        name: `Product ${i + 1}`,
        description: `Description ${i + 1}`,
        price: (i + 1) * 10,
        category: `Category ${(i % 5) + 1}`,
        image: `image${i + 1}.jpg`,
        inStock: true,
        stockQuantity: 100,
        manufacturer: `Manufacturer ${(i % 3) + 1}`,
        requiresPrescription: i % 4 === 0,
        sku: `SKU${(i + 1).toString().padStart(3, '0')}`,
        isLowStock: i % 10 === 0,
        pharmacy: null,
      }));

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.items).toHaveLength(100);
      expect(data.data.summary.totalItems).toBe(100);
      // Calculate total price: sum of (i+1) * 10 * (i+1) for i=0..99
      const expectedTotal = mockCartItems.reduce(
        (sum, item, i) => sum + (i + 1) * 10 * (i + 1),
        0
      );
      expect(data.data.summary.totalPrice).toBeCloseTo(expectedTotal);
    });

    it('POST should handle decimal prices correctly', async () => {
      // Arrange
      const mockCartItems = [{ _id: '507f1f77bcf86cd799439011', quantity: 3 }];

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
          name: 'Product with decimal price',
          description: 'Description',
          price: 19.99,
          category: 'Category',
          image: 'image.jpg',
          inStock: true,
          stockQuantity: 10,
          manufacturer: 'Manufacturer',
          requiresPrescription: false,
          sku: 'SKU001',
          isLowStock: false,
          pharmacy: null,
        },
      ];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.summary.totalPrice).toBeCloseTo(59.97); // 19.99 * 3
    });

    it('POST should handle products with only required fields', async () => {
      // Arrange
      const mockCartItems = [{ _id: '507f1f77bcf86cd799439011', quantity: 1 }];

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
          name: 'Minimal Product',
          description: 'Description',
          price: 9.99,
          category: 'Category',
          image: 'image.jpg',
          inStock: true,
          stockQuantity: 1,
          manufacturer: 'Manufacturer',
          requiresPrescription: false,
          sku: 'SKU001',
          isLowStock: false,
          // No pharmacy, no images array
        },
      ];

      (mockRequest.json as jest.Mock).mockResolvedValue({
        items: mockCartItems,
      });

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.items[0].images).toEqual([]); // Default empty array
      expect(data.data.items[0].pharmacy).toBeNull();
    });

    it('GET should handle URL encoded IDs', async () => {
      // Arrange
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/products/user/my-cart?ids=507f1f77bcf86cd799439011%2C507f1f77bcf86cd799439012',
      } as unknown as NextRequest;

      const mockProducts = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
          name: 'Product 1',
          description: 'Description',
          price: 19.99,
          category: 'Category',
          image: 'image.jpg',
          inStock: true,
          stockQuantity: 10,
          manufacturer: 'Manufacturer',
          requiresPrescription: false,
          sku: 'SKU001',
          isLowStock: false,
          pharmacy: null,
        },
      ];

      const mockLean = jest.fn().mockResolvedValue(mockProducts);
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFind = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });
      (Product.find as jest.Mock).mockImplementation(mockFind);

      // Act
      const response = await GET(mockRequest);
      const _data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(Product.find).toHaveBeenCalledWith({
        _id: {
          $in: [
            new Types.ObjectId('507f1f77bcf86cd799439011'),
            new Types.ObjectId('507f1f77bcf86cd799439012'),
          ],
        },
      });
    });

    it('should handle JSON parse errors', async () => {
      // Arrange
      (mockRequest.json as jest.Mock).mockRejectedValue(
        new Error('Invalid JSON')
      );

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid JSON');
    });
  });
});
