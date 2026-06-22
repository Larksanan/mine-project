/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PHARMACIST') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      parseInt(searchParams.get('limit') || '20') || 20
    );
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const nic = searchParams.get('nic');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: any = {
      isActive: true,
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    let patientInfo: { id: string; name: string; email: string } | null = null;

    // Dedicated exact NIC lookup — pulls one patient's full prescription history
    if (nic) {
      const patient = await Patient.findOne({ nic: nic.trim() }).select(
        'firstName lastName email nic'
      );

      if (!patient) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
          patient: null,
        });
      }

      query.patientId = patient._id;
      patientInfo = {
        id: patient._id.toString(),
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
      };
    }
    // General fuzzy search — name, prescription number, diagnosis (skipped if nic was used)
    else if (search) {
      const matchingPatients = await Patient.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { nic: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const patientIds = matchingPatients.map(p => p._id);

      query.$or = [
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
        { patientId: { $in: patientIds } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .populate('patientId', 'firstName lastName phone email nic')
        .populate('doctorId', 'firstName lastName email specialty phone')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Prescription.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: prescriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      patient: patientInfo,
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}
