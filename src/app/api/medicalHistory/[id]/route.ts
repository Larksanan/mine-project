import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MedicalHistory from '@/models/MedicalHistory';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await context.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid medical history entry ID format' },
        { status: 400 }
      );
    }

    const medicalHistoryEntry = await MedicalHistory.findById(id).lean();

    if (!medicalHistoryEntry) {
      return NextResponse.json(
        { success: false, message: 'Medical history entry not found' },
        { status: 404 }
      );
    }

    // Get patient details
    const patientDetails = await Patient.findOne({
      nic: medicalHistoryEntry.nic,
    })
      .select('firstName lastName dateOfBirth gender phone email address')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...medicalHistoryEntry,
        patientDetails,
      },
    });
  } catch (error) {
    console.error('Error fetching medical history entry:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid medical history entry ID format' },
        { status: 400 }
      );
    }

    const existingEntry = await MedicalHistory.findById(id);

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: 'Medical history entry not found' },
        { status: 404 }
      );
    }

    // If NIC is being updated, verify the new patient exists
    if (body.nic && body.nic !== existingEntry.nic) {
      const patientExists = await Patient.findOne({ nic: body.nic });
      if (!patientExists) {
        return NextResponse.json(
          { success: false, message: 'Patient not found with this NIC' },
          { status: 404 }
        );
      }
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['active', 'resolved', 'chronic'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    // Validate severity if provided
    if (body.severity) {
      const validSeverities = ['mild', 'moderate', 'severe'];
      if (!validSeverities.includes(body.severity)) {
        return NextResponse.json(
          { success: false, message: 'Invalid severity' },
          { status: 400 }
        );
      }
    }

    // Prevent updating certain fields
    const updateData = { ...body };
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    const updatedEntry = await MedicalHistory.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy: session.user.id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedEntry) {
      return NextResponse.json(
        { success: false, message: 'Failed to update medical history entry' },
        { status: 500 }
      );
    }

    // Get patient details for response
    const patientDetails = await Patient.findOne({ nic: updatedEntry.nic })
      .select('firstName lastName dateOfBirth gender phone email address')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...updatedEntry,
        patientDetails,
      },
      message: 'Medical history entry updated successfully',
    });
  } catch (error) {
    console.error('Error updating medical history:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await context.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid medical history entry ID format' },
        { status: 400 }
      );
    }

    const medicalHistoryEntry = await MedicalHistory.findById(id);

    if (!medicalHistoryEntry) {
      return NextResponse.json(
        { success: false, message: 'Medical history entry not found' },
        { status: 404 }
      );
    }

    await MedicalHistory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Medical history entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting medical history:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
