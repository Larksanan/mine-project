import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session exists:', !!session);
    console.log('Session user:', session?.user);

    // Connect to database
    await connectDB();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const department = searchParams.get('department');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { nic: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users
    const [usersRaw, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(query),
    ]);

    // Transform users to ensure id field exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = usersRaw.map((user: any) => ({
      ...user,
      id: user._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + users.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin or staff privileges
    await connectDB();
    const currentUser = await User.findOne({ email: session.user?.email });

    if (
      !currentUser ||
      !currentUser.hasRole(['ADMIN', 'RECEPTIONIST', 'STAFF'])
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      name,
      email,
      nic,
      role,
      phone,
      department,
      specialization,
      address,
    } = body;

    // Validate required fields
    if (!name || !email || !nic) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, email, nic' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { nic }],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingUser.email === email
              ? 'Email already registered'
              : 'NIC already registered',
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      nic,
      role: role || 'USER',
      phone,
      department,
      specialization,
      address,
      isActive: true,
    });

    // Remove password from response
    const userObject = newUser.toJSON();

    return NextResponse.json(
      {
        success: true,
        data: userObject,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update user (requires user ID in body or query)
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user ID from query or body
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('id');
    const body = await req.json();
    const updateData = body;

    if (!userId && !updateData.id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const targetUserId = userId || updateData.id;

    // Check authorization
    const currentUser = await User.findOne({ email: session.user?.email });
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Users can update their own profile, admins can update anyone
    if (
      currentUser?._id.toString() !== targetUserId &&
      !currentUser?.hasRole('ADMIN')
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData._id;
    delete updateData.password;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete user (soft delete by setting isActive to false)
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user ID
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if current user is admin
    const currentUser = await User.findOne({ email: session.user?.email });

    if (!currentUser?.hasRole('ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Soft delete - set isActive to false
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } },
      { new: true }
    ).select('-password');

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedUser,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
