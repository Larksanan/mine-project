/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Import models
let MedicalRecord: any;
let Appointment: any;
let Patient: any;
let Doctor: any;

try {
  MedicalRecord =
    mongoose.models.MedicalRecord || require('@/models/MedicalRecord').default;
  Appointment =
    mongoose.models.Appointment || require('@/models/Appointment').default;
  Patient = mongoose.models.Patient || require('@/models/Patient').default;
  Doctor = mongoose.models.Doctor || require('@/models/Doctor').default;
} catch (error) {
  console.error('Error loading models:', error);
}

interface AnalyticsData {
  overview: {
    totalPatients: number;
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageRating: number;
    totalRevenue: number;
    newPatients: number;
    returningPatients: number;
  };
  monthlyStats: any[];
  patientDemographics: any;
  appointmentTrends: any[];
  commonDiagnoses: any[];
  revenueAnalysis: any;
}

// Helper functions for analytics data
async function getMonthlyStats(
  doctorId: mongoose.Types.ObjectId,
  startDate: Date
): Promise<any[]> {
  try {
    const monthlyStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          appointments: { $sum: 1 },
          patients: { $addToSet: '$patient' },
        },
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInString: [
                  '',
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
              },
              in: {
                $arrayElemAt: ['$$monthsInString', '$_id.month'],
              },
            },
          },
          year: '$_id.year',
          appointments: 1,
          patients: { $size: '$patients' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    return monthlyStats;
  } catch (error) {
    console.error('Error in getMonthlyStats:', error);
    return [];
  }
}

async function getPatientDemographics(
  doctorId: mongoose.Types.ObjectId
): Promise<any> {
  try {
    // Get unique patients for this doctor from appointments
    const uniquePatients = await Appointment.distinct('patient', {
      doctor: doctorId,
    });

    if (uniquePatients.length === 0) {
      return {
        ageGroups: { under18: 0, age18to35: 0, age36to60: 0, over60: 0 },
        genderDistribution: { male: 0, female: 0, other: 0 },
      };
    }

    // Get patient details
    const patients = await Patient.find({
      _id: { $in: uniquePatients },
      isActive: true,
    }).lean();

    // Calculate age groups
    const now = new Date();
    const ageGroups = {
      under18: 0,
      age18to35: 0,
      age36to60: 0,
      over60: 0,
    };

    const genderDistribution = {
      male: 0,
      female: 0,
      other: 0,
    };

    patients.forEach((patient: any) => {
      // Calculate age
      if (patient.dateOfBirth) {
        const age = Math.floor(
          (now.getTime() - new Date(patient.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        if (age < 18) ageGroups.under18++;
        else if (age < 36) ageGroups.age18to35++;
        else if (age < 61) ageGroups.age36to60++;
        else ageGroups.over60++;
      }

      // Count gender
      const gender = patient.gender?.toLowerCase();
      if (gender === 'male') genderDistribution.male++;
      else if (gender === 'female') genderDistribution.female++;
      else genderDistribution.other++;
    });

    return {
      ageGroups,
      genderDistribution,
    };
  } catch (error) {
    console.error('Error in getPatientDemographics:', error);
    return {
      ageGroups: { under18: 0, age18to35: 0, age36to60: 0, over60: 0 },
      genderDistribution: { male: 0, female: 0, other: 0 },
    };
  }
}

async function getAppointmentTrends(
  doctorId: mongoose.Types.ObjectId,
  startDate: Date
): Promise<any[]> {
  try {
    const byDay = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          day: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 1] }, then: 'Sunday' },
                { case: { $eq: ['$_id', 2] }, then: 'Monday' },
                { case: { $eq: ['$_id', 3] }, then: 'Tuesday' },
                { case: { $eq: ['$_id', 4] }, then: 'Wednesday' },
                { case: { $eq: ['$_id', 5] }, then: 'Thursday' },
                { case: { $eq: ['$_id', 6] }, then: 'Friday' },
                { case: { $eq: ['$_id', 7] }, then: 'Saturday' },
              ],
              default: 'Unknown',
            },
          },
          count: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byTime = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          time: {
            $concat: [{ $toString: '$_id' }, ':00'],
          },
          count: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return [
      { type: 'byDay', data: byDay },
      { type: 'byTime', data: byTime },
    ];
  } catch (error) {
    console.error('Error in getAppointmentTrends:', error);
    return [];
  }
}

async function getCommonDiagnoses(
  doctorId: mongoose.Types.ObjectId,
  startDate: Date
): Promise<any[]> {
  try {
    const diagnoses = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: startDate },
          diagnosis: { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: '$diagnosis',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          diagnosis: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    const totalDiagnoses = diagnoses.reduce(
      (sum: any, item: { count: any }) => sum + item.count,
      0
    );

    return diagnoses.map((item: { count: number }) => ({
      ...item,
      percentage: totalDiagnoses > 0 ? item.count / totalDiagnoses : 0,
    }));
  } catch (error) {
    console.error('Error in getCommonDiagnoses:', error);
    return [];
  }
}

