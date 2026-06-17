import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/patients/search - Search patients by NIC
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const allowedRoles = [
      'ADMIN',
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
      'LABTECH',
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const nic = searchParams.get('q') || searchParams.get('nic') || '';

    if (!nic || nic.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'NIC number is required',
        },
        { status: 400 }
      );
    }

    // Search for patient by NIC (exact match or case-insensitive)
    const escapedNic = nic.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patient = await Patient.findOne({
      nic: { $regex: new RegExp(`^${escapedNic}$`, 'i') },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          message: 'Patient not found with this NIC number',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error searching patient by NIC:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
