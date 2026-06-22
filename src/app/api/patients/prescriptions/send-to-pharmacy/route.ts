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

// Helper function to generate unique tracking number
function generateTrackingNumber(): string {
  const prefix = 'DEL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// POST - Send prescription to pharmacy
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a patient
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Forbidden - Only patients can send prescriptions to pharmacies',
        },
        { status: 403 }
      );
    }

    // Get patient profile
    const patient = await getPatientForSession(session.user.id);
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);

    const { prescriptionId, pharmacyId, notes } = body;

    // Validate required fields
    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, message: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    if (!pharmacyId) {
      return NextResponse.json(
        { success: false, message: 'Pharmacy ID is required' },
        { status: 400 }
      );
    }

    // Fetch the prescription
    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      patientId: patient._id,
      isActive: true,
    });

    if (!prescription) {
      return NextResponse.json(
        {
          success: false,
          message: 'Prescription not found or does not belong to you',
        },
        { status: 404 }
      );
    }

    console.log('Found prescription:', prescription._id);

    // Check if prescription is active
    if (prescription.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only active prescriptions can be sent to a pharmacy',
        },
        { status: 400 }
      );
    }

    // Check if prescription already has delivery address
    if (!prescription.deliveryAddress || !prescription.deliveryAddress.line1) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Delivery address is required. Please add a delivery address first.',
        },
        { status: 400 }
      );
    }

    const pharmacy = await Pharmacy.findOne({
      _id: pharmacyId,
      status: 'ACTIVE',
    });

    if (!pharmacy) {
      return NextResponse.json(
        { success: false, message: 'Pharmacy not found or is not active' },
        { status: 404 }
      );
    }

    console.log('Found pharmacy:', pharmacy._id);

    // Check if prescription already has a delivery in progress
    let delivery = await Delivery.findOne({
      prescriptionId: prescription._id,
      isActive: true,
    });

    // If prescription already has a delivery, update it
    if (delivery) {
      console.log('Updating existing delivery:', delivery._id);

      // Update delivery with new pharmacy
      delivery.pharmaciesID = pharmacy._id;
      delivery.status = 'PENDING';
      delivery.deliveryFee = pharmacy.deliveryFee || 0;
      delivery.notes =
        notes || delivery.notes || 'Prescription re-sent to new pharmacy';
      delivery.updatedAt = new Date();

      // Generate new tracking number
      delivery.trackingNumber = generateTrackingNumber();

      await delivery.save();
      console.log('Delivery updated successfully');
    } else {
      // Create new delivery
      console.log('Creating new delivery');

      // Generate tracking number
      const trackingNumber = generateTrackingNumber();

      delivery = await Delivery.create({
        prescriptionId: prescription._id,
        patientId: patient._id,
        pharmaciesID: pharmacy._id,
        address: prescription.deliveryAddress,
        status: 'PENDING',
        deliveryFee: pharmacy.deliveryFee || 0,
        trackingNumber: trackingNumber,
        notes: notes || 'Prescription sent to pharmacy by patient',
        isActive: true,
      });
      console.log('New delivery created:', delivery._id);
    }

    // Update prescription with pharmacy info
    prescription.pharmaciesID = pharmacy._id;
    prescription.sentTopharmacies = true;
    prescription.pharmaciesSentAt = new Date();
    prescription.pharmaciesStatus = 'PENDING';
    prescription.delivery = delivery._id;
    await prescription.save();
    console.log('Prescription updated:', prescription._id);

    // Fetch updated prescription with populated fields
    const updatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'firstName lastName email phone nic')
      .populate('delivery', 'status address trackingNumber deliveryFee')
      .lean();

    // Get pharmacy data separately
    const pharmacyData = await Pharmacy.findById(pharmacy._id)
      .select(
        'name address contact phone services operatingHours is24Hours deliveryAvailable deliveryFee'
      )
      .lean();

    // Get delivery with pharmacy details
    const deliveryData = await Delivery.findById(delivery._id)
      .populate('pharmaciesID', 'name address contact phone services')
      .lean();

    const result = {
      ...updatedPrescription,
      delivery: deliveryData,
      pharmacy: pharmacyData,
    };

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Prescription sent to pharmacy successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending prescription to pharmacy:', error);

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: 'A duplicate entry was detected. Please try again.',
          details: error.keyValue,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to send prescription to pharmacy',
      },
      { status: 500 }
    );
  }
}
