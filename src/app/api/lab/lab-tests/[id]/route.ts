/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTest from '@/models/LabTest';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const { id } = await context.params;

    const test = await LabTest.findById(id).select('-__v');

    if (!test) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Error fetching lab test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'LABTECH'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;

    const body = await _request.json();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, createdAt, updatedAt, ...updateData } = body;

    const test = await LabTest.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ test });
  } catch (error: any) {
    console.error('Error updating lab test:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Test name already exists in this category' },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'LABTECH'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;

    const test = await LabTest.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!test) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Lab test deactivated successfully', test },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deactivating lab test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
