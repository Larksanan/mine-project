/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RECEPTIONIST') {
      return NextResponse.json(
        { error: 'Forbidden - Receptionist access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Find receptionist by user ID
    const receptionist = await Receptionist.findOne({ user: session.user.id })
      .populate('user', 'name email phone image role department')
      .populate('assignedDoctor', 'name specialization')
      .populate('lastModifiedBy', 'name email')
      .exec();

    if (!receptionist) {
      return NextResponse.json(
        { error: 'Receptionist profile not found' },
        { status: 404 }
      );
    }

    // Convert to object and handle virtuals
    const receptionistData = receptionist.toObject();

    return NextResponse.json({
      success: true,
      data: receptionistData,
    });
  } catch (error) {
    console.error('Error fetching receptionist profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get receptionist profile with additional statistics
export async function GET_WITH_STATS() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RECEPTIONIST') {
      return NextResponse.json(
        { error: 'Forbidden - Receptionist access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const receptionist = await Receptionist.findOne({ user: session.user.id })
      .populate('user', 'name email phone image role department')
      .populate('assignedDoctor', 'name specialization department')
      .populate('lastModifiedBy', 'name email')
      .exec();

    if (!receptionist) {
      return NextResponse.json(
        { error: 'Receptionist profile not found' },
        { status: 404 }
      );
    }

    const receptionistData = receptionist.toObject();

    // Calculate additional statistics
    const todaySchedule = receptionist.getTodaySchedule();
    const performanceRating = receptionist.getPerformanceRating();
    const totalSalary = receptionist.calculateTotalSalary();
    const isOnDuty = receptionist.isOnDuty();
    const canHandleMore = receptionist.canHandleMoreAppointments();
    const hasValidSchedule = receptionist.hasValidSchedule();

    // Get additional stats (you might need to import Appointment model)
    // const todayAppointmentsCount = await Appointment.countDocuments({
    //   receptionist: receptionist._id,
    //   date: { $gte: new Date().setHours(0,0,0,0) }
    // });

    const enhancedData = {
      ...receptionistData,
      stats: {
        performanceRating: Math.round(performanceRating * 100) / 100,
        totalSalary,
        isOnDuty,
        canHandleMoreAppointments: canHandleMore,
        availableAppointmentSlots: receptionist.maxAppointmentsPerDay
          ? receptionist.maxAppointmentsPerDay -
            (receptionist.currentAppointmentsCount || 0)
          : null,
        hasValidSchedule,
        todaySchedule,
        appointmentUtilization: receptionist.maxAppointmentsPerDay
          ? ((receptionist.currentAppointmentsCount || 0) /
              receptionist.maxAppointmentsPerDay) *
            100
          : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: enhancedData,
    });
  } catch (error) {
    console.error('Error fetching receptionist profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update receptionist profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RECEPTIONIST') {
      return NextResponse.json(
        { error: 'Forbidden - Receptionist access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Fields that should not be updated via this endpoint
    const restrictedFields = [
      '_id',
      'user',
      'employeeId',
      'createdAt',
      'updatedAt',
      'lastModifiedBy',
    ];

    // Remove restricted fields from update data
    restrictedFields.forEach(field => delete body[field]);

    // Add lastModifiedBy
    body.lastModifiedBy = session.user.id;

    await connectDB();

    // Find and update receptionist
    const receptionist = await Receptionist.findOneAndUpdate(
      { user: session.user.id },
      body,
      {
        new: true,
        runValidators: true,
        populate: [
          { path: 'user', select: 'name email phone image role department' },
          { path: 'assignedDoctor', select: 'name specialization department' },
          { path: 'lastModifiedBy', select: 'name email' },
        ],
      }
    );

    if (!receptionist) {
      return NextResponse.json(
        { error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: receptionist.toObject(),
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating receptionist profile:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate field value entered' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update only specific fields (like work schedule)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RECEPTIONIST') {
      return NextResponse.json(
        { error: 'Forbidden - Receptionist access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      'workSchedule',
      'shift',
      'skills',
      'languages',
      'emergencyContact',
      'notes',
      'permissions',
    ];

    // Filter only allowed fields
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add lastModifiedBy
    updateData.lastModifiedBy = session.user.id;

    await connectDB();

    const receptionist = await Receptionist.findOneAndUpdate(
      { user: session.user.id },
      updateData,
      {
        new: true,
        runValidators: true,
        populate: [
          { path: 'user', select: 'name email phone image role department' },
        ],
      }
    );

    if (!receptionist) {
      return NextResponse.json(
        { error: 'Receptionist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: receptionist.toObject(),
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating receptionist profile:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get receptionist dashboard data
export async function GET_DASHBOARD() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RECEPTIONIST') {
      return NextResponse.json(
        { error: 'Forbidden - Receptionist access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const receptionist = await Receptionist.findOne({ user: session.user.id })
      .populate('user', 'name email phone image role department')
      .populate('assignedDoctor', 'name specialization department')
      .exec();

    if (!receptionist) {
      return NextResponse.json(
        { error: 'Receptionist profile not found' },
        { status: 404 }
      );
    }

    // Get department metrics if department exists
    let departmentMetrics = null;
    if (receptionist.department) {
      departmentMetrics = await Receptionist.calculateDepartmentMetrics(
        receptionist.department
      );
    }

    // Get available receptionists in same department
    const availableReceptionists = receptionist.department
      ? await Receptionist.findByDepartment(receptionist.department)
      : await Receptionist.findAvailableReceptionists();

    const dashboardData = {
      profile: receptionist.toObject(),
      metrics: {
        performance: receptionist.getPerformanceRating(),
        isAvailable: receptionist.isAvailable,
        appointmentsHandled:
          receptionist.performanceMetrics?.totalAppointmentsHandled || 0,
        satisfactionScore:
          receptionist.performanceMetrics?.patientSatisfactionScore || 0,
        todayAppointments: receptionist.currentAppointmentsCount || 0,
        maxAppointments: receptionist.maxAppointmentsPerDay || 30,
        utilizationRate: receptionist.maxAppointmentsPerDay
          ? ((receptionist.currentAppointmentsCount || 0) /
              receptionist.maxAppointmentsPerDay) *
            100
          : 0,
      },
      department: departmentMetrics,
      colleagues: availableReceptionists
        .filter(r => r._id.toString() !== receptionist._id.toString())
        .map(r => ({
          id: r._id,
          name: r.fullName,
          isAvailable: r.isAvailable,
          currentAppointments: r.currentAppointmentsCount,
        })),
      todaySchedule: receptionist.getTodaySchedule(),
      employmentInfo: {
        status: receptionist.employmentStatus,
        type: receptionist.employmentType,
        hireDate: receptionist.hireDate,
        tenureDays: Math.floor(
          (new Date().getTime() - new Date(receptionist.hireDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching receptionist dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
