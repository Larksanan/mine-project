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

// GET - Fetch a single delivery (scoped to the user's role)
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Delivery ID is required' },
        { status: 400 }
      );
    }

    const delivery: any = await Delivery.findById(id)
      .populate(
        'prescriptionId',
        'prescriptionNumber diagnosis status attachmentUrl'
      )
      .populate('patientId', 'firstName lastName phone email')
      .populate('pharmaciesID', 'name address contact phone services')
      .lean();

    if (!delivery) {
      return NextResponse.json(
        { success: false, error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Scope access by role
    if (session.user.role === 'PATIENT') {
      const patient = await getPatientForSession(session.user.id);
      if (
        !patient ||
        delivery.patientId?._id?.toString() !== patient._id.toString()
      ) {
        return NextResponse.json(
          { success: false, error: 'Delivery not found' },
          { status: 404 }
        );
      }
    } else if (session.user.role === 'PHARMACIST') {
      const pharmacy = await getPharmacyForPharmacist(session.user.id);
      if (
        !pharmacy ||
        delivery.pharmaciesID?._id?.toString() !== pharmacy._id.toString()
      ) {
        return NextResponse.json(
          { success: false, error: 'Delivery not found' },
          { status: 404 }
        );
      }
    } else if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: delivery,
    });
  } catch (error: any) {
    console.error('Error fetching delivery:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a delivery (patient only for pending deliveries)
export async function DELETE(
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Delivery ID is required' },
        { status: 400 }
      );
    }

    const delivery = await Delivery.findById(id);
    if (!delivery || !delivery.isActive) {
      return NextResponse.json(
        { success: false, error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Patients can only cancel their own pending deliveries
    if (session.user.role === 'PATIENT') {
      const patient = await getPatientForSession(session.user.id);
      if (
        !patient ||
        delivery.patientId.toString() !== patient._id.toString()
      ) {
        return NextResponse.json(
          { success: false, error: 'Delivery not found' },
          { status: 404 }
        );
      }
      if (delivery.status !== 'PENDING') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Only pending deliveries can be cancelled. Contact the pharmacy if this delivery is already in progress.',
          },
          { status: 400 }
        );
      }
    } else if (session.user.role === 'PHARMACIST') {
      const pharmacy = await getPharmacyForPharmacist(session.user.id);
      if (
        !pharmacy ||
        delivery.pharmaciesID.toString() !== pharmacy._id.toString()
      ) {
        return NextResponse.json(
          { success: false, error: 'Delivery not found' },
          { status: 404 }
        );
      }
      // Pharmacists can cancel any non-delivered/non-cancelled delivery
      if (['DELIVERED', 'CANCELLED'].includes(delivery.status)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This delivery cannot be cancelled as it is already delivered or cancelled.',
          },
          { status: 400 }
        );
      }
    } else if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    delivery.isActive = false;
    delivery.status = 'CANCELLED';
    await delivery.save();

    return NextResponse.json({
      success: true,
      message: 'Delivery cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling delivery:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cancel delivery',
      },
      { status: 500 }
    );
  }
}
