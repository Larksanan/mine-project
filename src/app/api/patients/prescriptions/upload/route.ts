/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Patientprescription';
import Patient from '@/models/Patient';
import pharmacies from '@/models/Pharmacy';
import Delivery from '@/models/Delivery';
import { authOptions } from '@/lib/auth';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

// GET - Patient fetches their own prescriptions
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
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const patient = await getPatientForSession(session.user.id);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient profile not found' },
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

    const query: any = { patientId: patient._id, isActive: true };
    if (status && status !== 'ALL') query.status = status;

    if (search) {
      query.$or = [
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    // Get prescriptions with populated fields
    // FIXED: select pharmacy fields, not patient fields (firstName/lastName/nic don't exist on Pharmacy)
    const prescriptions = await Prescription.find(query)
      .populate('pharmaciesID', 'name address contact phone services')
      .populate('delivery', 'status address trackingNumber deliveryFee')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get pharmacy and delivery information separately
    const prescriptionIds = prescriptions.map(p => (p as any)._id);

    // Get deliveries with pharmacy info
    const deliveries = await Delivery.find({
      prescriptionId: { $in: prescriptionIds },
      isActive: true,
    })
      .populate(
        'pharmaciesID',
        'name address contact phone services deliveryAvailable deliveryFee'
      )
      .lean();

    // Get pharmacy info for prescriptions that have pharmaciesID
    const prescriptionsWithPharmacy = await Promise.all(
      prescriptions.map(async prescription => {
        const delivery = deliveries.find(
          d =>
            (d.prescriptionId as any).toString() ===
            (prescription as any)._id.toString()
        );

        // If prescription has pharmaciesID, get pharmacy details
        let pharmaciesData = null;
        if ((prescription as any).pharmaciesID) {
          pharmaciesData = await pharmacies
            .findById((prescription as any).pharmaciesID)
            .select('name address contact phone services')
            .lean();
        }

        return {
          ...prescription,
          delivery: delivery || null,
          pharmacies: pharmaciesData,
        };
      })
    );

    const total = await Prescription.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: prescriptionsWithPharmacy,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}

// POST - Patient uploads a new prescription file
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const patient = await getPatientForSession(session.user.id);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const diagnosis = formData.get('diagnosis') as string | null;
    const notes = formData.get('notes') as string | null;
    const wantsDelivery = formData.get('wantsDelivery') === 'true';
    const pharmaciesID = formData.get('pharmaciesID') as string | null;
    const addressLine1 = formData.get('addressLine1') as string | null;
    const addressLine2 = formData.get('addressLine2') as string | null;
    const addressCity = formData.get('addressCity') as string | null;
    const addressPostalCode = formData.get('addressPostalCode') as
      | string
      | null;
    const addressPhone = formData.get('addressPhone') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only JPEG, PNG, WEBP, or PDF files are allowed',
        },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File must be under 10MB' },
        { status: 400 }
      );
    }

    // Validate delivery requirements
    let deliveryAddress: any = null;
    let selectedpharmacies = null;

    if (wantsDelivery) {
      // Get delivery address from form data or patient profile
      const savedAddress = (patient as any).address || {};
      deliveryAddress = {
        line1: addressLine1 || savedAddress.line1,
        line2: addressLine2 || savedAddress.line2 || '',
        city: addressCity || savedAddress.city,
        postalCode: addressPostalCode || savedAddress.postalCode || '',
        phone: addressPhone || savedAddress.phone || patient.phone,
      };

      // Validate required address fields
      if (
        !deliveryAddress.line1 ||
        !deliveryAddress.city ||
        !deliveryAddress.phone
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'A delivery address requires at least line1, city, and phone',
          },
          { status: 400 }
        );
      }

      // Get pharmacy
      if (pharmaciesID) {
        selectedpharmacies = await pharmacies.findOne({
          _id: pharmaciesID,
          status: 'ACTIVE',
        });

        if (!selectedpharmacies) {
          return NextResponse.json(
            {
              success: false,
              error: 'Selected pharmacy not found or is not active',
            },
            { status: 404 }
          );
        }
      } else {
        // If no pharmacy selected, get the first available one
        selectedpharmacies = await pharmacies.findOne({ status: 'ACTIVE' });
        if (!selectedpharmacies) {
          return NextResponse.json(
            {
              success: false,
              error: 'No active pharmacies found. Please select a pharmacy.',
            },
            { status: 404 }
          );
        }
      }
    }

    // Save file to disk
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'prescriptions');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileExt = file.name.split('.').pop() || 'bin';
    const uniqueName = `rx_${patient._id}_${Date.now()}.${fileExt}`;
    const filePath = join(uploadDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/prescriptions/${uniqueName}`;

    // Generate prescription number
    const count = await Prescription.countDocuments();
    const prescriptionNumber = `RX-${String(count + 1).padStart(8, '0')}`;

    // Create prescription object - DON'T auto-send to pharmacy
    const prescriptionData: any = {
      patientId: patient._id,
      prescriptionNumber,
      diagnosis: diagnosis || 'Uploaded by patient',
      notes: notes || '',
      attachmentUrl: fileUrl,
      uploadedByPatient: true,
      wantsDelivery,
      deliveryAddress: wantsDelivery ? deliveryAddress : null,
      status: 'ACTIVE',
      isActive: true,
      startDate: new Date(),
      medications: [],
      sentTopharmacies: false, // Don't auto-send
    };

    // If pharmacy selected, store it but don't mark as sent
    if (selectedpharmacies && wantsDelivery) {
      prescriptionData.pharmaciesID = selectedpharmacies._id;
      // NOT setting sentTopharmacies: true here
    }

    // Create prescription
    const prescription = await Prescription.create(prescriptionData);

    // Create delivery record if requested
    let delivery = null;
    if (wantsDelivery && deliveryAddress && selectedpharmacies) {
      try {
        // Generate a unique tracking number
        const trackingNumber = generateTrackingNumber();

        // Create new delivery with tracking number
        delivery = await Delivery.create({
          prescriptionId: prescription._id,
          patientId: patient._id,
          pharmaciesID: selectedpharmacies._id,
          address: deliveryAddress,
          status: 'PENDING',
          deliveryFee: selectedpharmacies.deliveryFee || 0,
          trackingNumber: trackingNumber,
          notes:
            notes || 'Prescription uploaded by patient with delivery request',
          isActive: true,
        });

        // Update prescription with delivery reference
        prescription.delivery = delivery._id;
        await prescription.save();
      } catch (deliveryError: any) {
        console.error('Error creating delivery:', deliveryError);
        // If delivery creation fails, still return success for prescription
        // but with a warning
        return NextResponse.json(
          {
            success: true,
            data: prescription,
            message: 'Prescription uploaded but delivery creation failed',
            warning: deliveryError.message,
          },
          { status: 201 }
        );
      }
    }

    // Fetch the created prescription with populated fields
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'firstName lastName email phone nic')
      .populate('delivery', 'status address trackingNumber deliveryFee')
      .lean();

    // Get pharmacy info separately
    let pharmaciesData = null;
    if (selectedpharmacies) {
      pharmaciesData = await pharmacies
        .findById(selectedpharmacies._id)
        .select(
          'name address contact phone services deliveryAvailable deliveryFee'
        )
        .lean();
    }

    // Get delivery with pharmacy details
    let deliveryData = null;
    if (prescription.delivery) {
      deliveryData = await Delivery.findById(prescription.delivery)
        .populate('pharmaciesID', 'name address contact phone services')
        .lean();
    }

    const result = {
      ...populatedPrescription,
      delivery: deliveryData || null,
      pharmacies: pharmaciesData,
    };

    return NextResponse.json(
      {
        success: true,
        data: result,
        message:
          wantsDelivery && selectedpharmacies
            ? 'Prescription uploaded successfully. You can now send it to a pharmacy.'
            : 'Prescription uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading prescription:', error);

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'A duplicate entry was detected. Please try again.',
          details: error.keyValue,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to upload prescription' },
      { status: 500 }
    );
  }
}
