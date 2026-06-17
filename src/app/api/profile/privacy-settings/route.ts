import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Fetch privacy settings
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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return default privacy settings if none exist
    const defaultPrivacy = {
      profileVisibility: 'contacts',
      showOnlineStatus: true,
      allowMessaging: 'everyone',
      dataSharing: false,
      analytics: true,
    };

    return NextResponse.json({
      success: true,
      data: user.settings?.privacy || defaultPrivacy,
    });
  } catch (error) {
    console.error('Privacy settings fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update privacy settings
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
      profileVisibility,
      showOnlineStatus,
      allowMessaging,
      dataSharing,
      analytics,
    } = body;

    // Validate profileVisibility
    const validVisibilities = ['public', 'contacts', 'private'];
    if (profileVisibility && !validVisibilities.includes(profileVisibility)) {
      return NextResponse.json(
        { success: false, error: 'Invalid profile visibility value' },
        { status: 400 }
      );
    }

    // Validate allowMessaging
    const validMessaging = ['everyone', 'contacts', 'none'];
    if (allowMessaging && !validMessaging.includes(allowMessaging)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messaging preference value' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update privacy settings
    if (!user.settings) {
      user.settings = {};
    }

    user.settings.privacy = {
      profileVisibility: profileVisibility || 'contacts',
      showOnlineStatus: showOnlineStatus ?? true,
      allowMessaging: allowMessaging || 'everyone',
      dataSharing: dataSharing ?? false,
      analytics: analytics ?? true,
    };

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      data: user.settings.privacy,
      message: 'Privacy settings updated successfully',
    });
  } catch (error) {
    console.error('Privacy settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
