/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { ICreateReceptionistRequest } from '@/types/Receptionist';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  // Await params before accessing its properties
  const { id } = await params;

  try {
    const receptionist = await Receptionist.findById(id).populate(
      'user',
      'name email'
    );

    if (!receptionist) {
      return NextResponse.json(
        { success: false, error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: receptionist });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  // Await params before accessing its properties
  const { id } = await params;

  try {
    const body: Partial<ICreateReceptionistRequest> = await request.json();
    const { employeeId, shift, employmentType, hireDate, department } = body;

    const updatedReceptionist = await Receptionist.findByIdAndUpdate(
      id,
      { employeeId, shift, employmentType, hireDate, department },
      { new: true, runValidators: true }
    );

    if (!updatedReceptionist) {
      return NextResponse.json(
        { success: false, error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReceptionist,
      message: 'Receptionist updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  // Await params before accessing its properties
  const { id } = await params;

  try {
    const deletedReceptionist = await Receptionist.findByIdAndDelete(id);

    if (!deletedReceptionist) {
      return NextResponse.json(
        { success: false, error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Receptionist deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
