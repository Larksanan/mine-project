import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MedicalHistory from '@/models/MedicalHistory';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

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
    const patientId = searchParams.get('patientId');
    const nic = searchParams.get('nic');

    if (!patientId && !nic) {
      return NextResponse.json(
        { success: false, message: 'Either Patient ID or NIC is required' },
        { status: 400 }
      );
    }

    let patientNic = nic;
    let patientInfo = null;

    // If patientId is provided, get the NIC from Patient model
    if (patientId) {
      // Validate MongoDB ObjectId format
      if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json(
          { success: false, message: 'Invalid patient ID format' },
          { status: 400 }
        );
      }

      const patient = await Patient.findById(patientId)
        .select('nic firstName lastName')
        .lean();
      if (!patient) {
        return NextResponse.json(
          { success: false, message: 'Patient not found' },
          { status: 404 }
        );
      }
      patientNic = patient.nic;
      patientInfo = patient;
    } else if (nic) {
      // If NIC is provided, get patient info
      const patient = await Patient.findOne({ nic })
        .select('firstName lastName')
        .lean();
      if (!patient) {
        return NextResponse.json(
          { success: false, message: 'Patient not found' },
          { status: 404 }
        );
      }
      patientInfo = patient;
    }

    // Get status counts
    const statusCounts = await MedicalHistory.aggregate([
      {
        $match: { nic: patientNic },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get severity counts
    const severityCounts = await MedicalHistory.aggregate([
      {
        $match: { nic: patientNic },
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent conditions
    const recentConditions = await MedicalHistory.find({ nic: patientNic })
      .sort({ diagnosisDate: -1 })
      .limit(5)
      .select('condition diagnosisDate status severity')
      .lean();

    // Get active conditions
    const activeConditions = await MedicalHistory.countDocuments({
      nic: patientNic,
      status: 'active',
    });

    // Get chronic conditions
    const chronicConditions = await MedicalHistory.countDocuments({
      nic: patientNic,
      status: 'chronic',
    });

    // Format the response
    const statusSummary = {
      patientInfo: patientInfo
        ? {
            id: patientId || null,
            nic: patientNic,
            name: `${patientInfo.firstName} ${patientInfo.lastName}`,
          }
        : null,
      counts: {
        total: await MedicalHistory.countDocuments({ nic: patientNic }),
        active: statusCounts.find(item => item._id === 'active')?.count || 0,
        resolved:
          statusCounts.find(item => item._id === 'resolved')?.count || 0,
        chronic: statusCounts.find(item => item._id === 'chronic')?.count || 0,
      },
      severity: {
        mild: severityCounts.find(item => item._id === 'mild')?.count || 0,
        moderate:
          severityCounts.find(item => item._id === 'moderate')?.count || 0,
        severe: severityCounts.find(item => item._id === 'severe')?.count || 0,
      },
      activeConditions,
      chronicConditions,
      recentConditions: recentConditions.map(condition => ({
        ...condition,
        diagnosisDate: condition.diagnosisDate?.toISOString().split('T')[0],
      })),
    };

    return NextResponse.json({
      success: true,
      data: statusSummary,
    });
  } catch (error) {
    console.error('Error fetching medical history status:', error);

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
