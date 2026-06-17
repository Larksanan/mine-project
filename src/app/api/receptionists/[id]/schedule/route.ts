import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import { IWorkSchedule } from '@/types/Receptionist';

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

    const updateSchedule = body.workSchedule;

    // Check if workSchedule is missing or is an empty object
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

    // Filter out invalid day keys before checking if there's valid data
    const validDays = Object.keys(updateSchedule).filter(day =>
      allowedDays.includes(day as keyof IWorkSchedule)
    );

    // If no valid days are provided after filtering, return 400
    if (validDays.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No schedule data provided' },
        { status: 400 }
      );
    }

    const receptionist = await Receptionist.findById(id);

    if (!receptionist) {
      return NextResponse.json(
        { success: false, error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    // Initialize workSchedule if it doesn't exist
    if (!receptionist.workSchedule) {
      receptionist.workSchedule = {} as IWorkSchedule;
    }

    // Update only valid days
    for (const day of validDays) {
      const updateForDay = updateSchedule[day as keyof IWorkSchedule];
      if (updateForDay) {
        // Initialize the day if it doesn't exist
        if (!receptionist.workSchedule[day as keyof IWorkSchedule]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
