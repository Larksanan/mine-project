/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

let Department: any;

try {
  Department =
    mongoose.models.Department || require('@/models/Department').default;
} catch (error) {
  console.error('Error loading Department model:', error);
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!Department) {
      Department = require('@/models/Department').default;
    }

    const [
      totalDepartments,
      activeDepartments,
      inactiveDepartments,
      departmentsWithStaff,
      departmentsByFloor,
    ] = await Promise.all([
      Department.countDocuments(),
      Department.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: false }),
      Department.find({ staffCount: { $exists: true, $ne: null } }),
      Department.aggregate([
        {
          $group: {
            _id: '$floor',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalStaff = departmentsWithStaff.reduce(
      (sum: number, dept: any) => sum + (dept.staffCount || 0),
      0
    );

    const averageStaffPerDepartment =
      totalDepartments > 0 ? totalStaff / totalDepartments : 0;

    const departmentsByFloorMap = departmentsByFloor.reduce(
      (acc: Record<number, number>, item: any) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    );

    const stats = {
      totalDepartments,
      activeDepartments,
      inactiveDepartments,
      totalStaff,
      averageStaffPerDepartment:
        Math.round(averageStaffPerDepartment * 10) / 10,
      departmentsByFloor: departmentsByFloorMap,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
