/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import { IPerformanceMetrics } from '@/types/Receptionist';

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

    const { id } = await params;

    const body = (await _request.json()) as Partial<IPerformanceMetrics>;

    const receptionist = await Receptionist.findById(id);

    if (!receptionist) {
      return NextResponse.json(
        { success: false, error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    if (!receptionist.performanceMetrics) {
      receptionist.performanceMetrics = {
        averageCheckInTime: 0,
        averageAppointmentTime: 0,
        patientSatisfactionScore: 0,
        totalAppointmentsHandled: 0,
        errorRate: 0,
      };
    }

    // Allowed keys from interface
    const allowedKeys: (keyof IPerformanceMetrics)[] = [
      'averageCheckInTime',
      'averageAppointmentTime',
      'patientSatisfactionScore',
      'totalAppointmentsHandled',
      'errorRate',
    ];

    // Type-safe assignment
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        receptionist.performanceMetrics[key] = body[key]!;
      }
    }

    await receptionist.save();

    return NextResponse.json({
      success: true,
      data: receptionist.performanceMetrics,
      rating: receptionist.getPerformanceRating?.(),
      message: 'Performance metrics updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating performance metrics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
