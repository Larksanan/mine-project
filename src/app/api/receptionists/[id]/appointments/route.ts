/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

interface AppointmentUpdateBody {
  action?: 'increment' | 'decrement';
  count?: number;
}

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

    await connectDB();

    const body = (await _request.json()) as AppointmentUpdateBody;

    const { id } = await params;
    const receptionist = await Receptionist.findById(id);

    if (!receptionist) {
      return NextResponse.json(
        { success: false, error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    const current = receptionist.currentAppointmentsCount || 0;

    if (body.count !== undefined) {
      receptionist.currentAppointmentsCount = body.count;
    } else if (body.action === 'increment') {
      receptionist.currentAppointmentsCount = current + 1;
    } else if (body.action === 'decrement') {
      receptionist.currentAppointmentsCount = Math.max(0, current - 1);
    }

    await receptionist.save();

    return NextResponse.json({
      success: true,
      data: {
        currentCount: receptionist.currentAppointmentsCount,
        maxCount: receptionist.maxAppointmentsPerDay,
        canHandleMore: receptionist.canHandleMoreAppointments(),
      },
      message: 'Appointment count updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating appointment count:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
