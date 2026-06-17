/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTestRequest from '@/models/LabTestRequest';
import Patient from '@/models/Patient';

// GET all lab test requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const technicianId = searchParams.get('technicianId');

    const query: any = {};

    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (technicianId) query.labTechnician = technicianId;

    const requests = await LabTestRequest.find(query)
      .populate({
        path: 'patient',
        select: 'firstName lastName email dateOfBirth height weight',
      })
      .populate('doctor', 'name email')
      .populate('labTechnician', 'name email')
      .populate('test')
      .sort({ requestedDate: -1 });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching lab test requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new lab test request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !['DOCTOR', 'ADMIN', 'LABTECH', 'PATIENT'].includes(
        session.user.role || ''
      )
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    // Resolve Patient ID
    const targetId =
      session.user.role === 'PATIENT' ? session.user.id : body.patient;

    let patient = await Patient.findOne({ user: targetId });

    if (!patient) {
      patient = await Patient.findById(targetId);
    }

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Build the document — only include `test` if it was provided.
    // Patient self-bookings (appointments) don't have a test yet;
    // a doctor/lab tech will assign one later.
    const docData: any = {
      patient: patient._id,
      doctor: body.doctorId || session.user.id,
      status: body.status || 'REQUESTED',
      priority: body.priority || 'NORMAL',
      requestedDate: body.requestedDate || new Date(),
      notes: body.notes,
      // Appointment-specific fields (ignored by model if not in schema)
      appointmentType: body.appointmentType,
      reason: body.reason,
      timeSlot: body.timeSlot,
      scheduledDate: body.date
        ? new Date(`${body.date}T${body.timeSlot || '09:00'}`)
        : undefined,
    };

    // Only set `test` if provided — avoids the validation error for
    // patient self-bookings that don't yet have a test assigned
    if (body.test) {
      docData.test = body.test;
    }

    const testRequest = new LabTestRequest(docData);

    await testRequest.save();

    await testRequest.populate([
      {
        path: 'patient',
        select: 'firstName lastName email dateOfBirth height weight',
      },
    ]);

    return NextResponse.json({ testRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lab test request:', error);

    // Return validation errors clearly instead of generic 500
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: 'Validation failed', details: messages },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
