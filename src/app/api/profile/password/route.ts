import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

// POST - Delete account (requires password confirmation)
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await _req.json();
    const { password, confirmText } = body;

    // Require confirmation text
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

    // Verify password if user has one (not OAuth)
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Password is required' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password' },
          { status: 401 }
        );
      }
    }

    // Soft delete - mark as inactive instead of hard delete
    // You can change this to hard delete if needed
    user.isActive = false;
    user.email = `deleted_${user._id}@deleted.com`; // Prevent email conflicts
    user.updatedAt = new Date();
    await user.save();

    // For hard delete, uncomment this:
    // await User.findByIdAndDelete(session.user.id);

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
