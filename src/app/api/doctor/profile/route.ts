/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Forbidden - Doctor access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const doctor = (await User.findById(session.user.id)) as any;

    const doctorData = doctor ? doctor.toObject() : null;

    if (!doctorData) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Ensure all required fields have default values
    const profileWithDefaults = {
      ...doctorData,
      availableHours: doctorData.availableHours || {
        start: '09:00',
        end: '17:00',
      },
      workingDays: doctorData.workingDays || [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
      ],
      consultationFee: doctorData.consultationFee || 0,
      bio: doctorData.bio || '',
      specialization: doctorData.specialization || 'General Practitioner',
      hospital: doctorData.hospital || 'Medical Center',
      licenseNumber: doctorData.licenseNumber || 'Not provided',
      experience: doctorData.experience || 0,
      education: doctorData.education || [],
      awards: doctorData.awards || [],
      profilePicture: doctorData.profilePicture || null,
    };

    return NextResponse.json({
      success: true,
      data: profileWithDefaults,
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Forbidden - Doctor access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const data = await request.json();

    // Update doctor profile
    const updatedDoctor = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          availableHours: data.availableHours,
          workingDays: data.workingDays,
          consultationFee: data.consultationFee,
          bio: data.bio,
          specialization: data.specialization,
          hospital: data.hospital,
          licenseNumber: data.licenseNumber,
          experience: data.experience,
          education: data.education,
          awards: data.awards,
          profilePicture: data.profilePicture,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedDoctor,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
