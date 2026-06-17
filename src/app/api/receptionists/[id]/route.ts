import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import mongoose from 'mongoose';

export async function PATCH(
  _request: NextRequest,

  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const receptionist = await Receptionist.findById(id);

    if (!receptionist) {
      return NextResponse.json(
        { success: false, error: 'Receptionist not found' },
        { status: 404 }
      );
    }
    if (session.user.id) {
      receptionist.lastModifiedBy = new mongoose.Types.ObjectId(
        session.user.id
      );
    }

    await receptionist.save();

    await receptionist.populate('user', 'name email phone image');
    await receptionist.populate('assignedDoctor', 'name specialization');

    return NextResponse.json({
      success: true,
      data: receptionist,
      message: 'Receptionist updated successfully',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error updating receptionist:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