async function getRevenueAnalysis(
  doctorId: mongoose.Types.ObjectId,
  startDate: Date
): Promise<any> {
  try {
    const monthlyRevenue = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: startDate },
          status: { $in: ['COMPLETED', 'completed'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: { $ifNull: ['$consultationFee', 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInString: [
                  '',
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
              },
              in: {
                $arrayElemAt: ['$$monthsInString', '$_id.month'],
              },
            },
          },
          year: '$_id.year',
          revenue: 1,
          count: 1,
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Calculate growth percentages
    const monthlyRevenueWithGrowth = monthlyRevenue.map(
      (month: { revenue: number }, index: number, array: any[]) => {
        const previousMonth = array[index - 1];
        const growth = previousMonth
          ? ((month.revenue - previousMonth.revenue) / previousMonth.revenue) *
            100
          : 0;
        return {
          ...month,
          growth: Math.round(growth * 10) / 10,
        };
      }
    );

    const byService = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: startDate },
          status: { $in: ['COMPLETED', 'completed'] },
          type: { $exists: true, $ne: '' },
        },
      },
      {
        $group: {
          _id: '$type',
          revenue: { $sum: { $ifNull: ['$consultationFee', 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          service: '$_id',
          revenue: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    const totalRevenue = byService.reduce(
      (sum: number, service: { revenue: any }) => sum + (service.revenue || 0),
      0
    );
    const byServiceWithPercentage = byService.map(
      (service: { revenue: number }) => ({
        ...service,
        percentage: totalRevenue > 0 ? service.revenue / totalRevenue : 0,
      })
    );

    return {
      monthlyRevenue: monthlyRevenueWithGrowth,
      byService: byServiceWithPercentage,
    };
  } catch (error) {
    console.error('Error in getRevenueAnalysis:', error);
    return {
      monthlyRevenue: [],
      byService: [],
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== Analytics API: Starting ===');

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
    if (!MedicalRecord) {
      MedicalRecord = require('@/models/MedicalRecord').default;
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'DOCTOR') {
      console.log('User is not a doctor:', session.user.role);
      return NextResponse.json(
        { error: 'Forbidden - Doctor access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30days';

    // Convert session user ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    console.log('User ObjectId:', userObjectId);

    // Find the Doctor document for this user
    const doctorDoc = await Doctor.findOne({ user: userObjectId }).lean();
    console.log('Doctor document found:', !!doctorDoc);

    if (!doctorDoc) {
      return NextResponse.json(
        {
          error: 'Doctor profile not found for this user',
          debug: {
            userId: session.user.id,
            userObjectId: userObjectId.toString(),
          },
        },
        { status: 404 }
      );
    }

    const doctorId = doctorDoc._id;
    console.log('Doctor ID:', doctorId);

    // Calculate date range based on the selected period
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // 30 days
        startDate.setDate(now.getDate() - 30);
    }

    console.log('Date range:', { startDate, endDate: now });

    // Fetch analytics data in parallel
    const [
      uniquePatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenueResult,
      monthlyStatsData,
      patientDemographicsData,
      appointmentTrendsData,
      commonDiagnosesData,
      revenueAnalysisData,
    ] = await Promise.all([
      // Total unique patients
      Appointment.distinct('patient', { doctor: doctorId }),

      // Appointment counts
      Appointment.countDocuments({
        doctor: doctorId,
        createdAt: { $gte: startDate },
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        status: { $in: ['COMPLETED', 'completed'] },
        createdAt: { $gte: startDate },
      }),
      Appointment.countDocuments({
        doctor: doctorId,
        status: { $in: ['CANCELLED', 'cancelled'] },
        createdAt: { $gte: startDate },
      }),

      // Total Revenue - Direct calculation
      Appointment.aggregate([
        {
          $match: {
            doctor: doctorId,
            status: { $in: ['COMPLETED', 'completed'] },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$consultationFee', 0] } },
          },
        },
      ]),

      // Monthly stats
      getMonthlyStats(doctorId, startDate),

      // Patient demographics
      getPatientDemographics(doctorId),

      // Appointment trends
      getAppointmentTrends(doctorId, startDate),

      // Common diagnoses
      getCommonDiagnoses(doctorId, startDate),

      // Revenue analysis
      getRevenueAnalysis(doctorId, startDate),
    ]);

    // Extract total revenue with proper fallback
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Calculate new vs returning patients
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60); // 30 days before start date

    const oldPatients = await Appointment.distinct('patient', {
      doctor: doctorId,
      createdAt: { $lt: startDate },
    });

    const newPatients = uniquePatients.filter(
      (p: any) => !oldPatients.includes(p.toString())
    ).length;

    // Debug logging
    console.log('Analytics Debug Info:', {
      doctorId: doctorId.toString(),
      timeRange: range,
      startDate,
      totalPatients: uniquePatients.length,
      totalAppointments,
      completedAppointments,
      totalRevenue,
      hasRevenueData: totalRevenueResult.length > 0,
    });

    const analyticsData: AnalyticsData = {
      overview: {
        totalPatients: uniquePatients.length,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        averageRating: 4.7, // This would come from your rating system
        totalRevenue,
        newPatients,
        returningPatients: uniquePatients.length - newPatients,
      },
      monthlyStats: monthlyStatsData,
      patientDemographics: patientDemographicsData,
      appointmentTrends: appointmentTrendsData,
      commonDiagnoses: commonDiagnosesData,
      revenueAnalysis: revenueAnalysisData,
    };

    console.log('=== Analytics API: Success ===');

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error: any) {
    console.error('=== Analytics API Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
