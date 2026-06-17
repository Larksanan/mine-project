/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';
import User from '@/models/User';
import mongoose from 'mongoose';

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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const bloodType = searchParams.get('bloodType');
    const gender = searchParams.get('gender');
    const ageGroup = searchParams.get('ageGroup');
    const hasInsurance = searchParams.get('hasInsurance');
    const isActive = searchParams.get('isActive');
    const createdBy = searchParams.get('createdBy');

    const skip = (page - 1) * limit;

    const queryParts: any[] = [];

    if (isActive !== null && isActive !== undefined) {
      queryParts.push({ isActive: isActive === 'true' });
    } else {
      queryParts.push({ isActive: true });
    }

    if (search) {
      queryParts.push({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { nic: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (bloodType) {
      queryParts.push({ bloodType });
    }

    if (gender && ['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      queryParts.push({ gender });
    }

    if (ageGroup && ['CHILD', 'ADULT', 'SENIOR'].includes(ageGroup)) {
      const today = new Date();
      let minDate, maxDate;
      switch (ageGroup) {
        case 'CHILD':
          maxDate = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
          );
          queryParts.push({ dateOfBirth: { $gte: maxDate } });
          break;
        case 'ADULT':
          minDate = new Date(
            today.getFullYear() - 65,
            today.getMonth(),
            today.getDate()
          );
          maxDate = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
          );
          queryParts.push({ dateOfBirth: { $gte: minDate, $lt: maxDate } });
          break;
        case 'SENIOR':
          minDate = new Date(
            today.getFullYear() - 120,
            today.getMonth(),
            today.getDate()
          );
          maxDate = new Date(
            today.getFullYear() - 65,
            today.getMonth(),
            today.getDate()
          );
          queryParts.push({ dateOfBirth: { $gte: minDate, $lt: maxDate } });
          break;
      }
    }

    if (hasInsurance === 'true') {
      queryParts.push({ 'insurance.validUntil': { $gt: new Date() } });
    } else if (hasInsurance === 'false') {
      queryParts.push({
        $or: [
          { 'insurance.validUntil': { $lte: new Date() } },
          { insurance: { $exists: false } },
          { 'insurance.validUntil': { $exists: false } },
        ],
      });
    }

    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
      queryParts.push({ createdBy: new mongoose.Types.ObjectId(createdBy) });
    }

    const finalQuery = queryParts.length > 0 ? { $and: queryParts } : {};

    const [patients, totalCount] = await Promise.all([
      Patient.find(finalQuery)
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      Patient.countDocuments(finalQuery),
    ]);

    return NextResponse.json({
      success: true,
      count: patients.length,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      data: patients.map((patient: any) => formatPatientResponse(patient)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch patients', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      nic,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      medicalHistory,
      allergies,
      medications,
      insurance,
      bloodType,
      height,
      weight,
      maritalStatus,
      occupation,
      preferredLanguage,
      createdBy,
      userId,
      user,
    } = body;

    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'nic',
      'dateOfBirth',
      'gender',
    ];

    const missingFields = requiredFields.filter(field => {
      const value = body[field];
      const isMissing = !value || (typeof value === 'string' && !value.trim());
      return isMissing;
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields,
          receivedFields: Object.keys(body),
        },
        { status: 400 }
      );
    }

    const trimmedFirstName = firstName?.trim();
    const trimmedLastName = lastName?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPhone = phone?.trim();
    const trimmedNic = nic?.trim().toUpperCase();

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const nicRegex = /^[0-9]{9}[VX]|[0-9]{12}$/;
    if (!nicRegex.test(trimmedNic)) {
      return NextResponse.json(
        { error: 'Invalid NIC format. Use format: 123456789V or 123456789012' },
        { status: 400 }
      );
    }

    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date of birth format' },
        { status: 400 }
      );
    }

    if (dob >= new Date()) {
      return NextResponse.json(
        { error: 'Date of birth must be in the past' },
        { status: 400 }
      );
    }

    const existingPatient = await Patient.findOne({
      $or: [{ email: trimmedEmail }, { nic: trimmedNic }],
    });

    if (existingPatient) {
      const field = existingPatient.email === trimmedEmail ? 'email' : 'NIC';
      return NextResponse.json(
        { error: `Patient with this ${field} already exists` },
        { status: 409 }
      );
    }

    if (bloodType) {
      const validBloodTypes = [
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
      ];
      if (!validBloodTypes.includes(bloodType)) {
        return NextResponse.json(
          { error: 'Invalid blood type' },
          { status: 400 }
        );
      }
    }

    // Validate gender
    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
    }

    // Validate marital status if provided
    if (maritalStatus) {
      const validMaritalStatuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
      if (!validMaritalStatuses.includes(maritalStatus)) {
        return NextResponse.json(
          { error: 'Invalid marital status' },
          { status: 400 }
        );
      }
    }

    if (height !== undefined && height !== null) {
      const heightNum = Number(height);
      if (isNaN(heightNum) || heightNum < 0 || heightNum > 300) {
        return NextResponse.json(
          { error: 'Height must be between 0 and 300 cm' },
          { status: 400 }
        );
      }
    }

    if (weight !== undefined && weight !== null) {
      const weightNum = Number(weight);
      if (isNaN(weightNum) || weightNum < 0 || weightNum > 500) {
        return NextResponse.json(
          { error: 'Weight must be between 0 and 500 kg' },
          { status: 400 }
        );
      }
    }

    if (user && !mongoose.Types.ObjectId.isValid(user)) {
      return NextResponse.json(
        { error: 'Invalid user ID for patient link' },
        { status: 400 }
      );
    }

    const patientData: any = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      phone: trimmedPhone,
      nic: trimmedNic,
      dateOfBirth: dob,
      gender,
      address: {
        street: address?.street?.trim() || '',
        city: address?.city?.trim() || '',
        state: address?.state?.trim() || '',
        zipCode: address?.zipCode?.trim() || '',
        country: address?.country?.trim() || '',
        district: address?.district?.trim() || '',
        province: address?.province?.trim() || '',
        addressLine2: address?.addressLine2?.trim() || '',
      },
      emergencyContact: {
        name: emergencyContact?.name?.trim() || '',
        phone: emergencyContact?.phone?.trim() || '',
        email: emergencyContact?.email?.trim() || '',
        relationship: emergencyContact?.relationship?.trim() || '',
        additionalPhone: emergencyContact?.additionalPhone?.trim() || '',
      },
      medicalHistory: medicalHistory?.trim() || '',
      allergies: Array.isArray(allergies)
        ? allergies.filter((item: any) => item && item.trim())
        : [],
      medications: Array.isArray(medications)
        ? medications.filter((item: any) => item && item.trim())
        : [],
      insurance: {
        provider: insurance?.provider?.trim() || '',
        policyNumber: insurance?.policyNumber?.trim() || '',
        groupNumber: insurance?.groupNumber?.trim() || '',
        coverageDetails: insurance?.coverageDetails?.trim() || '',
        validUntil: insurance?.validUntil
          ? new Date(insurance.validUntil)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      bloodType: bloodType || undefined,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      isActive: true,
      maritalStatus: maritalStatus || undefined,
      occupation: occupation?.trim() || '',
      preferredLanguage: preferredLanguage || 'en',
      user: user ? new mongoose.Types.ObjectId(user) : undefined,
    };

    const userIdToUse = userId || createdBy;
    if (userIdToUse) {
      if (!mongoose.Types.ObjectId.isValid(userIdToUse)) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
      }

      const creator = await User.findById(userIdToUse);
      if (!creator) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      patientData.createdBy = new mongoose.Types.ObjectId(userIdToUse);
    }

    const patient = new Patient(patientData);
    await patient.save();
    await patient.populate('createdBy', 'name email');

    if (user) {
      await User.findOneAndUpdate(
        { _id: user, role: 'USER' },
        { role: 'PATIENT' }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Patient created successfully',
        data: formatPatientResponse(patient.toObject()),
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return NextResponse.json(
          { error: 'Patient with this email already exists' },
          { status: 409 }
        );
      }
      if (error.keyPattern?.nic) {
        return NextResponse.json(
          { error: 'Patient with this NIC already exists' },
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
      { error: 'Failed to create patient', details: error.message },
      { status: 500 }
    );
  }
}
