/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch orders that are ready for delivery or in progress
    const orders = await Order.find({
      status: { $in: ['ready', 'out_for_delivery', 'delivered'] },
    })
      .populate('items.product', 'name requiresPrescription')
      .populate('customer', 'name phone')
      .sort({ updatedAt: -1 });

    const deliveries = orders.map((order: any) => {
      // Map Order status to Delivery status
      let status = 'pending'; // Default for 'ready'
      if (order.status === 'out_for_delivery') status = 'on_way';
      else if (order.status === 'delivered') status = 'delivered';

      return {
        _id: order._id,
        orderId: order.orderNumber || order._id.toString().slice(-6),
        customer: {
          name: order.shippingInfo?.name || order.customer?.name || 'Guest',
          phone: order.shippingInfo?.phone || order.customer?.phone || 'N/A',
        },
        deliveryAddress: {
          street: order.shippingInfo?.address || '',
          city: order.shippingInfo?.city || '',
          state: '',
          zipCode: order.shippingInfo?.postalCode || '',
          instructions: '',
        },
        items: order.items.map((item: any) => ({
          product: {
            name: item.product?.name || 'Unknown Item',
            requiresPrescription: item.product?.requiresPrescription || false,
          },
          quantity: item.quantity,
        })),
        status: status,
        estimatedDelivery: order.estimatedDelivery,
      };
    });

    return NextResponse.json({ success: true, data: { deliveries } });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}
