/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Forbidden - Patient access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Find patient by user ID (Patient model has a reference to User)
    const patient = await Patient.findOne({ user: session.user.id })
      .populate('user', 'name email phone role') // Populate user details
      .exec();

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Convert to object and handle virtuals
    const patientData = patient.toObject();

    return NextResponse.json({
      success: true,
      data: patientData,
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// If you want to include the patient's appointments as well, you could do:
export async function GET_WITH_APPOINTMENTS() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Forbidden - Patient access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const patient = await Patient.findOne({ user: session.user.id })
      .populate('user', 'name email phone role image')
      .populate({
        path: 'appointments',
        select: 'date time doctor status type notes',
        populate: {
          path: 'doctor',
          select: 'name specialization',
        },
        options: {
          sort: { date: -1 },
          limit: 10, // Optional: limit to recent appointments
        },
      })
      .exec();

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: patient.toObject(),
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// If you want to handle PUT/PATCH for updating patient profile:
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Forbidden - Patient access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Remove fields that shouldn't be updated via this endpoint
    const { _id, user, createdAt, updatedAt, ...updateData } = body;

    await connectDB();

    // Find and update patient
    const patient = await Patient.findOneAndUpdate(
      { user: session.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email phone role');

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: patient.toObject(),
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating patient profile:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate field value entered' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
