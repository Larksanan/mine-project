/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTechnician from '@/models/LabTechnician';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get('specialization');

    const query: any = {
      isAvailable: true,
    };

    if (specialization) {
      query.specialization = specialization;
    }

    const technicians = await LabTechnician.find({
      ...query,
      $expr: { $lt: ['$currentWorkload', '$maxConcurrentTests'] },
    })
      .populate('user', 'name email phone')
      .sort({ currentWorkload: 1, performanceScore: -1 });

    return NextResponse.json({ technicians });
  } catch (error) {
    console.error('Error fetching available technicians:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
