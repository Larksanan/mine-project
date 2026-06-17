/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Pharmacy from '@/models/Pharmacy';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

// GET - Fetch all pharmacies with pagination and filtering
export async function GET(request: NextRequest): Promise<Response> {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const service = searchParams.get('service') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.street': { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (service && service !== 'all') {
      query.services = { $in: [service] };
    }

    // Execute query with population
    const pharmacies = await Pharmacy.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Pharmacy.countDocuments(query);

    const response: ApiResponse<{
      pharmacies: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        pharmacies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      message: 'Pharmacies fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch pharmacies',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST - Create a new pharmacy
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to create a pharmacy',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    await connectDB();

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'User not found',
        error: 'Unable to verify user account',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if user has permission to create pharmacy
    if (!['ADMIN', 'PHARMACIST'].includes(user.role)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Insufficient permissions',
        error: 'Only admins and pharmacists can create pharmacies',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields for new schema
    if (
      !body.name ||
      !body.address?.street ||
      !body.address?.city ||
      !body.address?.state ||
      !body.address?.zipCode ||
      !body.contact?.phone
    ) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Missing required fields',
        error:
          'Name, address (street, city, state, zipCode), and phone are required',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if pharmacy with same name already exists
    const existingPharmacy = await Pharmacy.findOne({
      name: body.name.trim(),
    });

    if (existingPharmacy) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy already exists',
        error: 'A pharmacy with this name already exists',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Process pharmacists: ensure they have the required userId and add the creator if applicable
    let pharmacistsList = Array.isArray(body.pharmacists)
      ? body.pharmacists
      : [];

    // Sanitize and ensure each pharmacist entry has a userId
    // This prevents validation errors if the client sends incomplete objects
    pharmacistsList = pharmacistsList
      .filter((p: any) => p && (typeof p === 'string' || p.userId))
      .map((p: any) => (typeof p === 'string' ? { userId: p } : p));

    // If the creator is a PHARMACIST and not already in the list, add them
    const isCreatorIncluded = pharmacistsList.some(
      (p: any) => p.userId?.toString() === user._id.toString()
    );

    if (user.role === 'PHARMACIST' && !isCreatorIncluded) {
      pharmacistsList.push({
        userId: user._id,
        role: 'PHARMACIST_IN_CHARGE',
        status: 'ACTIVE',
      });
    }

    // Set default values for the new schema
    const pharmacyData = {
      name: body.name.trim(),
      address: {
        street: body.address.street.trim(),
        city: body.address.city.trim(),
        state: body.address.state.trim(),
        zipCode: body.address.zipCode.trim(),
        country: body.address.country || 'US',
      },
      contact: {
        phone: body.contact.phone.trim(),
        email: body.contact.email?.trim() || '',
        emergencyPhone: body.contact.emergencyPhone?.trim() || '',
      },
      operatingHours: body.operatingHours || {
        Monday: '9:00 AM - 6:00 PM',
        Tuesday: '9:00 AM - 6:00 PM',
        Wednesday: '9:00 AM - 6:00 PM',
        Thursday: '9:00 AM - 6:00 PM',
        Friday: '9:00 AM - 6:00 PM',
        Saturday: '9:00 AM - 2:00 PM',
        Sunday: 'Closed',
      },
      services: body.services || [],
      pharmacists: pharmacistsList,
      inventory: body.inventory || {
        totalProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      },
      status: body.status || 'ACTIVE',
      is24Hours: body.is24Hours || false,
      description: body.description?.trim() || '',
      website: body.website?.trim() || '',
      createdBy: user._id,
    };

    // Create new pharmacy
    const newPharmacy = new Pharmacy(pharmacyData);
    await newPharmacy.save();

    // Populate the createdBy field for response
    await newPharmacy.populate('createdBy', 'name email role');

    const response: ApiResponse<typeof newPharmacy> = {
      success: true,
      data: newPharmacy,
      message: 'Pharmacy created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pharmacy:', error);

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy already exists',
        error: 'A pharmacy with this name already exists',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Validation failed',
        error: errors.join(', '),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to create pharmacy',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT - Update a pharmacy (if needed for bulk updates)
export async function PUT(): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to update a pharmacy',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    await connectDB();

    // Implementation for bulk updating pharmacies would go here
    const response: ApiResponse<null> = {
      success: true,
      message: 'Bulk pharmacy update endpoint - implement as needed',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating pharmacy:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to update pharmacy',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
