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

    const technician = await LabTechnician.findById(id)
      .populate('user', 'name email')
      .select('currentWorkload maxConcurrentTests efficiency isAvailable');

    if (!technician) {
      return NextResponse.json(
        { error: 'Lab technician not found' },
        { status: 404 }
      );
    }
    const LabTestRequest = (await import('@/models/LabTestRequest')).default;
    const activeTests = await LabTestRequest.countDocuments({
      labTechnician: id,
      status: { $in: ['SAMPLE_COLLECTED', 'IN_PROGRESS'] },
    });

    const workloadInfo = {
      technician: {
        name: technician.user.name,
        currentWorkload: technician.currentWorkload,
        maxConcurrentTests: technician.maxConcurrentTests,
        efficiency: technician.efficiency,
        isAvailable: technician.isAvailable,
      },
      activeTests,
      availableSlots:
        technician.maxConcurrentTests - technician.currentWorkload,
      canAcceptMore: technician.canAcceptMoreTests(),
    };

    return NextResponse.json(workloadInfo);
  } catch (error) {
    console.error('Error fetching technician workload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;

    const body = await request.json();
    const { action } = body;

    const technician = await LabTechnician.findById(id);

    if (!technician) {
      return NextResponse.json(
        { error: 'Lab technician not found' },
        { status: 404 }
      );
    }

    let updatedTechnician;

    switch (action) {
      case 'assign':
        updatedTechnician = await technician.assignTest();
        break;
      case 'complete':
        updatedTechnician = await technician.completeTest();
        break;
      case 'update':
        updatedTechnician = await technician.updateWorkload();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "assign", "complete", or "update"' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      technician: updatedTechnician,
      message: `Workload ${action}ed successfully`,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error updating workload:', error);

    if (error.message.includes('maximum workload')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
