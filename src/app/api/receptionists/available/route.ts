/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import { IReceptionist } from '@/types/Receptionist';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const receptionists: IReceptionist[] = await (
      Receptionist.findAvailableReceptionists() as any
    )
      .populate('user', 'name email phone image')
      .populate('assignedDoctor', 'name specialization email')
      .lean();

    return NextResponse.json({
      success: true,
      data: receptionists,
      count: receptionists.length,
    });
  } catch (error: any) {
    console.error('Error fetching available receptionists:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
