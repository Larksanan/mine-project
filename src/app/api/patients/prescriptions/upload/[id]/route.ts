// app/api/patients/prescriptions/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Patientprescription';
import Patient from '@/models/Patient';
import Pharmacy from '@/models/Pharmacy';
import Delivery from '@/models/Delivery';
import { authOptions } from '@/lib/auth';

async function getPatientForSession(userId: string) {
  return Patient.findOne({ user: userId });
}

// GET - Patient fetches a single prescription by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a patient
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get patient profile
    const patient = await getPatientForSession(session.user.id);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Await params before accessing
    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    // Fetch the prescription
    const prescription = await Prescription.findOne({
      _id: id,
      patientId: patient._id,
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
        { success: false, error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Get pharmacy data if prescription has pharmaciesID
    let pharmacyData = null;
    if ((prescription as any).pharmaciesID) {
      pharmacyData = await Pharmacy.findById((prescription as any).pharmaciesID)
        .select(
          'name address contact phone services operatingHours is24Hours deliveryAvailable deliveryFee description'
        )
        .lean();
    }

    // Get delivery with full pharmacy details if delivery exists
    let deliveryData = null;
    if ((prescription as any).delivery) {
      deliveryData = await Delivery.findById((prescription as any).delivery)
        .populate(
          'pharmaciesID',
          'name address contact phone services operatingHours is24Hours deliveryAvailable deliveryFee'
        )
        .lean();
    }

    // Combine all data
    const result = {
      ...prescription,
      pharmacy: pharmacyData,
      delivery: deliveryData || (prescription as any).delivery,
    };

    return NextResponse.json({
      success: true,
      data: result,
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

// PUT - Patient updates a prescription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a patient
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get patient profile
    const patient = await getPatientForSession(session.user.id);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Await params before accessing
    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    // Check if prescription exists and belongs to patient
    const existingPrescription = await Prescription.findOne({
      _id: id,
      patientId: patient._id,
      isActive: true,
    });

    if (!existingPrescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      diagnosis,
      notes,
      status,
      deliveryAddress,
      wantsDelivery,
      medications,
    } = body;

    // Build update object
    const updateData: any = {};

    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) {
      // Validate status
      const validStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (wantsDelivery !== undefined) updateData.wantsDelivery = wantsDelivery;
    if (deliveryAddress !== undefined) {
      updateData.deliveryAddress = {
        line1: deliveryAddress.line1,
        line2: deliveryAddress.line2 || '',
        city: deliveryAddress.city,
        postalCode: deliveryAddress.postalCode || '',
        phone: deliveryAddress.phone,
      };
    }
    if (medications !== undefined) {
      updateData.medications = medications;
    }

    // Update prescription
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate('patientId', 'firstName lastName email phone nic')
      .populate('delivery', 'status address trackingNumber deliveryFee')
      .lean();

    // Get pharmacy data
    let pharmacyData = null;
    if ((updatedPrescription as any).pharmaciesID) {
      pharmacyData = await Pharmacy.findById(
        (updatedPrescription as any).pharmaciesID
      )
        .select('name address contact phone services')
        .lean();
    }

    // Get delivery data
    let deliveryData = null;
    if ((updatedPrescription as any).delivery) {
      deliveryData = await Delivery.findById(
        (updatedPrescription as any).delivery
      )
        .populate('pharmaciesID', 'name address contact phone services')
        .lean();
    }

    const result = {
      ...updatedPrescription,
      pharmacy: pharmacyData,
      delivery: deliveryData,
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Prescription updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating prescription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update prescription',
      },
      { status: 500 }
    );
  }
}

// DELETE - Patient cancels/deletes a prescription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a patient
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get patient profile
    const patient = await getPatientForSession(session.user.id);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Await params before accessing
    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    // Check if prescription exists and belongs to patient
    const prescription = await Prescription.findOne({
      _id: id,
      patientId: patient._id,
      isActive: true,
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Soft delete - set isActive to false
    prescription.isActive = false;
    prescription.status = 'CANCELLED';
    await prescription.save();

    // Also cancel any active delivery
    if (prescription.delivery) {
      const delivery = await Delivery.findById(prescription.delivery);
      if (delivery && delivery.isActive) {
        delivery.isActive = false;
        delivery.status = 'CANCELLED';
        await delivery.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Prescription cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling prescription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cancel prescription',
      },
      { status: 500 }
    );
  }
}
