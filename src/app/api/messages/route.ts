/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { receiverId, content, messageType = 'text' } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json(
        { success: false, error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [session.user.id, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [session.user.id, receiverId],
      });
    }

    // Create message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId: session.user.id,
      receiverId,
      content,
      messageType,
      read: false,
    });

    // Update conversation's last message and timestamp
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: session.user.id,
    })
      .populate({
        path: 'participants',
        select: '_id name email role avatar',
      })
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv: any) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: session.user.id,
          read: false,
        });

        const otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== session.user.id
        );

        return {
          ...conv,
          _id: conv._id.toString(),
          unreadCount,
          otherParticipant: otherParticipant || conv.participants[0],
          participants: conv.participants.map((p: any) => ({
            ...p,
            _id: p._id.toString(),
          })),
        };
      })
    );

    const total = await Conversation.countDocuments({
      participants: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: conversationsWithDetails,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
