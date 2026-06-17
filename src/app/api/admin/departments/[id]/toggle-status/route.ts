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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!Department) {
      Department = require('@/models/Department').default;
    }

    const department = await Department.findById(id);

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    department.isActive = !department.isActive;
    await department.save();

    await department.populate('head', 'name email image role');

    return NextResponse.json({ department });
  } catch (error) {
    console.error('Error toggling department status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
