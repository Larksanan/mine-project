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

try {
  Appointment =
    mongoose.models.Appointment || require('@/models/Appointment').default;
  Patient = mongoose.models.Patient || require('@/models/Patient').default;
  Doctor = mongoose.models.Doctor || require('@/models/Doctor').default;
} catch (error) {
  console.error('Error loading models:', error);
}

export async function GET(request: NextRequest) {
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

    console.log('Models loaded:', {
      Appointment: !!Appointment,
      Patient: !!Patient,
      Doctor: !!Doctor,
      registeredModels: Object.keys(mongoose.models),
    });

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    const query: any = {
      isActive: true,
    };

    const sampleAppointment = await Appointment.findOne({
      $or: [{ doctor: session.user.id }, { pharmacist: session.user.id }],
    }).lean();

    if (sampleAppointment?.doctor) {
      query.doctor = session.user.id;
    } else if (sampleAppointment?.pharmacist) {
      query.pharmacist = session.user.id;
    } else {
      query.doctor = session.user.id;
    }

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (type && type !== 'all') {
      query.type = type.toUpperCase();
    }

    if (date) {
      try {
        const selectedDate = new Date(date);
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);

        query.appointmentDate = {
          $gte: selectedDate,
          $lt: nextDay,
        };
      } catch (dateError) {
        console.error('Date parsing error:', dateError);
      }
    }

    console.log('Query:', query);

    const skip = (page - 1) * limit;

    // FIXED: Now populating doctor data
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({
          path: 'patient',
          model: 'Patient',
          select:
            'firstName lastName email phone nic dateOfBirth gender address',
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
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Appointment.countDocuments(query),
    ]);

    console.log(`Found ${appointments.length} appointments, total: ${total}`);
    if (appointments.length > 0) {
      console.log('Sample appointment doctor data:', appointments[0].doctor);
    }

    // FIXED: Format with proper doctor data
    const formattedAppointments = appointments.map((apt: any) => {
      const patientData = apt.patient
        ? {
            _id: apt.patient._id?.toString() || '',
            firstName: apt.patient.firstName || '',
            lastName: apt.patient.lastName || '',
            email: apt.patient.email || '',
            phone: apt.patient.phone || '',
            nic: apt.patient.nic || '',
            dateOfBirth: apt.patient.dateOfBirth || null,
            gender: apt.patient.gender || '',
            address: apt.patient.address || null,
          }
        : null;

      // Handle doctor data - it comes from Doctor collection with nested user
      let doctorData = null;
      if (apt.doctor) {
        if (typeof apt.doctor === 'object' && apt.doctor.user) {
          // Doctor document with user reference
          doctorData = {
            _id: apt.doctor._id?.toString() || '',
            id: apt.doctor._id?.toString() || '',
            name: apt.doctor.user?.name || '',
            email: apt.doctor.user?.email || '',
            phone: apt.doctor.user?.phone || '',
            specialization: apt.doctor.profile?.specialization || '',
            department: apt.doctor.profile?.department || '',
          };
        } else if (typeof apt.doctor === 'string') {
          // Just an ID - not populated
          doctorData = {
            _id: apt.doctor,
            id: apt.doctor,
            name: 'Unknown',
            email: '',
            phone: '',
            specialization: '',
            department: '',
          };
        }
      }

      return {
        _id: apt._id?.toString() || '',
        id: apt._id?.toString() || '',
        patient: patientData,
        doctor: doctorData,
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
    console.error('=== ERROR IN GET /api/appointments ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Registered models:', Object.keys(mongoose.models));

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
                registeredModels: Object.keys(mongoose.models),
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
