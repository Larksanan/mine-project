import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

export async function GET(_request: NextRequest) {
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

    // Find doctor user with settings
    const doctor = (await User.findById(session.user.id)
      .select(
        'name email phone specialization licenseNumber hospital bio consultationFee availableHours workingDays'
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .lean()) as any;

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        name: doctor.name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        specialization: doctor.specialization || '',
        licenseNumber: doctor.licenseNumber || '',
        hospital: doctor.hospital || '',
        bio: doctor.bio || '',
        consultationFee: doctor.consultationFee || 0,
        availableHours: doctor.availableHours || {
          start: '09:00',
          end: '17:00',
        },
        workingDays: doctor.workingDays || [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching doctor settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      phone,
      specialization,
      licenseNumber,
      hospital,
      bio,
      consultationFee,
      availableHours,
      workingDays,
    } = body;

    await connectDB();

    // Update doctor settings
    const updatedDoctor = await User.findByIdAndUpdate(
      session.user.id,
      {
        name,
        phone,
        specialization,
        licenseNumber,
        hospital,
        bio,
        consultationFee,
        availableHours,
        workingDays,
      },
      { new: true, runValidators: true }
    ).select(
      'name email phone specialization licenseNumber hospital bio consultationFee availableHours workingDays'
    );

    if (!updatedDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedDoctor,
    });
  } catch (error) {
    console.error('Error updating doctor settings:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
