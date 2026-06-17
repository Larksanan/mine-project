/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Import models
let Appointment: any;
let Doctor: any;

let Patient: any;

try {
  Appointment =
    mongoose.models.Appointment || require('@/models/Appointment').default;
  Doctor = mongoose.models.Doctor || require('@/models/Doctor').default;
  Patient = mongoose.models.Patient || require('@/models/Patient').default;
} catch (error) {
  console.error('Error loading models:', error);
}

export async function GET() {
  try {
    await connectDB();

    // Ensure models are loaded
    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Doctor) {
      Doctor = require('@/models/Doctor').default;
    }
    if (!Patient) {
      Patient = require('@/models/Patient').default;
    }

    const session = await getServerSession(authOptions);

    console.log('Stats API - Session:', {
      userId: session?.user?.id,
      role: session?.user?.role,
      email: session?.user?.email,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = session.user.role || 'PATIENT';
    console.log('Stats API - User role:', userRole);

    let stats: any = {};

    // Different stats based on user role
    if (userRole === 'DOCTOR') {
      console.log(
        'Stats API - Fetching doctor profile for user:',
        session.user.id
      );

      // Stats for doctors
      const doctor = await Doctor.findOne({ user: session.user.id }).lean();
      console.log('Stats API - Doctor found:', doctor ? 'Yes' : 'No');

      if (!doctor) {
        console.log('Stats API - No doctor profile found');
        return NextResponse.json(
          {
            success: false,
            message: 'Doctor profile not found. Please complete setup.',
            needsDoctorProfile: true,
          },
          { status: 404 }
        );
      }

      const doctorId = doctor._id;

      const [total, scheduled, confirmed, completed, cancelled] =
        await Promise.all([
          Appointment.countDocuments({ doctor: doctorId, isActive: true }),
          Appointment.countDocuments({
            doctor: doctorId,
            isActive: true,
            status: { $regex: /scheduled/i },
          }),
          Appointment.countDocuments({
            doctor: doctorId,
            isActive: true,
            status: { $regex: /confirmed/i },
          }),
          Appointment.countDocuments({
            doctor: doctorId,
            isActive: true,
            status: { $regex: /completed/i },
          }),
          Appointment.countDocuments({
            doctor: doctorId,
            isActive: true,
            status: { $regex: /cancelled/i },
          }),
        ]);

      // Get today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = await Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        appointmentDate: {
          $gte: today,
          $lt: tomorrow,
        },
      });

      stats = {
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        today: todayAppointments,
      };

      console.log('Stats API - Doctor stats:', stats);
    } else if (userRole === 'PATIENT') {
      console.log(
        'Stats API - Fetching patient profile for user:',
        session.user.id
      );

      // Stats for patients
      const patient = await Patient.findOne({
        $or: [{ createdBy: session.user.id }, { email: session.user.email }],
      }).lean();

      console.log('Stats API - Patient found:', patient ? 'Yes' : 'No');

      if (!patient) {
        console.log(
          'Stats API - No patient profile found, returning empty stats'
        );
        // Return empty stats instead of error for patients
        return NextResponse.json(
          {
            success: true,
            data: {
              total: 0,
              scheduled: 0,
              confirmed: 0,
              completed: 0,
              cancelled: 0,
              upcoming: 0,
            },
            role: userRole,
            message:
              'No patient profile found. Please create a patient profile.',
            needsPatientProfile: true,
          },
          { status: 200 }
        );
      }

      const patientId = patient._id;

      const [total, scheduled, confirmed, completed, cancelled] =
        await Promise.all([
          Appointment.countDocuments({ patient: patientId, isActive: true }),
          Appointment.countDocuments({
            patient: patientId,
            isActive: true,
            status: { $regex: /scheduled/i },
          }),
          Appointment.countDocuments({
            patient: patientId,
            isActive: true,
            status: { $regex: /confirmed/i },
          }),
          Appointment.countDocuments({
            patient: patientId,
            isActive: true,
            status: { $regex: /completed/i },
          }),
          Appointment.countDocuments({
            patient: patientId,
            isActive: true,
            status: { $regex: /cancelled/i },
          }),
        ]);

      // Get upcoming appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = await Appointment.countDocuments({
        patient: patientId,
        isActive: true,
        appointmentDate: { $gte: today },
        status: { $in: ['SCHEDULED', 'CONFIRMED', 'scheduled', 'confirmed'] },
      });

      stats = {
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        upcoming,
      };

      console.log('Stats API - Patient stats:', stats);
    } else if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST') {
      console.log('Stats API - Fetching admin/staff stats');

      // Stats for admin/staff - all appointments
      const [total, scheduled, confirmed, completed, cancelled] =
        await Promise.all([
          Appointment.countDocuments({ isActive: true }),
          Appointment.countDocuments({
            isActive: true,
            status: { $regex: /scheduled/i },
          }),
          Appointment.countDocuments({
            isActive: true,
            status: { $regex: /confirmed/i },
          }),
          Appointment.countDocuments({
            isActive: true,
            status: { $regex: /completed/i },
          }),
          Appointment.countDocuments({
            isActive: true,
            status: { $regex: /cancelled/i },
          }),
        ]);

      // Get today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = await Appointment.countDocuments({
        isActive: true,
        appointmentDate: {
          $gte: today,
          $lt: tomorrow,
        },
      });

      stats = {
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        today: todayAppointments,
      };

      console.log('Stats API - Admin/RECEPTIONIST stats:', stats);
    } else {
      console.log('Stats API - Unknown role:', userRole);
      return NextResponse.json(
        { success: false, message: 'Invalid user role' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
      role: userRole,
    });
  } catch (error: any) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
        error:
          process.env.NODE_ENV === 'development'
            ? {
                message: error.message,
                stack: error.stack,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
