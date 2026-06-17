/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order';
import Product from '@/models/Product';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Types } from 'mongoose';

function serializeOrder(order: any) {
  return {
    ...order,
    _id: order._id?.toString() || order._id,
    id: order._id?.toString() || order._id,
    customer: order.customer
      ? {
          ...order.customer,
          _id: order.customer._id?.toString(),
        }
      : undefined,
    items:
      order.items?.map((item: any) => ({
        ...item,
        product: item.product
          ? {
              ...item.product,
              _id: item.product._id?.toString(),
            }
          : item.product,
      })) || [],
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      items,
      shippingInfo,
      paymentMethod,
      prescriptionImages,
      deliveryInstructions,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in order' },
        { status: 400 }
      );
    }

    if (!shippingInfo) {
      return NextResponse.json(
        { success: false, error: 'Shipping information is required' },
        { status: 400 }
      );
    }

    if (!['cash', 'card', 'insurance'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    const orderItems = [];
    let totalAmount = 0;
    let hasRxItems = false;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (!product.inStock || product.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${product.name}`,
          },
          { status: 400 }
        );
      }

      if (product.requiresPrescription) {
        hasRxItems = true;
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        prescriptionVerified: false,
      });

      totalAmount += product.price * item.quantity;

      product.stockQuantity -= item.quantity;
      if (product.stockQuantity === 0) {
        product.inStock = false;
      }
      await product.save();
    }

    const tax = totalAmount * 0.1;
    const shipping = totalAmount > 50 ? 0 : 5.99;
    totalAmount = totalAmount + tax + shipping;

    if (
      hasRxItems &&
      (!prescriptionImages || prescriptionImages.length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prescription images required for prescription items',
        },
        { status: 400 }
      );
    }

    const orderNumber = await Order.generateOrderNumber();

    const deliveryAddress = `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}, ${shippingInfo.country}`;

    const order = await Order.create({
      orderNumber,
      customer: session?.user?.id || undefined,
      items: orderItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'pending',
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      deliveryAddress,
      shippingInfo: {
        name: shippingInfo.fullName,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        city: shippingInfo.city,
        postalCode: shippingInfo.zipCode,
        instructions: deliveryInstructions || '',
      },
      prescriptionImages: prescriptionImages || [],
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdBy: session?.user?.id || undefined,
    });

    await order.populate([
      { path: 'items.product', select: 'name image price' },
      { path: 'customer', select: 'name email phone' },
    ]);

    if (process.env.TWILIO_ENABLED === 'true') {
      try {
        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization:
                'Basic ' +
                Buffer.from(
                  `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
                ).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: shippingInfo.phone,
              From: process.env.TWILIO_PHONE_NUMBER || '',
              Body: `Your order ${orderNumber} has been confirmed! Estimated delivery: 2-3 business days. Total: LKR ${totalAmount.toFixed(2)}`,
            }),
          }
        );
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        order: {
          id: order._id.toString(),
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          estimatedDelivery: order.estimatedDelivery,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    if (orderId) {
      const order = await Order.findById(orderId)
        .populate('items.product', 'name image price')
        .populate('customer', 'name email phone')
        .lean();

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      const isOwner =
        session?.user?.id && order.customer?.toString() === session.user.id;
      const isGuestOrder = !order.customer;

      if (!isOwner && !isGuestOrder) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: true, order: serializeOrder(order) },
        { status: 200 }
      );
    }

    const query: Record<string, any> = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (email) {
      query['shippingInfo.email'] = email;
      const orders = await Order.find(query)
        .populate('items.product', 'name image price')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return NextResponse.json(
        { success: true, orders: orders.map(serializeOrder) },
        { status: 200 }
      );
    }

    if (phone) {
      query['shippingInfo.phone'] = phone;
      const orders = await Order.find(query)
        .populate('items.product', 'name image price')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return NextResponse.json(
        { success: true, orders: orders.map(serializeOrder) },
        { status: 200 }
      );
    }

    const userRole = (session?.user as any)?.role?.toString().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'pharmacist';

    console.log('GET /api/orders - User role:', userRole, 'Is admin:', isAdmin);

    if (session?.user?.id && !isAdmin) {
      query.customer = new Types.ObjectId(session.user.id);
      const orders = await Order.find(query)
        .populate('items.product', 'name image price')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(
        { success: true, orders: orders.map(serializeOrder) },
        { status: 200 }
      );
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name image price requiresPrescription')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    console.log(`Returning ${orders.length} orders`);

    return NextResponse.json(
      { success: true, orders: orders.map(serializeOrder) },
      { status: 200 }
    );
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { orderId, status, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (status) {
      const validStatuses = [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
      order.status = status;
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { success: false, error: 'Invalid payment status' },
          { status: 400 }
        );
      }
      order.paymentStatus = paymentStatus;
    }

    order.updatedBy = session?.user?.id
      ? new Types.ObjectId(session.user.id)
      : undefined;

    await order.save();

    if (status && process.env.TWILIO_ENABLED === 'true') {
      try {
        const statusMessages: Record<string, string> = {
          confirmed: 'Your order has been confirmed!',
          preparing: 'Your order is being prepared.',
          ready: 'Your order is ready for pickup/delivery.',
          out_for_delivery: 'Your order is out for delivery!',
          delivered: 'Your order has been delivered. Thank you!',
          cancelled: 'Your order has been cancelled.',
        };

        const message = statusMessages[status];
        if (message) {
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  'Basic ' +
                  Buffer.from(
                    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
                  ).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: order.shippingInfo.phone,
                From: process.env.TWILIO_PHONE_NUMBER || '',
                Body: `Order ${order.orderNumber}: ${message}`,
              }),
            }
          );
        }
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }
    }

    await order.populate([
      { path: 'items.product', select: 'name image price' },
      { path: 'customer', select: 'name email phone' },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Order updated successfully',
        order: serializeOrder(order.toObject()),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const isOwner =
      session?.user?.id && order.customer?.toString() === session.user.id;
    const isGuestOrder = !order.customer;

    if (!isOwner && !isGuestOrder) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Can only cancel pending or confirmed orders',
        },
        { status: 400 }
      );
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stockQuantity += item.quantity;
        product.inStock = true;
        await product.save();
      }
    }

    order.status = 'cancelled';
    order.updatedBy = session?.user?.id
      ? new Types.ObjectId(session.user.id)
      : undefined;
    await order.save();

    if (process.env.TWILIO_ENABLED === 'true') {
      try {
        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization:
                'Basic ' +
                Buffer.from(
                  `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
                ).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: order.shippingInfo.phone,
              From: process.env.TWILIO_PHONE_NUMBER || '',
              Body: `Your order ${order.orderNumber} has been cancelled. If you did not request this, please contact us.`,
            }),
          }
        );
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order cancelled successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
