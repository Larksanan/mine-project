/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Patientprescription';
import Pharmacy from '@/models/Pharmacy';
import Delivery from '@/models/Delivery';
import Patient from '@/models/Patient';
import { authOptions } from '@/lib/auth';

// Finds the pharmacy this pharmacist belongs to via the pharmacists[] sub-array
async function getPharmacyForPharmacist(userId: string) {
  return Pharmacy.findOne({ 'pharmacists.userId': userId });
}

// Force Mongoose to register these models before any populate() calls.
// Next.js can tree-shake or defer unused imports, so we touch the models explicitly.
void Patient;
void Delivery;

// GET - Pharmacist fetches prescriptions sent to their pharmacy
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Ensure models are registered after DB connection (handles hot-reload edge cases)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/models/Patient');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/models/Delivery');

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

    // Find the pharmacy this pharmacist is registered under
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

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      parseInt(searchParams.get('limit') || '20') || 20
    );
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {
      pharmaciesID: pharmacy._id,
      sentTopharmacies: true,
      isActive: true,
    };

    if (status && status !== 'ALL') {
      query.pharmaciesStatus = status;
    }

    if (search) {
      query.$or = [
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'firstName lastName email phone nic')
      .populate('delivery', 'status address trackingNumber deliveryFee')
      .sort({ pharmaciesSentAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Prescription.countDocuments(query);
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
    });
  } catch (error: any) {
    console.error('Error fetching pharmacist prescriptions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch prescriptions',
      },
      { status: 500 }
    );
  }
}
