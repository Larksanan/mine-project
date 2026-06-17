/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session user:', session?.user?.email);

    if (!session || !session.user) {
      console.log('No session found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    console.log('Database connected');

    // Get user
    const user = await User.findOne({ email: session.user.email });
    console.log('Found user:', user?.email, 'Role:', user?.role);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view doctors
    const allowedRoles = [
      'ADMIN',
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
      'PATIENT',
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filter parameters
    const search = searchParams.get('search') || '';
    const specialization = searchParams.get('specialization');
    const department = searchParams.get('department');
    const isVerified = searchParams.get('isVerified');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('Query parameters:', {
      page,
      limit,
      search,
      specialization,
      department,
      isVerified,
      sortBy,
      sortOrder,
    });

    // Build query
    const query: any = {};

    // Search across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { hospital: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by specialization
    if (specialization && specialization !== 'ALL') {
      query.specialization = specialization;
    }

    // Filter by department
    if (department && department !== 'ALL') {
      query.department = department;
    }

    // Filter by verification status
    if (isVerified !== null && isVerified !== '') {
      query.isVerified = isVerified === 'true';
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    // Define sort order
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .populate('user', 'name email phone image')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(query),
    ]);

    console.log(`Found ${doctors.length} doctors out of ${total} total`);

    // Format doctors data
    const doctorsFormatted = doctors.map(doctor => ({
      ...doctor,
      createdAtFormatted: doctor.createdAt
        ? new Date(doctor.createdAt).toISOString()
        : null,
      licenseExpiryFormatted: doctor.profile?.experience
        ? new Date(doctor.profile.experience).toISOString().split('T')[0]
        : null,
    }));

    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    const hasNextPage = page < pages;
    const hasPrevPage = page > 1;

    // Get statistics for the current query
    const stats = await Doctor.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] },
          },
          avgConsultationFee: { $avg: '$consultationFee' },
          avgExperience: { $avg: '$experience' },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalCount: 0,
      verifiedCount: 0,
      avgConsultationFee: 0,
      avgExperience: 0,
    };

    // Get specialization distribution
    const specializationStats = await Doctor.aggregate([
      { $match: query },
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get department distribution
    const departmentStats = await Doctor.aggregate([
      { $match: query },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: doctorsFormatted,
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
        specialization,
        department,
        isVerified,
        sortBy,
        sortOrder,
      },
      statistics: {
        total: statistics.totalCount,
        verified: statistics.verifiedCount,
        avgConsultationFee: Math.round(statistics.avgConsultationFee || 0),
        avgExperience: Math.round((statistics.avgExperience || 0) * 10) / 10,
        specializations: specializationStats.reduce(
          (acc, curr) => {
            acc[curr._id || 'Unknown'] = curr.count;
            return acc;
          },
          {} as Record<string, number>
        ),
        departments: departmentStats.reduce(
          (acc, curr) => {
            acc[curr._id || 'Unknown'] = curr.count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      metadata: {
        requestId: Date.now(),
        timestamp: new Date().toISOString(),
        userRole: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch doctors',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
