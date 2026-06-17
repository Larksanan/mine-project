/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import Patient from '@/models/Patient';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure the session user is a patient role
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Forbidden - Patient access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      parseInt(searchParams.get('limit') || '10') || 10
    );
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const recordType = searchParams.get('recordType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Find the patient profile using the user ID from session
    const patientProfile = await Patient.findOne({ user: session.user.id })
      .select(
        '_id firstName lastName email nic phone address dateOfBirth gender'
      )
      .lean();

    if (!patientProfile) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No patient profile found',
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

    // Build query - only get medical records for this patient
    const query: any = {
      patientId: patientProfile._id,
    };

    // Optional record type filter
    if (recordType && recordType !== 'ALL') {
      query.recordType = recordType;
    }

    // Optional status filter
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Optional search across title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { doctorNotes: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Fetch medical records with doctor details populated
    const records = await MedicalRecord.find(query)
      .populate('doctorId', 'name email specialization specialty phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await MedicalRecord.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Format the response for better readability
    const formattedRecords = records.map((record: any) => ({
      _id: record._id,
      recordType: record.recordType,
      title: record.title,
      description: record.description,
      date: record.date,
      status: record.status,
      attachments: record.attachments || [],
      doctorNotes: record.doctorNotes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      doctor: record.doctorId
        ? {
            id: record.doctorId._id.toString(),
            name: record.doctorId.name?.startsWith('Dr.')
              ? record.doctorId.name
              : `Dr. ${record.doctorId.name || 'Unknown Doctor'}`,

            email: record.doctorId.email,
            specialization:
              record.doctorId.specialization || record.doctorId.specialty,
            phone: record.doctorId.phone,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedRecords,
      patient: {
        id: patientProfile._id,
        name: `${patientProfile.firstName} ${patientProfile.lastName}`,
        nic: patientProfile.nic,
        phone: patientProfile.phone,
        address: patientProfile.address,
        dob: patientProfile.dateOfBirth,
        gender: patientProfile.gender,
        email: patientProfile.email,
      },
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
    console.error('Error fetching patient medical records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}
