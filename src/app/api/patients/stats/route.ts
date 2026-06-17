// app/api/patients/stats/route.ts
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/patients/stats - Get patient statistics
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const allowedRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    let stats;

    // Use the static method from Patient model if available, otherwise compute manually
    if (typeof Patient.getPatientStats === 'function') {
      stats = await Patient.getPatientStats();
    } else {
      // Fallback: manually compute stats
      const [
        total,
        active,
        genderDistribution,
        ageDistribution,
        topCities,
        monthlyGrowth,
      ] = await Promise.all([
        Patient.countDocuments({}),
        Patient.countDocuments({ isActive: true }),
        Patient.aggregate([
          {
            $group: {
              _id: '$gender',
              count: { $sum: 1 },
            },
          },
        ]),
        Patient.aggregate([
          {
            $addFields: {
              age: {
                $floor: {
                  $divide: [
                    { $subtract: [new Date(), '$dateOfBirth'] },
                    365.25 * 24 * 60 * 60 * 1000,
                  ],
                },
              },
            },
          },
          {
            $bucket: {
              groupBy: '$age',
              boundaries: [0, 19, 36, 51, 200],
              default: 'Unknown',
              output: {
                count: { $sum: 1 },
              },
            },
          },
        ]),
        Patient.aggregate([
          {
            $group: {
              _id: '$address.city',
              count: { $sum: 1 },
            },
          },
          {
            $sort: { count: -1 },
          },
          {
            $limit: 5,
          },
        ]),
        Patient.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
            },
          },
          {
            $count: 'count',
          },
        ]),
      ]);

      // Format gender distribution
      const genderDist = {
        male: 0,
        female: 0,
        other: 0,
      };

      genderDistribution.forEach((item: { _id: string; count: number }) => {
        const gender = item._id?.toLowerCase();
        if (gender === 'male') genderDist.male = item.count;
        else if (gender === 'female') genderDist.female = item.count;
        else genderDist.other = item.count;
      });

      // Format age distribution
      const ageDist: Record<string, number> = {};
      ageDistribution.forEach((bucket: { _id: number; count: number }) => {
        if (bucket._id === 0) ageDist['0-18'] = bucket.count;
        else if (bucket._id === 19) ageDist['19-35'] = bucket.count;
        else if (bucket._id === 36) ageDist['36-50'] = bucket.count;
        else if (bucket._id === 51) ageDist['51+'] = bucket.count;
      });

      // Format top cities
      const cities = topCities.map((city: { _id: string; count: number }) => ({
        city: city._id,
        count: city.count,
      }));

      stats = {
        total,
        active,
        inactive: total - active,
        genderDistribution: genderDist,
        ageDistribution: ageDist,
        monthlyGrowth: monthlyGrowth[0]?.count || 0,
        topCities: cities,
      };
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
