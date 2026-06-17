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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!Department) {
      Department = require('@/models/Department').default;
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const floor = searchParams.get('floor');
    const hasHead = searchParams.get('hasHead');

    // Build query
    const query: any = {};

    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (floor) {
      query.floor = parseInt(floor);
    }

    if (hasHead !== null) {
      if (hasHead === 'true') {
        query.head = { $exists: true, $ne: null };
      } else {
        query.$or = [{ head: { $exists: false } }, { head: null }];
      }
    }

    const departments = await Department.find(query)
      .sort({ name: 1 })
      .populate('head', 'name email image role');

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!Department) {
      Department = require('@/models/Department').default;
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    const department = new Department(body);
    await department.save();

    return NextResponse.json({ department }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Department with this name or code already exists' },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
