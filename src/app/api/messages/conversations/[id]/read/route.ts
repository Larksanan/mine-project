/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await _request.json();
    const { messageIds } = body;

    await connectDB();

    const conversation = await Conversation.findOne({
      _id: id,
      participants: session.user.id,
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    const query: any = {
      conversationId: id,
      receiverId: session.user.id,
      read: false,
    };

    if (messageIds && Array.isArray(messageIds)) {
      query._id = { $in: messageIds };
    }

    const result = await Message.updateMany(query, {
      $set: { read: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
