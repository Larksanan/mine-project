/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

let Appointment: any;
let Patient: any;
let Doctor: any;

async function loadModels() {
  try {
    if (!Appointment) {
      Appointment =
        mongoose.models.Appointment ||
        (await import('@/models/Appointment')).default;
    }
    if (!Patient) {
      Patient =
        mongoose.models.Patient || (await import('@/models/Patient')).default;
    }
    if (!Doctor) {
      Doctor =
        mongoose.models.Doctor || (await import('@/models/Doctor')).default;
    }
  } catch (error) {
    console.error('Error loading models:', error);
    throw new Error('Failed to load database models');
  }
}

// POST - Patient books an appointment
export async function POST(request: NextRequest) {
  try {
    console.log('=== APPOINTMENT BOOKING API CALLED ===');

    await connectDB();
    await loadModels();

    // Get session
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);

    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
      symptoms,
      notes,
      type,
      duration = 30,
    } = body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Missing required fields: doctorId, appointmentDate, appointmentTime, reason',
        },
        { status: 400 }
      );
    }

    // Convert session user ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Find patient profile using createdBy field (based on your existing structure)
    const patient = await Patient.findOne({
      $or: [
        { user: userObjectId },
        { 'createdBy._id': userObjectId },
        { createdBy: userObjectId },
      ],
    }).lean();

    console.log('Patient found:', patient?._id);

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Patient profile not found. Please complete your profile first.',
        },
        { status: 404 }
      );
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId).lean();

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Parse and validate appointment date
    const appointmentDateTime = new Date(appointmentDate);

    if (isNaN(appointmentDateTime.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid appointment date format' },
        { status: 400 }
      );
    }

    // Validate appointment date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(appointmentDateTime);
    aptDate.setHours(0, 0, 0, 0);

    if (aptDate < today) {
      return NextResponse.json(
        { success: false, message: 'Appointment date cannot be in the past' },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: appointmentDateTime,
      appointmentTime: appointmentTime,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] },
      isActive: true,
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This time slot is already booked. Please select a different time.',
        },
        { status: 409 }
      );
    }

    // Validate appointment type
    const validTypes = ['CONSULTATION', 'FOLLOW_UP', 'CHECK_UP', 'EMERGENCY'];
    const appointmentType = type?.toUpperCase() || 'CONSULTATION';

    if (!validTypes.includes(appointmentType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid appointment type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create appointment
    const newAppointment = new Appointment({
      patient: patient._id,
      doctor: doctorId,
      appointmentDate: appointmentDateTime,
      appointmentTime: appointmentTime,
      duration: duration || 30,
      type: appointmentType,
      status: 'SCHEDULED',
      reason: reason.trim(),
      symptoms: symptoms?.trim() || '',
      notes: notes?.trim() || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newAppointment.save();
    console.log('Appointment created:', newAppointment._id);

    // Populate the saved appointment
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate({
        path: 'patient',
        select: 'firstName lastName email phone nic dateOfBirth gender',
      })
      .populate({
        path: 'doctor',
        select: 'user profile',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .lean()
      .exec();

    // Format response
    const formattedAppointment = {
      _id: populatedAppointment._id?.toString() || '',
      patient: populatedAppointment.patient
        ? {
            _id: populatedAppointment.patient._id?.toString() || '',
            firstName: populatedAppointment.patient.firstName || '',
            lastName: populatedAppointment.patient.lastName || '',
            email: populatedAppointment.patient.email || '',
            phone: populatedAppointment.patient.phone || '',
          }
        : null,
      doctor: populatedAppointment.doctor
        ? {
            _id: populatedAppointment.doctor._id?.toString() || '',
            name: populatedAppointment.doctor.user?.name || '',
            email: populatedAppointment.doctor.user?.email || '',
            specialization:
              populatedAppointment.doctor.profile?.specialization || '',
            department: populatedAppointment.doctor.profile?.department || '',
          }
        : null,
      appointmentDate: populatedAppointment.appointmentDate
        ? new Date(populatedAppointment.appointmentDate)
            .toISOString()
            .split('T')[0]
        : '',
      appointmentTime: populatedAppointment.appointmentTime || '',
      duration: populatedAppointment.duration || 30,
      type: populatedAppointment.type || '',
      status: populatedAppointment.status || 'SCHEDULED',
      reason: populatedAppointment.reason || '',
      symptoms: populatedAppointment.symptoms || '',
      notes: populatedAppointment.notes || '',
      createdAt: populatedAppointment.createdAt || null,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment booked successfully',
        data: formattedAppointment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('=== ERROR IN POST /api/appointments/patient/book ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Duplicate appointment detected',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to book appointment',
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

// GET - Get patient's own appointments
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await loadModels();

    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Convert session user ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Find patient profile
    const patient = await Patient.findOne({
      $or: [
        { user: userObjectId },
        { 'createdBy._id': userObjectId },
        { createdBy: userObjectId },
      ],
    }).lean();

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Patient profile not found. Please complete your profile first.',
        },
        { status: 404 }
      );
    }

    // Build query
    const query: any = {
      patient: patient._id,
      isActive: true,
    };

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    const skip = (page - 1) * limit;

    // Fetch appointments
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
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
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Appointment.countDocuments(query),
    ]);

    // Format appointments with debug logging
    const formattedAppointments = appointments.map((apt: any) => {
      console.log(
        'Appointment doctor data:',
        JSON.stringify(apt.doctor, null, 2)
      );

      return {
        _id: apt._id?.toString() || '',
        doctor: apt.doctor
          ? {
              _id: apt.doctor._id?.toString() || '',
              name: apt.doctor.user?.name || apt.doctor.name || '',
              email: apt.doctor.user?.email || apt.doctor.email || '',
              phone: apt.doctor.user?.phone || apt.doctor.phone || '',
              specialization:
                apt.doctor.profile?.specialization ||
                apt.doctor.specialization ||
                '',
              department:
                apt.doctor.profile?.department || apt.doctor.department || '',
              hospital:
                apt.doctor.profile?.hospitalAffiliation ||
                apt.doctor.hospital ||
                '',
            }
          : null,
        appointmentDate: apt.appointmentDate
          ? new Date(apt.appointmentDate).toISOString().split('T')[0]
          : '',
        appointmentTime: apt.appointmentTime || '',
        duration: apt.duration || 30,
        type: apt.type || '',
        status: apt.status || 'SCHEDULED',
        reason: apt.reason || '',
        symptoms: apt.symptoms || '',
        diagnosis: apt.diagnosis || '',
        prescription: apt.prescription || '',
        notes: apt.notes || '',
        createdAt: apt.createdAt || null,
        updatedAt: apt.updatedAt || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          appointments: formattedAppointments,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('=== ERROR IN GET /api/appointments/patient/book ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch appointments',
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
