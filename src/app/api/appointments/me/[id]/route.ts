/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

let Appointment: any;
let Patient: any;

try {
  Appointment =
    mongoose.models.Appointment || require('@/models/Appointment').default;
  Patient = mongoose.models.Patient || require('@/models/Patient').default;
} catch (error) {
  console.error('Error loading models:', error);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Patient) {
      Patient = require('@/models/Patient').default;
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    console.log('Fetching appointment:', {
      appointmentId: id,
      userId: session.user.id,
      role: session.user.role,
    });

    const appointment = await Appointment.findOne({
      _id: id,
      isActive: true,
    })
      .populate({
        path: 'patient',
        model: 'Patient',
        select:
          'firstName lastName email phone nic dateOfBirth gender address emergencyContact bloodType allergies medications medicalHistory',
      })
      .populate({
        path: 'doctor',
        model: 'User',
        select: 'name email phone image',
      })
      .populate({
        path: 'pharmacist',
        model: 'User',
        select: 'name email phone',
      })
      .lean()
      .exec();

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    const hasAccess = await verifyAppointmentAccess(
      appointment,
      session.user.id,
      session.user.role || 'PATIENT',
      session.user.email || undefined
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to access this appointment',
        },
        { status: 403 }
      );
    }
    const formattedAppointment = {
      _id: appointment._id?.toString() || '',
      patient: appointment.patient
        ? {
            _id: appointment.patient._id?.toString() || '',
            firstName: appointment.patient.firstName || '',
            lastName: appointment.patient.lastName || '',
            email: appointment.patient.email || '',
            phone: appointment.patient.phone || '',
            nic: appointment.patient.nic || '',
            dateOfBirth: appointment.patient.dateOfBirth || null,
            gender: appointment.patient.gender || '',
            address: appointment.patient.address || null,
            emergencyContact: appointment.patient.emergencyContact || null,
            bloodType: appointment.patient.bloodType || '',
            allergies: appointment.patient.allergies || [],
            medications: appointment.patient.medications || [],
            medicalHistory: appointment.patient.medicalHistory || '',
          }
        : null,
      doctor: appointment.doctor
        ? {
            _id: appointment.doctor._id?.toString() || '',
            name: appointment.doctor.name || '',
            email: appointment.doctor.email || '',
            phone: appointment.doctor.phone || '',
            image: appointment.doctor.image || null,
          }
        : appointment.doctor?.toString() || '',
      pharmacist: appointment.pharmacist
        ? {
            _id: appointment.pharmacist._id?.toString() || '',
            name: appointment.pharmacist.name || '',
            email: appointment.pharmacist.email || '',
            phone: appointment.pharmacist.phone || '',
          }
        : null,
      appointmentDate: appointment.appointmentDate
        ? new Date(appointment.appointmentDate).toISOString().split('T')[0]
        : '',
      appointmentTime: appointment.appointmentTime || '',
      duration: appointment.duration || 30,
      type: appointment.type || '',
      status: appointment.status || 'SCHEDULED',
      reason: appointment.reason || '',
      symptoms: appointment.symptoms || '',
      diagnosis: appointment.diagnosis || '',
      prescription: appointment.prescription || '',
      notes: appointment.notes || '',
      labResults: appointment.labResults || [],
      vitalSigns: appointment.vitalSigns || null,
      followUpDate: appointment.followUpDate || null,
      createdAt: appointment.createdAt || null,
      updatedAt: appointment.updatedAt || null,
    };

    return NextResponse.json(
      {
        success: true,
        data: formattedAppointment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch appointment',
        error:
          process.env.NODE_ENV === 'development'
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Patient) {
      Patient = require('@/models/Patient').default;
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    const appointment = await Appointment.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    const hasAccess = await verifyAppointmentAccess(
      appointment,
      session.user.id,
      session.user.role || 'PATIENT',
      session.user.email || undefined
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to update this appointment',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Determine which fields can be updated based on role
    let allowedUpdates: any = {};

    if (session.user.role === 'PATIENT') {
      // Patients can only update certain fields
      allowedUpdates = {
        reason: body.reason,
        symptoms: body.symptoms,
        notes: body.notes,
      };
    } else if (session.user.role === 'DOCTOR') {
      // Doctors can update medical information
      allowedUpdates = {
        diagnosis: body.diagnosis,
        prescription: body.prescription,
        notes: body.notes,
        symptoms: body.symptoms,
        status: body.status,
        vitalSigns: body.vitalSigns,
        followUpDate: body.followUpDate,
      };
    } else if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') {
      // Admin/Staff can update most fields
      allowedUpdates = {
        appointmentDate: body.appointmentDate,
        appointmentTime: body.appointmentTime,
        duration: body.duration,
        type: body.type,
        status: body.status,
        reason: body.reason,
        symptoms: body.symptoms,
        diagnosis: body.diagnosis,
        prescription: body.prescription,
        notes: body.notes,
        doctor: body.doctor,
        pharmacist: body.pharmacist,
      };
    }

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(
      key => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        ...allowedUpdates,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'patient',
        model: 'Patient',
        select: 'firstName lastName email phone nic dateOfBirth gender',
      })
      .populate({
        path: 'doctor',
        model: 'User',
        select: 'name email phone image',
      })
      .lean()
      .exec();

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, message: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedAppointment,
        message: 'Appointment updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update appointment',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Patient) {
      Patient = require('@/models/Patient').default;
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    const appointment = await Appointment.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    const hasAccess = await verifyAppointmentAccess(
      appointment,
      session.user.id,
      session.user.role || 'PATIENT',
      session.user.email || undefined
    );

    if (
      !hasAccess &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'STAFF'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to cancel this appointment',
        },
        { status: 403 }
      );
    }

    await Appointment.findByIdAndUpdate(id, {
      status: 'CANCELLED',
      isActive: false,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment cancelled successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to cancel appointment',
      },
      { status: 500 }
    );
  }
}

// Helper function to verify appointment access
async function verifyAppointmentAccess(
  appointment: any,
  userId: string,
  userRole: string,
  userEmail?: string
): Promise<boolean> {
  // Admin and staff have access to all appointments
  if (userRole === 'ADMIN' || userRole === 'STAFF') {
    return true;
  }

  // Doctor has access if they're assigned to the appointment
  if (userRole === 'DOCTOR') {
    const doctorId = appointment.doctor?.toString();
    return doctorId === userId;
  }

  if (userRole === 'PHARMACIST') {
    const pharmacistId = appointment.pharmacist?.toString();
    return pharmacistId === userId;
  }

  if (userRole === 'PATIENT') {
    if (!Patient) {
      Patient = require('@/models/Patient').default;
    }

    const patientId =
      appointment.patient?._id?.toString() || appointment.patient?.toString();

    if (!patientId) {
      return false;
    }

    const patient = await Patient.findById(patientId).lean();

    if (!patient) {
      return false;
    }

    let patientUserId: string | undefined;
    if (typeof patient.createdBy === 'string') {
      patientUserId = patient.createdBy;
    } else if (patient.createdBy && typeof patient.createdBy === 'object') {
      patientUserId = (patient.createdBy as any)._id?.toString();
    }

    const matchById = patientUserId === userId;
    const matchByEmail =
      !!patient.email &&
      !!userEmail &&
      patient.email.toLowerCase() === userEmail.toLowerCase();

    return matchById || matchByEmail;
  }

  return false;
}
