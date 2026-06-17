import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { validateProfileData } from '@/validation/profile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatUserResponse = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  nic: user.nic,
  image: user.image,
  phone: user.phone,
  department: user.department,
  specialization: user.specialization,
  licenseNumber: user.licenseNumber,
  address: user.address,
  bio: user.bio,
  role: user.role,
  emailVerified: user.emailVerified,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  notificationPreferences: user.notificationPreferences,
  settings: user.settings,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export async function GET(
  request: NextRequest,
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

    if (session.user.id !== id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(id).select('-password -__v');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
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

    if (session.user.id !== id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    await connectDB();

    const currentUser = await User.findById(id);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const validation = validateProfileData(body, currentUser.role);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors[0]?.message || 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const updateData = {
      name: validation.data.name,
      email: validation.data.email,
      phone: validation.data.phone || null,
      department: validation.data.department || null,
      specialization: validation.data.specialization || null,
      address: validation.data.address || null,
      bio: validation.data.bio || null,
      ...(body.licenseNumber && { licenseNumber: body.licenseNumber }),
      updatedAt: new Date(),
    };

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatUserResponse(updatedUser),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
