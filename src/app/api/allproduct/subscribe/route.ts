import { connectDB } from '@/lib/mongodb';
import Newsletter from '@/models/Newsletter';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  subscribedAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate email
    const validation = newsletterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, subscribedAt } = validation.data;

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      return NextResponse.json(
        {
          success: false,
          message: 'This email is already subscribed to our newsletter!',
        },
        { status: 400 }
      );
    }

    // Generate a unique coupon code for the new subscriber
    const couponCode = `WELCOME20_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now()}`;

    // Create new subscriber
    const newSubscriber = new Newsletter({
      email,
      subscribedAt: subscribedAt || new Date().toISOString(),
      isActive: true,
      couponCode: couponCode,
      couponUsed: false,
    });

    await newSubscriber.save();

    // TODO: Send welcome email with coupon code
    // await sendWelcomeEmail(email, couponCode);

    return NextResponse.json({
      success: true,
      message:
        'Successfully subscribed to newsletter! Check your email for your 20% off coupon.',
      data: {
        email: newSubscriber.email,
        subscribedAt: newSubscriber.subscribedAt,
        couponCode: couponCode,
      },
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to subscribe. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    // Check for admin role
    const userRole = session.user?.role;
    const isAdminUser = userRole === 'ADMIN' || userRole === 'PHARMACIST';

    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    // Fetch subscribers with pagination
    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Newsletter.countDocuments(query);

    return NextResponse.json({
      success: true,
      count: subscribers.length,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit),
      data: subscribers,
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch subscribers',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    const userRole = session.user?.role;
    const isAdminUser = userRole === 'ADMIN' || userRole === 'PHARMACIST';

    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { success: false, message: 'Email or ID is required' },
        { status: 400 }
      );
    }

    let deletedSubscriber;
    if (id) {
      deletedSubscriber = await Newsletter.findByIdAndDelete(id);
    } else if (email) {
      deletedSubscriber = await Newsletter.findOneAndDelete({ email });
    }

    if (!deletedSubscriber) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscriber removed successfully',
      data: { email: deletedSubscriber.email },
    });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete subscriber',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    const userRole = session.user?.role;
    const isAdminUser = userRole === 'ADMIN' || userRole === 'PHARMACIST';

    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { isActive, couponUsed } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Subscriber ID is required' },
        { status: 400 }
      );
    }

    const updatedSubscriber = await Newsletter.findByIdAndUpdate(
      id,
      {
        ...(isActive !== undefined && { isActive }),
        ...(couponUsed !== undefined && { couponUsed }),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedSubscriber) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscriber updated successfully',
      data: updatedSubscriber,
    });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update subscriber',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
