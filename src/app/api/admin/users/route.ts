import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Receptionist from '@/models/Receptionist';
import Appointment from '@/models/Appointment';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface UserLean {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  role?: string;
  status?: string;
  isEmailVerified?: boolean;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date | null;
}

interface DateFilter {
  $gte?: Date;
  $lte?: Date;
}

interface UserQuery {
  $or?: Array<Record<string, unknown>>;
  role?: string;
  status?: string;
  isEmailVerified?: boolean;
  createdAt?: DateFilter;
  lastLogin?: DateFilter;
}

interface StatsResult {
  _id: null;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  suspendedCount: number;
  verifiedCount: number;
}

interface RoleStatsResult {
  _id: string;
  count: number;
}

function sanitizeUser(user: UserLean) {
  const sanitized = { ...user };
  if (sanitized.password) {
    delete sanitized.password;
  }
  return {
    ...sanitized,
    _id: sanitized._id.toString(),
    createdAtFormatted: sanitized.createdAt
      ? new Date(sanitized.createdAt).toISOString()
      : null,
    updatedAtFormatted: sanitized.updatedAt
      ? new Date(sanitized.updatedAt).toISOString()
      : null,
    lastLoginFormatted: sanitized.lastLogin
      ? new Date(sanitized.lastLogin).toISOString()
      : null,
  };
}

