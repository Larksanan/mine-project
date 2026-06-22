// app/api/pharmacist/prescriptions/[id]/status/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Patientprescription';
import Pharmacy from '@/models/Pharmacy';
import Delivery from '@/models/Delivery';
import { authOptions } from '@/lib/auth';

const VALID_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'FULFILLED'];

async function getPharmacyForPharmacist(userId: string) {
  return Pharmacy.findOne({ 'pharmacists.userId': userId });
}

// PATCH - Pharmacist accepts, rejects, or fulfills a prescription
export async function PATCH(
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

    const body = await request.json();
    const { status, notes } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Only allow updates to prescriptions sent to THIS pharmacy
    const prescription = await Prescription.findOne({
      _id: id,
      pharmaciesID: pharmacy._id,
      sentTopharmacies: true,
      isActive: true,
    });

    if (!prescription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prescription not found or not sent to your pharmacy',
        },
        { status: 404 }
      );
    }

    prescription.pharmaciesStatus = status;
    await prescription.save();

    // Keep the linked delivery in sync with the pharmacy's decision
    if (prescription.delivery) {
      const delivery = await Delivery.findById(prescription.delivery);
      if (delivery && delivery.isActive) {
        if (status === 'ACCEPTED') {
          delivery.status = 'PROCESSING';
        } else if (status === 'REJECTED') {
          delivery.status = 'CANCELLED';
          delivery.isActive = false;
        } else if (status === 'FULFILLED') {
          delivery.status = 'OUT_FOR_DELIVERY';
          delivery.dispatchedAt = new Date();
        }
        if (notes) delivery.notes = notes;
        await delivery.save();
      }
    }

    const updatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'firstName lastName email phone nic')
      .populate('delivery', 'status address trackingNumber deliveryFee')
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedPrescription,
      message: `Prescription marked as ${status.toLowerCase()}`,
    });
  } catch (error: any) {
    console.error('Error updating prescription status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update prescription status',
      },
      { status: 500 }
    );
  }
}
