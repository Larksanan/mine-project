/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const doctor = await Doctor.findById(id).populate('user', 'name email');

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Check permissions - only admin or the doctor themselves can view stats
    const currentUser = await User.findById(session.user.id);
    if (
      !currentUser ||
      (currentUser.role !== 'ADMIN' &&
        doctor.user._id.toString() !== session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doctorUserId = doctor.user._id;

    // Date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all appointments for this doctor
    const allAppointments = await Appointment.find({
      doctor: doctorUserId,
      isActive: true,
    });

    // Total appointments
    const totalAppointments = allAppointments.length;

    // Appointments today
    const appointmentsToday = await Appointment.countDocuments({
      doctor: doctorUserId,
      appointmentDate: { $gte: today, $lt: tomorrow },
      isActive: true,
    });

    // Appointments this week
    const appointmentsThisWeek = await Appointment.countDocuments({
      doctor: doctorUserId,
      appointmentDate: { $gte: thisWeekStart },
      isActive: true,
    });

    // Appointments this month
    const appointmentsThisMonth = await Appointment.countDocuments({
      doctor: doctorUserId,
      appointmentDate: { $gte: thisMonthStart },
      isActive: true,
    });

    // Upcoming appointments
    const upcomingAppointments = await Appointment.countDocuments({
      doctor: doctorUserId,
      appointmentDate: { $gte: now },
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      isActive: true,
    });

    // Today's appointments with details
    const todayAppointments = await Appointment.find({
      doctor: doctorUserId,
      appointmentDate: { $gte: today, $lt: tomorrow },
      isActive: true,
    })
      .populate('patient', 'firstName lastName email phone')
      .sort({ appointmentTime: 1 })
      .lean();

    // Next 10 upcoming appointments
    const nextAppointments = await Appointment.find({
      doctor: doctorUserId,
      appointmentDate: { $gte: now },
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
      isActive: true,
    })
      .populate('patient', 'firstName lastName email phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(10)
      .lean();

    // Unique patients count
    const uniquePatients = await Appointment.distinct('patient', {
      doctor: doctorUserId,
      isActive: true,
    });

    // Appointment status breakdown
    const statusBreakdown = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorUserId,
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Appointment type breakdown
    const typeBreakdown = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorUserId,
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorUserId,
          appointmentDate: { $gte: sixMonthsAgo },
          isActive: true,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAppointments,
          totalPatients: uniquePatients.length,
          appointmentsToday,
          appointmentsThisWeek,
          appointmentsThisMonth,
          upcomingAppointments,
          averageRating: doctor.profile?.rating?.average || 0,
          ratingCount: doctor.profile?.rating?.count || 0,
        },
        profile: {
          specialization: doctor.profile?.specialization,
          consultationFee: doctor.profile?.consultationFee,
          experience: doctor.profile?.experience,
          isVerified: doctor.profile?.isVerified,
          isLicenseValid: doctor.profile?.licenseExpiry
            ? doctor.profile?.licenseExpiry > new Date()
            : false,
          availableToday: doctor.profile?.availability.days.includes(
            now.toLocaleString('en-US', { weekday: 'long' })
          ),
        },
        appointments: {
          today: todayAppointments.map((apt: any) => ({
            id: apt._id.toString(),
            patient: apt.patient,
            appointmentTime: apt.appointmentTime,
            type: apt.type,
            status: apt.status,
            reason: apt.reason,
          })),
          upcoming: nextAppointments.map((apt: any) => ({
            id: apt._id.toString(),
            patient: apt.patient,
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.appointmentTime,
            type: apt.type,
            status: apt.status,
            reason: apt.reason,
          })),
        },
        breakdown: {
          byStatus: statusBreakdown.map(item => ({
            status: item._id,
            count: item.count,
          })),
          byType: typeBreakdown.map(item => ({
            type: item._id,
            count: item.count,
          })),
        },
        trends: {
          monthly: monthlyTrend.map(item => ({
            year: item._id.year,
            month: item._id.month,
            count: item.count,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching doctor statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor statistics' },
      { status: 500 }
    );
  }
}
