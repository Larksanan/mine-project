import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function DELETE(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { password, confirmText } = await _req.json();

    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Please type DELETE to confirm account deletion',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password if user has one (non-OAuth)
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Password is required' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password' },
          { status: 401 }
        );
      }
    }

    user.isActive = false;
    user.email = `deleted_${user._id}@deleted.com`;
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
