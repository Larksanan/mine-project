/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTestRequest from '@/models/LabTestRequest';
import Patient from '@/models/Patient';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Forbidden - Patient access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.max(
      1,
      parseInt(searchParams.get('limit') || '10') || 10
    );
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const search = searchParams.get('search');

    // Find the patient profile
    const patientProfile = await Patient.findOne({ user: session.user.id })
      .select('_id firstName lastName email')
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

    const query: any = {
      patient: patientProfile._id,
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { 'test.name': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch lab test requests
    const requests = await LabTestRequest.find(query)
      .populate('doctor', 'firstName lastName email specialization')
      .populate('labTechnician', 'firstName lastName email')
      .populate('test', 'name description price')
      .sort({ requestedDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await LabTestRequest.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Format the response
    const formattedRequests = requests.map((request: any) => ({
      _id: request._id,
      status: request.status,
      priority: request.priority,
      requestedDate: request.requestedDate,
      scheduledDate: request.scheduledDate,
      completedDate: request.completedDate,
      notes: request.notes,
      results: request.results,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      doctor: request.doctor
        ? {
            id: request.doctor._id,
            name:
              request.doctor.firstName && request.doctor.lastName
                ? `Dr. ${request.doctor.firstName} ${request.doctor.lastName}`
                : request.doctor.name || 'Unknown Doctor',
            email: request.doctor.email,
            specialization: request.doctor.specialization,
          }
        : null,
      labTechnician: request.labTechnician
        ? {
            id: request.labTechnician._id,
            name:
              request.labTechnician.firstName && request.labTechnician.lastName
                ? `${request.labTechnician.firstName} ${request.labTechnician.lastName}`
                : request.labTechnician.name || 'Unknown',
            email: request.labTechnician.email,
          }
        : null,
      test: request.test
        ? {
            id: request.test._id,
            name: request.test.name,
            description: request.test.description,
            price: request.test.price,
          }
        : null,
      // Appointment fields
      appointmentType: request.appointmentType,
      reason: request.reason,
      timeSlot: request.timeSlot,
    }));

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      patient: {
        id: patientProfile._id,
        name: `${patientProfile.firstName} ${patientProfile.lastName}`,
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
    console.error('Error fetching lab test requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab test requests' },
      { status: 500 }
    );
  }
}

// POST - Patient creates a new lab test request (appointment booking)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Forbidden - Patient access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Find the patient profile
    const patientProfile = await Patient.findOne({ user: session.user.id });

    if (!patientProfile) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Validate required fields for appointment booking
    const { appointmentType, reason, date, timeSlot } = body;

    if (!appointmentType || !reason || !date || !timeSlot) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'appointmentType, reason, date, and timeSlot are required',
        },
        { status: 400 }
      );
    }

    // Create scheduled date from date and timeSlot
    const scheduledDate = new Date(`${date}T${timeSlot}`);

    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date or time format' },
        { status: 400 }
      );
    }

    // FIX 4: Save `test` (optional specific test ID) and `notes` (additional
    // notes) from the request body. Previously both fields were sent by the
    // client but never read here, so they were silently lost on every booking.
    const testRequest = new LabTestRequest({
      patient: patientProfile._id,
      doctor: body.doctorId || null,
      status: 'REQUESTED',
      priority: 'NORMAL',
      requestedDate: new Date(),
      scheduledDate: scheduledDate,
      notes: body.notes || reason, // fall back to reason if no separate notes
      appointmentType: appointmentType,
      reason: reason,
      timeSlot: timeSlot,
      ...(body.test ? { test: body.test } : {}), // only set if provided
    });

    await testRequest.save();

    // Populate the response
    await testRequest.populate([
      {
        path: 'patient',
        select: 'firstName lastName email',
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Lab test appointment requested successfully',
        data: {
          _id: testRequest._id,
          status: testRequest.status,
          scheduledDate: testRequest.scheduledDate,
          appointmentType: testRequest.appointmentType,
          reason: testRequest.reason,
          timeSlot: testRequest.timeSlot,
          notes: testRequest.notes,
          test: testRequest.test || null,
          patient: {
            id: testRequest.patient._id,
            name: `${(testRequest.patient as any).firstName} ${(testRequest.patient as any).lastName}`,
            email: (testRequest.patient as any).email,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating lab test request:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: 'Validation failed', details: messages },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create lab test request' },
      { status: 500 }
    );
  }
}
