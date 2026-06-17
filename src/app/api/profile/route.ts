/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { validateProfileData } from '@/validation/profile';

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

    const user = await User.findById(session.user.id).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        nic: user.nic,
        image: user.image,
        phone: user.phone,
        department: user.department,
        specialization: user.specialization,
        address: user.address,
        bio: user.bio,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    await connectDB();

    // Get current user to validate against role
    const currentUser = await User.findById(session.user.id).select(
      '-password'
    );
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate the data using your validation schema
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

    // Update allowed fields
    const updateData: any = {
      name: validation.data.name,
      phone: validation.data.phone || null,
      department: validation.data.department || null,
      specialization: validation.data.specialization || null,
      address: validation.data.address || null,
      bio: validation.data.bio || null,
      updatedAt: new Date(),
    };

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        phone: updatedUser.phone,
        department: updatedUser.department,
        specialization: updatedUser.specialization,
        address: updatedUser.address,
        bio: updatedUser.bio,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Profile update error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
