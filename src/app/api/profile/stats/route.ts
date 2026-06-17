import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    return NextResponse.json({
      success: true,
      data: {
        appointmentsCount: 0,
        patientsCount: 0,
        prescriptionsCount: 0,
        labReportsCount: 0,
        lastActive: new Date(),
        memberSince: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
