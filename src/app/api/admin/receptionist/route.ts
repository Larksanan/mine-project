/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Receptionist from '@/models/Receptionist';
import User from '@/models/User';
import {
  ICreateReceptionistRequest,
  EmploymentStatus,
  EmploymentType,
  ShiftType,
  IReceptionistQuery,
} from '@/types/Receptionist';

// GET all receptionists with filters
export async function GET(request: NextRequest) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const pageParam = parseInt(searchParams.get('page') || '1');
    const limitParam = parseInt(searchParams.get('limit') || '10');

    const query: IReceptionistQuery = {
      page: isNaN(pageParam) ? 1 : pageParam,
      limit: isNaN(limitParam) ? 10 : limitParam,
      search: searchParams.get('search') || '',
      department: searchParams.get('department') || undefined,
      employmentStatus:
        (searchParams.get('employmentStatus') as EmploymentStatus) || undefined,
      shift: (searchParams.get('shift') as ShiftType) || undefined,
      employmentType:
        (searchParams.get('employmentType') as EmploymentType) || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      populate: true,
    };

    const skip = ((query.page || 1) - 1) * (query.limit || 10);

    // Build filter query
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { employeeId: { $regex: query.search, $options: 'i' } },
        { department: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.department) {
      filter.department = query.department;
    }

    if (query.employmentStatus) {
      filter.employmentStatus = query.employmentStatus;
    }

    if (query.shift) {
      filter.shift = query.shift;
    }

    if (query.employmentType) {
      filter.employmentType = query.employmentType;
    }

    // Get total count
    const total = await Receptionist.countDocuments(filter);

    // Build sort
    const sort: any = {};
    if (query.sortBy) sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;

    // Get receptionists with pagination
    const receptionists = await Receptionist.find(filter)
      .populate({
        path: 'user',
        select: 'name email phone image role nic',
      })
      .populate({
        path: 'assignedDoctor',
        select: 'name email phone specialization nic',
      })
      .sort(sort)
      .skip(skip || 0)
      .limit(query.limit || 10)
      .lean();

    return NextResponse.json({
      success: true,
      data: receptionists,
      total,
      page: query.page,
      limit: query.limit || 10,
      totalPages: Math.ceil(total / (query.limit || 10)),
    });
  } catch (error) {
    console.error('Error fetching receptionists:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST create new receptionist
export async function POST(request: NextRequest) {
  await connectDB();

  try {
    const body: ICreateReceptionistRequest = await request.json();

    console.log('📥 Received request body:', {
      userId: body.userId,
      employeeId: body.employeeId,
      shift: body.shift,
      employmentType: body.employmentType,
    });

    // ==================== VALIDATION ====================

    // Required field validations
    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!body.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Validate Employee ID format
    const employeeIdRegex = /^REC-\d{4}-\d{4}$/;
    const upperEmployeeId = body.employeeId.toUpperCase();
    if (!employeeIdRegex.test(upperEmployeeId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Employee ID must be in format REC-YYYY-XXXX (e.g., REC-2024-0001)',
        },
        { status: 400 }
      );
    }

    if (!body.shift) {
      return NextResponse.json(
        { success: false, error: 'Shift is required' },
        { status: 400 }
      );
    }

    if (!body.employmentType) {
      return NextResponse.json(
        { success: false, error: 'Employment type is required' },
        { status: 400 }
      );
    }

    if (!body.hireDate) {
      return NextResponse.json(
        { success: false, error: 'Hire date is required' },
        { status: 400 }
      );
    }

    // Validate languages array
    const validLanguages = (body.languages || []).filter(
      lang => lang.trim() !== ''
    );
    if (validLanguages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one language is required' },
        { status: 400 }
      );
    }

    // ==================== CHECK USER EXISTS ====================

    const userExists = await User.findById(body.userId);
    if (!userExists) {
      console.log('❌ User not found:', body.userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', {
      id: userExists._id,
      name: userExists.name,
      email: userExists.email,
    });

    // ==================== CHECK FOR DUPLICATES ====================

    // Check if user already has a receptionist profile
    const existingByUser = await Receptionist.findOne({ user: body.userId });
    if (existingByUser) {
      console.log('❌ User already has receptionist profile:', {
        userId: body.userId,
        employeeId: existingByUser.employeeId,
      });
      return NextResponse.json(
        {
          success: false,
          error: `This user already has a receptionist profile with Employee ID: ${existingByUser.employeeId}`,
          details: {
            existingEmployeeId: existingByUser.employeeId,
            existingProfileId: existingByUser._id,
          },
        },
        { status: 409 }
      );
    }

    // Check if employee ID is already taken
    const existingByEmployeeId = await Receptionist.findOne({
      employeeId: upperEmployeeId,
    });
    if (existingByEmployeeId) {
      console.log('❌ Employee ID already exists:', upperEmployeeId);

      // Populate user info for better error message
      await existingByEmployeeId.populate('user', 'name email');
      const userName = existingByEmployeeId.user
        ? typeof existingByEmployeeId.user === 'object' &&
          'name' in existingByEmployeeId.user
          ? existingByEmployeeId.user.name
          : 'Unknown'
        : 'Unknown';

      return NextResponse.json(
        {
          success: false,
          error: `Employee ID ${upperEmployeeId} is already assigned to ${userName}`,
          details: {
            existingUserId: existingByEmployeeId.user,
            existingProfileId: existingByEmployeeId._id,
          },
        },
        { status: 409 }
      );
    }

    console.log('✅ No duplicates found. Creating receptionist profile...');

    // ==================== CREATE RECEPTIONIST ====================

    const newReceptionist = new Receptionist({
      user: body.userId,
      employeeId: upperEmployeeId,
      shift: body.shift,
      workSchedule: body.workSchedule,
      department: body.department,
      assignedDoctor: body.assignedDoctor || undefined,
      maxAppointmentsPerDay: body.maxAppointmentsPerDay || 30,
      currentAppointmentsCount: body.currentAppointmentsCount || 0,
      skills: (body.skills || []).filter(skill => skill.trim() !== ''),
      languages: validLanguages,
      emergencyContact: body.emergencyContact,
      employmentStatus: body.employmentStatus || EmploymentStatus.ACTIVE,
      employmentType: body.employmentType,
      hireDate: new Date(body.hireDate),
      terminationDate: body.terminationDate
        ? new Date(body.terminationDate)
        : undefined,
      salary: {
        basic: body.salary?.basic || 0,
        allowances: body.salary?.allowances || 0,
        deductions: body.salary?.deductions || 0,
        currency: body.salary?.currency || 'LKR',
        paymentFrequency: body.salary?.paymentFrequency || 'MONTHLY',
      },
      performanceMetrics: body.performanceMetrics || {
        averageCheckInTime: 0,
        averageAppointmentTime: 0,
        patientSatisfactionScore: 0,
        totalAppointmentsHandled: 0,
        errorRate: 0,
      },
      permissions: body.permissions || {
        canManageAppointments: true,
        canManagePatients: true,
        canManageBilling: true,
        canViewReports: false,
        canManageInventory: false,
        canHandleEmergency: true,
        canAccessMedicalRecords: false,
        canManagePrescriptions: false,
      },
      trainingRecords: body.trainingRecords || [],
      notes: body.notes || '',
    });

    await newReceptionist.save();

    console.log('✅ Receptionist profile created successfully:', {
      id: newReceptionist._id,
      employeeId: newReceptionist.employeeId,
    });

    // Populate and return
    const populated = await Receptionist.findById(newReceptionist._id)
      .populate('user', 'name email phone image role nic')
      .populate('assignedDoctor', 'name email phone specialization')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: populated,
        message: 'Receptionist profile created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error creating receptionist:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Handle duplicate key errors (MongoDB E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];

      return NextResponse.json(
        {
          success: false,
          error: `${field === 'user' ? 'User' : 'Employee ID'} ${value} already exists`,
          details: {
            field,
            value,
          },
        },
        { status: 409 }
      );
    }

        // Generic error

        return NextResponse.json(

          {

            success: false,

            error: error.message || 'Internal server error',

          },

          { status: 500 }

        );

      }

    }

    

    // DELETE a receptionist

    export async function DELETE(request: NextRequest) {

        await connectDB();

    

        try {

            const { searchParams } = new URL(request.url);

            const id = searchParams.get('id');

    

            if (!id) {

                return NextResponse.json({ success: false, error: 'Receptionist ID is required' }, { status: 400 });

            }

    

            const receptionist = await Receptionist.findById(id);

    

            if (!receptionist) {

                return NextResponse.json({ success: false, error: 'Receptionist not found' }, { status: 404 });

            }

    

            // Revert user role to USER

            await User.findByIdAndUpdate(receptionist.user, { role: 'USER' });

    

            await Receptionist.findByIdAndDelete(id);

    

            return NextResponse.json({ success: true, message: 'Receptionist deleted successfully' });

        } catch (error: any) {

            console.error('❌ Error deleting receptionist:', error);

            return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });

        }

    }

    

    
