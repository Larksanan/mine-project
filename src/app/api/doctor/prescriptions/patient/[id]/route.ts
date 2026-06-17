import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import { authOptions } from '@/lib/auth';

// GET - Get a specific prescription by ID for the authenticated patient
export async function GET(
  request: NextRequest,
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

    // Find the prescription and ensure it belongs to this patient
    const prescription = await Prescription.findOne({
      _id: id,
      patientId: patientProfile._id,
      isActive: true,
    })
      .populate('doctorId', 'firstName lastName email specialty phone')
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
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescription' },
      { status: 500 }
    );
  }
}
