/**
 * @jest-environment node
 */

// Mock dependencies BEFORE imports
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/lib/auth');

// Mock Order model
jest.mock('@/models/order', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
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

import { PUT } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order';

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

describe('Delivery [id] API Routes', () => {
  const mockSession = {
    user: {
      email: 'user@example.com',
      name: 'Test User',
    },
  };

  const validDeliveryId = '507f1f77bcf86cd799439020';
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for cleaner test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Suppress console.log as well
    jest.spyOn(console, 'log').mockImplementation(() => {});
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore console methods after each test
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('PUT /api/deliveries/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unauthorized');
    });

    it('should update delivery status from "on_way" to order status "out_for_delivery"', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(validDeliveryId, {
        status: 'out_for_delivery',
      });
    });

    it('should update delivery status from "delivered" to order status "delivered"', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'delivered' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(validDeliveryId, {
        status: 'delivered',
      });
    });

    it('should not update order for intermediate status "assigned"', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'assigned' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should not update order for intermediate status "picked_up"', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'picked_up' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should not update order for status "pending"', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'pending' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle missing status in request body', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({}),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle empty status string', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: '' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle null status', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: null }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle unknown status values', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'unknown_status' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to update delivery');
      expect(body.details).toBe('Database error');
    });

    it('should handle Order.findByIdAndUpdate errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Order.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to update delivery');
      expect(body.details).toBe('Update failed');
    });

    it('should handle invalid JSON in request body', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: 'invalid json',
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to update delivery');
    });

    it('should return success even if Order.findByIdAndUpdate returns null', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should handle case-sensitive status values correctly', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'ON_WAY' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should use correct delivery ID from params', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const customId = '507f1f77bcf86cd799439999';

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${customId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'delivered' }),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: customId }),
      });

      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(customId, {
        status: 'delivered',
      });
    });

    it('should handle non-Error exceptions', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Order.findByIdAndUpdate as jest.Mock).mockRejectedValue('String error');

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to update delivery');
      expect(body.details).toBe('Unknown error');
    });

    it('should connect to database before processing request', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });

      expect(connectDB).toHaveBeenCalled();
    });

    it('should check authentication after connecting to database', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });

      expect(connectDB).toHaveBeenCalled();
      expect(getServerSession).toHaveBeenCalled();
    });

    it('should only update order when status mapping exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // Test valid statuses
      const validStatuses = [
        { delivery: 'on_way', order: 'out_for_delivery' },
        { delivery: 'delivered', order: 'delivered' },
      ];

      for (const { delivery, order } of validStatuses) {
        jest.clearAllMocks();
        // Re-mock console.error for each iteration
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const req = new NextRequest(
          `http://localhost:3000/api/deliveries/${validDeliveryId}`,
          {
            method: 'PUT',
            body: JSON.stringify({ status: delivery }),
          }
        );

        await PUT(req, {
          params: Promise.resolve({ id: validDeliveryId }),
        });

        expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(validDeliveryId, {
          status: order,
        });
      }
    });

    it('should include error details in 500 response', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      const errorMessage = 'Specific database error';
      (Order.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const req = new NextRequest(
        `http://localhost:3000/api/deliveries/${validDeliveryId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'on_way' }),
        }
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: validDeliveryId }),
      });
      const body = await response.json();

      expect(body.details).toBe(errorMessage);
    });
  });
});
