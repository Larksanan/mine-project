/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Check if user is a doctor
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Doctor role required.' },
        { status: 403 }
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this week's date range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Run all stats queries in parallel
    const [
      totalAppointments,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      inPersonAppointments,
      videoAppointments,
      phoneAppointments,
      todayScheduled,
      todayCompleted,
      uniquePatients,
    ] = await Promise.all([
      // Total appointments (all time)
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
      }),

      // Today's appointments
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        appointmentDate: {
          $gte: today,
          $lt: tomorrow,
        },
      }),

      // This week's appointments
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        appointmentDate: {
          $gte: startOfWeek,
          $lt: endOfWeek,
        },
      }),

      // This month's appointments
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        appointmentDate: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
      }),

      // Scheduled appointments (all time)
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'SCHEDULED',
      }),

      // Completed appointments (all time)
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'COMPLETED',
      }),

      // Cancelled appointments (all time)
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'CANCELLED',
      }),

      // No-show appointments (all time)
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'NO_SHOW',
      }),

      // In-person appointments (all time)
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        type: 'IN-PERSON',
      }),

      // Video appointments (all time)
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        type: 'VIDEO',
      }),

      // Phone appointments (all time)
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        type: 'PHONE',
      }),

      // Today's scheduled appointments
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'SCHEDULED',
        appointmentDate: {
          $gte: today,
          $lt: tomorrow,
        },
      }),

      // Today's completed appointments
      Appointment.countDocuments({
        doctor: doctorId,
        isActive: true,
        status: 'COMPLETED',
        appointmentDate: {
          $gte: today,
          $lt: tomorrow,
        },
      }),

      // Count unique patients
      Appointment.distinct('patient', {
        doctor: doctorId,
        isActive: true,
      }).then((patients: any[]) => patients.length),
    ]);

    // Calculate average appointments per day (this month)
    const daysInMonth = endOfMonth.getDate();
    const avgPerDay =
      monthAppointments > 0
        ? (monthAppointments / daysInMonth).toFixed(1)
        : '0';

    // Calculate completion rate
    const completionRate =
      totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
        : '0';

    // Calculate no-show rate
    const noShowRate =
      totalAppointments > 0
        ? ((noShowAppointments / totalAppointments) * 100).toFixed(1)
        : '0';

    return NextResponse.json(
      {
        success: true,
        data: {
          // Overview stats
          overview: {
            total: totalAppointments,
            today: todayAppointments,
            week: weekAppointments,
            month: monthAppointments,
            avgPerDay: parseFloat(avgPerDay),
          },

          // Status breakdown
          byStatus: {
            scheduled: scheduledAppointments,
            completed: completedAppointments,
            cancelled: cancelledAppointments,
            noShow: noShowAppointments,
            completionRate: parseFloat(completionRate),
            noShowRate: parseFloat(noShowRate),
          },

          // Type breakdown
          byType: {
            inPerson: inPersonAppointments,
            video: videoAppointments,
            phone: phoneAppointments,
          },

          // Today's breakdown
          today: {
            total: todayAppointments,
            scheduled: todayScheduled,
            completed: todayCompleted,
            remaining: todayScheduled, // Same as scheduled for today
          },

          // Additional metrics
          metrics: {
            totalPatients: uniquePatients,
            upcomingAppointments: scheduledAppointments,
            completionRate: parseFloat(completionRate),
            noShowRate: parseFloat(noShowRate),
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching appointment stats:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch appointment statistics',
      },
      { status: 500 }
    );
  }
}
