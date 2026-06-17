/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTechnician from '@/models/LabTechnician';
import User from '../../../../models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const shift = searchParams.get('shift');
    const specialization = searchParams.get('specialization');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const query: any = {};

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (shift && shift !== 'All') {
      query.shift = shift;
    }

    if (specialization && specialization !== 'All') {
      query.specialization = { $in: [specialization] };
    }

    if (availableOnly) {
      query.isAvailable = true;
      query.$expr = { $lt: ['$currentWorkload', '$maxConcurrentTests'] };
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [technicians, total] = await Promise.all([
      LabTechnician.find(query)
        .populate('user', 'name email phone nic')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      LabTechnician.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      technicians,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching lab technicians:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    // Check if user is already assigned to a technician profile
    if (body.user) {
      const existingUser = await LabTechnician.findOne({ user: body.user });
      if (existingUser) {
        return NextResponse.json(
          { error: 'This user is already assigned to a technician profile' },
          { status: 409 }
        );
      }
    }

    // Helper to map frontend enum keys to backend display values
    const mapSpecialization = (spec: string) => {
      const map: Record<string, string> = {
        HEMATOLOGY: 'Hematology',
        CLINICAL_CHEMISTRY: 'Clinical Chemistry',
        MICROBIOLOGY: 'Microbiology',
        IMMUNOLOGY: 'Immunology',
        PATHOLOGY: 'Pathology',
        CYTOLOGY: 'Cytology',
        MOLECULAR_BIOLOGY: 'Molecular Biology',
        BLOOD_BANK: 'Blood Bank',
        GENERAL_LABORATORY: 'General Laboratory',
      };
      return map[spec] || spec;
    };

    // Generate Employee ID if not provided
    let employeeId = body.employeeId;

    // If ID is provided but already exists, force auto-generation
    if (employeeId) {
      const existingId = await LabTechnician.findOne({ employeeId });
      if (existingId) employeeId = null;
    }

    if (!employeeId) {
      const lastTech = await LabTechnician.findOne({}, { employeeId: 1 }).sort({
        _id: -1,
      });

      let nextNum = 1;
      if (lastTech?.employeeId?.startsWith('EMP')) {
        const num = parseInt(lastTech.employeeId.substring(3));
        if (!isNaN(num)) nextNum = num + 1;
      }

      employeeId = `EMP${String(nextNum).padStart(3, '0')}`;
    }

    // Map form fields to model fields
    const technicianData = {
      user: body.user || undefined,
      name: body.name,
      employeeId: employeeId,
      email: body.email,
      phone: body.phone,
      specialization: (Array.isArray(body.specialization)
        ? body.specialization
        : [body.specialization]
      ).map(mapSpecialization),
      qualification: body.qualification,
      yearsOfExperience: body.yearsOfExperience || 0,
      status: body.status,
      shift: body.shift || 'GENERAL',
      maxConcurrentTests: body.maxConcurrentTests || 10,
      joinedDate: body.joinedDate ? new Date(body.joinedDate) : new Date(),
      certifications: body.certifications || [],
      notes: body.notes || '',
      isAvailable: body.status === 'AVAILABLE',
      currentWorkload: 0,
      performanceScore: 100,
    };

    const technician = new LabTechnician(technicianData);
    await technician.save();

    if (body.user) {
      await User.findByIdAndUpdate(body.user, { role: 'LABTECH' });
    }

    await technician.populate('user', 'name email phone nic');

    return NextResponse.json(
      {
        success: true,
        technician,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return NextResponse.json(
        {
          error:
            field === 'user'
              ? 'This user is already assigned to a technician profile'
              : `Duplicate value for ${field || 'field'}`,
        },
        { status: 409 }
      );
    }

    console.error('Error creating lab technician:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));
      console.error('Validation errors:', errors);

      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
