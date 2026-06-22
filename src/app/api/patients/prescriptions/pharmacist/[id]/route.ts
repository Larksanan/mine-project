/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Patientprescription';
import Pharmacy from '@/models/Pharmacy';

import { authOptions } from '@/lib/auth';

async function getPharmacyForPharmacist(userId: string) {
  return Pharmacy.findOne({ 'pharmacists.userId': userId });
}

// GET - Pharmacist fetches a single prescription sent to their pharmacy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    // Only return the prescription if it was sent to THIS pharmacy
    const prescription = await Prescription.findOne({
      _id: id,
      pharmaciesID: pharmacy._id,
      sentTopharmacies: true,
      isActive: true,
    })
      .populate('patientId', 'firstName lastName email phone nic address')
      .populate(
        'delivery',
        'status address trackingNumber deliveryFee notes dispatchedAt deliveredAt'
      )
      .lean();

    if (!prescription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prescription not found or not sent to your pharmacy',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch prescription',
      },
      { status: 500 }
    );
  }
}
