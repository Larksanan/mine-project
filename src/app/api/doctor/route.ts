import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Forbidden - Doctor access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const doctorId = session.user.id;

    // Get stats in parallel for better performance
    const [
      totalPatients,
      totalAppointments,
      upcomingAppointments,
      recentRecords,
      ratingAggregate,
    ] = await Promise.all([
      // Total unique patients
      MedicalRecord.distinct('patient', { doctor: doctorId }),

      // Total appointments
      Appointment.countDocuments({ doctor: doctorId }),

      // Upcoming appointments
      Appointment.countDocuments({
        doctor: doctorId,
        status: 'scheduled',
        date: { $gte: new Date() },
      }),

      // Recent medical records (last 30 days)
      MedicalRecord.countDocuments({
        doctor: doctorId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),

      // Average rating
      Appointment.aggregate([
        {
          $match: {
            doctor: doctorId,
            rating: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Calculate average rating
    let averageRating = 4.5; // Default rating
    let totalRatings = 0;

    if (ratingAggregate.length > 0) {
      averageRating = Math.round(ratingAggregate[0].averageRating * 10) / 10;
      totalRatings = ratingAggregate[0].totalRatings;
    }

    // Get monthly stats for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: sixMonthsAgo },
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
          month: '$_id.month',
          year: '$_id.year',
          appointments: 1,
          patients: { $size: '$patients' },
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ]);

    const stats = {
      totalPatients: totalPatients.length,
      totalAppointments,
      upcomingAppointments,
      recentRecords,
      averageRating,
      totalRatings,
      monthlyStats: monthlyStats.map(stat => ({
        month: stat.month,
        year: stat.year,
        appointments: stat.appointments,
        patients: stat.patients,
      })),
      // Additional stats
      todayAppointments: await Appointment.countDocuments({
        doctor: doctorId,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      // Patient demographics
      patientAgeGroups: await getPatientAgeGroups(doctorId),
      // Common diagnoses
      commonDiagnoses: await getCommonDiagnoses(doctorId),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get patient age groups
async function getPatientAgeGroups(doctorId: string) {
  try {
    const ageGroups = await MedicalRecord.aggregate([
      {
        $match: { doctor: doctorId },
      },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      {
        $unwind: '$patientData',
      },
      {
        $match: {
          'patientData.dateOfBirth': { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          under18: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    {
                      $divide: [
                        { $subtract: [new Date(), '$patientData.dateOfBirth'] },
                        365 * 24 * 60 * 60 * 1000,
                      ],
                    },
                    18,
                  ],
                },
                0,
                1,
              ],
            },
          },
          age18to35: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $lt: [
                        {
                          $divide: [
                            {
                              $subtract: [
                                new Date(),
                                '$patientData.dateOfBirth',
                              ],
                            },
                            365 * 24 * 60 * 60 * 1000,
                          ],
                        },
                        35,
                      ],
                    },
                    {
                      $gte: [
                        {
                          $divide: [
                            {
                              $subtract: [
                                new Date(),
                                '$patientData.dateOfBirth',
                              ],
                            },
                            365 * 24 * 60 * 60 * 1000,
                          ],
                        },
                        18,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          age36to60: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $lt: [
                        {
                          $divide: [
                            {
                              $subtract: [
                                new Date(),
                                '$patientData.dateOfBirth',
                              ],
                            },
                            365 * 24 * 60 * 60 * 1000,
                          ],
                        },
                        60,
                      ],
                    },
                    {
                      $gte: [
                        {
                          $divide: [
                            {
                              $subtract: [
                                new Date(),
                                '$patientData.dateOfBirth',
                              ],
                            },
                            365 * 24 * 60 * 60 * 1000,
                          ],
                        },
                        36,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          over60: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    {
                      $divide: [
                        { $subtract: [new Date(), '$patientData.dateOfBirth'] },
                        365 * 24 * 60 * 60 * 1000,
                      ],
                    },
                    60,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return ageGroups.length > 0
      ? ageGroups[0]
      : {
          under18: 0,
          age18to35: 0,
          age36to60: 0,
          over60: 0,
        };
  } catch (error) {
    console.error('Error calculating age groups:', error);
    return {
      under18: 0,
      age18to35: 0,
      age36to60: 0,
      over60: 0,
    };
  }
}

// Helper function to get common diagnoses
async function getCommonDiagnoses(doctorId: string) {
  try {
    const commonDiagnoses = await MedicalRecord.aggregate([
      {
        $match: { doctor: doctorId },
      },
      {
        $group: {
          _id: '$diagnosis',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          diagnosis: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    return commonDiagnoses;
  } catch (error) {
    console.error('Error getting common diagnoses:', error);
    return [];
  }
}
