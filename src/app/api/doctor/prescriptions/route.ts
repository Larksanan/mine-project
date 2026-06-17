/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import { authOptions } from '@/lib/auth';
import { sendPrescriptions } from '@/lib/email';

// GET - Get all prescriptions with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      parseInt(searchParams.get('limit') || '20') || 20
    );
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: any = {
      isActive: true,
      doctorId: session.user.id,
    };

    // Status filter
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Patient filter
    if (patientId) {
      query.patientId = patientId;
    }

    // Search filter
    if (search) {
      const patientSearch = await Patient.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();

      const patientIds = patientSearch.map(p => p._id);

      query.$or = [
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
        { 'medications.name': { $regex: search, $options: 'i' } },
        { patientId: { $in: patientIds } },
      ];
    }

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Get prescriptions with pagination
    const prescriptions = await Prescription.find(query)
      .populate(
        'patientId',
        'firstName lastName email phone dateOfBirth gender'
      )
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
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
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}

// POST - Create new prescription
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      diagnosis,
      medications,
      notes,
      startDate,
      endDate,
      status = 'ACTIVE',
    } = body;

    // Validate required fields
    if (!patientId || !diagnosis || !medications || !startDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: patientId, diagnosis, medications, and startDate are required',
        },
        { status: 400 }
      );
    }

    // Validate medications array
    if (!Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json(
        { error: 'At least one medication is required' },
        { status: 400 }
      );
    }

    // Validate each medication
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        return NextResponse.json(
          {
            error: `Medication ${i + 1} is missing required fields: name, dosage, frequency, and duration are required`,
          },
          { status: 400 }
        );
      }
      if (!med.quantity || med.quantity <= 0) {
        return NextResponse.json(
          { error: `Medication ${i + 1}: quantity must be greater than 0` },
          { status: 400 }
        );
      }
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    let prescriptionStartDate = new Date(startDate);
    const now = new Date();
    if (prescriptionStartDate < now) {
      const diff = now.getTime() - prescriptionStartDate.getTime();
      if (diff < 24 * 60 * 60 * 1000) {
        prescriptionStartDate = new Date(now.getTime() + 60 * 1000);
      }
    }

    // Create new prescription
    const prescription = new Prescription({
      patientId,
      doctorId: session.user.id,
      diagnosis: diagnosis.trim(),
      medications: medications.map(med => ({
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        frequency: med.frequency.trim(),
        duration: med.duration.trim(),
        instructions: med.instructions?.trim() || '',
        quantity: med.quantity,
        refills: med.refills || 0,
      })),
      notes: notes?.trim() || '',
      startDate: prescriptionStartDate,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      isActive: true, // Ensure the record is active so it shows up in GET requests
    });

    console.log('Attempting to save new prescription with data:', {
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      status: prescription.status,
      isActive: prescription.isActive,
    });
    await prescription.save();
    console.log('Prescription saved successfully with ID:', prescription._id);

    // Send email notification
    try {
      if (patient.email) {
        await sendPrescriptions(
          patient.email,
          patient.firstName,
          patient.lastName,
          diagnosis,
          startDate,
          endDate || startDate
        );
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }

    // Populate the response
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate(
        'patientId',
        'firstName lastName email phone dateOfBirth gender'
      )
      .populate('doctorId', 'firstName lastName email specialty')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: populatedPrescription,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating prescription:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Prescription number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}
