import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
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

    const user = await User.findById(session.user.id).select('settings');

    // Default settings
    const defaultSettings = {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      notifications: {
        email: true,
        push: true,
        sms: false,
        desktop: true,
        appointmentReminders: true,
        prescriptionUpdates: true,
        labResults: true,
        billingAlerts: true,
        marketingEmails: false,
        newsletter: false,
      },
      privacy: {
        profileVisibility: 'contacts',
        showOnlineStatus: true,
        allowMessaging: 'contacts',
        dataSharing: true,
        analytics: true,
      },
      security: {
        twoFactorAuth: false,
        loginAlerts: true,
        sessionTimeout: 60,
        passwordExpiry: 90,
      },
    };

    return NextResponse.json({
      success: true,
      data: user?.settings || defaultSettings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await request.json();

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: { settings },
      },
      { new: true }
    ).select('settings');

    return NextResponse.json({
      success: true,
      data: user?.settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
