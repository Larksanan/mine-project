/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '../../auth/[...nextauth]/option';
import { IWorkSchedule } from '../../../../types/Receptionist';
import Receptionist from '../../../../models/Receptionist';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await context.params;

    const body = (await request.json()) as {
      workSchedule?: Partial<IWorkSchedule>;
    };

    const receptionist = await Receptionist.findById(id);

    if (!receptionist) {
      return NextResponse.json(
        { success: false, error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    const updateSchedule = body.workSchedule;

    if (!updateSchedule || Object.keys(updateSchedule).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No schedule data provided' },
        { status: 400 }
      );
    }

    const allowedDays: (keyof IWorkSchedule)[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    const validDays = Object.keys(updateSchedule).filter(day =>
      allowedDays.includes(day as keyof IWorkSchedule)
    );

    if (validDays.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No schedule data provided' },
        { status: 400 }
      );
    }

    if (!receptionist.workSchedule) {
      receptionist.workSchedule = {} as IWorkSchedule;
    }

    for (const day of validDays) {
      const updateForDay = updateSchedule[day as keyof IWorkSchedule];
      if (updateForDay) {
        if (!receptionist.workSchedule[day as keyof IWorkSchedule]) {
          receptionist.workSchedule[day as keyof IWorkSchedule] = {} as any;
        }

        receptionist.workSchedule[day as keyof IWorkSchedule] = {
          ...receptionist.workSchedule[day as keyof IWorkSchedule],
          ...updateForDay,
        };
      }
    }

    await receptionist.save();

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      data: receptionist.workSchedule,
    });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
