import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check user role first
    const user = await User.findOne({
      $or: [{ _id: session.user.id }, { email: session.user.email }],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a PATIENT
    if (user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, message: 'Access denied: Patient only' },
        { status: 403 }
      );
    }

    console.log('Looking for patient with userId:', session.user.id);

    // Try multiple fields to find the patient
    let patient = await Patient.findOne({ createdBy: session.user.id })
      .populate('createdBy', 'name email role')
      .lean();

    // If not found by createdBy, try by email
    if (!patient && session.user.email) {
      console.log('Not found by createdBy, trying email:', session.user.email);
      patient = await Patient.findOne({ email: session.user.email })
        .populate('createdBy', 'name email role')
        .lean();
    }

    // If still not found, try by user._id directly (if Patient has userId field)
    if (!patient) {
      console.log('Not found by email, trying userId field');
      patient = await Patient.findOne({ userId: session.user.id })
        .populate('createdBy', 'name email role')
        .lean();
    }

    if (!patient) {
      console.log('Patient profile not found for user:', session.user.id);
      return NextResponse.json(
        {
          success: false,
          message: 'Patient profile not found',
          needsRegistration: true,
        },
        { status: 404 }
      );
    }

    console.log('Found patient:', patient);

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Error fetching current patient:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
