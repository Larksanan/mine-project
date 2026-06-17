/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Patient, { IPatientModel } from '@/models/Patient';

// Helper function to calculate days until expiry
function calculateDaysUntilExpiry(validUntil?: Date): number | null {
  if (!validUntil) return null;
  const now = new Date();
  const expiry = new Date(validUntil);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper function to format patient for insurance expiring list
function formatInsurancePatient(patient: any) {
  return {
    id: patient._id.toString(),
    name: `${patient.firstName} ${patient.lastName}`,
    email: patient.email,
    phone: patient.phone,
    insurance: patient.insurance,
    daysUntilExpiry: calculateDaysUntilExpiry(patient.insurance?.validUntil),
  };
}

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    // Calculate date 30 days from now
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Use Promise.all for parallel execution
    const [
      stats,
      bloodTypeDistribution,
      allergyStatistics,
      patientsWithExpiringInsurance,
      totalPatients,
      activePatients,
      patientsWithValidInsurance,
      recentPatients,
    ] = await Promise.all([
      // Get patient statistics
      (Patient as unknown as IPatientModel).getPatientStats(),

      // Get blood type distribution
      (Patient as unknown as IPatientModel).getBloodTypeDistribution(),

      // Get allergy statistics
      (Patient as unknown as IPatientModel).getAllergyStatistics(),

      // Get patients with expiring insurance (within 30 days)
      Patient.find({
        'insurance.validUntil': {
          $gte: new Date(),
          $lte: thirtyDaysFromNow,
        },
        isActive: true,
      })
        .select('firstName lastName email phone insurance')
        .sort({ 'insurance.validUntil': 1 })
        .lean()
        .exec(),

      // Get total patients count
      Patient.countDocuments().exec(),

      // Get active patients count
      Patient.countDocuments({ isActive: true }).exec(),

      // Get patients with valid insurance
      Patient.countDocuments({
        'insurance.validUntil': { $gt: new Date() },
        isActive: true,
      }).exec(),

      // Get recent patients (last 30 days)
      Patient.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        isActive: true,
      }).exec(),
    ]);

    // Calculate gender distribution
    const genderDistribution = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Calculate age group distribution
    const ageGroupDistribution = await Patient.aggregate([
      { $match: { isActive: true, dateOfBirth: { $exists: true } } },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365 * 24 * 60 * 60 * 1000,
              ],
            },
          },
        },
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 30, 45, 60, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            patients: { $push: '$$ROOT' },
          },
        },
      },
    ]);

    // Calculate patients by marital status
    const maritalStatusDistribution = await Patient.aggregate([
      { $match: { isActive: true, maritalStatus: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$maritalStatus',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Calculate patients by preferred language
    const languageDistribution = await Patient.aggregate([
      {
        $match: {
          isActive: true,
          preferredLanguage: { $exists: true, $ne: '' },
        },
      },
      {
        $group: {
          _id: '$preferredLanguage',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Calculate patients with allergies vs without
    const allergyStats = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $cond: [
              {
                $and: [
                  { $isArray: '$allergies' },
                  { $gt: [{ $size: '$allergies' }, 0] },
                ],
              },
              'With Allergies',
              'Without Allergies',
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate patients with medications vs without
    const medicationStats = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $cond: [
              {
                $and: [
                  { $isArray: '$medications' },
                  { $gt: [{ $size: '$medications' }, 0] },
                ],
              },
              'With Medications',
              'Without Medications',
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Format the response
    const responseData = {
      overview: {
        total: totalPatients,
        active: activePatients,
        inactive: totalPatients - activePatients,
        withValidInsurance: patientsWithValidInsurance,
        withoutInsurance: activePatients - patientsWithValidInsurance,
        recent: recentPatients,
        insuranceExpiringSoon: patientsWithExpiringInsurance.length,
      },
      demographics: {
        gender: genderDistribution.map((item: any) => ({
          gender: item._id,
          count: item.count,
          percentage: Math.round((item.count / activePatients) * 100),
        })),
        ageGroups: ageGroupDistribution.map((item: any) => ({
          ageGroup: `${item._id === 0 ? '0-17' : item._id === 18 ? '18-29' : item._id === 30 ? '30-44' : item._id === 45 ? '45-59' : '60+'}`,
          count: item.count,
          percentage: Math.round((item.count / activePatients) * 100),
        })),
        maritalStatus: maritalStatusDistribution.map((item: any) => ({
          status: item._id,
          count: item.count,
          percentage: Math.round((item.count / activePatients) * 100),
        })),
        languages: languageDistribution.map((item: any) => ({
          language: item._id,
          count: item.count,
          percentage: Math.round((item.count / activePatients) * 100),
        })),
      },
      medical: {
        bloodTypes: bloodTypeDistribution.map((item: any) => ({
          bloodType: item.bloodType,
          count: item.count,
          percentage: Math.round((item.count / activePatients) * 100),
        })),
        allergies: {
          stats: allergyStats.map((item: any) => ({
            category: item._id,
            count: item.count,
            percentage: Math.round((item.count / activePatients) * 100),
          })),
          topAllergies: allergyStatistics,
        },
        medications: {
          stats: medicationStats.map((item: any) => ({
            category: item._id,
            count: item.count,
            percentage: Math.round((item.count / activePatients) * 100),
          })),
        },
      },
      insurance: {
        expiring: {
          count: patientsWithExpiringInsurance.length,
          patients: patientsWithExpiringInsurance.map((patient: any) =>
            formatInsurancePatient(patient)
          ),
        },
        summary: {
          withInsurance: stats.withInsurance || 0,
          insuranceExpiring: stats.insuranceExpiring || 0,
          withoutInsurance: activePatients - (stats.withInsurance || 0),
        },
      },
      trends: {
        // Monthly patient growth (last 6 months)
        monthlyGrowth: await getMonthlyGrowth(),
        // Daily averages
        dailyAverages: {
          newPatientsPerDay: Math.round(recentPatients / 30), // Last 30 days average
          activePercentage: Math.round((activePatients / totalPatients) * 100),
          insuranceCoverage: Math.round(
            (patientsWithValidInsurance / activePatients) * 100
          ),
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error fetching patient statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patient statistics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to get monthly growth
async function getMonthlyGrowth() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyStats = await Patient.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo },
        isActive: true,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
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
    {
      $limit: 6,
    },
  ]);

  // Format month names
  const monthNames = [
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
  ];

  return monthlyStats.map((stat: any) => ({
    month: `${monthNames[stat._id.month - 1]} ${stat._id.year}`,
    count: stat.count,
  }));
}
