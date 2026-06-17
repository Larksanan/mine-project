/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest } from 'next/server';
import { POST, GET, PATCH, DELETE } from '../route';

// Mock all dependencies
jest.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    method?: string;
    body?: any;
    headers: any;

    constructor(url: string, init?: { method?: string; body?: any }) {
      this.url = url;
      this.method = init?.method;
      this.body = init?.body;
      this.headers = { get: () => null };
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
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/order', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    generateOrderNumber: jest.fn(),
  },
}));

jest.mock('@/models/Product', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock mongoose Types
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: class {
      constructor(public id: string) {}
      toString() {
        return this.id;
      }
    },
  },
}));

describe('Orders API', () => {
  let Order: any;
  let Product: any;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  const originalConsoleError = console.error;
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    Order = require('@/models/order').default;
    Product = require('@/models/Product').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    connectDB.mockResolvedValue(undefined);

    // Mock fetch for Twilio
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  describe('POST /api/orders', () => {
    const mockSession = {
      user: { id: 'user123', role: 'USER' },
    };

    const validOrderData = {
      items: [
        { productId: 'prod123', quantity: 2 },
        { productId: 'prod456', quantity: 1 },
      ],
      shippingInfo: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      paymentMethod: 'cash',
      prescriptionImages: [],
      deliveryInstructions: 'Leave at door',
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
      Order.generateOrderNumber.mockResolvedValue('ORD-2024-001');
    });

    it('should create order successfully', async () => {
      const mockProduct1 = {
        _id: 'prod123',
        name: 'Product 1',
        price: 10.99,
        stockQuantity: 10,
        inStock: true,
        requiresPrescription: false,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockProduct2 = {
        _id: 'prod456',
        name: 'Product 2',
        price: 15.5,
        stockQuantity: 5,
        inStock: true,
        requiresPrescription: false,
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-2024-001',
        totalAmount: 42.47,
        status: 'pending',
        paymentMethod: 'cash',
        estimatedDelivery: new Date(),
        populate: jest.fn().mockResolvedValue({
          _id: 'order123',
          orderNumber: 'ORD-2024-001',
        }),
      };

      Order.create.mockResolvedValue(mockOrder);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Order created successfully');
      expect(data.order.orderNumber).toBe('ORD-2024-001');
      expect(Order.create).toHaveBeenCalled();
    });

    it('should return 400 when no items in order', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ ...validOrderData, items: [] }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No items in order');
    });

    it('should return 400 when shipping info is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ ...validOrderData, shippingInfo: null }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Shipping information is required');
    });

    it('should return 400 for invalid payment method', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ ...validOrderData, paymentMethod: 'crypto' }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid payment method');
    });

    it('should return 404 when product not found', async () => {
      Product.findById.mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should return 400 when insufficient stock', async () => {
      const outOfStockProduct = {
        _id: 'prod123',
        name: 'Product 1',
        stockQuantity: 1,
        inStock: true,
        save: jest.fn(),
      };

      Product.findById.mockResolvedValueOnce(outOfStockProduct);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Insufficient stock');
    });

    it('should return 400 when prescription items missing prescription images', async () => {
      const rxProduct = {
        _id: 'prod123',
        name: 'RX Product',
        price: 10.99,
        stockQuantity: 10,
        inStock: true,
        requiresPrescription: true,
        save: jest.fn(),
      };

      const regularProduct = {
        _id: 'prod456',
        name: 'Regular Product',
        price: 15.5,
        stockQuantity: 5,
        inStock: true,
        requiresPrescription: false,
        save: jest.fn(),
      };

      Product.findById
        .mockResolvedValueOnce(rxProduct)
        .mockResolvedValueOnce(regularProduct);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ ...validOrderData, prescriptionImages: [] }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Prescription images required for prescription items'
      );
    });

    it('should update product stock after order creation', async () => {
      // Create fresh mock instances for each product
      const mockProduct1 = {
        _id: 'prod123',
        name: 'Product 1',
        price: 10.99,
        stockQuantity: 10,
        inStock: true,
        requiresPrescription: false,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockProduct2 = {
        _id: 'prod456',
        name: 'Product 2',
        price: 15.5,
        stockQuantity: 5,
        inStock: true,
        requiresPrescription: false,
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock findById to return fresh instances
      Product.findById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-2024-001',
        populate: jest.fn().mockResolvedValue({}),
      };

      Order.create.mockResolvedValue(mockOrder);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderData),
      });

      await POST(req);

      expect(mockProduct1.save).toHaveBeenCalled();
      expect(mockProduct2.save).toHaveBeenCalled();
      expect(mockProduct1.stockQuantity).toBe(8); // 10 - 2
      expect(mockProduct2.stockQuantity).toBe(4); // 5 - 1
    });

    it('should handle guest orders (no session)', async () => {
      getServerSession.mockResolvedValue(null);

      const mockProduct1 = {
        _id: 'prod123',
        price: 10.99,
        stockQuantity: 10,
        inStock: true,
        requiresPrescription: false,
        save: jest.fn(),
      };

      const mockProduct2 = {
        _id: 'prod456',
        price: 15.5,
        stockQuantity: 5,
        inStock: true,
        requiresPrescription: false,
        save: jest.fn(),
      };

      Product.findById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-2024-001',
        populate: jest.fn().mockResolvedValue({}),
      };

      Order.create.mockResolvedValue(mockOrder);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderData),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/orders', () => {
    const mockSession = {
      user: { id: 'user123', role: 'USER' },
    };

    const mockOrders = [
      {
        _id: 'order1',
        orderNumber: 'ORD-001',
        customer: 'user123',
        items: [],
        totalAmount: 50,
        status: 'pending',
      },
      {
        _id: 'order2',
        orderNumber: 'ORD-002',
        customer: 'user123',
        items: [],
        totalAmount: 75,
        status: 'delivered',
      },
    ];

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should fetch single order by ID', async () => {
      const order = {
        ...mockOrders[0],
        customer: { toString: () => 'user123' },
      };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(order),
          }),
        }),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=order1'
      );

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order).toBeDefined();
    });

    it('should return 404 when order not found', async () => {
      Order.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=invalid'
      );

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Order not found');
    });

    it('should return 403 for unauthorized access', async () => {
      const order = {
        ...mockOrders[0],
        customer: { toString: () => 'otheruser' },
      };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(order),
          }),
        }),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=order1'
      );

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should fetch orders by email', async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/orders?email=test@example.com'
      );

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orders).toHaveLength(2);
    });

    it('should fetch orders by phone', async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/orders?phone=+1234567890'
      );

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orders).toHaveLength(2);
    });

    it('should filter orders by status', async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockOrders[0]]),
          }),
        }),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/orders?status=pending'
      );

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should fetch user orders for non-admin', async () => {
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/orders');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Order.find).toHaveBeenCalledWith(
        expect.objectContaining({ customer: expect.any(Object) })
      );
    });

    it('should fetch all orders for admin', async () => {
      getServerSession.mockResolvedValue({
        user: { id: 'admin123', role: 'ADMIN' },
      });

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockOrders),
              }),
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/orders');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('PATCH /api/orders', () => {
    const mockSession = {
      user: { id: 'admin123', role: 'ADMIN' },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should update order status successfully', async () => {
      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-001',
        status: 'pending',
        shippingInfo: { phone: '+1234567890' },
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({
          _id: 'order123',
          status: 'confirmed',
        }),
      };

      Order.findById.mockResolvedValue(mockOrder);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ orderId: 'order123', status: 'confirmed' }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Order updated successfully');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should return 400 when order ID is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'confirmed' }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Order ID is required');
    });

    it('should return 404 when order not found', async () => {
      Order.findById.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ orderId: 'invalid', status: 'confirmed' }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Order not found');
    });

    it('should return 400 for invalid status', async () => {
      const mockOrder = {
        _id: 'order123',
        status: 'pending',
        save: jest.fn(),
      };

      Order.findById.mockResolvedValue(mockOrder);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ orderId: 'order123', status: 'invalid_status' }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid status');
    });

    it('should update payment status successfully', async () => {
      const mockOrder = {
        _id: 'order123',
        paymentStatus: 'pending',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({ _id: 'order123' }),
      };

      Order.findById.mockResolvedValue(mockOrder);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ orderId: 'order123', paymentStatus: 'paid' }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockOrder.paymentStatus).toBe('paid');
    });

    it('should return 400 for invalid payment status', async () => {
      const mockOrder = {
        _id: 'order123',
        save: jest.fn(),
      };

      Order.findById.mockResolvedValue(mockOrder);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          orderId: 'order123',
          paymentStatus: 'invalid_payment',
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid payment status');
    });
  });

  describe('DELETE /api/orders', () => {
    const mockSession = {
      user: { id: 'user123', role: 'USER' },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should cancel order successfully', async () => {
      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-001',
        status: 'pending',
        customer: { toString: () => 'user123' },
        items: [
          { product: 'prod1', quantity: 2 },
          { product: 'prod2', quantity: 1 },
        ],
        shippingInfo: { phone: '+1234567890' },
        save: jest.fn().mockResolvedValue(true),
      };

      const mockProduct1 = {
        _id: 'prod1',
        stockQuantity: 5,
        inStock: true,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockProduct2 = {
        _id: 'prod2',
        stockQuantity: 3,
        inStock: false,
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findById.mockResolvedValue(mockOrder);
      Product.findById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=order123',
        { method: 'DELETE' }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Order cancelled successfully');
      expect(mockOrder.status).toBe('cancelled');
      expect(mockProduct1.stockQuantity).toBe(7); // 5 + 2
      expect(mockProduct2.stockQuantity).toBe(4); // 3 + 1
      expect(mockProduct2.inStock).toBe(true);
    });

    it('should return 400 when order ID is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Order ID is required');
    });

    it('should return 404 when order not found', async () => {
      Order.findById.mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=invalid',
        { method: 'DELETE' }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Order not found');
    });

    it('should return 403 for unauthorized cancellation', async () => {
      const mockOrder = {
        _id: 'order123',
        customer: { toString: () => 'otheruser' },
      };

      Order.findById.mockResolvedValue(mockOrder);

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=order123',
        { method: 'DELETE' }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when cancelling non-cancellable order', async () => {
      const mockOrder = {
        _id: 'order123',
        status: 'delivered',
        customer: { toString: () => 'user123' },
      };

      Order.findById.mockResolvedValue(mockOrder);

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=order123',
        { method: 'DELETE' }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Can only cancel pending or confirmed orders');
    });

    it('should allow guest order cancellation', async () => {
      getServerSession.mockResolvedValue(null);

      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-001',
        status: 'pending',
        customer: undefined,
        items: [],
        shippingInfo: { phone: '+1234567890' },
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findById.mockResolvedValue(mockOrder);

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=order123',
        { method: 'DELETE' }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors in POST', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items: [] }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle database errors in GET', async () => {
      connectDB.mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost:3000/api/orders');

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle errors in PATCH', async () => {
      Order.findById.mockRejectedValue(new Error('Update failed'));

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ orderId: 'order123', status: 'confirmed' }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle errors in DELETE', async () => {
      Order.findById.mockRejectedValue(new Error('Delete failed'));

      const req = new NextRequest(
        'http://localhost:3000/api/orders?orderId=order123',
        { method: 'DELETE' }
      );

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
