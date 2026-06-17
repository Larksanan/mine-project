/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTechnician from '@/models/LabTechnician';

// GET specific lab technician
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Properly await the params
    const { id } = await params;

    // Check if id exists and is valid
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid technician ID' },
        { status: 400 }
      );
    }

    const technician = await LabTechnician.findById(id)
      .populate('user', 'name email phone profileImage')
      .select('-__v');

    if (!technician) {
      return NextResponse.json(
        { error: 'Lab technician not found' },
        { status: 404 }
      );
    }

    // Return in the format expected by the frontend
    return NextResponse.json({
      success: true,
      technician,
    });
  } catch (error: any) {
    console.error('Error fetching lab technician:', error);

    // Handle specific MongoDB CastError
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      return NextResponse.json(
        { error: 'Invalid technician ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE lab technician
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'LABTECH'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Properly await the params
    const { id } = await params;

    // Check if id exists and is valid
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid technician ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Remove fields that shouldn't be updated
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, employeeId, _id, createdAt, updatedAt, ...updateData } = body;

    const technician = await LabTechnician.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('user', 'name email phone profileImage');

    if (!technician) {
      return NextResponse.json(
        { error: 'Lab technician not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      technician,
    });
  } catch (error: any) {
    console.error('Error updating lab technician:', error);

    // Handle specific MongoDB CastError
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      return NextResponse.json(
        { error: 'Invalid technician ID format' },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE lab technician
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Properly await the params
    const { id } = await params;

    // Check if id exists and is valid
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid technician ID' },
        { status: 400 }
      );
    }

    const technician = await LabTechnician.findByIdAndDelete(id);

    if (!technician) {
      return NextResponse.json(
        { error: 'Lab technician not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Lab technician deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting lab technician:', error);

    // Handle specific MongoDB CastError
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      return NextResponse.json(
        { error: 'Invalid technician ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
