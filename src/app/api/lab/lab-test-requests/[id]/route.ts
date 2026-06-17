/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTestRequest from '@/models/LabTestRequest';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params; // ← Add await here

    const testRequest = await LabTestRequest.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('labTechnician', 'name email employeeId')
      .populate('test');

    if (!testRequest) {
      return NextResponse.json(
        { error: 'Test request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ testRequest });
  } catch (error: any) {
    console.error('Error fetching lab test request:', error);
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params; // ← Add await here

    const body = await request.json();
    const testRequest = await LabTestRequest.findById(id);

    if (!testRequest) {
      return NextResponse.json(
        { error: 'Test request not found' },
        { status: 404 }
      );
    }

    // Whitelist and apply updates
    const allowedUpdates = [
      'results',
      'findings',
      'notes',
      'labTechnician',
      'priority',
    ];
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        testRequest[key] = body[key];
      }
    }

    if (body.status) {
      await testRequest.updateStatus(body.status);
    }
    await testRequest.save();

    await testRequest.populate([
      { path: 'patient', select: 'name email' },
      { path: 'doctor', select: 'name email' },
      { path: 'labTechnician', select: 'name email employeeId' },
      { path: 'test' },
    ]);

    return NextResponse.json({ testRequest });
  } catch (error: any) {
    console.error('Error updating lab test request:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
