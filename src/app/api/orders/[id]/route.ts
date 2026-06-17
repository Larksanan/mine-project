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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id)
      .populate('items.product', 'name image price requiresPrescription')
      .populate('customer', 'name email phone')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const userRole = (session?.user as any)?.role?.toString().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'pharmacist';
    const isOwner =
      session?.user?.id && order.customer?.toString() === session.user.id;
    const isGuestOrder = !order.customer;

    if (!isOwner && !isGuestOrder && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, order: serializeOrder(order) },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const body = await request.json();

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const { status, paymentStatus, prescriptionVerified } = body;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const userRole = (session?.user as any)?.role?.toString().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'pharmacist';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
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

    if (
      prescriptionVerified !== undefined &&
      typeof prescriptionVerified === 'boolean'
    ) {
      order.items.forEach((item: any) => {
        item.prescriptionVerified = prescriptionVerified;
      });
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
        if (message && order.shippingInfo?.phone) {
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
      {
        path: 'items.product',
        select: 'name image price requiresPrescription',
      },
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const userRole = (session?.user as any)?.role?.toString().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'pharmacist';
    const isOwner =
      session?.user?.id && order.customer?.toString() === session.user.id;
    const isGuestOrder = !order.customer;

    if (!isOwner && !isGuestOrder && !isAdmin) {
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

    if (process.env.TWILIO_ENABLED === 'true' && order.shippingInfo?.phone) {
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
