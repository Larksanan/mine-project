/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Prescription';
import { authOptions } from '@/lib/auth';

// GET - Get single prescription by ID
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    const prescription = await Prescription.findOne({
      _id: id,
      doctorId: session.user.id,
      isActive: true,
    })
      .populate(
        'patientId',
        'firstName lastName email phone dateOfBirth gender allergies medications'
      )
      .populate('doctorId', 'firstName lastName email specialty')
      .lean();

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  } catch (error: any) {
    console.error('Error fetching prescription:', error);

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid prescription ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch prescription' },
      { status: 500 }
    );
  }
}

// PUT - Update prescription by ID
export async function PUT(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    const body = await _request.json();
    const { diagnosis, medications, notes, startDate, endDate, status } = body;

    // Check if prescription exists and belongs to doctor
    const existingPrescription = await Prescription.findOne({
      _id: id,
      doctorId: session.user.id,
      isActive: true,
    });

    if (!existingPrescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Validate medications if provided
    if (medications) {
      if (!Array.isArray(medications) || medications.length === 0) {
        return NextResponse.json(
          { error: 'At least one medication is required' },
          { status: 400 }
        );
      }

      for (let i = 0; i < medications.length; i++) {
        const med = medications[i];
        if (!med.name || !med.dosage || !med.frequency || !med.duration) {
          return NextResponse.json(
            { error: `Medication ${i + 1} is missing required fields` },
            { status: 400 }
          );
        }
      }
    }

    // Update prescription
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      {
        ...(diagnosis && { diagnosis: diagnosis.trim() }),
        ...(medications && {
          medications: medications.map(
            (med: {
              name: string;
              dosage: string;
              frequency: string;
              duration: string;
              instructions: string;
              quantity: any;
              refills: any;
            }) => ({
              name: med.name.trim(),
              dosage: med.dosage.trim(),
              frequency: med.frequency.trim(),
              duration: med.duration.trim(),
              instructions: med.instructions?.trim() || '',
              quantity: med.quantity,
              refills: med.refills || 0,
            })
          ),
        }),
        ...(typeof notes === 'string' && { notes: notes.trim() }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        'patientId',
        'firstName lastName email phone dateOfBirth gender'
      )
      .populate('doctorId', 'firstName lastName email specialty')
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedPrescription,
    });
  } catch (error: any) {
    console.error('Error updating prescription:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid prescription ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update prescription' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete prescription by ID
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    // Check if prescription exists and belongs to doctor
    const prescription = await Prescription.findOne({
      _id: id,
      doctorId: session.user.id,
      isActive: true,
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await Prescription.findByIdAndUpdate(id, {
      isActive: false,
      status: 'CANCELLED',
    });

    return NextResponse.json({
      success: true,
      message: 'Prescription deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting prescription:', error);

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid prescription ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete prescription' },
      { status: 500 }
    );
  }
}
