/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Pharmacy from '@/models/Pharmacy';
import { authOptions } from '@/lib/auth';

// POST - Admin links a pharmacist user to a pharmacy's pharmacists[] array
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admins only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pharmacistEmail, pharmacistId, pharmacyId, licenseNumber } = body;

    if (!pharmacistEmail && !pharmacistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'pharmacistEmail or pharmacistId is required',
        },
        { status: 400 }
      );
    }

    if (!pharmacyId) {
      return NextResponse.json(
        { success: false, error: 'pharmacyId is required' },
        { status: 400 }
      );
    }

    if (!licenseNumber) {
      return NextResponse.json(
        { success: false, error: 'licenseNumber is required' },
        { status: 400 }
      );
    }

    // Find the pharmacist user (by id if provided, otherwise by email)
    const user = pharmacistId
      ? await User.findById(pharmacistId)
      : await User.findOne({ email: pharmacistEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pharmacist user not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'PHARMACIST') {
      return NextResponse.json(
        {
          success: false,
          error: `User has role "${user.role}", expected "PHARMACIST"`,
        },
        { status: 400 }
      );
    }

    // Find the pharmacy
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    // Prevent duplicate links
    const alreadyLinked = pharmacy.pharmacists.find(
      (p: any) => p.userId.toString() === user._id.toString()
    );
    if (alreadyLinked) {
      return NextResponse.json(
        {
          success: false,
          error: 'This pharmacist is already linked to this pharmacy',
        },
        { status: 409 }
      );
    }

    pharmacy.pharmacists.push({
      userId: user._id,
      name: user.name || user.email,
      licenseNumber,
    });

    await pharmacy.save();

    const updatedPharmacy = await Pharmacy.findById(pharmacy._id)
      .select('name pharmacists')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: updatedPharmacy,
        message: `${user.name || user.email} linked to ${pharmacy.name} successfully`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error linking pharmacist to pharmacy:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'A duplicate entry was detected. Please try again.',
          details: error.keyValue,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to link pharmacist to pharmacy',
      },
      { status: 500 }
    );
  }
}

// GET - Admin views pharmacists currently linked to a pharmacy
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admins only' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId');

    if (!pharmacyId) {
      return NextResponse.json(
        { success: false, error: 'pharmacyId query param is required' },
        { status: 400 }
      );
    }

    const pharmacy = await Pharmacy.findById(pharmacyId)
      .select('name pharmacists')
      .populate('pharmacists.userId', 'name email role')
      .lean();

    if (!pharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pharmacy,
    });
  } catch (error: any) {
    console.error('Error fetching pharmacy pharmacists:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch pharmacists',
      },
      { status: 500 }
    );
  }
}

// DELETE - Admin unlinks a pharmacist from a pharmacy
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admins only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pharmacyId, pharmacistUserId } = body;

    if (!pharmacyId || !pharmacistUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'pharmacyId and pharmacistUserId are required',
        },
        { status: 400 }
      );
    }

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    const beforeCount = pharmacy.pharmacists.length;
    pharmacy.pharmacists = pharmacy.pharmacists.filter(
      (p: any) => p.userId.toString() !== pharmacistUserId
    ) as any;

    if (pharmacy.pharmacists.length === beforeCount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pharmacist was not linked to this pharmacy',
        },
        { status: 404 }
      );
    }

    await pharmacy.save();

    return NextResponse.json({
      success: true,
      message: 'Pharmacist unlinked successfully',
    });
  } catch (error: any) {
    console.error('Error unlinking pharmacist from pharmacy:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to unlink pharmacist',
      },
      { status: 500 }
    );
  }
}
