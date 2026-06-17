/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

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

    const receptionists = await Receptionist.find()
      .populate('user', 'name')
      .lean();

    const byDepartment: Record<string, number> = receptionists.reduce(
      (acc, r: any) => {
        if (r.department) acc[r.department] = (acc[r.department] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averagePerformance =
      receptionists.reduce(
        (sum, r: any) =>
          sum +
          (typeof r.getPerformanceRating === 'function'
            ? r.getPerformanceRating()
            : 0),
        0
      ) / (receptionists.length || 1);

    const stats = {
      total: receptionists.length,
      active: receptionists.filter(r => r.employmentStatus === 'ACTIVE').length,
      onLeave: receptionists.filter(r => r.employmentStatus === 'ON_LEAVE')
        .length,
      suspended: receptionists.filter(r => r.employmentStatus === 'SUSPENDED')
        .length,
      terminated: receptionists.filter(r => r.employmentStatus === 'TERMINATED')
        .length,
      available: receptionists.filter(r => r.isAvailable).length,
      unavailable: receptionists.filter(r => !r.isAvailable).length,
      byShift: {
        MORNING: receptionists.filter(r => r.shift === 'MORNING').length,
        EVENING: receptionists.filter(r => r.shift === 'EVENING').length,
        NIGHT: receptionists.filter(r => r.shift === 'NIGHT').length,
        FULL_DAY: receptionists.filter(r => r.shift === 'FULL_DAY').length,
      },
      byDepartment,
      averagePerformance,
      totalAppointmentsToday: receptionists.reduce(
        (sum, r) => sum + (r.currentAppointmentsCount || 0),
        0
      ),
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching receptionist stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
