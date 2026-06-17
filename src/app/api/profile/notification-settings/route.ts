import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Fetch notification settings
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

    const user = await User.findById(session.user.id).select(
      'notificationPreferences'
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return default settings if none exist
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      appointmentReminders: true,
      messageAlerts: true,
      systemUpdates: true,
      marketingEmails: false,
    };

    return NextResponse.json({
      success: true,
      data: user.notificationPreferences || defaultSettings,
    });
  } catch (error) {
    console.error('Notification settings fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update notification settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      emailNotifications,
      pushNotifications,
      inAppNotifications,
      appointmentReminders,
      messageAlerts,
      systemUpdates,
      marketingEmails,
    } = body;

    await connectDB();

    const updateData = {
      notificationPreferences: {
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? true,
        inAppNotifications: inAppNotifications ?? true,
        appointmentReminders: appointmentReminders ?? true,
        messageAlerts: messageAlerts ?? true,
        systemUpdates: systemUpdates ?? true,
        marketingEmails: marketingEmails ?? false,
      },
      updatedAt: new Date(),
    };

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).select('notificationPreferences');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser.notificationPreferences,
      message: 'Notification settings updated successfully',
    });
  } catch (error) {
    console.error('Notification settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
