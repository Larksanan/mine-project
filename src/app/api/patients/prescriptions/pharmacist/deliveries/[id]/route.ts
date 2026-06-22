/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Delivery from '@/models/Delivery';
import Patient from '@/models/Patient';
import Pharmacy from '@/models/Pharmacy';
import { authOptions } from '@/lib/auth';

const VALID_STATUSES = [
  'PENDING',
  'PROCESSING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

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

// PATCH - Update delivery status (pharmacist or admin only)
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

    if (
      !session.user.role ||
      !['PHARMACIST', 'ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Delivery ID is required' },
        { status: 400 }
      );
    }

    // Log the raw request body for debugging
    const rawBody = await request.text();
    console.log('Raw request body:', rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('Parsed body:', body);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid JSON in request body. Please ensure you are sending a valid JSON object.',
          received: rawBody,
        },
        { status: 400 }
      );
    }

    const { status, notes, deliveryFee } = body;

    // Validate status - check if it exists
    if (!status) {
      console.error('Status is missing from request body. Body:', body);
      return NextResponse.json(
        {
          success: false,
          error:
            'Status is required. Please provide a status field in the request body.',
          receivedBody: body,
          expectedFormat: {
            status: 'PROCESSING',
            notes: 'Optional notes',
            deliveryFee: 0, // Optional
          },
        },
        { status: 400 }
      );
    }

    // Validate deliveryFee if provided
    if (deliveryFee !== undefined) {
      if (typeof deliveryFee !== 'number' || deliveryFee < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid delivery fee. Must be a positive number.',
          },
          { status: 400 }
        );
      }
    }

    // Convert to uppercase for case-insensitive comparison
    const normalizedStatus = status.toUpperCase();

    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}. Received: "${status}"`,
        },
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

    if (session.user.role === 'PHARMACIST') {
      const pharmacy = await getPharmacyForPharmacist(session.user.id);
      if (
        !pharmacy ||
        delivery.pharmaciesID.toString() !== pharmacy._id.toString()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'This delivery does not belong to your pharmacy',
          },
          { status: 403 }
        );
      }
    }

    // Update delivery fields with normalized status
    delivery.status = normalizedStatus;
    if (notes !== undefined) delivery.notes = notes;
    if (deliveryFee !== undefined) delivery.deliveryFee = deliveryFee;

    if (normalizedStatus === 'OUT_FOR_DELIVERY' && !delivery.dispatchedAt) {
      delivery.dispatchedAt = new Date();
    }
    if (normalizedStatus === 'DELIVERED' && !delivery.deliveredAt) {
      delivery.deliveredAt = new Date();
    }
    if (normalizedStatus === 'CANCELLED') {
      delivery.isActive = false;
    }

    await delivery.save();

    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate('prescriptionId', 'prescriptionNumber diagnosis status')
      .populate('patientId', 'firstName lastName phone')
      .populate('pharmaciesID', 'name address contact phone')
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedDelivery,
      message: `Delivery marked as ${normalizedStatus.toLowerCase().replace(/_/g, ' ')}`,
    });
  } catch (error: any) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update delivery' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a delivery
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
