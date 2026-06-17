import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Order, { IOrder } from '@/models/order';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import '@/models/Product';
import mongoose, { FilterQuery } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    let customerId = session.user.id;

    // If the session ID is not a valid MongoDB ObjectId (e.g., it's a provider sub ID),
    // find the corresponding user document to get the correct database _id.
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      const user = await User.findOne({
        email: session.user.email?.toLowerCase().trim(),
      });
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User record not found in database.' },
          { status: 404 }
        );
      }
      customerId = (user._id as mongoose.Types.ObjectId).toString();
    }

    // Build query
    const query: FilterQuery<IOrder> = { customer: customerId };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);
    const skip = (page - 1) * limit;

    // Fetch orders
    const orders = await Order.find(query)
      .populate('items.product', 'name image price requiresPrescription')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch orders',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
