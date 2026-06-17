import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Pharmacy from '@/models/Pharmacy';
import User from '@/models/User';
import { Types } from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy ID is required',
        error: 'Please provide a pharmacy ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    let pharmacy;

    // Try different ID formats
    if (Types.ObjectId.isValid(id)) {
      pharmacy = await Pharmacy.findById(id)
        .populate('createdBy', 'name email role')
        .lean();
    } else {
      // Try finding by name or other identifier
      pharmacy = await Pharmacy.findOne({
        $or: [{ name: { $regex: id, $options: 'i' } }, { _id: id }],
      })
        .populate('createdBy', 'name email role')
        .lean();
    }

    if (!pharmacy) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy not found',
        error: 'No pharmacy found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<typeof pharmacy> = {
      success: true,
      data: pharmacy,
      message: 'Pharmacy fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch pharmacy',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT - Update a pharmacy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'User not found',
        error: 'Unable to verify user account',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy ID is required',
        error: 'Please provide a pharmacy ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Find pharmacy
    const pharmacy = await Pharmacy.findById(id);
    if (!pharmacy) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy not found',
        error: 'No pharmacy found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check permissions - only admin, pharmacist who created it, or owner can update
    const canUpdate =
      user.role === 'ADMIN' ||
      pharmacy.createdBy.toString() === user._id.toString();

    if (!canUpdate) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Insufficient permissions',
        error: 'You can only update pharmacies you created',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Prepare update data - handle nested objects properly
    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    // Handle nested objects to ensure they're merged properly
    if (body.address) {
      updateData.address = {
        ...pharmacy.address.toObject(),
        ...body.address,
      };
    }

    if (body.contact) {
      updateData.contact = {
        ...pharmacy.contact.toObject(),
        ...body.contact,
      };
    }

    if (body.operatingHours) {
      updateData.operatingHours = {
        ...pharmacy.operatingHours.toObject(),
        ...body.operatingHours,
      };
    }

    if (body.inventory) {
      updateData.inventory = {
        ...(pharmacy.inventory?.toObject() || {
          totalProducts: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
        }),
        ...body.inventory,
      };
    }

    // Update pharmacy
    const updatedPharmacy = await Pharmacy.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email role');

    const response: ApiResponse<typeof updatedPharmacy> = {
      success: true,
      data: updatedPharmacy,
      message: 'Pharmacy updated successfully',
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

// DELETE - Delete a pharmacy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to delete a pharmacy',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'User not found',
        error: 'Unable to verify user account',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const { id } = await params;

    if (!id) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy ID is required',
        error: 'Please provide a pharmacy ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Find pharmacy
    const pharmacy = await Pharmacy.findById(id);
    if (!pharmacy) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy not found',
        error: 'No pharmacy found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check permissions - only admin can delete
    if (user.role !== 'ADMIN') {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Insufficient permissions',
        error: 'Only administrators can delete pharmacies',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Soft delete by setting status to INACTIVE (matching the new schema)
    await Pharmacy.findByIdAndUpdate(id, {
      status: 'INACTIVE',
      updatedAt: new Date(),
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Pharmacy deleted successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting pharmacy:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to delete pharmacy',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
