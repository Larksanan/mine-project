/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import { authOptions } from '@/lib/auth';

// GET - Patient fetches their own prescriptions with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure the session user is a patient role
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      parseInt(searchParams.get('limit') || '20') || 20
    );
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Resolve the Patient profile ID from the User session ID
    const patientProfile = await Patient.findOne({ user: session.user.id })
      .select('_id')
      .lean();

    if (!patientProfile) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    // Base query - always scoped to the authenticated patient
    const query: any = {
      isActive: true,
      patientId: patientProfile._id,
    };

    // Optional status filter
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Optional full-text search across prescription fields
    if (search) {
      query.$or = [
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
        { 'medications.name': { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Fetch paginated prescriptions, populate the prescribing doctor
    const prescriptions = await Prescription.find(query)
      .populate('doctorId', 'firstName lastName email specialty')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Total count for pagination metadata
    const total = await Prescription.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: prescriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}
