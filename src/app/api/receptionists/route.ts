/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import { EmploymentStatus, ShiftType } from '@/types/Receptionist';

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

    const total = await Receptionist.countDocuments();
    const active = await Receptionist.countDocuments({
      employmentStatus: EmploymentStatus.ACTIVE,
    });
    const onLeave = await Receptionist.countDocuments({
      employmentStatus: EmploymentStatus.ON_LEAVE,
    });
    const suspended = await Receptionist.countDocuments({
      employmentStatus: EmploymentStatus.SUSPENDED,
    });
    const terminated = await Receptionist.countDocuments({
      employmentStatus: EmploymentStatus.TERMINATED,
    });

    const byShift = {
      [ShiftType.MORNING]: await Receptionist.countDocuments({
        shift: ShiftType.MORNING,
      }),
      [ShiftType.EVENING]: await Receptionist.countDocuments({
        shift: ShiftType.EVENING,
      }),
      [ShiftType.NIGHT]: await Receptionist.countDocuments({
        shift: ShiftType.NIGHT,
      }),
      [ShiftType.FULL_DAY]: await Receptionist.countDocuments({
        shift: ShiftType.FULL_DAY,
      }),
    };

    const departmentResults = await Receptionist.aggregate([
      { $match: { department: { $exists: true, $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    const byDepartment: { [key: string]: number } = {};
    departmentResults.forEach((dept: any) => {
      byDepartment[dept._id] = dept.count;
    });

    const availableReceptionists = await Receptionist.countDocuments({
      employmentStatus: EmploymentStatus.ACTIVE,
      $expr: {
        $lt: ['$currentAppointmentsCount', '$maxAppointmentsPerDay'],
      },
    });

    const performanceResults = await Receptionist.aggregate([
      {
        $match: {
          'performanceMetrics.patientSatisfactionScore': { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgPerformance: {
            $avg: '$performanceMetrics.patientSatisfactionScore',
          },
        },
      },
    ]);

    const averagePerformance =
      performanceResults.length > 0 ? performanceResults[0].avgPerformance : 0;

    const todayAppointments = await Receptionist.aggregate([
      { $match: { employmentStatus: EmploymentStatus.ACTIVE } },
      {
        $group: {
          _id: null,
          total: { $sum: '$currentAppointmentsCount' },
        },
      },
    ]);

    const totalAppointmentsToday =
      todayAppointments.length > 0 ? todayAppointments[0].total : 0;

    return NextResponse.json({
      success: true,
      data: {
        total,
        active,
        onLeave,
        suspended,
        terminated,
        available: availableReceptionists,
        unavailable: active - availableReceptionists,
        byShift,
        byDepartment,
        averagePerformance: Math.round(averagePerformance * 100) / 100,
        totalAppointmentsToday,
      },
    });
  } catch (error: any) {
    console.error('Error fetching receptionist statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
