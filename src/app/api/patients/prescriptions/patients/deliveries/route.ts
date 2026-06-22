/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Delivery from '@/models/Delivery';
import Patient from '@/models/Patient';
import Pharmacy from '@/models/Pharmacy';
import { authOptions } from '@/lib/auth';

async function getPatientForSession(userId: string) {
  return Patient.findOne({ user: userId });
}

async function getPharmacyForPharmacist(userId: string) {
  return Pharmacy.findOne({ 'pharmacists.userId': userId });
}

// GET - List deliveries, scoped by the logged-in user's role
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

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      parseInt(searchParams.get('limit') || '20') || 20
    );
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = { isActive: true };

    if (session.user.role === 'PATIENT') {
      const patient = await getPatientForSession(session.user.id);
      if (!patient) {
        return NextResponse.json(
          { success: false, error: 'Patient profile not found' },
          { status: 404 }
        );
      }
      query.patientId = patient._id;
    } else if (session.user.role === 'PHARMACIST') {
      const pharmacy = await getPharmacyForPharmacist(session.user.id);
      if (!pharmacy) {
        return NextResponse.json(
          {
            success: false,
            error:
              'No pharmacy is linked to this account. Ask an admin to add you to a pharmacy.',
          },
          { status: 404 }
        );
      }
      query.pharmaciesID = pharmacy._id;
    } else if (session.user.role === 'ADMIN') {
      // Admins see everything, with optional filters
      const pharmacyIdFilter = searchParams.get('pharmacyId');
      const patientIdFilter = searchParams.get('patientId');
      if (pharmacyIdFilter) query.pharmaciesID = pharmacyIdFilter;
      if (patientIdFilter) query.patientId = patientIdFilter;
    } else {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      // Find patients matching the search
      const matchingPatients = await Patient.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { phone: searchRegex },
        ],
      }).select('_id');

      const patientIds = matchingPatients.map(p => p._id);

      // Find pharmacies matching the search
      const matchingPharmacies = await Pharmacy.find({
        $or: [{ name: searchRegex }, { address: searchRegex }],
      }).select('_id');

      const pharmacyIds = matchingPharmacies.map(p => p._id);

      query.$or = [
        { patientId: { $in: patientIds } },
        { pharmaciesID: { $in: pharmacyIds } },
        { trackingNumber: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const deliveries = await Delivery.find(query)
      .populate(
        'prescriptionId',
        'prescriptionNumber diagnosis status attachmentUrl'
      )
      .populate('patientId', 'firstName lastName phone email')
      .populate('pharmaciesID', 'name address contact phone services')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Delivery.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: deliveries,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch deliveries',
      },
      { status: 500 }
    );
  }
}
