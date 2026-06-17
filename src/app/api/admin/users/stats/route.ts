import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Receptionist from '@/models/Receptionist';
import Appointment from '@/models/Appointment';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RoleStats {
  ADMIN: number;
  DOCTOR: number;
  PATIENT: number;
  NURSE: number;
  RECEPTIONIST: number;
  PHARMACIST: number;
}

interface StatusStats {
  ACTIVE: number;
  INACTIVE: number;
  SUSPENDED: number;
}

interface GenderStats {
  [key: string]: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== Fetching User Statistics ===');

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get authenticated user
    const authUser = await User.findOne({ email: session.user.email });
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get date range from query params (optional)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    interface DateFilter {
      $gte?: Date;
      $lte?: Date;
    }
    const dateFilter: DateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const query =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // === TOTAL USER COUNTS ===
    const totalUsers = await User.countDocuments(query);
    const activeUsers = await User.countDocuments({
      ...query,
      status: 'ACTIVE',
    });
    const inactiveUsers = await User.countDocuments({
      ...query,
      status: 'INACTIVE',
    });
    const suspendedUsers = await User.countDocuments({
      ...query,
      status: 'SUSPENDED',
    });
    const verifiedUsers = await User.countDocuments({
      ...query,
      isEmailVerified: true,
    });
    const unverifiedUsers = await User.countDocuments({
      ...query,
      isEmailVerified: false,
    });

    // === ROLE DISTRIBUTION ===
    const roleDistribution = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const roleStats: RoleStats = {
      ADMIN: 0,
      DOCTOR: 0,
      PATIENT: 0,
      NURSE: 0,
      RECEPTIONIST: 0,
      PHARMACIST: 0,
    };

    roleDistribution.forEach(
      (role: { _id: keyof RoleStats; count: number }) => {
        if (role._id in roleStats) {
          roleStats[role._id] = role.count;
        }
      }
    );

    // === STATUS DISTRIBUTION ===
    const statusDistribution = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats: StatusStats = {
      ACTIVE: 0,
      INACTIVE: 0,
      SUSPENDED: 0,
    };

    statusDistribution.forEach(
      (status: { _id: keyof StatusStats; count: number }) => {
        if (status._id in statusStats) {
          statusStats[status._id] = status.count;
        }
      }
    );

    // === USER GROWTH OVER TIME ===
    const userGrowth = await User.aggregate([
      { $match: query },
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
    ]);

    // === RECENT REGISTRATIONS ===
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const registrationsLast7Days = await User.countDocuments({
      createdAt: { $gte: last7Days },
    });

    const registrationsLast30Days = await User.countDocuments({
      createdAt: { $gte: last30Days },
    });

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const registrationsToday = await User.countDocuments({
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    // === ROLE-SPECIFIC STATISTICS ===

    // Doctor Stats
    const totalDoctors = await Doctor.countDocuments();
    const verifiedDoctors = await Doctor.countDocuments({
      'profile.isVerified': true,
    });

    interface SpecializationResult {
      _id: string;
      count: number;
    }
    const doctorsBySpecialization =
      await Doctor.aggregate<SpecializationResult>([
        {
          $group: {
            _id: '$profile.specialization',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

    // Patient Stats
    const totalPatients = await Patient.countDocuments();
    const activePatients = await Patient.countDocuments({ isActive: true });

    interface GenderResult {
      _id: string;
      count: number;
    }
    const patientsByGender = await Patient.aggregate<GenderResult>([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]);

    interface BloodTypeResult {
      _id: string;
      count: number;
    }
    const patientsByBloodType = await Patient.aggregate<BloodTypeResult>([
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Receptionist Stats
    const totalReceptionists = await Receptionist.countDocuments();
    const activeReceptionists = await Receptionist.countDocuments({
      employmentStatus: 'ACTIVE',
    });

    // === LOGIN ACTIVITY ===
    const usersWithRecentLogin = await User.countDocuments({
      lastLogin: { $gte: last7Days },
    });

    const usersNeverLoggedIn = await User.countDocuments({
      lastLogin: { $exists: false },
    });

    // === TOP USERS BY ROLE ===
    interface DoctorWithUser {
      _id: unknown;
      user?: {
        name?: string;
        email?: string;
      };
      profile?: {
        specialization?: string;
        rating?: {
          average?: number;
        };
      };
    }

    const topDoctors = await Doctor.find()
      .populate('user', 'name email')
      .sort({ 'profile.rating.average': -1 })
      .limit(5)
      .lean<DoctorWithUser[]>();

    interface UserLean {
      _id: unknown;
      name?: string;
      email?: string;
      role?: string;
      createdAt?: Date;
    }

    const recentUsers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<UserLean[]>();

    // === ENGAGEMENT METRICS ===
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({
      status: 'COMPLETED',
    });

    // === AGE DISTRIBUTION (for patients) ===
    interface AgeDistResult {
      _id: number | string;
      count: number;
    }
    const ageDistribution = await Patient.aggregate<AgeDistResult>([
      {
        $addFields: {
          age: {
            $divide: [
              { $subtract: [new Date(), '$dateOfBirth'] },
              365 * 24 * 60 * 60 * 1000,
            ],
          },
        },
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 30, 45, 60, 100],
          default: 'Unknown',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    // === VERIFICATION METRICS ===
    const verificationRate =
      totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : '0.00';

    const doctorVerificationRate =
      totalDoctors > 0
        ? ((verifiedDoctors / totalDoctors) * 100).toFixed(2)
        : '0.00';

    const loginRate =
      totalUsers > 0
        ? ((usersWithRecentLogin / totalUsers) * 100).toFixed(2)
        : '0.00';

    const completionRate =
      totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
        : '0.00';

    // === RESPONSE DATA ===
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          suspendedUsers,
          verifiedUsers,
          unverifiedUsers,
          verificationRate: `${verificationRate}%`,
        },
        roles: {
          distribution: roleStats,
          totalDoctors,
          verifiedDoctors,
          doctorVerificationRate: `${doctorVerificationRate}%`,
          totalPatients,
          activePatients,
          totalReceptionists,
          activeReceptionists,
        },
        status: {
          distribution: statusStats,
        },
        growth: {
          registrationsToday,
          registrationsLast7Days,
          registrationsLast30Days,
          monthlyGrowth: userGrowth,
        },
        engagement: {
          usersWithRecentLogin,
          usersNeverLoggedIn,
          loginRate: `${loginRate}%`,
        },
        demographics: {
          patientsByGender: patientsByGender.reduce(
            (acc: GenderStats, curr) => {
              acc[curr._id || 'Unknown'] = curr.count;
              return acc;
            },
            {}
          ),
          patientsByBloodType: patientsByBloodType.reduce(
            (acc: GenderStats, curr) => {
              acc[curr._id || 'Unknown'] = curr.count;
              return acc;
            },
            {}
          ),
          ageDistribution,
        },
        specializations: {
          doctorsBySpecialization: doctorsBySpecialization.map(spec => ({
            specialization: spec._id,
            count: spec.count,
          })),
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          completionRate: `${completionRate}%`,
        },
        topPerformers: {
          doctors: topDoctors.map(doc => ({
            id: doc._id,
            name: doc.user?.name,
            specialization: doc.profile?.specialization,
            rating: doc.profile?.rating?.average || 0,
          })),
        },
        recentActivity: {
          recentUsers: recentUsers.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          })),
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching user statistics:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user statistics',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
