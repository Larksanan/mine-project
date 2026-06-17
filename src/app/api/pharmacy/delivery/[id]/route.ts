import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Map delivery status back to Order status
    let orderStatus = '';
    if (status === 'on_way') orderStatus = 'out_for_delivery';
    else if (status === 'delivered') orderStatus = 'delivered';

    // Only update if we have a valid mapping, otherwise we might be in an intermediate state
    // like 'assigned' or 'picked_up' which doesn't exist on Order model yet.
    if (orderStatus) {
      await Order.findByIdAndUpdate(id, { status: orderStatus });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update delivery',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
