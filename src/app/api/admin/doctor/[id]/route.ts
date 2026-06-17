/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const doctor = await Doctor.findById(id)
      .populate('user', 'name email phone image')
      .lean();

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Get appointment count
    const appointmentCount = await Appointment.countDocuments({
      doctor: (doctor.user as any)._id,
      isActive: true,
    });

    // Get unique patient count
    const uniquePatients = await Appointment.distinct('patient', {
      doctor: (doctor.user as any)._id,
      isActive: true,
    });

    // Format the response to match frontend expectations
    const formattedDoctor = formatDoctorResponse(doctor);

    return NextResponse.json({
      success: true,
      data: {
        ...formattedDoctor,
        stats: {
          totalAppointments: appointmentCount,
          totalPatients: uniquePatients.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}

// Helper function to format doctor response (same as in the list API)
function formatDoctorResponse(doctor: any) {
  return {
    id: doctor._id.toString(),
    name: doctor.user?.name || 'Unknown',
    email: doctor.user?.email || '',
    phone: doctor.user?.phone || '',
    image: doctor.user?.image || null,
    specialization: doctor.profile?.specialization || '',
    department: doctor.profile?.department || '',
    experience: doctor.profile?.experience || 0,
    consultationFee: doctor.profile?.consultationFee || 0,
    isVerified: doctor.profile?.isVerified || false,
    rating: doctor.profile?.rating || { average: 0, count: 0 },
    licenseNumber: doctor.profile?.licenseNumber || '',
    licenseExpiry: doctor.profile?.licenseExpiry || null,
    qualifications: doctor.profile?.qualifications || [],
    languages: doctor.profile?.languages || [],
    services: doctor.profile?.services || [],
    availability: doctor.profile?.availability || {},
    hospital: doctor.profile?.hospitalAffiliation || '',
    awards: doctor.profile?.awards || [],
    publications: doctor.profile?.publications || [],
    appointments: doctor.appointments || [],
    patients: doctor.patients || [],
    schedules: doctor.schedules || [],
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Check if doctor exists
    const existingDoctor = await Doctor.findById(id);
    if (!existingDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Check permissions - only admin or the doctor themselves can update
    const currentUser = await User.findById(session.user.id);
    if (
      !currentUser ||
      (currentUser.role !== 'ADMIN' &&
        existingDoctor.user.toString() !== session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle profile updates
    if (body.profile) {
      // Update individual profile fields
      const profileUpdates = body.profile;

      // Update user information if provided
      if (profileUpdates.name || profileUpdates.email || profileUpdates.phone) {
        const userUpdates: any = {};
        if (profileUpdates.name !== undefined)
          userUpdates.name = profileUpdates.name;
        if (profileUpdates.email !== undefined)
          userUpdates.email = profileUpdates.email;
        if (profileUpdates.phone !== undefined)
          userUpdates.phone = profileUpdates.phone;

        await User.findByIdAndUpdate(existingDoctor.user, userUpdates);
      }

      // Update doctor profile fields
      Object.keys(profileUpdates).forEach(key => {
        if (key !== 'name' && key !== 'email' && key !== 'phone') {
          if (profileUpdates[key] !== undefined) {
            (existingDoctor.profile as any)[key] = profileUpdates[key];
          }
        }
      });
    }

    // Update other fields if provided
    if (body.appointments) existingDoctor.appointments = body.appointments;
    if (body.patients) existingDoctor.patients = body.patients;
    if (body.schedules) existingDoctor.schedules = body.schedules;

    await existingDoctor.save();

    // Populate user data
    await existingDoctor.populate('user', 'name email phone image');

    return NextResponse.json({
      success: true,
      data: formatDoctorResponse(existingDoctor),
    });
  } catch (error: any) {
    console.error('Error updating doctor:', error);

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
        { error: 'Duplicate field value entered' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update doctor', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if user is admin
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Update user role back to USER
    await User.findByIdAndUpdate(doctor.user, { role: 'USER' });

    return NextResponse.json({
      success: true,
      message: 'Doctor profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json(
      { error: 'Failed to delete doctor' },
      { status: 500 }
    );
  }
}
