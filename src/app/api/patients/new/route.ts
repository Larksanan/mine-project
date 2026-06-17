/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendNowPatients } from '@/lib/email';

// Helper function to validate phone number
const isValidPhone = (phone: string): boolean => {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

// Helper function to validate NIC
const isValidNIC = (nic: string): boolean => {
  // Check for old NIC format (9 digits + V/X) or new NIC format (12 digits)
  const oldNicRegex = /^[0-9]{9}[VXvx]$/;
  const newNicRegex = /^[0-9]{12}$/;
  return oldNicRegex.test(nic) || newNicRegex.test(nic);
};

export async function POST(request: NextRequest) {
  try {
    console.log('Starting patient creation...');

    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.email);

    if (!session || !session.user) {
      console.log('No session found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();
    console.log('Database connected');

    // Get user
    const user = await User.findOne({ email: session.user.email });
    console.log('Found user:', user?.email, 'Role:', user?.role);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const allowedRoles = ['ADMIN', 'RECEPTIONIST'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body received');

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
      isActive,
      maritalStatus,
      occupation,
      preferredLanguage,
      lastVisit,
    } = body;

    // Debug logging
    console.log('Required fields:', {
      firstName: !!firstName,
      lastName: !!lastName,
      phone: !!phone,
      gender: !!gender,
      dateOfBirth: !!dateOfBirth,
      nic: !!nic,
    });

    // Required fields validation
    const missingFields = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!phone) missingFields.push('phone');
    if (!gender) missingFields.push('gender');
    if (!dateOfBirth) missingFields.push('dateOfBirth');
    if (!nic) missingFields.push('nic');

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
          missingFields,
        },
        { status: 400 }
      );
    }

    // Validate field formats
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (!isValidNIC(nic)) {
      return NextResponse.json(
        { success: false, message: 'Invalid NIC format' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date of birth' },
        { status: 400 }
      );
    }

    // Validate height and weight if provided
    if (height && (isNaN(height) || height < 0 || height > 300)) {
      return NextResponse.json(
        { success: false, message: 'Invalid height value' },
        { status: 400 }
      );
    }

    if (weight && (isNaN(weight) || weight < 0 || weight > 300)) {
      return NextResponse.json(
        { success: false, message: 'Invalid weight value' },
        { status: 400 }
      );
    }

    // Check for existing patients
    console.log('Checking for existing patients...');
    const existingByNIC = await Patient.findOne({ nic });
    if (existingByNIC) {
      console.log('Patient with NIC already exists:', nic);
      return NextResponse.json(
        {
          success: false,
          message: 'Patient with this NIC already exists',
          field: 'NIC',
        },
        { status: 409 }
      );
    }

    if (email) {
      const existingByEmail = await Patient.findOne({ email });
      if (existingByEmail) {
        console.log('Patient with email already exists:', email);
        return NextResponse.json(
          {
            success: false,
            message: 'Patient with this email already exists',
            field: 'Email',
          },
          { status: 409 }
        );
      }
    }

    // Prepare patient data with proper types
    const patientData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || undefined,
      phone: phone.trim(),
      nic: nic.trim(),
      dateOfBirth: dob,
      gender,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: user._id,
    };

    // Add optional fields if they exist
    if (address && (address.street || address.city || address.country)) {
      patientData.address = {
        street: address.street?.trim(),
        city: address.city?.trim(),
        state: address.state?.trim(),
        zipCode: address.zipCode?.trim(),
        country: address.country?.trim(),
      };
    }

    if (emergencyContact && emergencyContact.name) {
      patientData.emergencyContact = {
        name: emergencyContact.name?.trim(),
        phone: emergencyContact.phone?.trim(),
        relationship: emergencyContact.relationship?.trim(),
        email: emergencyContact.email?.trim(),
      };
    }

    if (insurance && insurance.provider) {
      patientData.insurance = {
        provider: insurance.provider?.trim(),
        policyNumber: insurance.policyNumber?.trim(),
        groupNumber: insurance.groupNumber?.trim(),
        validUntil: insurance.validUntil
          ? new Date(insurance.validUntil)
          : undefined,
      };
    }

    // Medical fields
    patientData.medicalHistory = medicalHistory?.trim() || '';
    patientData.allergies = Array.isArray(allergies)
      ? allergies.map((a: string) => a.trim()).filter(Boolean)
      : [];
    patientData.medications = Array.isArray(medications)
      ? medications.map((m: string) => m.trim()).filter(Boolean)
      : [];

    if (bloodType) patientData.bloodType = bloodType;
    if (height) patientData.height = Number(height);
    if (weight) patientData.weight = Number(weight);
    if (maritalStatus) patientData.maritalStatus = maritalStatus;
    if (occupation) patientData.occupation = occupation.trim();
    if (preferredLanguage)
      patientData.preferredLanguage = preferredLanguage.trim();
    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit);
      if (!isNaN(lastVisitDate.getTime())) {
        patientData.lastVisit = lastVisitDate;
      }
    }

    console.log(
      'Creating patient with data:',
      JSON.stringify(patientData, null, 2)
    );

    // Create patient
    const patient = await Patient.create(patientData);
    console.log('Patient created successfully:', patient._id);

    // Send registration email
    if (patient.email) {
      try {
        await sendNowPatients(
          patient.firstName,
          patient.lastName,
          patient.email,
          patient.phone,
          patient.nic,
          patient.dateOfBirth.toISOString(),
          patient.gender,
          patient.address,
          patient.emergencyContact,
          patient.medicalHistory || '',
          patient.allergies || [],
          patient.medications || [],
          patient.insurance,
          patient.bloodType || '',
          patient.height || 0,
          patient.weight || 0,
          !!patient.isActive,
          patient.maritalStatus || '',
          patient.occupation || '',
          patient.preferredLanguage || '',
          patient.lastVisit ? patient.lastVisit.toISOString() : ''
        );
      } catch (emailError) {
        console.error('Failed to send patient registration email:', emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        patient: {
          id: patient._id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          nic: patient.nic,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          isActive: patient.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating patient:', error);

    // Log the full error for debugging
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      stack: error.stack,
    });

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      console.log(`Duplicate key error: ${field} = ${value}`);

      return NextResponse.json(
        {
          success: false,
          message: `Patient with this ${field} already exists`,
          field: field.charAt(0).toUpperCase() + field.slice(1),
          value,
        },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors: Record<string, string> = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // Handle cast errors (e.g., invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid ${error.kind}: ${error.value}`,
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
