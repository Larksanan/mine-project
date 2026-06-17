/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTechnician from '@/models/LabTechnician';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;

    const { searchParams } = new URL(request.url);
    const includeWorkload = searchParams.get('includeWorkload') === 'true';

    let specialization: string | undefined;

    try {
      const LabTest = (await import('@/models/LabTest')).default;
      const test = await LabTest.findById(id);
      if (test && test.category) {
        specialization = test.category;
      } else {
        specialization = id.toUpperCase();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      specialization = id.toUpperCase();
    }

    const query: any = {
      isAvailable: true,
    };

    if (specialization && specialization.trim() !== '') {
      const validSpecializations = [
        'HEMATOLOGY',
        'BIOCHEMISTRY',
        'MICROBIOLOGY',
        'IMMUNOLOGY',
        'PATHOLOGY',
        'URINALYSIS',
        'ENDOCRINOLOGY',
        'TOXICOLOGY',
        'MOLECULAR_DIAGNOSTICS',
        'GENERAL',
      ];

      if (validSpecializations.includes(specialization)) {
        query.specialization = specialization;
      }
    }

    const techniciansQuery = LabTechnician.aggregate([
      { $match: query },
      {
        $addFields: {
          availableSlots: {
            $subtract: ['$maxConcurrentTests', '$currentWorkload'],
          },
          canAcceptMore: {
            $and: [
              { $eq: ['$isAvailable', true] },
              { $lt: ['$currentWorkload', '$maxConcurrentTests'] },
            ],
          },
        },
      },
      { $match: { canAcceptMore: true } },
      { $sort: { currentWorkload: 1, performanceScore: -1 } },
    ]);

    const technicians = await techniciansQuery;

    const populatedTechnicians = await LabTechnician.populate(technicians, {
      path: 'user',
      select: 'name email phone profileImage',
    });

    const filteredTechnicians = includeWorkload
      ? populatedTechnicians
      : populatedTechnicians.map((tech: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { currentWorkload, maxConcurrentTests, ...rest } = tech;
          return rest;
        });

    return NextResponse.json({
      technicians: filteredTechnicians,
      specialization: specialization || 'GENERAL',
      totalAvailable: filteredTechnicians.length,
    });
  } catch (error) {
    console.error('Error fetching available technicians:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(session.user.role || '')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id } = await context.params;

    const body = await request.json();
    const { technicianId, action = 'assign' } = body;

    if (!technicianId || typeof technicianId !== 'string') {
      return NextResponse.json(
        { error: 'Valid technician ID is required' },
        { status: 400 }
      );
    }

    const technician = await LabTechnician.findById(technicianId);

    if (!technician) {
      return NextResponse.json(
        { error: 'Lab technician not found' },
        { status: 404 }
      );
    }

    let updatedTechnician;

    if (action === 'assign') {
      if (!technician.canAcceptMoreTests()) {
        return NextResponse.json(
          { error: 'Technician cannot accept more tests at this time' },
          { status: 400 }
        );
      }
      updatedTechnician = await technician.assignTest();
    } else if (action === 'complete') {
      updatedTechnician = await technician.completeTest();
    } else if (action === 'update') {
      updatedTechnician = await technician.updateWorkload();
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "assign", "complete", or "update"' },
        { status: 400 }
      );
    }

    await updatedTechnician.populate('user', 'name email phone profileImage');

    // Create proper message based on action
    const messages: { [key: string]: string } = {
      assign: 'Test assigned successfully',
      complete: 'Test completed successfully',
      update: 'Test updated successfully',
    };

    return NextResponse.json({
      technician: updatedTechnician,
      action,
      message: messages[action],
    });
  } catch (error: any) {
    console.error('Error updating technician workload:', error);

    if (error.message.includes('cannot accept more tests')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
