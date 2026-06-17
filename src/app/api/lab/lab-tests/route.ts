/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTest from '@/models/LabTest';

// GET all lab tests
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (activeOnly) {
      query.isActive = true;
    }

    const tests = await LabTest.find(query).sort({ name: 1 });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new lab test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'DOCTOR'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    const test = new LabTest(body);
    await test.save();

    return NextResponse.json({ test }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lab test:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Test name already exists in this category' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
