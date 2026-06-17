// app/api/inventory/bulk-delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import User from '@/models/User';
import { Types } from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to delete inventory',
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

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'No items selected',
        error: 'Please provide an array of inventory item IDs to delete',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate all IDs
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid inventory IDs',
        error: 'Please provide valid inventory item IDs',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Soft delete by setting status to DISCONTINUED
    const result = await Inventory.updateMany(
      {
        _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
      },
      {
        $set: {
          status: 'DISCONTINUED',
          quantity: 0,
          updatedAt: new Date(),
          deletedAt: new Date(),
          deletedBy: user._id,
        },
      }
    );

    const response: ApiResponse<{ deletedCount: number }> = {
      success: true,
      data: {
        deletedCount: result.modifiedCount,
      },
      message: `Successfully deleted ${result.modifiedCount} items`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error bulk deleting inventory items:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to delete inventory items',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
