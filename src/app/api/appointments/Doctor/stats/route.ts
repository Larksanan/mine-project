/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

let Appointment: any;
let Doctor: any;

try {
  Appointment =
    mongoose.models.Appointment || require('@/models/Appointment').default;
  Doctor = mongoose.models.Doctor || require('@/models/Doctor').default;
} catch (error) {
  console.error('Error loading models:', error);
}

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    // Ensure models are loaded
    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Doctor) {
      Doctor = require('@/models/Doctor').default;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Find the Doctor document for this user
    const doctorDoc = await Doctor.findOne({ user: userObjectId }).lean();

    if (!doctorDoc) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    const doctorId = doctorDoc._id;

    // Get stats
    const [
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      todayAppointments,
    ] = await Promise.all([
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'SCHEDULED',
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'COMPLETED',
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'CANCELLED',
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          total: totalAppointments,
          scheduled: scheduledAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          today: todayAppointments,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch appointment stats',
      },
      { status: 500 }
    );
  }
}
