import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const nic = searchParams.get('nic');

    // Validate input parameters
    if (!email && !nic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either email or NIC parameter is required',
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate NIC format if provided
    if (nic) {
      const nicRegex = /^[0-9]{9}[VXvx]|[0-9]{12}$/;
      if (!nicRegex.test(nic)) {
        return NextResponse.json(
          { success: false, message: 'Invalid NIC format' },
          { status: 400 }
        );
      }
    }

    // Build query to check for existing patient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
      isActive: true, // Only check active patients
    };

    if (email && nic) {
      query.$or = [{ email: email.toLowerCase() }, { nic: nic.toUpperCase() }];
    } else if (email) {
      query.email = email.toLowerCase();
    } else if (nic) {
      query.nic = nic.toUpperCase();
    }

    // Check for existing patient
    const existingPatient = await Patient.findOne(query);

    if (existingPatient) {
      let field = '';
      let value = '';

      if (existingPatient.email === email?.toLowerCase()) {
        field = 'email';
        value = email;
      } else if (existingPatient.nic === nic?.toUpperCase()) {
        field = 'NIC';
        value = nic;
      }

      return NextResponse.json({
        exists: true,
        field: field,
        value: value,
        message: `Patient with this ${field} already exists`,
        patient: {
          id: existingPatient._id,
          firstName: existingPatient.firstName,
          lastName: existingPatient.lastName,
          email: existingPatient.email,
          nic: existingPatient.nic,
        },
      });
    }

    // No existing patient found
    return NextResponse.json({
      exists: false,
      message: 'No patient found with the provided credentials',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error checking patient existence:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
