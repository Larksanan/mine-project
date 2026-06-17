/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTestRequest from '@/models/LabTestRequest';
import Patient from '@/models/Patient';
import LabTest from '@/models/LabTest';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Find the patient document for this user
    const patient = await Patient.findOne({ user: session.user.id });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = { patient: patient._id };

    if (status) {
      query.status = status;
    }

    // Fetch lab test requests
    const requests = await LabTestRequest.find(query)
      .populate(
        'patient',
        'firstName lastName email nic phone dateOfBirth height weight'
      )
      .populate('doctor', 'name email')
      .populate('labTechnician', 'name email')
      .populate('test')
      .sort({ requestedDate: -1, createdAt: -1 });

    return NextResponse.json({
      requests,
      patient: {
        _id: patient._id,
        email: patient.email,
        nic: patient.nic,
      },
    });
  } catch (error) {
    console.error('Error fetching patient lab test requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new lab test request for patient
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.test) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    if (!body.requestedDate) {
      return NextResponse.json(
        { error: 'Requested date is required' },
        { status: 400 }
      );
    }

    // Find the patient document for this user
    let patient = await Patient.findOne({ user: session.user.id });

    // If patient provided a patient ID directly, use that
    if (body.patient) {
      patient = await Patient.findById(body.patient);
    }

    if (!patient) {
      return NextResponse.json(
        {
          error:
            'Patient profile not found. Please complete your profile first.',
        },
        { status: 404 }
      );
    }

    // Verify the test exists
    const labTest = await LabTest.findById(body.test);
    if (!labTest) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    if (!labTest.isActive) {
      return NextResponse.json(
        { error: 'This test is currently not available' },
        { status: 400 }
      );
    }

    // Validate dates
    const requestedDate = new Date(body.requestedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return NextResponse.json(
        { error: 'Requested date cannot be in the past' },
        { status: 400 }
      );
    }

    if (body.scheduledDate) {
      const scheduledDate = new Date(body.scheduledDate);
      if (scheduledDate < requestedDate) {
        return NextResponse.json(
          { error: 'Scheduled date cannot be before requested date' },
          { status: 400 }
        );
      }
    }

    // Create the test request
    const testRequest = new LabTestRequest({
      patient: patient._id,
      test: body.test,
      status: body.status || 'REQUESTED',
      priority: body.priority || 'NORMAL',
      requestedDate: body.requestedDate,
      scheduledDate: body.scheduledDate || undefined,
      notes: body.notes || '',
      attachments: body.attachments || [],
      // Doctor and lab technician will be assigned by staff
      doctor: body.doctor || undefined,
      labTechnician: body.labTechnician || undefined,
    });

    await testRequest.save();

    // Populate the saved document
    await testRequest.populate([
      {
        path: 'patient',
        select: 'firstName lastName email nic phone dateOfBirth height weight',
      },
      { path: 'test' },
      { path: 'doctor', select: 'name email' },
      { path: 'labTechnician', select: 'name email' },
    ]);

    return NextResponse.json(
      {
        testRequest,
        message:
          'Lab test request submitted successfully. Our team will contact you soon.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating patient lab test request:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: `Invalid ${error.path}: ${error.value}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update lab test request (cancel only for patients)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Find the patient document
    const patient = await Patient.findOne({ user: session.user.id });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Find the test request
    const testRequest = await LabTestRequest.findById(requestId);

    if (!testRequest) {
      return NextResponse.json(
        { error: 'Test request not found' },
        { status: 404 }
      );
    }

    // Verify this request belongs to the patient
    if (testRequest.patient.toString() !== patient._id.toString()) {
      return NextResponse.json(
        { error: 'You can only modify your own requests' },
        { status: 403 }
      );
    }

    // Patients can only cancel requests that haven't been processed
    if (action === 'cancel') {
      if (
        testRequest.status === 'COMPLETED' ||
        testRequest.status === 'IN_PROGRESS'
      ) {
        return NextResponse.json(
          {
            error:
              'Cannot cancel a request that is already in progress or completed',
          },
          { status: 400 }
        );
      }

      testRequest.status = 'CANCELLED';
      testRequest.notes = testRequest.notes
        ? `${testRequest.notes}\n\nCancelled by patient on ${new Date().toISOString()}`
        : `Cancelled by patient on ${new Date().toISOString()}`;

      await testRequest.save();

      await testRequest.populate([
        {
          path: 'patient',
          select:
            'firstName lastName email nic phone dateOfBirth height weight',
        },
        { path: 'test' },
        { path: 'doctor', select: 'name email' },
        { path: 'labTechnician', select: 'name email' },
      ]);

      return NextResponse.json({
        testRequest,
        message: 'Test request cancelled successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Patients can only cancel requests.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating patient lab test request:', error);

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
