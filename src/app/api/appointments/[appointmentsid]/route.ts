/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Import models
let Appointment: any;
let Patient: any;
let Doctor: any;
let User: any;

try {
  Appointment =
    mongoose.models.Appointment || require('@/models/Appointment').default;
  Patient = mongoose.models.Patient || require('@/models/Patient').default;
  Doctor = mongoose.models.Doctor || require('@/models/Doctor').default;
  User = mongoose.models.User || require('@/models/User').default;
} catch (error) {
  console.error('Error loading models:', error);
}

// Helper function to check access
async function checkAppointmentAccess(
  userId: string,
  appointment: any
): Promise<{ hasAccess: boolean; role: string }> {
  const user = await User.findById(userId).select('role').lean();

  if (!user) {
    return { hasAccess: false, role: '' };
  }

  // ADMIN and RECEPTIONIST have access to all appointments
  if (user.role === 'ADMIN' || user.role === 'RECEPTIONIST') {
    return { hasAccess: true, role: user.role };
  }

  // DOCTOR - check if they own this appointment
  if (user.role === 'DOCTOR') {
    const doctorDoc = await Doctor.findOne({ user: userId }).lean();
    if (!doctorDoc) {
      return { hasAccess: false, role: user.role };
    }

    const doctorId = appointment.doctor?.toString();
    const userDoctorId = doctorDoc._id.toString();

    if (doctorId === userDoctorId) {
      return { hasAccess: true, role: user.role };
    }
  }

  // Check if user is pharmacist for this appointment
  const pharmacistId = appointment.pharmacist?.toString();
  if (pharmacistId === userId) {
    return { hasAccess: true, role: user.role || 'PHARMACIST' };
  }

  return { hasAccess: false, role: user.role || '' };
}

// Helper function to format doctor data
function formatDoctorData(doctor: any): any {
  if (!doctor) return null;

  // If doctor is just a string ID
  if (typeof doctor === 'string') {
    return null;
  }

  // If doctor document with user reference and profile
  if (doctor.user && doctor.profile) {
    // Transform availability structure to match frontend expectations
    const availableHours = doctor.profile?.availability
      ? {
          days: doctor.profile.availability.days || [],
          start: doctor.profile.availability.startTime || '',
          end: doctor.profile.availability.endTime || '',
        }
      : null;

    return {
      _id: doctor._id?.toString() || '',
      id: doctor._id?.toString() || '',
      name: doctor.user?.name || '',
      email: doctor.user?.email || '',
      phone: doctor.user?.phone || '',
      specialization: doctor.profile?.specialization || '',
      department: doctor.profile?.department || '',
      hospital: doctor.profile?.hospitalAffiliation || '',
      hospitalAffiliation: doctor.profile?.hospitalAffiliation || '',
      experience: doctor.profile?.experience || 0,
      consultationFee: doctor.profile?.consultationFee || 0,
      licenseNumber: doctor.profile?.licenseNumber || '',
      qualifications: doctor.profile?.qualifications || [],
      languages: doctor.profile?.languages || [],
      services: doctor.profile?.services || [],
      awards: doctor.profile?.awards || [],
      publications: doctor.profile?.publications || [],
      availableHours: availableHours,
      availability: doctor.profile?.availability || null,
      rating: doctor.profile?.rating || null,
      isVerified: doctor.profile?.isVerified || false,
    };
  }

  // Fallback for incomplete data
  return {
    _id: doctor._id?.toString() || '',
    id: doctor._id?.toString() || '',
    name: 'Unknown',
    email: '',
    phone: '',
    specialization: '',
    department: '',
    hospital: '',
  };
}

// GET - Fetch single appointment by ID
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ appointmentsid: string }> }
) {
  try {
    await connectDB();

    // Ensure models are loaded
    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Patient) {
      Patient = require('@/models/Patient').default;
    }
    if (!Doctor) {
      Doctor = require('@/models/Doctor').default;
    }
    if (!User) {
      User = require('@/models/User').default;
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { appointmentsid: id } = await context.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    // Fetch appointment with full doctor population
    const appointment = await Appointment.findOne({
      _id: id,
      isActive: true,
    })
      .populate({
        path: 'patient',
        model: 'Patient',
        select:
          'firstName lastName email phone nic dateOfBirth gender address bloodType allergies medications',
      })
      .populate({
        path: 'doctor',
        model: 'Doctor',
        select: 'user profile',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name email phone',
        },
      })
      .lean()
      .exec();

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const { hasAccess } = await checkAppointmentAccess(
      session.user.id,
      appointment
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to this appointment' },
        { status: 403 }
      );
    }

    // Format appointment with properly structured doctor data
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
            bloodType: appointment.patient.bloodType || '',
            allergies: appointment.patient.allergies || [],
            medications: appointment.patient.medications || [],
          }
        : null,
      doctor: formatDoctorData(appointment.doctor),
      pharmacist: appointment.pharmacist?.toString() || null,
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
    console.error('=== ERROR IN GET /api/appointments/[id] ===');
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

