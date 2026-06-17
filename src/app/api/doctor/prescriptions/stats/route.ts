/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Prescription';
import { authOptions } from '@/lib/auth';

// GET - Get prescription statistics
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const baseQuery: any = {
      isActive: true,
      doctorId: session.user.id,
    };

    // Date range filter
    if (startDate || endDate) {
      baseQuery.createdAt = {};
      if (startDate) baseQuery.createdAt.$gte = new Date(startDate);
      if (endDate) baseQuery.createdAt.$lte = new Date(endDate);
    }

    // Execute multiple aggregation queries in parallel
    const [
      totalPrescriptions,
      statusStats,
      monthlyStats,
      recentPrescriptions,
      topMedications,
    ] = await Promise.all([
      // Total prescriptions count
      Prescription.countDocuments(baseQuery),

      // Status statistics
      Prescription.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Monthly statistics
      Prescription.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),

      // Recent prescriptions (last 7 days)
      Prescription.countDocuments({
        ...baseQuery,
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),

      // Top prescribed medications
      Prescription.aggregate([
        { $match: baseQuery },
        { $unwind: '$medications' },
        {
          $group: {
            _id: '$medications.name',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$medications.quantity' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Process status stats
    const statusCounts = {
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    statusStats.forEach((stat: any) => {
      statusCounts[stat._id as keyof typeof statusCounts] = stat.count;
    });

    // Process monthly data
    const monthlyData = monthlyStats.map((month: any) => ({
      month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
      prescriptions: month.count,
    }));

    // Process top medications
    const medicationStats = topMedications.map((med: any) => ({
      name: med._id,
      count: med.count,
      totalQuantity: med.totalQuantity,
    }));

    const stats = {
      total: totalPrescriptions,
      recent: recentPrescriptions,
      status: statusCounts,
      trends: {
        monthly: monthlyData,
      },
      medications: {
        topPrescribed: medicationStats,
        totalUnique: medicationStats.length,
      },
      averages: {
        prescriptionsPerMonth:
          totalPrescriptions > 0
            ? Math.round(totalPrescriptions / Math.max(monthlyData.length, 1))
            : 0,
        activeRate:
          totalPrescriptions > 0
            ? Math.round((statusCounts.ACTIVE / totalPrescriptions) * 100)
            : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching prescription statistics:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch prescription statistics',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
