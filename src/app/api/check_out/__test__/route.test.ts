import { NextRequest } from 'next/server';
import { POST } from '../route';
import { PATCH } from '../[id]/route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { OrderService } from '@/services/order.service';
import Receptionist from '@/models/Receptionist';

interface WorkDaySchedule {
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

type WorkSchedule = {
  [key: string]: WorkDaySchedule;
};

jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      nextUrl: URL;
      method?: string;
      _body?: any;
      headers: Headers;

      constructor(
        url: string,
        init?: { method?: string; body?: any; headers?: any }
      ) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.method = init?.method;
        this._body = init?.body;
        this.headers = new Headers(init?.headers);
      }

      json() {
        try {
          return Promise.resolve(
            typeof this._body === 'string'
              ? JSON.parse(this._body)
              : this._body || {}
          );
        } catch {
          return Promise.reject(new Error('Invalid JSON'));
        }
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

jest.mock('@/services/order.service', () => ({
  OrderService: {
    createOrder: jest.fn(),
  },
}));

jest.mock('@/models/Receptionist', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/app/api/auth/[...nextauth]/option', () => ({
  authOptions: {},
}));

describe('Checkout/Receptionist API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /api/checkout', () => {
    const mockSession = {
      user: { id: 'user123', email: 'user@example.com' },
    };

    const validCheckoutBody = {
      items: [
        { productId: 'product1', quantity: 2, price: 25.99 },
        { productId: 'product2', quantity: 1, price: 15.5 },
      ],
      shippingAddress: {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        postalCode: '10001',
        phone: '+1234567890',
      },
      paymentMethod: 'card',
    };

    const mockOrder = {
      _id: 'order123',
      orderNumber: 'ORD-2024-001',
      totalAmount: 67.48,
      items: [
        { productId: 'product1', quantity: 2, price: 25.99 },
        { productId: 'product2', quantity: 1, price: 15.5 },
      ],
      status: 'pending',
    };

    const mockStripeSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    };

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it('should process checkout successfully for authenticated user', async () => {
      (OrderService.createOrder as jest.Mock).mockResolvedValue({
        order: mockOrder,
        stripeSession: mockStripeSession,
      });

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(validCheckoutBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Order created successfully');
      expect(data.data).toEqual({
        orderId: 'order123',
        orderNumber: 'ORD-2024-001',
        total: 67.48,
        items: 2,
        stripeSessionId: 'cs_test_123',
        paymentUrl: 'https://checkout.stripe.com/pay/cs_test_123',
        status: 'pending',
      });

      expect(OrderService.createOrder).toHaveBeenCalledWith(
        validCheckoutBody,
        'user123',
        'user@example.com'
      );
    });

    it('should process checkout successfully for guest user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      (OrderService.createOrder as jest.Mock).mockResolvedValue({
        order: mockOrder,
        stripeSession: mockStripeSession,
      });

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(validCheckoutBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(OrderService.createOrder).toHaveBeenCalledWith(
        validCheckoutBody,
        'guest',
        'john@example.com'
      );
    });

    it('should handle session with user but no email', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });

      (OrderService.createOrder as jest.Mock).mockResolvedValue({
        order: mockOrder,
        stripeSession: mockStripeSession,
      });

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(validCheckoutBody),
      });

      const res = await POST(req);
      const _data = await res.json();

      expect(res.status).toBe(200);
      expect(OrderService.createOrder).toHaveBeenCalledWith(
        validCheckoutBody,
        'user123',
        'john@example.com'
      );
    });

    it('should return 400 when cart is empty', async () => {
      const emptyCartBody = {
        items: [],
        shippingAddress: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(emptyCartBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cart is empty');
      expect(OrderService.createOrder).not.toHaveBeenCalled();
    });

    it('should return 400 when items are missing', async () => {
      const noItemsBody = {
        shippingAddress: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(noItemsBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cart is empty');
    });

    it('should return 400 when shipping address is missing', async () => {
      const noAddressBody = {
        items: [{ productId: 'product1', quantity: 1, price: 25.99 }],
      };

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(noAddressBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Shipping address is required');
    });

    it('should return 400 when shipping address name is missing', async () => {
      const invalidAddressBody = {
        items: [{ productId: 'product1', quantity: 1, price: 25.99 }],
        shippingAddress: {
          email: 'john@example.com',
        },
      };

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(invalidAddressBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Shipping address is required');
    });

    it('should handle insufficient stock error', async () => {
      const insufficientStockError = new Error(
        'Insufficient stock for product XYZ'
      );

      (OrderService.createOrder as jest.Mock).mockRejectedValue(
        insufficientStockError
      );

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(validCheckoutBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Insufficient stock for product XYZ');
    });

    it('should handle other OrderService errors', async () => {
      const serviceError = new Error('Payment processing failed');

      (OrderService.createOrder as jest.Mock).mockRejectedValue(serviceError);

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(validCheckoutBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to process checkout');
      expect(data.error).toBe('Payment processing failed');
    });

    it('should handle database connection errors', async () => {
      (connectDB as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(validCheckoutBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to process checkout');
    });

    it('should handle invalid JSON in request body', async () => {
      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: 'invalid json',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to process checkout');
    });

    it('should handle OrderService returning null stripeSession', async () => {
      (OrderService.createOrder as jest.Mock).mockResolvedValue({
        order: mockOrder,
        stripeSession: null,
      });

      const req = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(validCheckoutBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stripeSessionId).toBeUndefined();
      expect(data.data.paymentUrl).toBeUndefined();
    });
  });

  describe('PATCH /api/receptionist/:id/schedule', () => {
    const mockAdminSession = {
      user: {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    };

    const mockReceptionistData = {
      _id: 'receptionist123',
      name: 'Jane Smith',
      email: 'jane@example.com',
      workSchedule: {
        monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
      } as WorkSchedule,
      save: jest.fn(),
    };

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
    });

    it('should update receptionist schedule successfully', async () => {
      const mockReceptionist = {
        ...mockReceptionistData,
        save: jest.fn().mockResolvedValue(mockReceptionistData),
      };

      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const updateBody = {
        workSchedule: {
          monday: { startTime: '08:00', endTime: '16:00', isWorking: true },
          wednesday: { startTime: '10:00', endTime: '18:00', isWorking: true },
        },
      };

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify(updateBody),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Schedule updated successfully');
      expect(mockReceptionist.save).toHaveBeenCalled();
      expect(Receptionist.findById).toHaveBeenCalledWith('receptionist123');
    });

    it('should return 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify({ workSchedule: {} }),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', email: 'user@example.com', role: 'USER' },
      });

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify({ workSchedule: {} }),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 404 when receptionist not found', async () => {
      (Receptionist.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/nonexistent/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify({
            workSchedule: {
              monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
            },
          }),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'nonexistent' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Receptionist not found');
    });

    it('should return 400 when workSchedule is missing', async () => {
      (Receptionist.findById as jest.Mock).mockResolvedValue(
        mockReceptionistData
      );

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify({}),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No schedule data provided');
    });

    it('should return 400 when workSchedule is empty object', async () => {
      (Receptionist.findById as jest.Mock).mockResolvedValue(
        mockReceptionistData
      );

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify({ workSchedule: {} }),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No schedule data provided');
    });

    it('should return 400 when workSchedule has only invalid days', async () => {
      (Receptionist.findById as jest.Mock).mockResolvedValue(
        mockReceptionistData
      );

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify({
            workSchedule: {
              invalidDay: { startTime: '09:00', endTime: '17:00' },
              anotherInvalid: { startTime: '10:00', endTime: '18:00' },
            },
          }),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No schedule data provided');
    });

    it('should filter out invalid days and update only valid ones', async () => {
      const mockReceptionist = {
        ...mockReceptionistData,
        workSchedule: {},
        save: jest.fn().mockResolvedValue(mockReceptionistData),
      };

      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const updateBody = {
        workSchedule: {
          monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          invalidDay: { startTime: '10:00', endTime: '18:00', isWorking: true },
          tuesday: { startTime: '08:00', endTime: '16:00', isWorking: true },
        },
      };

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify(updateBody),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect((mockReceptionist.workSchedule as any).invalidDay).toBeUndefined();
    });

    it('should initialize workSchedule if it does not exist', async () => {
      const mockReceptionist = {
        _id: 'receptionist123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        workSchedule: {},
        save: jest.fn().mockResolvedValue({}),
      };

      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const updateBody = {
        workSchedule: {
          monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        },
      };

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify(updateBody),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockReceptionist.workSchedule).toBeDefined();
      expect(mockReceptionist.save).toHaveBeenCalled();
    });

    it('should merge existing schedule with updates', async () => {
      const mockReceptionist = {
        ...mockReceptionistData,
        workSchedule: {
          monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
        },
        save: jest.fn().mockResolvedValue({}),
      };

      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const updateBody = {
        workSchedule: {
          monday: { startTime: '08:00', endTime: '16:00', isWorking: false },
        },
      };

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify(updateBody),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockReceptionist.workSchedule.monday.startTime).toBe('08:00');
      expect(mockReceptionist.workSchedule.tuesday).toBeDefined();
    });

    it('should handle all valid days of the week', async () => {
      const mockReceptionist = {
        ...mockReceptionistData,
        workSchedule: {},
        save: jest.fn().mockResolvedValue({}),
      };

      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const updateBody = {
        workSchedule: {
          monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          wednesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          thursday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          friday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          saturday: { startTime: '10:00', endTime: '14:00', isWorking: true },
          sunday: { startTime: '10:00', endTime: '14:00', isWorking: false },
        },
      };

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify(updateBody),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Object.keys(mockReceptionist.workSchedule)).toHaveLength(7);
    });

    it('should handle database errors', async () => {
      (Receptionist.findById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify({
            workSchedule: {
              monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
            },
          }),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });

    it('should handle save errors', async () => {
      const mockReceptionist = {
        ...mockReceptionistData,
        workSchedule: {},
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      };

      (Receptionist.findById as jest.Mock).mockResolvedValue(mockReceptionist);

      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: JSON.stringify({
            workSchedule: {
              monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
            },
          }),
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Save failed');
    });

    it('should handle invalid JSON in request body', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/receptionist/receptionist123/schedule',
        {
          method: 'PATCH',
          body: 'invalid json',
        }
      );

      const context = {
        params: Promise.resolve({ id: 'receptionist123' }),
      };

      const res = await PATCH(req, context);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
