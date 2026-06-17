// app/api/admin/migrate-preferences/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    await connectDB();

    const usersWithoutPrefs = await User.find({
      $or: [
        { notificationPreferences: { $exists: false } },
        { notificationPreferences: null },
      ],
    }).countDocuments();

    if (usersWithoutPrefs === 0) {
      return NextResponse.json({
        success: true,
        message: 'All users already have notification preferences',
        updated: 0,
      });
    }

    // Update users
    const result = await User.updateMany(
      {
        $or: [
          { notificationPreferences: { $exists: false } },
          { notificationPreferences: null },
        ],
      },
      {
        $set: { notificationPreferences: defaultPreferences },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      updated: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
