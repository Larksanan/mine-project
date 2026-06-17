import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose, { Document } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface IUserDoc extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

function sanitizeUserDoc(doc: IUserDoc | null) {
  if (!doc) return null;
  const u = {
    ...doc,
    _id: doc._id?.toString ? doc._id.toString() : doc._id,
    createdAtFormatted: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : null,
    updatedAtFormatted: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : null,
    lastLoginFormatted: doc.lastLogin
      ? new Date(doc.lastLogin).toISOString()
      : null,
  };
  // Remove password if present
  if (u.password) delete u.password;
  return u;
}

async function ensureRoleProfilesOnChange(
  userId: string,
  prevRole?: string,
  newRole?: string
) {
  // remove previous role's profile if it differs from new role
  if (prevRole && prevRole !== newRole) {
    switch (prevRole) {
      case 'DOCTOR':
        await Doctor.findOneAndDelete({ user: userId });
        break;
      case 'PATIENT':
        await Patient.findOneAndDelete({ user: userId });
        break;
      case 'RECEPTIONIST':
        await Receptionist.findOneAndDelete({ user: userId });
        break;
    }
  }

  // create new role profile if it doesn't exist
  if (newRole && newRole !== prevRole) {
    switch (newRole) {
      case 'DOCTOR': {
        const exists = await Doctor.findOne({ user: userId });
        if (!exists) await Doctor.create({ user: userId });
        break;
      }
      case 'PATIENT': {
        const exists = await Patient.findOne({ user: userId });
        if (!exists) await Patient.create({ user: userId });
        break;
      }
      case 'RECEPTIONIST': {
        const exists = await Receptionist.findOne({ user: userId });
        if (!exists) await Receptionist.create({ user: userId });
        break;
      }
    }
  }
}

