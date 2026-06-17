/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import Product from '@/models/Product';

const mockExec = jest.fn();
const mockLean = jest.fn();
const mockPopulate = jest.fn();

const mockChain = {
  lean: mockLean,
  populate: mockPopulate,
  exec: mockExec,
};

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      constructor(url: string, init?: any) {
        this.url = url;
        this.method = init?.method || 'GET';
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

jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    Types: {
      ObjectId: {
        isValid: jest.fn((id: string) => {
          return id !== 'invalid-id' && id.length >= 12;
        }),
      },
    },
  },
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/Product', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

describe('GET /api/products/[id]', () => {
  let connectDB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    connectDB = require('@/lib/mongodb').connectDB;
    connectDB.mockResolvedValue(undefined);

    mockLean.mockReturnValue(mockChain);
    mockPopulate.mockReturnValue(mockChain);
    mockExec.mockResolvedValue(null);

    (Product.findById as jest.Mock).mockReturnValue(mockChain);
  });

  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Paracetamol',
    description: 'Pain reliever and fever reducer',
    price: 5.99,
    category: 'Pain Relief',
    image: '/images/paracetamol.jpg',
    inStock: true,
    stockQuantity: 100,
    reservedQuantity: 10,
    minStockLevel: 20,
    manufacturer: 'Generic Pharma',
    requiresPrescription: false,
    sku: 'PARA-500',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockPharmacy = {
    _id: '507f1f77bcf86cd799439012',
    name: 'City Pharmacy',
    address: '123 Main St',
    contact: '0771234567',
  };

  it('should fetch product successfully', async () => {
    mockExec
      .mockResolvedValueOnce(mockProduct)
      .mockResolvedValueOnce({ ...mockProduct, pharmacy: mockPharmacy });

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Product fetched successfully');
    expect(data.data).toBeDefined();
    expect(data.data.id).toBe('507f1f77bcf86cd799439011');
    expect(data.data.name).toBe('Paracetamol');
    expect(data.data.price).toBe(5.99);
    expect(data.data.availableQuantity).toBe(90);
    expect(data.data.isLowStock).toBe(false);
  });

  it('should fetch product with pharmacy populated', async () => {
    const productWithPharmacy = { ...mockProduct, pharmacy: mockPharmacy };

    mockExec
      .mockResolvedValueOnce(mockProduct)
      .mockResolvedValueOnce(productWithPharmacy);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.pharmacy).toBeDefined();
    expect(data.data.pharmacy.name).toBe('City Pharmacy');
    expect(data.data.pharmacy.address).toBe('123 Main St');
    expect(data.data.pharmacy.contact).toBe('0771234567');
  });

  it('should return 400 for invalid product ID', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/products/invalid-id'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: 'invalid-id' }),
    });

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid product ID');
    expect(data.error).toBe(
      'The provided ID is not a valid MongoDB ObjectId format'
    );
    expect(Product.findById).not.toHaveBeenCalled();
  });

  it('should return 400 for empty product ID', async () => {
    const req = new NextRequest('http://localhost:3000/api/products/');

    const res = await GET(req, {
      params: Promise.resolve({ id: '' }),
    });

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid product ID');
  });

  it('should return 404 when product not found', async () => {
    mockExec.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Product not found');
    expect(data.error).toBe('No product found with the provided ID');
  });

  it('should handle products with low stock', async () => {
    const lowStockProduct = {
      ...mockProduct,
      stockQuantity: 15,
      reservedQuantity: 5,
      minStockLevel: 20,
    };

    mockExec
      .mockResolvedValueOnce(lowStockProduct)
      .mockResolvedValueOnce(lowStockProduct);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.availableQuantity).toBe(10);
    expect(data.data.isLowStock).toBe(true);
  });

  it('should handle products with no reserved quantity', async () => {
    const productNoReserved = {
      ...mockProduct,
      reservedQuantity: 0,
    };

    mockExec
      .mockResolvedValueOnce(productNoReserved)
      .mockResolvedValueOnce(productNoReserved);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.availableQuantity).toBe(100);
    expect(data.data.stockQuantity).toBe(100);
  });

  it('should handle products requiring prescription', async () => {
    const prescriptionProduct = {
      ...mockProduct,
      requiresPrescription: true,
    };

    mockExec
      .mockResolvedValueOnce(prescriptionProduct)
      .mockResolvedValueOnce(prescriptionProduct);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.requiresPrescription).toBe(true);
  });

  it('should handle products with missing optional fields', async () => {
    const minimalProduct = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Product',
      price: 10,
      inStock: true,
      stockQuantity: 50,
    };

    mockExec
      .mockResolvedValueOnce(minimalProduct)
      .mockResolvedValueOnce(minimalProduct);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.description).toBe('');
    expect(data.data.category).toBe('Uncategorized');
    expect(data.data.manufacturer).toBe('Unknown');
    expect(data.data.sku).toBe('N/A');
    expect(data.data.image).toBe('/placeholder-medicine.jpg');
  });

  it('should continue when pharmacy population fails', async () => {
    mockExec
      .mockResolvedValueOnce(mockProduct)
      .mockRejectedValueOnce(new Error('Population failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.pharmacy).toBeNull();
  });

  it('should handle database connection errors', async () => {
    connectDB.mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Failed to fetch product');
    expect(data.error).toBe('Database connection failed');
  });

  it('should handle product fetch errors', async () => {
    mockExec.mockRejectedValueOnce(new Error('Query failed'));

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Failed to fetch product');
  });

  it('should handle out of stock products', async () => {
    const outOfStockProduct = {
      ...mockProduct,
      inStock: false,
      stockQuantity: 0,
      reservedQuantity: 0,
    };

    mockExec
      .mockResolvedValueOnce(outOfStockProduct)
      .mockResolvedValueOnce(outOfStockProduct);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.inStock).toBe(false);
    expect(data.data.availableQuantity).toBe(0);
    expect(data.data.isLowStock).toBe(true);
  });

  it('should handle products with toObject method', async () => {
    const productWithToObject = {
      ...mockProduct,
      toObject: jest.fn().mockReturnValue(mockProduct),
    };

    mockExec
      .mockResolvedValueOnce(productWithToObject)
      .mockResolvedValueOnce(productWithToObject);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(productWithToObject.toObject).toHaveBeenCalled();
  });

  it('should handle null pharmacy reference', async () => {
    const productWithNullPharmacy = {
      ...mockProduct,
      pharmacy: null,
    };

    mockExec
      .mockResolvedValueOnce(productWithNullPharmacy)
      .mockResolvedValueOnce(productWithNullPharmacy);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.pharmacy).toBeNull();
  });

  it('should handle products with negative or invalid numbers', async () => {
    const invalidNumberProduct = {
      ...mockProduct,
      stockQuantity: 'invalid',
      price: null,
      reservedQuantity: undefined,
    };

    mockExec
      .mockResolvedValueOnce(invalidNumberProduct)
      .mockResolvedValueOnce(invalidNumberProduct);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.stockQuantity).toBe(0);
    expect(data.data.price).toBe(0);
    expect(data.data.reservedQuantity).toBe(0);
  });

  it('should include all required fields in response', async () => {
    mockExec
      .mockResolvedValueOnce(mockProduct)
      .mockResolvedValueOnce({ ...mockProduct, pharmacy: mockPharmacy });

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('_id');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('description');
    expect(data.data).toHaveProperty('price');
    expect(data.data).toHaveProperty('category');
    expect(data.data).toHaveProperty('image');
    expect(data.data).toHaveProperty('inStock');
    expect(data.data).toHaveProperty('stockQuantity');
    expect(data.data).toHaveProperty('manufacturer');
    expect(data.data).toHaveProperty('requiresPrescription');
    expect(data.data).toHaveProperty('sku');
    expect(data.data).toHaveProperty('pharmacy');
    expect(data.data).toHaveProperty('availableQuantity');
    expect(data.data).toHaveProperty('isLowStock');
    expect(data.data).toHaveProperty('createdAt');
    expect(data.data).toHaveProperty('updatedAt');
  });

  it('should handle error without message property', async () => {
    mockExec.mockRejectedValueOnce('String error');

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Failed to fetch product');
    expect(data.error).toBe('String error');
  });

  it('should handle edge case where stockQuantity equals reserved quantity', async () => {
    const fullyReservedProduct = {
      ...mockProduct,
      stockQuantity: 50,
      reservedQuantity: 50,
    };

    mockExec
      .mockResolvedValueOnce(fullyReservedProduct)
      .mockResolvedValueOnce(fullyReservedProduct);

    const req = new NextRequest(
      'http://localhost:3000/api/products/507f1f77bcf86cd799439011'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.availableQuantity).toBe(0);
    expect(data.data.isLowStock).toBe(true);
  });
});
