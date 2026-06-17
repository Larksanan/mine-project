// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order';
import { authOptions } from '@/lib/auth';
import { Types } from 'mongoose';
import Notification from '@/models/Notification';
import '@/models/Product';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get specific order by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const { id } = await params;
    const orderId = id;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findById(orderId)
      .populate('items.product', 'name image price requiresPrescription')
      .populate('customer', 'name email phone')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization
    // Allow if: user is the customer, or it's a guest order, or user is admin
    const isOwner =
      session?.user?.id && order.customer?._id?.toString() === session.user.id;
    const isGuestOrder = !order.customer;
    // Add admin check here: const isAdmin = session?.user?.role === 'admin';

    if (!isOwner && !isGuestOrder) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view this order' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH - Update order (for status changes)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const { id } = await params;
    const orderId = id;
    const body = await request.json();
    const { status, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update status if provided
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

    // Update payment status if provided
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

    // Send SMS notification if status changed
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

      // Create in-app notification
      try {
        await Notification.create({
          recipient: order.customer,
          title: 'Order Status Update',
          message: `Your order ${order.orderNumber} is now ${status.replace(/_/g, ' ')}`,
          type: 'order',
          relatedId: order._id,
          read: false,
        });
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }

    // Populate for response
    await order.populate([
      { path: 'items.product', select: 'name image price' },
      { path: 'customer', select: 'name email phone' },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Order updated successfully',
        order,
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

// DELETE - Cancel order
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const { id } = await params;
    const orderId = id;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId).populate('items.product');

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwner =
      session?.user?.id && order.customer?.toString() === session.user.id;
    const isGuestOrder = !order.customer;

    if (!isOwner && !isGuestOrder) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to cancel this order' },
        { status: 403 }
      );
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel order with status: ${order.status}`,
        },
        { status: 400 }
      );
    }

    // Restore product stock
    const Product = (await import('@/models/Product')).default;
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stockQuantity += item.quantity;
        product.inStock = true;
        await product.save();
      }
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    order.updatedBy = session?.user?.id
      ? new Types.ObjectId(session.user.id)
      : undefined;
    await order.save();

    // Send cancellation notification
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

      // Create in-app notification
      try {
        await Notification.create({
          recipient: order.customer,
          title: 'Order Cancelled',
          message: `Your order ${order.orderNumber} has been cancelled`,
          type: 'order',
          relatedId: order._id,
          read: false,
        });
      } catch (error) {
        console.error('Error creating notification:', error);
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
