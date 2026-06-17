/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';
import mongoose from 'mongoose';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(id)
      .populate('createdBy', 'name email')
      .lean()
      .exec();

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: formatPatientResponse(patient),
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

export async function PUT(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await _request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Update allowed fields
    const allowedUpdates = [
      'firstName',
      'lastName',
      'phone',
      'dateOfBirth',
      'gender',
      'address',
      'emergencyContact',
      'medicalHistory',
      'allergies',
      'medications',
      'insurance',
      'bloodType',
      'height',
      'weight',
      'maritalStatus',
      'occupation',
      'preferredLanguage',
      'isActive',
      'lastVisit',
    ];

    const updates: any = {};

    // Handle special cases first
    if (body.email && body.email !== patient.email) {
      const existing = await Patient.findOne({
        email: body.email.toLowerCase(),
      });
      if (existing && existing._id.toString() !== id) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
      updates.email = body.email.toLowerCase();
    }

    if (body.nic && body.nic !== patient.nic) {
      const existing = await Patient.findOne({ nic: body.nic.toUpperCase() });
      if (existing && existing._id.toString() !== id) {
        return NextResponse.json(
          { error: 'NIC already in use' },
          { status: 409 }
        );
      }
      updates.nic = body.nic.toUpperCase();
    }

    // Handle other updates
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key) && body[key] !== undefined) {
        updates[key] = body[key];
      }
    });

    // Validate date of birth if updated
    if (updates.dateOfBirth) {
      const dob = new Date(updates.dateOfBirth);
      if (dob >= new Date()) {
        return NextResponse.json(
          { error: 'Date of birth must be in the past' },
          { status: 400 }
        );
      }
      updates.dateOfBirth = dob;
    }

    // Validate insurance validUntil if updated
    if (updates.insurance?.validUntil) {
      updates.insurance.validUntil = new Date(updates.insurance.validUntil);
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key === 'insurance' && updates[key]) {
        // Merge insurance updates
        patient.insurance = { ...patient.insurance, ...updates[key] };
      } else if (key === 'address' && updates[key]) {
        // Merge address updates
        patient.address = { ...patient.address, ...updates[key] };
      } else if (key === 'emergencyContact' && updates[key]) {
        // Merge emergency contact updates
        patient.emergencyContact = {
          ...patient.emergencyContact,
          ...updates[key],
        };
      } else {
        (patient as any)[key] = updates[key];
      }
    });

    await patient.save();
    await patient.populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      data: formatPatientResponse(patient.toObject()),
    });
  } catch (error: any) {
    console.error('Error updating patient:', error);

    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
      if (error.keyPattern?.nic) {
        return NextResponse.json(
          { error: 'NIC already in use' },
          { status: 409 }
        );
      }
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update patient', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Soft delete: mark as inactive
    patient.isActive = false;
    await patient.save();

    return NextResponse.json({
      success: true,
      message: 'Patient deactivated successfully',
    });
  } catch (error) {
    console.error(' Error deactivating patient:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate patient' },
      { status: 500 }
    );
  }
}

// Reuse the same helper functions
function formatPatientResponse(patient: any) {
  return {
    id: patient._id.toString(),
    firstName: patient.firstName,
    lastName: patient.lastName,
    fullName: `${patient.firstName} ${patient.lastName}`,
    email: patient.email,
    phone: patient.phone,
    nic: patient.nic,
    dateOfBirth: patient.dateOfBirth,
    age: patient.age || calculateAge(patient.dateOfBirth),
    gender: patient.gender,
    bloodType: patient.bloodType,
    isActive: patient.isActive,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    insurance: patient.insurance,
    address: patient.address,
    medicalHistory: patient.medicalHistory,
    allergies: patient.allergies || [],
    medications: patient.medications || [],
    createdBy: patient.createdBy,
    emergencyContact: patient.emergencyContact,
    height: patient.height,
    weight: patient.weight,
    bmi: patient.bmi || calculateBMI(patient.height, patient.weight),
    bmiCategory:
      patient.bmiCategory || getBMICategory(patient.height, patient.weight),
    maritalStatus: patient.maritalStatus,
    occupation: patient.occupation,
    preferredLanguage: patient.preferredLanguage,
    lastVisit: patient.lastVisit,
  };
}

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function calculateBMI(height?: number, weight?: number): number | null {
  if (!height || !weight || height === 0) return null;
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 100) / 100;
}

function getBMICategory(height?: number, weight?: number): string | null {
  const bmi = calculateBMI(height, weight);
  if (!bmi) return null;

  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
