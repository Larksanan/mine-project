/**
 * @jest-environment node
 */
import { GET } from '../route';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Product');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
      ...init,
    })),
  },
}));

describe('GET /api/allproduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return all products successfully', async () => {
    const mockProducts = [
      {
        toObject: () => ({
          _id: 'prod1',
          name: 'Paracetamol',
          price: 10,
          pharmacy: 'pharmacy1',
          createdBy: 'user1',
        }),
      },
      {
        toObject: () => ({
          _id: 'prod2',
          name: 'Ibuprofen',
          price: 15,
          // Testing optional fields handling
        }),
      },
    ];

    // Mock the chain: Product.find({}).sort({ createdAt: -1 })
    const mockSort = jest.fn().mockResolvedValue(mockProducts);
    (Product.find as jest.Mock).mockReturnValue({
      sort: mockSort,
    });

    await GET();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(Product.find).toHaveBeenCalledWith({});
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });

    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      data: [
        {
          _id: 'prod1',
          name: 'Paracetamol',
          price: 10,
          pharmacy: 'pharmacy1',
          createdBy: 'user1',
        },
        {
          _id: 'prod2',
          name: 'Ibuprofen',
          price: 15,
          pharmacy: undefined,
          createdBy: undefined,
        },
      ],
    });
  });

  it('should handle database connection errors', async () => {
    const mockError = new Error('Database connection failed');
    (connectDB as jest.Mock).mockRejectedValue(mockError);

    await GET();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'Failed to fetch products',
        error: 'Database connection failed',
      },
      { status: 500 }
    );
  });

  it('should handle errors during product fetching', async () => {
    (connectDB as jest.Mock).mockResolvedValue(undefined);
    const mockError = new Error('Find query failed');

    (Product.find as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    await GET();

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'Failed to fetch products',
        error: 'Find query failed',
      },
      { status: 500 }
    );
  });

  it('should handle unknown errors', async () => {
    (connectDB as jest.Mock).mockRejectedValue('Unknown string error');

    await GET();

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'Failed to fetch products',
        error: 'Unknown error',
      },
      { status: 500 }
    );
  });
});
