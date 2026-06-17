import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const unreadCount = await Message.countDocuments({
      receiverId: session.user.id,
      read: false,
    });

    const unreadByConversation = await Message.aggregate([
      {
        $match: {
          receiverId: session.user.id,
          read: false,
        },
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUnread: unreadCount,
        byConversation: unreadByConversation,
      },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