// GET - Fetch all users with pagination, filtering, and search
export async function GET(request: NextRequest) {
  try {
    console.log('=== Starting Admin Users Fetch ===');

    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session user:', session?.user?.email);

    if (!session || !session.user) {
      console.log('No session found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();
    console.log('Database connected');

    // Get authenticated user
    const authUser = await User.findOne({ email: session.user.email });
    console.log('Found user:', authUser?.email, 'Role:', authUser?.role);

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

    // Get query parameters
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filter parameters
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const isEmailVerified = searchParams.get('isEmailVerified');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Date range filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const lastLoginStart = searchParams.get('lastLoginStart');
    const lastLoginEnd = searchParams.get('lastLoginEnd');

    console.log('Query parameters:', {
      page,
      limit,
      search,
      role,
      status,
      isEmailVerified,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      lastLoginStart,
      lastLoginEnd,
    });

    // Build query
    const query: UserQuery = {};

    // Search across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by role
    if (role && role !== 'ALL') {
      query.role = role;
    }

    // Filter by status
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Filter by email verification
    if (isEmailVerified !== null && isEmailVerified !== '') {
      query.isEmailVerified = isEmailVerified === 'true';
    }

    // Date range filter for creation date
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Date range filter for last login
    if (lastLoginStart || lastLoginEnd) {
      query.lastLogin = {};
      if (lastLoginStart) {
        query.lastLogin.$gte = new Date(lastLoginStart);
      }
      if (lastLoginEnd) {
        query.lastLogin.$lte = new Date(lastLoginEnd);
      }
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    // Define sort order
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean<UserLean[]>(),
      User.countDocuments(query),
    ]);

    console.log(`Found ${users.length} users out of ${total} total`);

    // Format users data
    const formattedUsers = users.map(user => sanitizeUser(user));

    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    const hasNextPage = page < pages;
    const hasPrevPage = page > 1;

    // Get statistics
    const stats = await User.aggregate<StatsResult>([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] },
          },
          inactiveCount: {
            $sum: { $cond: [{ $eq: ['$status', 'INACTIVE'] }, 1, 0] },
          },
          suspendedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'SUSPENDED'] }, 1, 0] },
          },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      suspendedCount: 0,
      verifiedCount: 0,
    };

    // Get role distribution
    const roleStats = await User.aggregate<RoleStatsResult>([
      { $match: query },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      filters: {
        search,
        role,
        status,
        isEmailVerified,
        startDate,
        endDate,
        lastLoginStart,
        lastLoginEnd,
        sortBy,
        sortOrder,
      },
      statistics: {
        total: statistics.totalCount,
        active: statistics.activeCount,
        inactive: statistics.inactiveCount,
        suspended: statistics.suspendedCount,
        verified: statistics.verifiedCount,
        unverified: statistics.totalCount - statistics.verifiedCount,
        roles: roleStats.reduce<Record<string, number>>((acc, curr) => {
          acc[curr._id || 'Unknown'] = curr.count;
          return acc;
        }, {}),
      },
      metadata: {
        requestId: Date.now(),
        timestamp: new Date().toISOString(),
        userRole: authUser.role,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users',
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

// POST - Create a new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('=== Creating New User ===');

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

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Missing required fields: name, email, password, and role are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate role
    const validRoles = [
      'ADMIN',
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
      'PATIENT',
      'PHARMACIST',
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Hash password
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phone: phone?.trim() || '',
      image: body.image || '',
      status: body.status || 'ACTIVE',
      isEmailVerified: body.isEmailVerified || false,
      createdBy: authUser._id,
    });

    await newUser.save();

    // Create role-specific profile
    switch (role) {
      case 'DOCTOR': {
        const doctorExists = await Doctor.findOne({ user: newUser._id });
        if (!doctorExists) {
          await Doctor.create({
            user: newUser._id,
            createdBy: authUser._id,
          });
        }
        break;
      }
      case 'PATIENT': {
        const patientExists = await Patient.findOne({ user: newUser._id });
        if (!patientExists) {
          await Patient.create({
            user: newUser._id,
            createdBy: authUser._id,
          });
        }
        break;
      }
      case 'RECEPTIONIST': {
        const receptionistExists = await Receptionist.findOne({
          user: newUser._id,
        });
        if (!receptionistExists) {
          await Receptionist.create({
            user: newUser._id,
            createdBy: authUser._id,
          });
        }
        break;
      }
    }

    // Get user without password
    const userResponse = await User.findById(newUser._id)
      .select('-password')
      .lean<UserLean>();

    console.log('✅ User created successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: userResponse ? sanitizeUser(userResponse) : null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    console.error('Error creating user:', error);

    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(
        err.errors as Record<string, { message: string }>
      ).map(e => e.message);
      return NextResponse.json(
        { success: false, message: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create user',
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

// PATCH - Update user (role, status, etc.)
export async function PATCH(request: NextRequest) {
  try {
    console.log('=== Updating User ===');

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

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user id format' },
        { status: 400 }
      );
    }

    // Find user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return NextResponse.json(
        { success: false, message: 'User to update not found' },
        { status: 404 }
      );
    }

    // Prevent admins from demoting themselves
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

    // Allowed update fields
    const allowedUpdates = [
      'name',
      'phone',
      'image',
      'role',
      'status',
      'isEmailVerified',
    ];

    // Filter updates to only allowed fields
    const filteredUpdates: Record<string, unknown> = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // If role changes, handle profile creation/deletion
    if (filteredUpdates.role && filteredUpdates.role !== userToUpdate.role) {
      const prevRole = userToUpdate.role;
      const newRole = filteredUpdates.role as string;

      // Delete old role profile
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

      // Create new role profile
      switch (newRole) {
        case 'DOCTOR': {
          const exists = await Doctor.findOne({ user: userId });
          if (!exists)
            await Doctor.create({
              user: userId,
              createdBy: authUser._id,
            });
          break;
        }
        case 'PATIENT': {
          const exists = await Patient.findOne({ user: userId });
          if (!exists)
            await Patient.create({
              user: userId,
              createdBy: authUser._id,
            });
          break;
        }
        case 'RECEPTIONIST': {
          const exists = await Receptionist.findOne({ user: userId });
          if (!exists)
            await Receptionist.create({
              user: userId,
              createdBy: authUser._id,
            });
          break;
        }
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean<UserLean>();

    console.log('✅ User updated successfully');

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser ? sanitizeUser(updatedUser) : null,
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

// DELETE - Delete user (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    console.log('=== Deleting User ===');

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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user id format' },
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
        // Also delete doctor's appointments
        await Appointment.deleteMany({ doctor: userId });
        break;
      case 'PATIENT':
        await Patient.findOneAndDelete({ user: userId });
        // Also delete patient's appointments
        await Appointment.deleteMany({ patient: userId });
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
      message: 'User deleted successfully',
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
