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
    find: jest.fn(),
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

import { GET } from '../route';
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

describe('Deliveries API Routes', () => {
  const mockSession = {
    user: {
      email: 'user@example.com',
      name: 'Test User',
    },
  };

  const mockCustomer = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    phone: '555-1234',
  };

  const mockProduct = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Aspirin 100mg',
    requiresPrescription: false,
  };

  const mockPrescriptionProduct = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Antibiotics',
    requiresPrescription: true,
  };

  const mockOrders = [
    {
      _id: '507f1f77bcf86cd799439020',
      orderNumber: 'ORD-001',
      status: 'ready',
      customer: mockCustomer,
      shippingInfo: {
        name: 'John Doe',
        phone: '555-1234',
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001',
      },
      items: [
        {
          product: mockProduct,
          quantity: 2,
        },
      ],
      estimatedDelivery: new Date('2024-12-31'),
      updatedAt: new Date('2024-12-25'),
    },
    {
      _id: '507f1f77bcf86cd799439021',
      orderNumber: 'ORD-002',
      status: 'out_for_delivery',
      customer: mockCustomer,
      shippingInfo: {
        name: 'Jane Smith',
        phone: '555-5678',
        address: '456 Oak Ave',
        city: 'Boston',
        postalCode: '02101',
      },
      items: [
        {
          product: mockPrescriptionProduct,
          quantity: 1,
        },
      ],
      estimatedDelivery: new Date('2024-12-30'),
      updatedAt: new Date('2024-12-26'),
    },
    {
      _id: '507f1f77bcf86cd799439022',
      orderNumber: 'ORD-003',
      status: 'delivered',
      customer: mockCustomer,
      shippingInfo: {
        name: 'Bob Johnson',
        phone: '555-9999',
        address: '789 Pine Rd',
        city: 'Chicago',
        postalCode: '60601',
      },
      items: [
        {
          product: mockProduct,
          quantity: 3,
        },
      ],
      estimatedDelivery: new Date('2024-12-28'),
      updatedAt: new Date('2024-12-27'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/deliveries', () => {
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unauthorized');
    });

    it('should fetch all deliveries for authenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockOrders),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.deliveries).toHaveLength(3);
      expect(Order.find).toHaveBeenCalledWith({
        status: { $in: ['ready', 'out_for_delivery', 'delivered'] },
      });
    });

    it('should populate product and customer information', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockOrders),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      await GET();

      expect(mockFind.populate).toHaveBeenCalledWith(
        'items.product',
        'name requiresPrescription'
      );
      expect(mockFind.populate).toHaveBeenCalledWith('customer', 'name phone');
    });

    it('should sort orders by updatedAt in descending order', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockOrders),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      await GET();

      expect(mockFind.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    });

    it('should map order status "ready" to delivery status "pending"', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const readyOrder = [mockOrders[0]];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(readyOrder),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].status).toBe('pending');
    });

    it('should map order status "out_for_delivery" to delivery status "on_way"', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const outForDeliveryOrder = [mockOrders[1]];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(outForDeliveryOrder),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].status).toBe('on_way');
    });

    it('should map order status "delivered" to delivery status "delivered"', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const deliveredOrder = [mockOrders[2]];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(deliveredOrder),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].status).toBe('delivered');
    });

    it('should format delivery data correctly', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockOrders[0]]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      const delivery = body.data.deliveries[0];

      expect(delivery).toHaveProperty('_id');
      expect(delivery).toHaveProperty('orderId');
      expect(delivery).toHaveProperty('customer');
      expect(delivery.customer).toHaveProperty('name');
      expect(delivery.customer).toHaveProperty('phone');
      expect(delivery).toHaveProperty('deliveryAddress');
      expect(delivery.deliveryAddress).toHaveProperty('street');
      expect(delivery.deliveryAddress).toHaveProperty('city');
      expect(delivery.deliveryAddress).toHaveProperty('zipCode');
      expect(delivery).toHaveProperty('items');
      expect(delivery).toHaveProperty('status');
      expect(delivery).toHaveProperty('estimatedDelivery');
    });

    it('should use orderNumber or fallback to order ID for orderId', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const orderWithNumber = {
        ...mockOrders[0],
        orderNumber: 'ORD-12345',
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([orderWithNumber]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].orderId).toBe('ORD-12345');
    });

    it('should handle missing orderNumber by using last 6 chars of _id', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const orderWithoutNumber = {
        ...mockOrders[0],
        _id: { toString: () => '507f1f77bcf86cd799439020' },
        orderNumber: null,
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([orderWithoutNumber]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].orderId).toBe('439020');
    });

    it('should handle missing customer data with defaults', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const orderWithoutCustomer = {
        ...mockOrders[0],
        customer: null,
        shippingInfo: {},
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([orderWithoutCustomer]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].customer.name).toBe('Guest');
      expect(body.data.deliveries[0].customer.phone).toBe('N/A');
    });

    it('should handle missing product data with defaults', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const orderWithMissingProduct = {
        ...mockOrders[0],
        items: [
          {
            product: null,
            quantity: 2,
          },
        ],
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([orderWithMissingProduct]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].items[0].product.name).toBe(
        'Unknown Item'
      );
      expect(
        body.data.deliveries[0].items[0].product.requiresPrescription
      ).toBe(false);
    });

    it('should map shipping info to delivery address', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockOrders[0]]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      const delivery = body.data.deliveries[0];

      expect(delivery.deliveryAddress.street).toBe('123 Main St');
      expect(delivery.deliveryAddress.city).toBe('New York');
      expect(delivery.deliveryAddress.zipCode).toBe('10001');
    });

    it('should handle empty orders array', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.deliveries).toHaveLength(0);
    });

    it('should preserve requiresPrescription flag for items', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockOrders[1]]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(
        body.data.deliveries[0].items[0].product.requiresPrescription
      ).toBe(true);
    });

    it('should include quantity for each item', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockOrders[2]]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].items[0].quantity).toBe(3);
    });

    it('should handle database connection errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to fetch deliveries');
    });

    it('should handle Order.find errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Query error')),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to fetch deliveries');
    });

    it('should handle multiple items in an order', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const orderWithMultipleItems = {
        ...mockOrders[0],
        items: [
          { product: mockProduct, quantity: 2 },
          { product: mockPrescriptionProduct, quantity: 1 },
        ],
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([orderWithMultipleItems]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].items).toHaveLength(2);
      expect(body.data.deliveries[0].items[0].quantity).toBe(2);
      expect(body.data.deliveries[0].items[1].quantity).toBe(1);
    });

    it('should handle missing shippingInfo gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const orderWithoutShipping = {
        ...mockOrders[0],
        shippingInfo: null,
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([orderWithoutShipping]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].deliveryAddress.street).toBe('');
      expect(body.data.deliveries[0].deliveryAddress.city).toBe('');
      expect(body.data.deliveries[0].deliveryAddress.zipCode).toBe('');
    });

    it('should include estimatedDelivery date', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockOrders[0]]),
      };

      (Order.find as jest.Mock).mockReturnValue(mockFind);

      const response = await GET();
      const body = await response.json();

      expect(body.data.deliveries[0].estimatedDelivery).toBeDefined();
    });
  });
});
