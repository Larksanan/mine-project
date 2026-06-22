import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Prescription';
import { authOptions } from '@/lib/auth';

// GET - Fetch a single prescription's full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PHARMACIST') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid prescription ID' },
        { status: 400 }
      );
    }

    const prescription = await Prescription.findOne({
      _id: id,
      isActive: true,
    })
      .populate('patientId', 'firstName lastName email phone nic')
      .populate('doctorId', 'firstName lastName email specialty phone')
      .lean();

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescription' },
      { status: 500 }
    );
  }
}

// PATCH - Pharmacist updates prescription status (e.g. mark as DISPENSED/COMPLETED)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PHARMACIST') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid prescription ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    const allowedStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status must be one of: ${allowedStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const prescription = await Prescription.findOneAndUpdate(
      { _id: id, isActive: true },
      {
        status,
        updatedAt: new Date(),
        ...(status === 'COMPLETED' && {
          dispensedBy: session.user.id,
          dispensedAt: new Date(),
        }),
      },
      { new: true }
    )
      .populate('patientId', 'firstName lastName email phone nic')
      .populate('doctorId', 'firstName lastName email specialty phone');

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update prescription' },
      { status: 500 }
    );
  }
}
