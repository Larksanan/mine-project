import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, read = true } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification IDs' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId: session.user.id,
      },
      {
        $set: {
          read,
          readAt: read ? new Date() : null,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
      message: 'Notifications updated successfully',
    });
  } catch (error) {
    console.error('Error marking notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
