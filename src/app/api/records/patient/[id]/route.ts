/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import Patient from '@/models/Patient';
import { authOptions } from '@/lib/auth';
import '@/models/User';

// GET - Get a specific medical record by ID for the authenticated patient
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Forbidden - Patient access required' },
        { status: 403 }
      );
    }

    // Await params to get the id
    const { id } = await params;

    // Find the patient profile
    const patientProfile = await Patient.findOne({ user: session.user.id })
      .select('_id')
      .lean();

    if (!patientProfile) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Find the medical record and ensure it belongs to this patient
    const record = (await MedicalRecord.findOne({
      _id: id,
      patientId: patientProfile._id,
    })
      .populate(
        'doctorId',
        'name firstName lastName email specialization specialty phone'
      )
      .lean()) as any;

    if (!record) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedRecord = {
      _id: record._id,
      recordType: record.recordType,
      title: record.title,
      description: record.description,
      date: record.date,
      status: record.status,
      attachments: record.attachments || [],
      doctorNotes: record.doctorNotes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      doctor: record.doctorId
        ? {
            name:
              record.doctorId.firstName && record.doctorId.lastName
                ? `Dr. ${record.doctorId.firstName} ${record.doctorId.lastName}`
                : record.doctorId.name || 'Unknown Doctor',

            email: record.doctorId.email,
            specialization:
              record.doctorId.specialization || record.doctorId.specialty,
            phone: record.doctorId.phone,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: formattedRecord,
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical record' },
      { status: 500 }
    );
  }
}
