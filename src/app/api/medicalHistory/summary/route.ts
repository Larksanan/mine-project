import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MedicalHistory from '@/models/MedicalHistory';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const nic = searchParams.get('nic');

    if (!nic) {
      return NextResponse.json(
        { success: false, message: 'Patient NIC is required' },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await Patient.findOne({ nic }).lean();
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get summary using the static method
    const summary = await MedicalHistory.getPatientSummary(nic);

    // Get recent conditions
    const recentConditions = await MedicalHistory.find({ nic })
      .sort({ diagnosisDate: -1 })
      .limit(5)
      .select('condition diagnosisDate status severity')
      .lean();

    // Get active medications (unique list from all active conditions)
    const activeConditions = await MedicalHistory.find({
      nic,
      status: { $in: ['active', 'chronic'] },
    }).lean();

    const allMedications = activeConditions
      .flatMap(condition => condition.medications || [])
      .filter((med, index, self) => med && self.indexOf(med) === index);

    // Get condition timeline
    const conditionTimeline = await MedicalHistory.aggregate([
      {
        $match: {
          nic: nic,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$diagnosisDate' },
            month: { $month: '$diagnosisDate' },
          },
          count: { $sum: 1 },
          conditions: { $push: '$condition' },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 },
      },
      {
        $limit: 12,
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        patientInfo: {
          name: `${patient.firstName} ${patient.lastName}`,
          nic: patient.nic,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
        },
        summary,
        recentConditions: recentConditions.map(condition => ({
          ...condition,
          diagnosisDate: condition.diagnosisDate?.toISOString().split('T')[0],
        })),
        activeMedications: allMedications,
        conditionTimeline: conditionTimeline.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.count,
          conditions: item.conditions,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching medical history summary:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
