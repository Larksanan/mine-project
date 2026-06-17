import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import Receptionist from '@/models/Receptionist';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface SearchResult {
  id?: unknown;
  _id?: unknown;
  type: string;
  matchType: string;
  [key: string]: unknown;
}

interface UserSearchResult extends SearchResult {
  name?: string;
  email?: string;
}

interface DoctorSearchResult extends SearchResult {
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
    status?: string;
  };
  specialization?: string;
  department?: string;
  experience?: number;
  rating?: unknown;
  isVerified?: boolean;
}

interface PatientSearchResult extends SearchResult {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  age?: number | null;
  bloodType?: string;
  isActive?: boolean;
}

interface ReceptionistSearchResult extends SearchResult {
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
    status?: string;
  };
  employeeId?: string;
  department?: string;
  shift?: string;
  employmentStatus?: string;
}

// GET - Advanced search for users with fuzzy matching and filters
export async function GET(request: NextRequest) {
  try {
    console.log('=== Advanced User Search ===');

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

    // Get query parameters
    const { searchParams } = new URL(request.url);

    // Search parameters
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const searchType = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Advanced filters
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const isVerified = searchParams.get('isVerified');
    const minExperience = searchParams.get('minExperience');
    const specialization = searchParams.get('specialization');
    const department = searchParams.get('department');
    const gender = searchParams.get('gender');
    const bloodType = searchParams.get('bloodType');

    console.log('Search parameters:', {
      query,
      searchType,
      limit,
      page,
      role,
      status,
    });

    // Results object
    interface ResultsObject {
      users: UserSearchResult[];
      doctors: DoctorSearchResult[];
      patients: PatientSearchResult[];
      receptionists: ReceptionistSearchResult[];
      totalCount: number;
    }

    const results: ResultsObject = {
      users: [],
      doctors: [],
      patients: [],
      receptionists: [],
      totalCount: 0,
    };

    // === SEARCH USERS ===
    if (searchType === 'all' || searchType === 'user') {
      interface UserQuery {
        $or?: Array<Record<string, unknown>>;
        role?: string;
        status?: string;
        isEmailVerified?: boolean;
      }
      const userQuery: UserQuery = {};

      // Text search
      if (query) {
        userQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
        ];
      }

      // Apply filters
      if (role && role !== 'ALL') {
        userQuery.role = role;
      }
      if (status && status !== 'ALL') {
        userQuery.status = status;
      }
      if (isVerified !== null && isVerified !== '') {
        userQuery.isEmailVerified = isVerified === 'true';
      }

      interface UserLean {
        _id: unknown;
        name?: string;
        email?: string;
        phone?: string;
        role?: string;
        status?: string;
        isEmailVerified?: boolean;
        createdAt?: Date;
      }

      const users = await User.find(userQuery)
        .select('-password')
        .limit(searchType === 'user' ? limit : 10)
        .skip(searchType === 'user' ? skip : 0)
        .sort({ createdAt: -1 })
        .lean<UserLean[]>();

      const userCount = await User.countDocuments(userQuery);

      results.users = users.map(user => ({
        ...user,
        _id: user._id,
        type: 'USER',
        matchType: 'direct',
      }));

      results.totalCount += userCount;
    }

    // === SEARCH DOCTORS ===
    if (searchType === 'all' || searchType === 'doctor') {
      interface DoctorQuery {
        'profile.specialization'?: { $regex: string; $options: string };
        'profile.department'?: { $regex: string; $options: string };
        'profile.isVerified'?: boolean;
        'profile.experience'?: { $gte: number };
      }
      const doctorQuery: DoctorQuery = {};

      // Build doctor-specific filters
      if (specialization) {
        doctorQuery['profile.specialization'] = {
          $regex: specialization,
          $options: 'i',
        };
      }
      if (department) {
        doctorQuery['profile.department'] = {
          $regex: department,
          $options: 'i',
        };
      }
      if (isVerified !== null && isVerified !== '') {
        doctorQuery['profile.isVerified'] = isVerified === 'true';
      }
      if (minExperience) {
        doctorQuery['profile.experience'] = { $gte: parseInt(minExperience) };
      }

      interface DoctorLean {
        _id: unknown;
        user?: {
          name?: string;
          email?: string;
          phone?: string;
          image?: string;
          status?: string;
        };
        profile?: {
          specialization?: string;
          department?: string;
          experience?: number;
          rating?: unknown;
          isVerified?: boolean;
        };
      }

      // Find doctors
      let doctors = await Doctor.find(doctorQuery)
        .populate('user', 'name email phone image status')
        .limit(searchType === 'doctor' ? limit : 10)
        .skip(searchType === 'doctor' ? skip : 0)
        .sort({ createdAt: -1 })
        .lean<DoctorLean[]>();

      // If there's a text query, filter by user name/email
      if (query) {
        doctors = doctors.filter(doc => {
          const user = doc.user;
          if (!user) return false;
          const searchLower = query.toLowerCase();
          return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.phone?.includes(query) ||
            doc.profile?.specialization?.toLowerCase().includes(searchLower) ||
            doc.profile?.department?.toLowerCase().includes(searchLower)
          );
        });
      }

      const doctorCount = await Doctor.countDocuments(doctorQuery);

      results.doctors = doctors.map(doctor => ({
        id: doctor._id,
        user: doctor.user,
        specialization: doctor.profile?.specialization,
        department: doctor.profile?.department,
        experience: doctor.profile?.experience,
        rating: doctor.profile?.rating,
        isVerified: doctor.profile?.isVerified,
        type: 'DOCTOR',
        matchType: 'profile',
      }));

      results.totalCount += doctorCount;
    }

    // === SEARCH PATIENTS ===
    if (searchType === 'all' || searchType === 'patient') {
      interface PatientQuery {
        gender?: string;
        bloodType?: string;
        $or?: Array<Record<string, unknown>>;
      }
      const patientQuery: PatientQuery = {};

      // Build patient-specific filters
      if (gender && gender !== 'ALL') {
        patientQuery.gender = gender;
      }
      if (bloodType && bloodType !== 'ALL') {
        patientQuery.bloodType = bloodType;
      }

      // Text search in patient fields
      if (query) {
        patientQuery.$or = [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
          { nic: { $regex: query, $options: 'i' } },
        ];
      }

      interface PatientLean {
        _id: unknown;
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        gender?: string;
        dateOfBirth?: Date;
        bloodType?: string;
        isActive?: boolean;
      }

      const patients = await Patient.find(patientQuery)
        .limit(searchType === 'patient' ? limit : 10)
        .skip(searchType === 'patient' ? skip : 0)
        .sort({ createdAt: -1 })
        .lean<PatientLean[]>();

      const patientCount = await Patient.countDocuments(patientQuery);

      results.patients = patients.map(patient => {
        let age: number | null = null;
        if (patient.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(patient.dateOfBirth);
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
        }

        return {
          id: patient._id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender,
          age,
          bloodType: patient.bloodType,
          isActive: patient.isActive,
          type: 'PATIENT',
          matchType: 'profile',
        };
      });

      results.totalCount += patientCount;
    }

    // === SEARCH RECEPTIONISTS ===
    if (searchType === 'all' || searchType === 'receptionist') {
      interface ReceptionistQuery {
        department?: { $regex: string; $options: string };
      }
      const receptionistQuery: ReceptionistQuery = {};

      // Build receptionist-specific filters
      if (department) {
        receptionistQuery.department = { $regex: department, $options: 'i' };
      }

      interface ReceptionistLean {
        _id: unknown;
        user?: {
          name?: string;
          email?: string;
          phone?: string;
          image?: string;
          status?: string;
        };
        employeeId?: string;
        department?: string;
        shift?: string;
        employmentStatus?: string;
      }

      // Find receptionists
      let receptionists = await Receptionist.find(receptionistQuery)
        .populate('user', 'name email phone image status')
        .limit(searchType === 'receptionist' ? limit : 10)
        .skip(searchType === 'receptionist' ? skip : 0)
        .sort({ createdAt: -1 })
        .lean<ReceptionistLean[]>();

      // If there's a text query, filter by user name/email
      if (query) {
        receptionists = receptionists.filter(rec => {
          const user = rec.user;
          if (!user) return false;
          const searchLower = query.toLowerCase();
          return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.phone?.includes(query) ||
            rec.employeeId?.toLowerCase().includes(searchLower) ||
            rec.department?.toLowerCase().includes(searchLower)
          );
        });
      }

      const receptionistCount =
        await Receptionist.countDocuments(receptionistQuery);

      results.receptionists = receptionists.map(receptionist => ({
        id: receptionist._id,
        user: receptionist.user,
        employeeId: receptionist.employeeId,
        department: receptionist.department,
        shift: receptionist.shift,
        employmentStatus: receptionist.employmentStatus,
        type: 'RECEPTIONIST',
        matchType: 'profile',
      }));

      results.totalCount += receptionistCount;
    }

    // Calculate combined results for 'all' search
    let combinedResults: SearchResult[] = [];
    if (searchType === 'all') {
      combinedResults = [
        ...results.users,
        ...results.doctors,
        ...results.patients,
        ...results.receptionists,
      ];

      // Sort by relevance
      combinedResults.sort((a, b) => {
        // Prioritize exact matches
        const aName =
          ('name' in a ? a.name : '') ||
          ('firstName' in a && 'lastName' in a
            ? `${a.firstName} ${a.lastName}`
            : '');
        const aEmail = 'email' in a ? a.email : '';
        const bName =
          ('name' in b ? b.name : '') ||
          ('firstName' in b && 'lastName' in b
            ? `${b.firstName} ${b.lastName}`
            : '');
        const bEmail = 'email' in b ? b.email : '';

        const aExact =
          query &&
          ((typeof aName === 'string' &&
            aName.toLowerCase() === query.toLowerCase()) ||
            (typeof aEmail === 'string' &&
              aEmail.toLowerCase() === query.toLowerCase()));
        const bExact =
          query &&
          ((typeof bName === 'string' &&
            bName.toLowerCase() === query.toLowerCase()) ||
            (typeof bEmail === 'string' &&
              bEmail.toLowerCase() === query.toLowerCase()));

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return 0;
      });

      // Apply pagination to combined results
      combinedResults = combinedResults.slice(skip, skip + limit);
    }

    // Calculate pagination info
    const total = results.totalCount;
    const pages = Math.ceil(total / limit);

    // Build response based on search type
    const responseData =
      searchType === 'all'
        ? {
            results: combinedResults,
            breakdown: {
              users: results.users.length,
              doctors: results.doctors.length,
              patients: results.patients.length,
              receptionists: results.receptionists.length,
            },
          }
        : {
            results:
              searchType === 'user'
                ? results.users
                : searchType === 'doctor'
                  ? results.doctors
                  : searchType === 'patient'
                    ? results.patients
                    : results.receptionists,
          };

    return NextResponse.json({
      success: true,
      data: responseData,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1,
      },
      searchInfo: {
        query,
        searchType,
        filters: {
          role,
          status,
          isVerified,
          specialization,
          department,
          gender,
          bloodType,
          minExperience,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        executionTime: Date.now(),
      },
    });
  } catch (error: unknown) {
    console.error('Error searching users:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to search users',
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

// POST - Advanced search with complex criteria (body-based search)
export async function POST(request: NextRequest) {
  try {
    console.log('=== Advanced User Search (POST) ===');

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

    const body = await request.json();
    const {
      query = '',
      roles = [],
      statuses = [],
      dateRange = {},
      pagination = { page: 1, limit: 20 },
      sorting = { field: 'createdAt', order: 'desc' },
      filters = {},
    } = body;

    // Build MongoDB query
    interface MongoQuery {
      $or?: Array<Record<string, unknown>>;
      role?: { $in: string[] };
      status?: { $in: string[] };
      createdAt?: {
        $gte?: Date;
        $lte?: Date;
      };
      isEmailVerified?: boolean;
    }
    const mongoQuery: MongoQuery = {};

    // Text search
    if (query) {
      mongoQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ];
    }

    // Role filter
    if (roles && Array.isArray(roles) && roles.length > 0) {
      mongoQuery.role = { $in: roles };
    }

    // Status filter
    if (statuses && Array.isArray(statuses) && statuses.length > 0) {
      mongoQuery.status = { $in: statuses };
    }

    // Date range filter
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      mongoQuery.createdAt = {};
      if (dateRange.startDate) {
        mongoQuery.createdAt.$gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        mongoQuery.createdAt.$lte = new Date(dateRange.endDate);
      }
    }

    // Additional filters
    if (filters && typeof filters.isEmailVerified !== 'undefined') {
      mongoQuery.isEmailVerified = filters.isEmailVerified;
    }

    // Pagination
    const skip = (pagination.page - 1) * pagination.limit;

    // Sorting
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sorting.field] = sorting.order === 'desc' ? -1 : 1;

    interface UserLean {
      _id: unknown;
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      status?: string;
      isEmailVerified?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
      lastLogin?: Date;
    }

    // Execute query
    const [users, total] = await Promise.all([
      User.find(mongoQuery)
        .select('-password')
        .sort(sortOptions)
        .skip(skip)
        .limit(pagination.limit)
        .lean<UserLean[]>(),
      User.countDocuments(mongoQuery),
    ]);

    const pages = Math.ceil(total / pagination.limit);

    return NextResponse.json({
      success: true,
      data: users.map(user => ({
        ...user,
        _id: user._id,
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages,
        hasNextPage: pagination.page < pages,
        hasPrevPage: pagination.page > 1,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('Error in advanced search:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to perform advanced search',
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
