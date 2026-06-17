/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all doctors count
    const totalDoctors = await Doctor.countDocuments();

    // Get verified doctors
    const verifiedDoctors = await Doctor.countDocuments({
      'profile.isVerified': true,
    });

    // Get unverified doctors
    const unverifiedDoctors = await Doctor.countDocuments({
      'profile.isVerified': false,
    });

    // Get doctors with valid licenses
    const validLicenseDoctors = await Doctor.countDocuments({
      'profile.licenseExpiry': { $gt: new Date() },
    });

    // Get doctors with expired licenses
    const expiredLicenseDoctors = await Doctor.countDocuments({
      'profile.licenseExpiry': { $lte: new Date() },
    });

    // Get doctors available today
    const today = new Date().toLocaleString('en-US', { weekday: 'long' });
    const availableToday = await Doctor.countDocuments({
      'profile.availability.days': today,
      'profile.isVerified': true,
      'profile.licenseExpiry': { $gt: new Date() },
    });

    // Get specialization distribution
    const specializationStats = await Doctor.aggregate([
      {
        $group: {
          _id: '$profile.specialization',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Get department distribution
    const departmentStats = await Doctor.aggregate([
      {
        $group: {
          _id: '$profile.department',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Get average experience
    const experienceStats = await Doctor.aggregate([
      {
        $group: {
          _id: null,
          avgExperience: { $avg: '$profile.experience' },
          minExperience: { $min: '$profile.experience' },
          maxExperience: { $max: '$profile.experience' },
        },
      },
    ]);

    // Get average consultation fee
    const feeStats = await Doctor.aggregate([
      {
        $group: {
          _id: null,
          avgFee: { $avg: '$profile.consultationFee' },
          minFee: { $min: '$profile.consultationFee' },
          maxFee: { $max: '$profile.consultationFee' },
        },
      },
    ]);

    // Get rating distribution
    const ratingStats = await Doctor.aggregate([
      {
        $match: {
          'profile.rating.count': { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$profile.rating.average' },
          totalRatings: { $sum: '$profile.rating.count' },
          doctorsWithRatings: { $sum: 1 },
        },
      },
    ]);

    // Get top-rated doctors (with appointment and patient counts)
    const topRatedDoctors = await Doctor.find({
      'profile.isVerified': true,
      'profile.rating.count': { $gte: 5 },
    })
      .populate('user', 'name email image')
      .sort({ 'profile.rating.average': -1 })
      .limit(10)
      .lean();

    // Add appointment and patient counts for top-rated doctors
    const topRatedWithStats = await Promise.all(
      topRatedDoctors.map(async (doctor: any) => {
        const appointmentCount = await Appointment.countDocuments({
          doctor: doctor.user._id,
          isActive: true,
        });

        const uniquePatients = await Appointment.distinct('patient', {
          doctor: doctor.user._id,
          isActive: true,
        });

        return {
          id: doctor._id.toString(),
          user: doctor.user,
          specialization: doctor.profile.specialization,
          department: doctor.profile.department,
          rating: doctor.profile.rating,
          experience: doctor.profile.experience,
          consultationFee: doctor.profile.consultationFee,
          totalAppointments: appointmentCount,
          totalPatients: uniquePatients.length,
        };
      })
    );

    // Get recently added doctors
    const recentDoctors = await Doctor.find()
      .populate('user', 'name email image')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Add stats for recent doctors
    const recentWithStats = await Promise.all(
      recentDoctors.map(async (doctor: any) => {
        const appointmentCount = await Appointment.countDocuments({
          doctor: doctor.user._id,
          isActive: true,
        });

        return {
          id: doctor._id.toString(),
          user: doctor.user,
          specialization: doctor.profile.specialization,
          department: doctor.profile.department,
          isVerified: doctor.profile.isVerified,
          experience: doctor.profile.experience,
          consultationFee: doctor.profile.consultationFee,
          totalAppointments: appointmentCount,
          createdAt: doctor.createdAt,
        };
      })
    );

    // Get total appointments count across all doctors
    const totalAppointments = await Appointment.countDocuments({
      doctor: { $exists: true },
      isActive: true,
    });

    // Get appointment statistics by status (for all doctors)
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: {
          doctor: { $exists: true },
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

    // Get appointment statistics by type (for all doctors)
    const appointmentsByType = await Appointment.aggregate([
      {
        $match: {
          doctor: { $exists: true },
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

    // Get monthly appointment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Appointment.aggregate([
      {
        $match: {
          doctor: { $exists: true },
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

    // Get busiest doctors (by appointment count)
    const busiestDoctors = await Appointment.aggregate([
      {
        $match: {
          doctor: { $exists: true },
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$doctor',
          appointmentCount: { $sum: 1 },
        },
      },
      {
        $sort: { appointmentCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Populate doctor details for busiest doctors
    const busiestWithDetails = await Promise.all(
      busiestDoctors.map(async (item: any) => {
        const user = await User.findById(item._id).select('name email image');
        const doctor = await Doctor.findOne({ user: item._id })
          .select('profile.specialization profile.department')
          .lean();

        return {
          userId: item._id.toString(),
          user,
          specialization: doctor?.profile?.specialization || null,
          department: doctor?.profile?.department || null,
          appointmentCount: item.appointmentCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalDoctors,
          verifiedDoctors,
          unverifiedDoctors,
          validLicenseDoctors,
          expiredLicenseDoctors,
          availableToday,
          totalAppointments,
        },
        specializations: specializationStats.map((spec: any) => ({
          name: spec._id,
          count: spec.count,
        })),
        departments: departmentStats.map((dept: any) => ({
          name: dept._id,
          count: dept.count,
        })),
        experience: experienceStats[0] || {
          avgExperience: 0,
          minExperience: 0,
          maxExperience: 0,
        },
        consultationFees: feeStats[0] || {
          avgFee: 0,
          minFee: 0,
          maxFee: 0,
        },
        ratings: ratingStats[0] || {
          avgRating: 0,
          totalRatings: 0,
          doctorsWithRatings: 0,
        },
        appointments: {
          byStatus: appointmentsByStatus.map((item: any) => ({
            status: item._id,
            count: item.count,
          })),
          byType: appointmentsByType.map((item: any) => ({
            type: item._id,
            count: item.count,
          })),
          monthlyTrend: monthlyTrend.map((item: any) => ({
            year: item._id.year,
            month: item._id.month,
            count: item.count,
          })),
        },
        topPerformers: {
          topRated: topRatedWithStats,
          busiest: busiestWithDetails,
        },
        recentDoctors: recentWithStats,
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
