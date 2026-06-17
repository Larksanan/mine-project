/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    await connectDB();

    // Get user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view patients
    const allowedRoles = [
      'ADMIN',
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
      'PATIENT',
      'LABTECH',
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
    const gender = searchParams.get('gender');
    const bloodType = searchParams.get('bloodType');
    const maritalStatus = searchParams.get('maritalStatus');
    const isActive = searchParams.get('isActive');
    const createdBy = searchParams.get('createdBy');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Date range filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dobStart = searchParams.get('dobStart');
    const dobEnd = searchParams.get('dobEnd');

    // Build query
    const query: any = {};

    // Search across multiple fields
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { nic: { $regex: search, $options: 'i' } },
        { occupation: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'emergencyContact.name': { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by gender
    if (gender && gender !== 'ALL') {
      query.gender = gender;
    }

    // Filter by blood type
    if (bloodType && bloodType !== 'ALL') {
      query.bloodType = bloodType;
    }

    // Filter by marital status
    if (maritalStatus && maritalStatus !== 'ALL') {
      query.maritalStatus = maritalStatus;
    }

    // Filter by active status
    if (isActive !== null && isActive !== '') {
      query.isActive = isActive === 'true' ? { $ne: false } : false;
    }

    // Filter by creator
    if (createdBy) {
      query.createdBy = createdBy;
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

    // Date range filter for date of birth
    if (dobStart || dobEnd) {
      query.dateOfBirth = {};
      if (dobStart) {
        query.dateOfBirth.$gte = new Date(dobStart);
      }
      if (dobEnd) {
        query.dateOfBirth.$lte = new Date(dobEnd);
      }
    }

    // Define sort order
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate('createdBy', 'firstName lastName email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance
      Patient.countDocuments(query),
    ]);

    // Calculate age for each patient
    const patientsWithAge = patients.map(patient => {
      let age = null;
      if (patient.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(patient.dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }

      return {
        ...patient,
        age,
        // Format dates for display
        dateOfBirthFormatted: patient.dateOfBirth
          ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
          : null,
        createdAtFormatted: patient.createdAt
          ? new Date(patient.createdAt).toISOString()
          : null,
        lastVisitFormatted: patient.lastVisit
          ? new Date(patient.lastVisit).toISOString()
          : null,
      };
    });

    // Optional: Apply age group filtering in memory if needed
    const ageGroup = searchParams.get('ageGroup');
    let filteredPatients = patientsWithAge;
    let filteredTotal = total;

    if (ageGroup && ageGroup !== 'ALL') {
      filteredPatients = patientsWithAge.filter(patient => {
        if (!patient.age) return false;

        switch (ageGroup) {
          case 'INFANT':
            return patient.age < 1;
          case 'CHILD':
            return patient.age >= 1 && patient.age < 13;
          case 'TEEN':
            return patient.age >= 13 && patient.age < 20;
          case 'ADULT':
            return patient.age >= 20 && patient.age < 60;
          case 'SENIOR':
            return patient.age >= 60;
          default:
            return true;
        }
      });
      filteredTotal = filteredPatients.length;
    }

    // Calculate pagination info
    const pages = Math.ceil(filteredTotal / limit);
    const hasNextPage = page < pages;
    const hasPrevPage = page > 1;

    // Get statistics for the current query
    const stats = await Patient.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          maleCount: {
            $sum: { $cond: [{ $eq: ['$gender', 'MALE'] }, 1, 0] },
          },
          femaleCount: {
            $sum: { $cond: [{ $eq: ['$gender', 'FEMALE'] }, 1, 0] },
          },
          otherGenderCount: {
            $sum: { $cond: [{ $eq: ['$gender', 'OTHER'] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalCount: 0,
      activeCount: 0,
      maleCount: 0,
      femaleCount: 0,
      otherGenderCount: 0,
    };

    // Get blood type distribution
    const bloodTypeStats = await Patient.aggregate([
      { $match: query },
      { $group: { _id: '$bloodType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: filteredPatients,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        pages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      filters: {
        search,
        gender,
        bloodType,
        maritalStatus,
        isActive,
        ageGroup,
        startDate,
        endDate,
        dobStart,
        dobEnd,
        sortBy,
        sortOrder,
      },
      statistics: {
        total: statistics.totalCount,
        active: statistics.activeCount,
        genders: {
          male: statistics.maleCount,
          female: statistics.femaleCount,
          other: statistics.otherGenderCount,
        },
        bloodTypes: bloodTypeStats.reduce(
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
        queryTime: Date.now(), // Add query execution time
      },
    });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch patients',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
