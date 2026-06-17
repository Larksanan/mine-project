/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import LabTestRequest from '@/models/LabTestRequest';
import Patient from '@/models/Patient';

// GET - Patient fetches a specific lab test request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    await connectDB();

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

    // Find the lab test request and ensure it belongs to this patient
    const labTestRequest = (await LabTestRequest.findOne({
      _id: id,
      patient: patientProfile._id,
    })
      .populate('doctor', 'firstName lastName email specialization')
      .populate('labTechnician', 'firstName lastName email')
      .populate('test', 'name description price normalRange')
      .lean()) as any;

    if (!labTestRequest) {
      return NextResponse.json(
        { error: 'Lab test request not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedRequest = {
      _id: labTestRequest._id,
      status: labTestRequest.status,
      priority: labTestRequest.priority,
      requestedDate: labTestRequest.requestedDate,
      scheduledDate: labTestRequest.scheduledDate,
      completedDate: labTestRequest.completedDate,
      notes: labTestRequest.notes,
      results: labTestRequest.results,
      createdAt: labTestRequest.createdAt,
      updatedAt: labTestRequest.updatedAt,
      doctor: labTestRequest.doctor
        ? {
            id: (labTestRequest.doctor as any)._id,
            name: `Dr. ${labTestRequest.doctor.firstName} ${labTestRequest.doctor.lastName}`,
            email: labTestRequest.doctor.email,
            specialization: labTestRequest.doctor.specialization,
          }
        : null,
      labTechnician: labTestRequest.labTechnician
        ? {
            id: (labTestRequest.labTechnician as any)._id,
            name: `${labTestRequest.labTechnician.firstName} ${labTestRequest.labTechnician.lastName}`,
            email: labTestRequest.labTechnician.email,
          }
        : null,
      test: labTestRequest.test
        ? {
            id: (labTestRequest.test as any)._id,
            name: labTestRequest.test.name,
            description: labTestRequest.test.description,
            price: labTestRequest.test.price,
            normalRange: labTestRequest.test.normalRange,
          }
        : null,
      appointmentType: labTestRequest.appointmentType,
      reason: labTestRequest.reason,
      timeSlot: labTestRequest.timeSlot,
    };

    return NextResponse.json({
      success: true,
      data: formattedRequest,
    });
  } catch (error) {
    console.error('Error fetching lab test request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab test request' },
      { status: 500 }
    );
  }
}