// PATCH - Update appointment
export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ appointmentsid: string }> }
) {
  try {
    await connectDB();

    // Ensure models are loaded
    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Doctor) {
      Doctor = require('@/models/Doctor').default;
    }
    if (!User) {
      User = require('@/models/User').default;
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { appointmentsid: id } = await context.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await _request.json();

    // Check if appointment exists
    const existingAppointment = await Appointment.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const { hasAccess } = await checkAppointmentAccess(
      session.user.id,
      existingAppointment
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to this appointment' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Allowed fields to update
    const allowedFields = [
      'appointmentDate',
      'appointmentTime',
      'duration',
      'type',
      'status',
      'reason',
      'symptoms',
      'diagnosis',
      'prescription',
      'notes',
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Validate status if provided
    if (body.status) {
      const validStatuses = [
        'SCHEDULED',
        'CONFIRMED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
      ];
      if (!validStatuses.includes(body.status.toUpperCase())) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
      updateData.status = body.status.toUpperCase();
    }

    // Validate type if provided
    if (body.type) {
      const validTypes = [
        'CONSULTATION',
        'FOLLOW_UP',
        'CHECK_UP',
        'EMERGENCY',
        'ROUTINE',
      ];
      if (!validTypes.includes(body.type.toUpperCase())) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }
      updateData.type = body.type.toUpperCase();
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate({
        path: 'patient',
        model: 'Patient',
        select:
          'firstName lastName email phone nic dateOfBirth gender address bloodType allergies medications',
      })
      .populate({
        path: 'doctor',
        model: 'Doctor',
        select: 'user profile',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name email phone',
        },
      })
      .lean()
      .exec();

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, message: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    // Format response with properly structured doctor data
    const formattedAppointment = {
      _id: updatedAppointment._id?.toString() || '',
      patient: updatedAppointment.patient
        ? {
            _id: updatedAppointment.patient._id?.toString() || '',
            firstName: updatedAppointment.patient.firstName || '',
            lastName: updatedAppointment.patient.lastName || '',
            email: updatedAppointment.patient.email || '',
            phone: updatedAppointment.patient.phone || '',
            nic: updatedAppointment.patient.nic || '',
            dateOfBirth: updatedAppointment.patient.dateOfBirth || null,
            gender: updatedAppointment.patient.gender || '',
            address: updatedAppointment.patient.address || null,
            bloodType: updatedAppointment.patient.bloodType || '',
            allergies: updatedAppointment.patient.allergies || [],
            medications: updatedAppointment.patient.medications || [],
          }
        : null,
      doctor: formatDoctorData(updatedAppointment.doctor),
      pharmacist: updatedAppointment.pharmacist?.toString() || null,
      appointmentDate: updatedAppointment.appointmentDate
        ? new Date(updatedAppointment.appointmentDate)
            .toISOString()
            .split('T')[0]
        : '',
      appointmentTime: updatedAppointment.appointmentTime || '',
      duration: updatedAppointment.duration || 30,
      type: updatedAppointment.type || '',
      status: updatedAppointment.status || 'SCHEDULED',
      reason: updatedAppointment.reason || '',
      symptoms: updatedAppointment.symptoms || '',
      diagnosis: updatedAppointment.diagnosis || '',
      prescription: updatedAppointment.prescription || '',
      notes: updatedAppointment.notes || '',
      createdAt: updatedAppointment.createdAt || null,
      updatedAt: updatedAppointment.updatedAt || null,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment updated successfully',
        data: formattedAppointment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('=== ERROR IN PATCH /api/appointments/[id] ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update appointment',
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

// DELETE - Soft delete appointment
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ appointmentsid: string }> }
) {
  try {
    await connectDB();

    // Ensure models are loaded
    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Doctor) {
      Doctor = require('@/models/Doctor').default;
    }
    if (!User) {
      User = require('@/models/User').default;
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { appointmentsid: id } = await context.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    // Check if appointment exists
    const existingAppointment = await Appointment.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const { hasAccess } = await checkAppointmentAccess(
      session.user.id,
      existingAppointment
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to this appointment' },
        { status: 403 }
      );
    }

    // Soft delete - set isActive to false
    await Appointment.findByIdAndUpdate(id, {
      isActive: false,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('=== ERROR IN DELETE /api/appointments/[id] ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete appointment',
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
