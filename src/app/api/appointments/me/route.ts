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

export async function GET(_request: NextRequest) {
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

    console.log('Fetching appointments for user:', {
      userId: session.user.id,
      role: session.user.role,
      email: session.user.email,
    });

    let appointments = [];

    if (session.user.role === 'PATIENT') {
      let patient = await Patient.findOne({
        createdBy: session.user.id,
      }).lean();

      if (!patient && session.user.email) {
        patient = await Patient.findOne({
          email: session.user.email,
        }).lean();
      }

      if (!patient) {
        console.log('No patient profile found for user');
        return NextResponse.json(
          {
            success: false,
            message:
              'Patient profile not found. Please create a patient profile first.',
            needsPatientProfile: true,
          },
          { status: 404 }
        );
      }

      console.log('Found patient profile:', patient._id);

      appointments = await Appointment.find({
        patient: patient._id,
        isActive: true,
      })
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
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .lean()
        .exec();
    } else if (session.user.role === 'DOCTOR') {
      appointments = await Appointment.find({
        doctor: session.user.id,
        isActive: true,
      })
        .populate({
          path: 'patient',
          model: 'Patient',
          select: 'firstName lastName email phone nic dateOfBirth gender',
        })
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .lean()
        .exec();
    } else if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') {
      appointments = await Appointment.find({ isActive: true })
        .populate({
          path: 'patient',
          model: 'Patient',
          select: 'firstName lastName email phone nic dateOfBirth gender',
        })
        .populate({
          path: 'doctor',
          model: 'User',
          select: 'name email phone',
        })
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .lean()
        .exec();
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid user role' },
        { status: 403 }
      );
    }

    console.log(`Found ${appointments.length} appointments`);

    // Format appointments
    const formattedAppointments = appointments.map((apt: any) => ({
      _id: apt._id?.toString() || '',
      patient: apt.patient
        ? {
            _id: apt.patient._id?.toString() || '',
            firstName: apt.patient.firstName || '',
            lastName: apt.patient.lastName || '',
            email: apt.patient.email || '',
            phone: apt.patient.phone || '',
            nic: apt.patient.nic || '',
            dateOfBirth: apt.patient.dateOfBirth || null,
            gender: apt.patient.gender || '',
          }
        : null,
      doctor: apt.doctor
        ? {
            _id: apt.doctor._id?.toString() || '',
            name: apt.doctor.name || '',
            email: apt.doctor.email || '',
            phone: apt.doctor.phone || '',
            image: apt.doctor.image || '',
          }
        : apt.doctor?.toString() || '',
      pharmacist: apt.pharmacist?.toString() || null,
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
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedAppointments,
        count: formattedAppointments.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
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
