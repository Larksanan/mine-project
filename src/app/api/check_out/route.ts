/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { OrderService } from '@/services/order.service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    const body = await req.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cart is empty' },
        { status: 400 }
      );
    }

    if (!body.shippingAddress || !body.shippingAddress.name) {
      return NextResponse.json(
        { success: false, message: 'Shipping address is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const { order, stripeSession } = await OrderService.createOrder(
      body,
      session?.user?.id || 'guest',
      session?.user?.email || body.shippingAddress.email
    );

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        total: order.totalAmount,
        items: order.items.length,
        stripeSessionId: stripeSession?.id,
        paymentUrl: stripeSession?.url,
        status: order.status,
      },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);

    if (error.message.includes('Insufficient stock')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process checkout',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
