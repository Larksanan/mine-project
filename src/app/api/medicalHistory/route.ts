import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MedicalHistory from '@/models/MedicalHistory';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const nic = searchParams.get('nic');
    const status = searchParams.get('status');
    const condition = searchParams.get('condition');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (nic) {
      query.nic = nic;
    }

    if (status) {
      query.status = status;
    }

    if (condition) {
      query.condition = { $regex: condition, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch medical history with pagination
    const medicalHistory = await MedicalHistory.find(query)
      .sort({ diagnosisDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await MedicalHistory.countDocuments(query);

    // Enrich with patient details if needed
    const enrichedData = await Promise.all(
      medicalHistory.map(async entry => {
        const patient = await Patient.findOne({ nic: entry.nic })
          .select('firstName lastName dateOfBirth gender phone email')
          .lean();
        return {
          ...entry,
          patientDetails: patient || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Validation
    const requiredFields = [
      'nic',
      'condition',
      'diagnosisDate',
      'status',
      'severity',
    ];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate that patient exists with this NIC
    const patientExists = await Patient.findOne({ nic: body.nic });
    if (!patientExists) {
      return NextResponse.json(
        { success: false, message: 'Patient not found with this NIC' },
        { status: 404 }
      );
    }

    // Validate status
    const validStatuses = ['active', 'resolved', 'chronic'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['mild', 'moderate', 'severe'];
    if (!validSeverities.includes(body.severity)) {
      return NextResponse.json(
        { success: false, message: 'Invalid severity' },
        { status: 400 }
      );
    }

    // Create new medical history entry
    const medicalHistoryEntry = new MedicalHistory({
      ...body,
      patientId: patientExists._id,
      createdBy: session.user.id,
    });

    await medicalHistoryEntry.save();

    // Get patient details for response
    const patientDetails = await Patient.findOne({ nic: body.nic })
      .select('firstName lastName dateOfBirth gender phone email')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          ...medicalHistoryEntry.toObject(),
          patientDetails,
        },
        message: 'Medical history entry created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating medical history:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
