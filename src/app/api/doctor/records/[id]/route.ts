/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import '@/models/Patient';
import '@/models/User';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!session.user.role || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Doctor access required',
        },
        { status: 403 }
      );
    }

    await connectDB();

    const params = await context.params;
    const recordId = params.id;

    const medicalRecord = await MedicalRecord.findById(recordId)
      .populate(
        'patientId',
        'firstName lastName email phone dateOfBirth gender'
      )
      .populate('doctorId', 'name email specialization')
      .lean();

    if (!medicalRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Medical record not found',
        },
        { status: 404 }
      );
    }

    let doctorIdString: string;

    if (typeof medicalRecord.doctorId === 'string') {
      doctorIdString = medicalRecord.doctorId;
    } else if (
      medicalRecord.doctorId &&
      typeof medicalRecord.doctorId === 'object'
    ) {
      doctorIdString =
        (medicalRecord.doctorId as any)._id?.toString() ||
        String(medicalRecord.doctorId);
    } else {
      doctorIdString = String(medicalRecord.doctorId);
    }

    if (doctorIdString !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied to this medical record',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: medicalRecord,
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid medical record ID',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!session.user.role || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Doctor access required',
        },
        { status: 403 }
      );
    }

    const params = await context.params;
    const recordId = params.id;
    const contentType = request.headers.get('content-type');
    let updateData: any = {};

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();

      updateData = {
        recordType: formData.get('recordType') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        status: formData.get('status') as string,
        doctorNotes: formData.get('doctorNotes') as string,
      };
    } else {
      updateData = await request.json();
    }

    await connectDB();

    const existingRecord = await MedicalRecord.findOne({
      _id: recordId,
      doctorId: session.user.id,
    });

    if (!existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Medical record not found or access denied',
        },
        { status: 404 }
      );
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (updateData.recordType) updateFields.recordType = updateData.recordType;
    if (updateData.title) updateFields.title = updateData.title;
    if (updateData.description !== undefined)
      updateFields.description = updateData.description;
    if (updateData.date) updateFields.date = new Date(updateData.date);
    if (updateData.status) updateFields.status = updateData.status;
    if (updateData.doctorNotes !== undefined)
      updateFields.doctorNotes = updateData.doctorNotes;

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      recordId,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate(
        'patientId',
        'firstName lastName email phone dateOfBirth gender'
      )
      .populate('doctorId', 'name email specialization');

    return NextResponse.json({
      success: true,
      message: 'Medical record updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Error updating medical record:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid medical record ID',
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!session.user.role || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Doctor access required',
        },
        { status: 403 }
      );
    }

    await connectDB();

    // Await params in Next.js 15
    const params = await context.params;
    const recordId = params.id;

    // Check if record exists and doctor owns it
    const existingRecord = await MedicalRecord.findOne({
      _id: recordId,
      doctorId: session.user.id,
    });

    if (!existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Medical record not found or access denied',
        },
        { status: 404 }
      );
    }

    await MedicalRecord.findByIdAndDelete(recordId);

    return NextResponse.json({
      success: true,
      message: 'Medical record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid medical record ID',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
