/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Doctor, { IDoctorModel } from '@/models/Doctor';
import User from '@/models/User';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // TEMPORARILY BYPASS AUTH FOR TESTING
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const specialization = searchParams.get('specialization');
    const department = searchParams.get('department');
    const isVerified = searchParams.get('isVerified');
    const day = searchParams.get('day');
    const topRated = searchParams.get('topRated');
    const skip = (page - 1) * limit;

    if (topRated === 'true') {
      const doctors = await (Doctor as IDoctorModel).findTopRated(limit);
      return NextResponse.json({
        success: true,
        count: doctors.length,
        data: doctors.map((doctor: any) => formatDoctorResponse(doctor)),
        page,
        limit,
        totalPages: Math.ceil(doctors.length / limit),
      });
    }

    if (specialization) {
      const doctors = await (Doctor as IDoctorModel).findBySpecialization(
        specialization,
        limit
      );
      return NextResponse.json({
        success: true,
        count: doctors.length,
        data: doctors.map((doctor: any) => formatDoctorResponse(doctor)),
        page,
        limit,
        totalPages: Math.ceil(doctors.length / limit),
      });
    }

    if (day) {
      const time = searchParams.get('time') || '09:00';
      const doctors = await (Doctor as IDoctorModel).findAvailableDoctors(
        day,
        time,
        limit
      );
      return NextResponse.json({
        success: true,
        count: doctors.length,
        data: doctors.map((doctor: any) => formatDoctorResponse(doctor)),
        page,
        limit,
        totalPages: Math.ceil(doctors.length / limit),
      });
    }
    const query: any = {};

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = users.map(u => u._id);

      query.$or = [
        { user: { $in: userIds } },
        { 'profile.specialization': { $regex: search, $options: 'i' } },
        { 'profile.department': { $regex: search, $options: 'i' } },
      ];
    }

    if (department) {
      query['profile.department'] = { $regex: department, $options: 'i' };
    }

    if (isVerified !== null && isVerified !== undefined) {
      query['profile.isVerified'] = isVerified === 'true';
    }

    // Determine sort order
    const sort: any = {};
    if (sortBy === 'name') {
      sort['user.name'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'email') {
      sort['user.email'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'specialization') {
      sort['profile.specialization'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'department') {
      sort['profile.department'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'experience') {
      sort['profile.experience'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'consultationFee') {
      sort['profile.consultationFee'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'rating') {
      sort['profile.rating.average'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Get total count for pagination
    const total = await Doctor.countDocuments(query);

    // Fetch doctors with pagination
    const doctors = await Doctor.find(query)
      .populate('user', 'name email phone image')
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean();

    return NextResponse.json({
      success: true,
      count: doctors.length,
      total,
      data: doctors.map((doctor: any) => formatDoctorResponse(doctor)),
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

function formatDoctorResponse(doctor: any) {
  return {
    id: doctor._id.toString(),
    name: doctor.user?.name || 'Unknown',
    email: doctor.user?.email || '',
    phone: doctor.user?.phone || '',
    image: doctor.user?.image || null,
    specialization: doctor.profile?.specialization || '',
    department: doctor.profile?.department || '',
    experience: doctor.profile?.experience || 0,
    consultationFee: doctor.profile?.consultationFee || 0,
    isVerified: doctor.profile?.isVerified || false,
    rating: doctor.profile?.rating || { average: 0, count: 0 },
    licenseNumber: doctor.profile?.licenseNumber || '',
    licenseExpiry: doctor.profile?.licenseExpiry || null,
    qualifications: doctor.profile?.qualifications || [],
    languages: doctor.profile?.languages || [],
    services: doctor.profile?.services || [],
    availability: doctor.profile?.availability || {},
    hospital: doctor.profile?.hospitalAffiliation || '',
    awards: doctor.profile?.awards || [],
    publications: doctor.profile?.publications || [],
    appointments: doctor.appointments || [],
    patients: doctor.patients || [],
    schedules: doctor.schedules || [],
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // TEMPORARILY BYPASS AUTH FOR TESTING
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();

    const { userId, profile } = body;

    if (!userId || !profile) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and profile are required' },
        { status: 400 }
      );
    }

    const {
      specialization,
      qualifications,
      experience,
      consultationFee,
      availability,
      department,
      licenseNumber,
      licenseExpiry,
      languages,
      services,
    } = profile;

    if (
      !specialization ||
      !qualifications ||
      experience === undefined ||
      consultationFee === undefined ||
      !availability ||
      !department ||
      !licenseNumber ||
      !licenseExpiry ||
      !languages ||
      !services
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required profile fields: specialization, qualifications, experience, consultationFee, availability, department, licenseNumber, licenseExpiry, languages, and services are required',
        },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingDoctor = await Doctor.findOne({ user: userId });
    if (existingDoctor) {
      return NextResponse.json(
        { error: 'Doctor profile already exists for this user' },
        { status: 409 }
      );
    }

    const existingLicense = await Doctor.findOne({
      'profile.licenseNumber': licenseNumber.toUpperCase(),
    });
    if (existingLicense) {
      return NextResponse.json(
        { error: 'A doctor with this license number already exists' },
        { status: 409 }
      );
    }

    const doctor = new Doctor({
      user: userId,
      profile: {
        specialization,
        qualifications,
        experience,
        consultationFee,
        availability,
        hospitalAffiliation: profile.hospitalAffiliation,
        department,
        licenseNumber: licenseNumber.toUpperCase(),
        licenseExpiry: new Date(licenseExpiry),
        isVerified: false,
        languages,
        services,
        awards: profile.awards || [],
        publications: profile.publications || [],
        rating: {
          average: 0,
          count: 0,
        },
      },
      appointments: [],
      patients: [],
      schedules: [],
    });

    await doctor.save();
    await doctor.populate('user', 'name email phone image');

    return NextResponse.json(
      {
        success: true,
        data: formatDoctorResponse(doctor),
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      if (error.keyPattern?.user) {
        return NextResponse.json(
          { error: 'Doctor profile already exists for this user' },
          { status: 409 }
        );
      }
      if (error.keyPattern?.['profile.licenseNumber']) {
        return NextResponse.json(
          { error: 'A doctor with this license number already exists' },
          { status: 409 }
        );
      }
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create doctor profile', details: error.message },
      { status: 500 }
    );
  }
}
