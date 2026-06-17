/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const defaultPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  appointmentReminders: true,
  messageAlerts: true,
  systemUpdates: true,
  marketingEmails: false,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log(
      'Session:',
      JSON.stringify(
        {
          exists: !!session,
          hasUser: !!session?.user,
          hasId: !!session?.user?.id,
          userId: session?.user?.id || 'N/A',
          email: session?.user?.email || 'N/A',
        },
        null,
        2
      )
    );

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No session or user ID' },
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
    const preferences = user.notificationPreferences
      ? { ...defaultPreferences, ...user.notificationPreferences }
      : defaultPreferences;

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                name: error?.name,
                message: error?.message,
                stack: error?.stack,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('Session found, user ID:', session.user.id);
    let preferences;
    try {
      preferences = await request.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const validKeys = [
      'emailNotifications',
      'pushNotifications',
      'inAppNotifications',
      'appointmentReminders',
      'messageAlerts',
      'systemUpdates',
      'marketingEmails',
    ];

    const receivedKeys = Object.keys(preferences);
    const invalidKeys = receivedKeys.filter(key => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid preference keys: ${invalidKeys.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate all values are booleans
    for (const [key, value] of Object.entries(preferences)) {
      if (typeof value !== 'boolean') {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid value for ${key}: expected boolean, got ${typeof value}`,
          },
          { status: 400 }
        );
      }
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { notificationPreferences: preferences } },
      { new: true, runValidators: true }
    ).select('notificationPreferences');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: user.notificationPreferences || preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error: any) {
    console.error(
      'Full error object:',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                name: error?.name,
                message: error?.message,
                stack: error?.stack,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
