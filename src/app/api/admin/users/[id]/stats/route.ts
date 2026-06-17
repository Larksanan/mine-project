import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Receptionist from '@/models/Receptionist';
import Appointment from '@/models/Appointment';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface BaseStats {
  userId: unknown;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userStatus?: string;
  accountCreated?: Date;
  lastLogin?: Date | null;
  isEmailVerified?: boolean;
}

interface DateFilter {
  $gte?: Date;
  $lte?: Date;
}

// GET - Fetch detailed statistics for a specific user
export async function GET(
  request: NextRequest,
  context: { params: Promise<unknown> }
) {
  try {
    console.log('=== Fetching User Statistics by ID ===');

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

    // FIXED: Await params before accessing properties
    const params = (await context.params) as { id: string };
    const userId = params.id;

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user id' },
        { status: 400 }
      );
    }

    // Find user
    const user = (await User.findById(userId).select('-password').lean()) as {
      _id: unknown;
      name?: string;
      email?: string;
      role?: string;
      status?: string;
      createdAt?: Date;
      lastLogin?: Date | null;
      isEmailVerified?: boolean;
    } | null;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get date range from query params (optional)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: DateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Base statistics
    const baseStats: BaseStats = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      userStatus: user.status,
      accountCreated: user.createdAt,
      lastLogin: user.lastLogin || null,
      isEmailVerified: user.isEmailVerified,
    };

    // Role-specific statistics
    interface RoleSpecificStats {
      profileType: string;
      [key: string]: unknown;
    }

    let roleSpecificStats: RoleSpecificStats = {
      profileType: user.role || 'UNKNOWN',
    };

    switch (user.role) {
      case 'DOCTOR': {
        const doctorProfile = (await Doctor.findOne({
          user: userId,
        }).lean()) as {
          _id?: unknown;
          profile?: {
            specialization?: string;
            department?: string;
            experience?: number;
            consultationFee?: number;
            isVerified?: boolean;
            rating?: {
              average?: number;
              count?: number;
            };
          };
          patients?: unknown[];
        } | null;

        if (doctorProfile) {
          // Get appointments
          const appointmentQuery: {
            doctor: unknown;
            appointmentDate?: DateFilter;
          } = {
            doctor: doctorProfile._id,
          };

          if (Object.keys(dateFilter).length > 0) {
            appointmentQuery.appointmentDate = dateFilter;
          }

          const totalAppointments =
            await Appointment.countDocuments(appointmentQuery);
          const completedAppointments = await Appointment.countDocuments({
            ...appointmentQuery,
            status: 'COMPLETED',
          });
          const cancelledAppointments = await Appointment.countDocuments({
            ...appointmentQuery,
            status: 'CANCELLED',
          });
          const upcomingAppointments = await Appointment.countDocuments({
            ...appointmentQuery,
            status: 'SCHEDULED',
            appointmentDate: { $gte: new Date() },
          });

          // Get unique patients
          const uniquePatients = await Appointment.distinct(
            'patient',
            appointmentQuery
          );

          // Get appointment trends
          const appointmentTrends = await Appointment.aggregate<{
            _id: { year: number; month: number };
            count: number;
          }>([
            { $match: appointmentQuery },
            {
              $group: {
                _id: {
                  year: { $year: '$appointmentDate' },
                  month: { $month: '$appointmentDate' },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 },
          ]);

          // Get appointment status distribution
          const statusDistribution = await Appointment.aggregate<{
            _id: string;
            count: number;
          }>([
            { $match: appointmentQuery },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ]);

          // Calculate average consultation time if available
          const completedWithDuration = (await Appointment.find({
            ...appointmentQuery,
            status: 'COMPLETED',
            duration: { $exists: true },
          })
            .select('duration')
            .lean()) as { duration?: number }[];

          const avgConsultationTime =
            completedWithDuration.length > 0
              ? completedWithDuration.reduce(
                  (sum, app) => sum + (app.duration || 0),
                  0
                ) / completedWithDuration.length
              : 0;

          // Get recent appointments
          const recentAppointments = (await Appointment.find(appointmentQuery)
            .populate('patient', 'firstName lastName')
            .sort({ appointmentDate: -1 })
            .limit(10)
            .lean()) as Array<{
            _id: unknown;
            appointmentDate?: Date;
            status?: string;
            type?: string;
            patient?: {
              firstName?: string;
              lastName?: string;
            };
          }>;

          roleSpecificStats = {
            profileType: 'DOCTOR',
            specialization: doctorProfile.profile?.specialization,
            department: doctorProfile.profile?.department,
            experience: doctorProfile.profile?.experience,
            consultationFee: doctorProfile.profile?.consultationFee,
            isVerified: doctorProfile.profile?.isVerified,
            rating: {
              average: doctorProfile.profile?.rating?.average || 0,
              count: doctorProfile.profile?.rating?.count || 0,
            },
            appointments: {
              total: totalAppointments,
              completed: completedAppointments,
              cancelled: cancelledAppointments,
              upcoming: upcomingAppointments,
              completionRate:
                totalAppointments > 0
                  ? `${((completedAppointments / totalAppointments) * 100).toFixed(2)}%`
                  : '0%',
              statusDistribution: statusDistribution.reduce<
                Record<string, number>
              >((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
              }, {}),
            },
            patients: {
              total: doctorProfile.patients?.length || 0,
              unique: uniquePatients.length,
            },
            performance: {
              averageConsultationTime: `${avgConsultationTime.toFixed(0)} minutes`,
              appointmentTrends: appointmentTrends.map(trend => ({
                period: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
                count: trend.count,
              })),
            },
            recentActivity: {
              recentAppointments: recentAppointments.map(app => ({
                id: app._id,
                patientName:
                  `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`.trim(),
                date: app.appointmentDate,
                status: app.status,
                type: app.type,
              })),
            },
          };
        }
        break;
      }

      case 'PATIENT': {
        const patientProfile = (await Patient.findOne({
          user: userId,
        }).lean()) as {
          _id?: unknown;
          dateOfBirth?: Date;
          gender?: string;
          bloodType?: string;
          maritalStatus?: string;
          occupation?: string;
          phone?: string;
          address?: unknown;
          emergencyContact?: unknown;
          allergies?: string[];
          medicalHistory?: {
            chronicConditions?: string[];
            currentMedications?: string[];
          };
          lastVisit?: Date;
          isActive?: boolean;
        } | null;

        console.log('Patient profile found:', patientProfile ? 'Yes' : 'No');
        if (patientProfile) {
          console.log('Patient profile fields:', {
            dateOfBirth: patientProfile.dateOfBirth,
            gender: patientProfile.gender,
            bloodType: patientProfile.bloodType,
            maritalStatus: patientProfile.maritalStatus,
            occupation: patientProfile.occupation,
          });
        }

        if (patientProfile) {
          // Get appointments
          const appointmentQuery: {
            patient: unknown;
            appointmentDate?: DateFilter;
          } = {
            patient: patientProfile._id,
          };

          if (Object.keys(dateFilter).length > 0) {
            appointmentQuery.appointmentDate = dateFilter;
          }

          const totalAppointments =
            await Appointment.countDocuments(appointmentQuery);
          const completedAppointments = await Appointment.countDocuments({
            ...appointmentQuery,
            status: 'COMPLETED',
          });
          const upcomingAppointments = await Appointment.countDocuments({
            ...appointmentQuery,
            status: 'SCHEDULED',
            appointmentDate: { $gte: new Date() },
          });

          // Get doctors visited
          const doctorsVisited = await Appointment.distinct('doctor', {
            ...appointmentQuery,
            status: 'COMPLETED',
          });

          // Get appointment history
          const appointmentHistory = (await Appointment.find(appointmentQuery)
            .populate('doctor', 'name')
            .sort({ appointmentDate: -1 })
            .limit(10)
            .lean()) as Array<{
            _id: unknown;
            appointmentDate?: Date;
            status?: string;
            type?: string;
            doctor?: {
              name?: string;
            };
          }>;

          // Calculate age
          let age: number | undefined = undefined;
          if (patientProfile.dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(patientProfile.dateOfBirth);
            const calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
              age = calculatedAge - 1;
            } else {
              age = calculatedAge;
            }
          }

          // Build personal info object with only defined values
          const personalInfo: {
            age?: number;
            gender?: string;
            bloodType?: string;
            maritalStatus?: string;
            occupation?: string;
          } = {};

          if (age !== undefined) personalInfo.age = age;
          if (patientProfile.gender)
            personalInfo.gender = patientProfile.gender;
          if (patientProfile.bloodType)
            personalInfo.bloodType = patientProfile.bloodType;
          if (patientProfile.maritalStatus)
            personalInfo.maritalStatus = patientProfile.maritalStatus;
          if (patientProfile.occupation)
            personalInfo.occupation = patientProfile.occupation;

          roleSpecificStats = {
            profileType: 'PATIENT',
            personalInfo,
            contact: {
              phone: patientProfile.phone || undefined,
              address: patientProfile.address || undefined,
              emergencyContact: patientProfile.emergencyContact || undefined,
            },
            medical: {
              allergies: patientProfile.allergies || [],
              chronicConditions:
                patientProfile.medicalHistory?.chronicConditions || [],
              currentMedications:
                patientProfile.medicalHistory?.currentMedications || [],
            },
            appointments: {
              total: totalAppointments,
              completed: completedAppointments,
              upcoming: upcomingAppointments,
              lastVisit: patientProfile.lastVisit || undefined,
            },
            engagement: {
              doctorsVisited: doctorsVisited.length,
              isActive:
                patientProfile.isActive !== undefined
                  ? patientProfile.isActive
                  : true,
            },
            recentActivity: {
              appointmentHistory: appointmentHistory.map(app => ({
                id: app._id,
                doctorName: app.doctor?.name || 'Unknown',
                date: app.appointmentDate,
                status: app.status,
                type: app.type,
              })),
            },
          };
        } else {
          console.log('No patient profile found for user:', userId);
        }
        break;
      }

      case 'RECEPTIONIST': {
        const receptionistProfile = (await Receptionist.findOne({
          user: userId,
        }).lean()) as {
          employeeId?: string;
          department?: string;
          shift?: string;
          employmentStatus?: string;
          hireDate?: Date;
          salary?: number;
          currentAppointmentsCount?: number;
          maxAppointmentsPerDay?: number;
          performanceMetrics?: unknown;
          schedule?: {
            workingHours?: unknown;
            availableDays?: string[];
          };
        } | null;

        if (receptionistProfile) {
          roleSpecificStats = {
            profileType: 'RECEPTIONIST',
            employmentInfo: {
              employeeId: receptionistProfile.employeeId,
              department: receptionistProfile.department,
              shift: receptionistProfile.shift,
              employmentStatus: receptionistProfile.employmentStatus,
              hireDate: receptionistProfile.hireDate,
              salary: receptionistProfile.salary,
            },
            performance: {
              currentAppointments:
                receptionistProfile.currentAppointmentsCount || 0,
              maxAppointmentsPerDay:
                receptionistProfile.maxAppointmentsPerDay || 0,
              metrics: receptionistProfile.performanceMetrics || {},
            },
            schedule: {
              workingHours: receptionistProfile.schedule?.workingHours || {},
              availableDays: receptionistProfile.schedule?.availableDays || [],
            },
          };
        }
        break;
      }

      case 'ADMIN': {
        // Get admin activity metrics
        const createdUsers = await User.countDocuments({ createdBy: userId });

        const recentActivity = (await User.find({ createdBy: userId })
          .select('name email role createdAt')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()) as Array<{
          name?: string;
          email?: string;
          role?: string;
          createdAt?: Date;
        }>;

        roleSpecificStats = {
          profileType: 'ADMIN',
          adminActivity: {
            usersCreated: createdUsers,
            recentActions: recentActivity.map(u => ({
              action: 'Created User',
              target: u.name,
              targetRole: u.role,
              timestamp: u.createdAt,
            })),
          },
        };
        break;
      }

      default:
        roleSpecificStats = {
          profileType: user.role || 'UNKNOWN',
          message: 'No specific statistics available for this role',
        };
    }

    // Activity timeline
    interface TimelineEvent {
      type: string;
      timestamp?: Date | null;
      description: string;
    }

    const activityTimeline: TimelineEvent[] = [];

    // Account creation
    if (user.createdAt) {
      activityTimeline.push({
        type: 'ACCOUNT_CREATED',
        timestamp: user.createdAt,
        description: 'Account was created',
      });
    }

    // Last login
    if (user.lastLogin) {
      activityTimeline.push({
        type: 'LAST_LOGIN',
        timestamp: user.lastLogin,
        description: 'Last login',
      });
    }

    // Email verification
    if (user.isEmailVerified) {
      activityTimeline.push({
        type: 'EMAIL_VERIFIED',
        timestamp: user.createdAt,
        description: 'Email verified',
      });
    }

    // Sort timeline by timestamp
    activityTimeline.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...baseStats,
        ...roleSpecificStats,
        activityTimeline,
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
    const err = error as Record<string, unknown>;
    console.error('Error fetching user statistics:', error);

    if (err?.name === 'CastError' || err?.name === 'BSONTypeError') {
      return NextResponse.json(
        { success: false, message: 'Invalid id format' },
        { status: 400 }
      );
    }

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
