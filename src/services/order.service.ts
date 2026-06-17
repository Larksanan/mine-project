/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import Order, { IOrderDocument } from '@/models/order';
import Product from '@/models/Product';
import Stripe from 'stripe';

let stripe: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured.');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-14' as any,
    });
  }
  return stripe;
};

export interface CheckoutData {
  items: Array<{
    _id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    prescriptionRequired?: boolean;
  }>;
  total: number;
  pharmacyId?: string;
  paymentMethod: 'cash' | 'card' | 'insurance';
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  prescriptionImages?: string[];
}

export class OrderService {
  /**
   * Process checkout and create order
   */
  static async createOrder(
    checkoutData: CheckoutData,
    userId: string,
    userEmail: string
  ): Promise<{
    order: IOrderDocument;
    stripeSession?: Stripe.Checkout.Session;
  }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Verify stock and reserve items
      await this.verifyAndReserveStock(checkoutData.items, session);

      // Generate order number
      const orderNumber = await Order.generateOrderNumber();

      // Get pharmacy ID (use first product's pharmacy or default)
      let pharmacyId = checkoutData.pharmacyId;
      if (!pharmacyId && checkoutData.items.length > 0) {
        const firstProduct = await Product.findById(checkoutData.items[0]._id);
        pharmacyId = firstProduct?.pharmacy?.toString();
      }

      // Prepare order data
      const orderData = {
        orderNumber,
        customer: userId !== 'guest' ? new Types.ObjectId(userId) : undefined,
        pharmacy: pharmacyId ? new Types.ObjectId(pharmacyId) : undefined,
        items: checkoutData.items.map(item => ({
          product: new Types.ObjectId(item._id),
          quantity: item.quantity,
          price: item.price,
          prescriptionVerified: item.prescriptionRequired || false,
        })),
        totalAmount: checkoutData.total,
        paymentMethod: checkoutData.paymentMethod,
        paymentStatus: 'pending' as const,
        deliveryAddress: `${checkoutData.shippingAddress.address}, ${checkoutData.shippingAddress.city}, ${checkoutData.shippingAddress.postalCode}`,
        shippingInfo: checkoutData.shippingAddress,
        prescriptionImages: checkoutData.prescriptionImages || [],
        createdBy: userId !== 'guest' ? new Types.ObjectId(userId) : undefined,
        status: 'pending' as const,
      };

      // Create order
      const [order] = await Order.create([orderData], { session });

      let stripeSession: Stripe.Checkout.Session | undefined;

      // Create Stripe session for card payments
      if (checkoutData.paymentMethod === 'card') {
        stripeSession = await this.createStripeSession(
          order,
          checkoutData,
          userEmail
        );

        order.stripeSessionId = stripeSession.id;
        await order.save({ session });
      }

      // Commit transaction
      await session.commitTransaction();

      return { order, stripeSession };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Verify stock and reserve items
   */
  private static async verifyAndReserveStock(
    items: CheckoutData['items'],
    session: mongoose.ClientSession
  ): Promise<void> {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item._id,
          stockQuantity: { $gte: item.quantity },
          inStock: true,
        },
        {
          $inc: { stockQuantity: -item.quantity },
        },
        { new: true, session }
      );

      if (!product) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    }
  }

  /**
   * Create Stripe checkout session
   */
  private static async createStripeSession(
    order: IOrderDocument,
    checkoutData: CheckoutData,
    customerEmail: string
  ): Promise<Stripe.Checkout.Session> {
    const lineItems = checkoutData.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const baseUrl = process.env.NEXT_PUBLIC_APPs_URL || 'http://localhost:3000';

    return getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      metadata: {
        orderId: order._id.toString(),
        userId: order.customer?.toString() || 'guest',
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?order_id=${order._id}`,
    });
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleStripeWebhook(
    event: Stripe.Event
  ): Promise<{ success: boolean; order?: IOrderDocument }> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        return this.handlePaymentSuccess(session);
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        return this.handlePaymentExpired(session);
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        return this.handleRefund(charge);
      }

      default:
        return { success: false };
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSuccess(
    session: Stripe.Checkout.Session
  ): Promise<{ success: boolean; order?: IOrderDocument }> {
    const order = await Order.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        paymentStatus: 'paid',
        paymentMethod: 'card',
        stripePaymentIntentId: session.payment_intent as string,
        status: 'confirmed',
      },
      { new: true }
    );

    if (!order) {
      return { success: false };
    }

    // Note: shipping_details was removed - handle address update differently
    // The address is already stored in shippingInfo from checkout

    return { success: true, order };
  }

  /**
   * Handle expired payment session
   */
  private static async handlePaymentExpired(
    session: Stripe.Checkout.Session
  ): Promise<{ success: boolean }> {
    const order = await Order.findOneAndUpdate(
      { stripeSessionId: session.id, paymentStatus: 'pending' },
      {
        paymentStatus: 'failed',
        status: 'cancelled',
      }
    );

    if (order) {
      await this.restoreStock(order.items);
    }

    return { success: !!order };
  }

  /**
   * Handle refund
   */
  private static async handleRefund(
    charge: Stripe.Charge
  ): Promise<{ success: boolean }> {
    const order = await Order.findOneAndUpdate(
      { stripePaymentIntentId: charge.payment_intent },
      {
        paymentStatus: 'refunded',
        status: 'cancelled',
      }
    );

    if (order) {
      await this.restoreStock(order.items);
    }

    return { success: !!order };
  }

  /**
   * Restore stock when order is cancelled
   */

  private static async restoreStock(items: any[]): Promise<void> {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity },
      });
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(
    orderId: string,
    userId?: string
  ): Promise<IOrderDocument | null> {
    const query: any = { _id: orderId };

    if (userId && userId !== 'guest') {
      query.customer = userId;
    }

    return Order.findOne(query)
      .populate('customer', 'name email phone')
      .populate('pharmacy', 'name address phone')
      .populate('items.product', 'name image price');
  }

  /**
   * Get customer orders
   */
  static async getCustomerOrders(
    customerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    orders: IOrderDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ customer: customerId })
        .populate('pharmacy', 'name address')
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ customer: customerId }),
    ]);

    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Cancel order
   */
  static async cancelOrder(
    orderId: string,
    userId: string
  ): Promise<IOrderDocument | null> {
    const order = await Order.findOne({
      _id: orderId,
      customer: userId,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (!order) return null;

    order.status = 'cancelled';
    order.updatedBy = new Types.ObjectId(userId);
    await order.save();

    // Restore stock
    await this.restoreStock(order.items);

    return order;
  }
}
