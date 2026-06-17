/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Type for populated patient
interface PopulatedPatient {
  _id: any;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic?: string;
  dateOfBirth?: Date;
  gender?: string;
}

interface PopulatedAppointment {
  _id: any;
  patient: PopulatedPatient;
  doctor?: any;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  type: string;
  status: string;
  reason: string;
  diagnosis?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;

    // Find the specific appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'patient',
        select: 'firstName lastName email phone nic dateOfBirth gender',
      })
      .lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Cast to properly typed appointment
    const typedAppointment = appointment as unknown as PopulatedAppointment;

    // Verify authorization
    if (typedAppointment.doctor?.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to view this appointment' },
        { status: 403 }
      );
    }

    const patientId = typedAppointment.patient._id;

    // Get patient's appointment history statistics
    const [
      totalPatientAppointments,
      completedPatientAppointments,
      cancelledPatientAppointments,
      upcomingPatientAppointments,
      patientAppointmentHistory,
      patientNoShows,
    ] = await Promise.all([
      // Total appointments for this patient with this doctor
      Appointment.countDocuments({
        patient: patientId,
        doctor: session.user.id,
        isActive: true,
      }),

      // Completed appointments
      Appointment.countDocuments({
        patient: patientId,
        doctor: session.user.id,
        status: 'COMPLETED',
        isActive: true,
      }),

      // Cancelled appointments
      Appointment.countDocuments({
        patient: patientId,
        doctor: session.user.id,
        status: 'CANCELLED',
        isActive: true,
      }),

      // Upcoming appointments
      Appointment.countDocuments({
        patient: patientId,
        doctor: session.user.id,
        appointmentDate: { $gte: new Date() },
        status: { $in: ['SCHEDULED', 'CONFIRMED'] },
        isActive: true,
      }),

      // Recent appointment history (last 5)
      Appointment.find({
        patient: patientId,
        doctor: session.user.id,
        isActive: true,
        _id: { $ne: appointmentId }, // Exclude current appointment
      })
        .select('appointmentDate appointmentTime status type reason diagnosis')
        .sort({ appointmentDate: -1 })
        .limit(5)
        .lean(),

      // No-show count
      Appointment.countDocuments({
        patient: patientId,
        doctor: session.user.id,
        status: 'NO_SHOW',
        isActive: true,
      }),
    ]);

    // Calculate appointment metrics
    const appointmentDate = new Date(typedAppointment.appointmentDate);
    const today = new Date();
    const daysUntilAppointment = Math.ceil(
      (appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isUpcoming = appointmentDate >= today;
    const isPast = appointmentDate < today;
    const isToday = appointmentDate.toDateString() === today.toDateString();

    // Calculate patient reliability score (0-100)
    const totalNonUpcoming =
      totalPatientAppointments - upcomingPatientAppointments;
    const reliabilityScore =
      totalNonUpcoming > 0
        ? Math.round((completedPatientAppointments / totalNonUpcoming) * 100)
        : 100;

    // Format appointment history
    const formattedHistory = patientAppointmentHistory.map((apt: any) => ({
      id: apt._id.toString(),
      date: apt.appointmentDate.toISOString().split('T')[0],
      time: apt.appointmentTime,
      status: apt.status,
      type: apt.type,
      reason: apt.reason,
      diagnosis: apt.diagnosis || 'N/A',
    }));

    const stats = {
      appointment: {
        id: typedAppointment._id.toString(),
        status: typedAppointment.status,
        type: typedAppointment.type,
        date: typedAppointment.appointmentDate.toISOString().split('T')[0],
        time: typedAppointment.appointmentTime,
        duration: typedAppointment.duration,
        isUpcoming,
        isPast,
        isToday,
        daysUntilAppointment: isUpcoming ? daysUntilAppointment : null,
      },
      patient: {
        id: patientId.toString(),
        name: `${typedAppointment.patient.firstName} ${typedAppointment.patient.lastName}`,
        email: typedAppointment.patient.email,
        phone: typedAppointment.patient.phone,
        totalAppointments: totalPatientAppointments,
        completedAppointments: completedPatientAppointments,
        cancelledAppointments: cancelledPatientAppointments,
        upcomingAppointments: upcomingPatientAppointments,
        noShowCount: patientNoShows,
        reliabilityScore,
        history: formattedHistory,
      },
      timeline: {
        created: typedAppointment.createdAt,
        lastUpdated: typedAppointment.updatedAt,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: stats,
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
