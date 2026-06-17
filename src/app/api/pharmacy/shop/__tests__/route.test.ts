/**
 * @jest-environment node
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb');

// Mock Shop model
jest.mock('@/models/shop', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
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

import { GET, POST } from '../route';
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

// Mock console methods to avoid cluttering test output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('Shop API Routes', () => {
  const mockShops = [
    {
      _id: '507f1f77bcf86cd799439011',
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
    },
    {
      _id: '507f1f77bcf86cd799439012',
      name: 'Downtown Pharmacy',
      address: '456 Oak Ave',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      phone: '555-5678',
      email: 'downtown@pharmacy.com',
      operatingHours: {
        Monday: '8:00 AM - 8:00 PM',
        Tuesday: '8:00 AM - 8:00 PM',
        Wednesday: '8:00 AM - 8:00 PM',
        Thursday: '8:00 AM - 8:00 PM',
        Friday: '8:00 AM - 8:00 PM',
        Saturday: '9:00 AM - 5:00 PM',
        Sunday: '10:00 AM - 2:00 PM',
      },
      services: ['Prescription Filling', 'Consultation', 'Home Delivery'],
      status: 'ACTIVE',
    },
  ];

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

  describe('GET /api/shop', () => {
    it('should fetch all shops successfully', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockResolvedValue(mockShops);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.count).toBe(2);
      expect(body.data).toEqual(mockShops);
      expect(shopModel.find).toHaveBeenCalledWith({});
    });

    it('should log database connection state', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockResolvedValue(mockShops);

      await GET();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        ' Database connection state:',
        1
      );
    });

    it('should log number of shops found', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockResolvedValue(mockShops);

      await GET();

      expect(consoleLogSpy).toHaveBeenCalledWith('Found 2 shops');
    });

    it('should return empty array when no shops exist', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockResolvedValue([]);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.count).toBe(0);
      expect(body.data).toEqual([]);
    });

    it('should handle database connection errors', async () => {
      const errorMessage = 'Database connection failed';
      (connectDB as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch shops');
      expect(body.error).toBe(errorMessage);
    });

    it('should handle shopModel.find errors', async () => {
      const errorMessage = 'Query failed';
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to fetch shops');
      expect(body.error).toBe(errorMessage);
    });

    it('should log error when fetching fails', async () => {
      const error = new Error('Query failed');
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockRejectedValue(error);

      await GET();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching shops:',
        error
      );
    });

    it('should handle non-Error exceptions', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockRejectedValue('String error');

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unknown error');
    });

    it('should return correct response structure', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockResolvedValue(mockShops);

      const response = await GET();
      const body = await response.json();

      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('count');
      expect(body).toHaveProperty('data');
      expect(typeof body.success).toBe('boolean');
      expect(typeof body.count).toBe('number');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should handle large number of shops', async () => {
      const largeShopArray = Array(100)
        .fill(null)
        .map((_, index) => ({
          ...mockShops[0],
          _id: `507f1f77bcf86cd799${index}`,
          name: `Shop ${index}`,
        }));

      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockResolvedValue(largeShopArray);

      const response = await GET();
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.count).toBe(100);
      expect(body.data).toHaveLength(100);
    });

    it('should connect to database before querying', async () => {
      (connectDB as jest.Mock).mockResolvedValue(mockDbConnection);
      (shopModel.find as jest.Mock).mockResolvedValue(mockShops);

      await GET();

      expect(connectDB).toHaveBeenCalled();
      expect(shopModel.find).toHaveBeenCalled();

      // Verify connectDB was called before shopModel.find
      const connectDBOrder = (connectDB as jest.Mock).mock
        .invocationCallOrder[0];
      const findOrder = (shopModel.find as jest.Mock).mock
        .invocationCallOrder[0];
      expect(connectDBOrder).toBeLessThan(findOrder);
    });
  });

  describe('POST /api/shop', () => {
    const validShopData = {
      name: 'New Pharmacy',
      address: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      phone: '555-9999',
      email: 'new@pharmacy.com',
      operatingHours: {
        Monday: '9:00 AM - 5:00 PM',
        Tuesday: '9:00 AM - 5:00 PM',
        Wednesday: '9:00 AM - 5:00 PM',
        Thursday: '9:00 AM - 5:00 PM',
        Friday: '9:00 AM - 5:00 PM',
        Saturday: 'Closed',
        Sunday: 'Closed',
      },
      services: ['Prescription Filling'],
      status: 'ACTIVE',
    };

    const createdShop = {
      _id: '507f1f77bcf86cd799439013',
      ...validShopData,
    };

    it('should create a new shop successfully', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockResolvedValue(createdShop);

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(createdShop);
      expect(shopModel.create).toHaveBeenCalledWith(validShopData);
    });

    it('should log shop creation data', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockResolvedValue(createdShop);

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      await POST(req);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Creating new shop:',
        validShopData
      );
    });

    it('should handle database connection errors', async () => {
      const errorMessage = 'Database connection failed';
      (connectDB as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to create shop');
      expect(body.error).toBe(errorMessage);
    });

    it('should handle shopModel.create errors', async () => {
      const errorMessage = 'Validation failed';
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to create shop');
      expect(body.error).toBe(errorMessage);
    });

    it('should log error when creation fails', async () => {
      const error = new Error('Creation failed');
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockRejectedValue(error);

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      await POST(req);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating shop:',
        error
      );
    });

    it('should handle invalid JSON in request body', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Failed to create shop');
    });

    it('should handle non-Error exceptions', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockRejectedValue('String error');

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unknown error');
    });

    it('should handle empty request body', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockRejectedValue(
        new Error('Missing required fields')
      );

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('should handle partial shop data', async () => {
      const partialData = {
        name: 'Partial Shop',
        address: '123 Test St',
      };

      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        ...partialData,
      });

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(partialData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(shopModel.create).toHaveBeenCalledWith(partialData);
    });

    it('should return correct response structure', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockResolvedValue(createdShop);

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(typeof body.success).toBe('boolean');
      expect(typeof body.data).toBe('object');
    });

    it('should connect to database before creating shop', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockResolvedValue(createdShop);

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      await POST(req);

      expect(connectDB).toHaveBeenCalled();
      expect(shopModel.create).toHaveBeenCalled();

      // Verify connectDB was called before shopModel.create
      const connectDBOrder = (connectDB as jest.Mock).mock
        .invocationCallOrder[0];
      const createOrder = (shopModel.create as jest.Mock).mock
        .invocationCallOrder[0];
      expect(connectDBOrder).toBeLessThan(createOrder);
    });

    it('should handle duplicate shop names', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockRejectedValue(
        new Error('Duplicate key error')
      );

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Duplicate key error');
    });

    it('should preserve all shop properties in response', async () => {
      (connectDB as jest.Mock).mockResolvedValue(undefined);
      (shopModel.create as jest.Mock).mockResolvedValue(createdShop);

      const req = new Request('http://localhost:3000/api/shop', {
        method: 'POST',
        body: JSON.stringify(validShopData),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(body.data.name).toBe(validShopData.name);
      expect(body.data.address).toBe(validShopData.address);
      expect(body.data.city).toBe(validShopData.city);
      expect(body.data.phone).toBe(validShopData.phone);
      expect(body.data.email).toBe(validShopData.email);
    });
  });
});