// GET - Fetch single user by ID with related data
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Fetching User by ID ===');

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get authenticated user
    const authUser = await User.findOne({ email: session.user.email });
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Await params
    const params = await context.params;
    const userId = params.id;

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user id' },
        { status: 400 }
      );
    }

    // Find user
    const user = (await User.findById(userId)
      .select('-password')
      .lean()) as IUserDoc | null;
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get related data based on user role
    interface RelatedData {
      profile: unknown;
      totalAppointments?: number;
      totalPatients?: number;
      currentAppointments?: number;
    }
    let relatedData: RelatedData = { profile: null };

    switch (user.role) {
      case 'DOCTOR': {
        const doctorProfile = await Doctor.findOne({ user: userId })
          .populate('appointments')
          .populate('patients')
          .lean();
        relatedData = {
          profile: doctorProfile || null,
          totalAppointments: Array.isArray(doctorProfile?.appointments)
            ? doctorProfile.appointments.length
            : 0,
          totalPatients: Array.isArray(doctorProfile?.patients)
            ? doctorProfile.patients.length
            : 0,
        };
        break;
      }

      case 'PATIENT': {
        interface PatientProfile {
          _id?: mongoose.Types.ObjectId;
          user: string;
          appointments?: unknown[];
          [key: string]: unknown;
        }
        const patientProfile = (await Patient.findOne({ user: userId })
          .populate('appointments')
          .lean()) as PatientProfile | null;
        relatedData = {
          profile: patientProfile || null,
          totalAppointments: Array.isArray(patientProfile?.appointments)
            ? patientProfile.appointments.length
            : 0,
        };
        break;
      }

      case 'RECEPTIONIST': {
        const receptionistProfile = await Receptionist.findOne({
          user: userId,
        }).lean();
        relatedData = {
          profile: receptionistProfile || null,
          currentAppointments:
            receptionistProfile?.currentAppointmentsCount || 0,
        };
        break;
      }

      default:
        relatedData = { profile: null };
        break;
    }

    const userResponse = {
      ...sanitizeUserDoc(user),
      relatedData,
    };

    return NextResponse.json({
      success: true,
      data: userResponse,
    });
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    console.error('Error fetching user:', error);
    if (err?.name === 'CastError' || err?.name === 'BSONTypeError') {
      return NextResponse.json(
        { success: false, message: 'Invalid id format' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT - Update user by ID (full replace of allowed fields)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Updating User by ID ===');

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get authenticated user
    const authUser = await User.findOne({ email: session.user.email });
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Await params
    const params = await context.params;
    const userId = params.id;

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user id' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Find user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admins from demoting themselves
    if (
      userToUpdate._id.toString() === authUser._id.toString() &&
      body.role &&
      body.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { success: false, message: 'You cannot change your own admin role' },
        { status: 403 }
      );
    }

    // Allowed update fields
    const allowedUpdates = [
      'name',
      'phone',
      'image',
      'role',
      'status',
      'isEmailVerified',
    ];

    // Filter updates
    interface Updates {
      [key: string]: unknown;
    }
    const filteredUpdates: Updates = {};
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = body[key];
      }
    });

    const prevRole = userToUpdate.role;
    const newRole = filteredUpdates.role ?? prevRole;

    // If role changes, ensure role profiles are created/deleted accordingly
    if (filteredUpdates.role && filteredUpdates.role !== prevRole) {
      await ensureRoleProfilesOnChange(userId, prevRole, newRole);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    console.log('✅ User updated successfully');

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: sanitizeUserDoc(updatedUser as IUserDoc | null),
    });
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    console.error('Error updating user:', error);

    if (err.name === 'ValidationError') {
      const errors = Object.values(
        err.errors as Record<string, { message: string }>
      ).map(e => e.message);
      return NextResponse.json(
        { success: false, message: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    if (err?.name === 'CastError' || err?.name === 'BSONTypeError') {
      return NextResponse.json(
        { success: false, message: 'Invalid id format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update user',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete user by ID
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Deleting User by ID ===');

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get authenticated user
    const authUser = await User.findOne({ email: session.user.email });
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Await params
    const params = await context.params;
    const userId = params.id;

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user id' },
        { status: 400 }
      );
    }

    // Find user to delete
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admins from deleting themselves
    if (userToDelete._id.toString() === authUser._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 403 }
      );
    }

    // Delete related data based on role
    switch (userToDelete.role) {
      case 'DOCTOR':
        await Doctor.findOneAndDelete({ user: userId });
        break;
      case 'PATIENT':
        await Patient.findOneAndDelete({ user: userId });
        break;
      case 'RECEPTIONIST':
        await Receptionist.findOneAndDelete({ user: userId });
        break;
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    console.log('✅ User deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'User and related data deleted successfully',
    });
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    console.error('Error deleting user:', error);
    if (err?.name === 'CastError' || err?.name === 'BSONTypeError') {
      return NextResponse.json(
        { success: false, message: 'Invalid id format' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete user',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update user by ID
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Partial Update User by ID ===');

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get authenticated user
    const authUser = await User.findOne({ email: session.user.email });
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Await params
    const params = await context.params;
    const userId = params.id;

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user id' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Find user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Handle specific actions
    const { action, ...updates } = body;

    if (action) {
      switch (action) {
        case 'suspend':
          updates.status = 'SUSPENDED';
          break;
        case 'activate':
          updates.status = 'ACTIVE';
          break;
        case 'deactivate':
          updates.status = 'INACTIVE';
          break;
        case 'verify-email':
          updates.isEmailVerified = true;
          break;
        case 'unverify-email':
          updates.isEmailVerified = false;
          break;
      }
    }

    // Prevent admins from suspending themselves
    if (
      userToUpdate._id.toString() === authUser._id.toString() &&
      updates.status === 'SUSPENDED'
    ) {
      return NextResponse.json(
        { success: false, message: 'You cannot suspend your own account' },
        { status: 403 }
      );
    }

    // Prevent admins from demoting themselves via PATCH
    if (
      userToUpdate._id.toString() === authUser._id.toString() &&
      updates.role &&
      updates.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { success: false, message: 'You cannot change your own admin role' },
        { status: 403 }
      );
    }

    // If role change via PATCH, handle profile changes
    if (updates.role && updates.role !== userToUpdate.role) {
      await ensureRoleProfilesOnChange(userId, userToUpdate.role, updates.role);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    console.log('✅ User updated successfully');

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: sanitizeUserDoc(updatedUser as IUserDoc | null),
    });
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    console.error('Error updating user:', error);

    if (err.name === 'ValidationError') {
      const errors = Object.values(
        err.errors as Record<string, { message: string }>
      ).map(e => e.message);
      return NextResponse.json(
        { success: false, message: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    if (err?.name === 'CastError' || err?.name === 'BSONTypeError') {
      return NextResponse.json(
        { success: false, message: 'Invalid id format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update user',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
