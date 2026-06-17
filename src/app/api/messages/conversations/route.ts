import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const conversations = await Conversation.find({
      participants: session.user.id,
    })
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean();

    // Calculate unread counts
    const conversationsWithUnread = await Promise.all(
      conversations.map(async conv => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: session.user.id,
          read: false,
        });

        return {
          ...conv,
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: conversationsWithUnread,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
