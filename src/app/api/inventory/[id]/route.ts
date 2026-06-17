/* eslint-disable @typescript-eslint/no-explicit-any */
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to view inventory',
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
        message: 'Inventory ID is required',
        error: 'Please provide an inventory ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!Types.ObjectId.isValid(id)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid inventory ID',
        error: 'Please provide a valid inventory ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const inventoryItem = await Inventory.findById(id)
      .populate('pharmacy', 'name address')
      .populate('createdBy', 'name email');

    if (!inventoryItem) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Inventory item not found',
        error: 'No inventory item found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<typeof inventoryItem> = {
      success: true,
      data: inventoryItem,
      message: 'Inventory item fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch inventory item',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

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
        error: 'You must be logged in to update inventory',
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
        message: 'Inventory ID is required',
        error: 'Please provide an inventory ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!Types.ObjectId.isValid(id)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid inventory ID',
        error: 'Please provide a valid inventory ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const inventoryItem = await Inventory.findById(id);
    if (!inventoryItem) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Inventory item not found',
        error: 'No inventory item found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    if (body.quantity !== undefined) {
      const quantity = parseInt(body.quantity);
      const lowStockThreshold =
        body.lowStockThreshold || inventoryItem.lowStockThreshold;

      if (quantity === 0) {
        body.status = 'OUT_OF_STOCK';
      } else if (quantity <= lowStockThreshold) {
        body.status = 'LOW_STOCK';
      } else {
        body.status = 'IN_STOCK';
      }
    }

    // Check for SKU uniqueness if updating SKU
    if (body.sku && body.sku !== inventoryItem.sku) {
      const existingSku = await Inventory.findOne({
        sku: body.sku.toUpperCase(),
        pharmacy: inventoryItem.pharmacy,
        _id: { $ne: id },
      });

      if (existingSku) {
        const errorResponse: ApiResponse<null> = {
          success: false,
          message: 'SKU already exists',
          error: 'An item with this SKU already exists in this pharmacy',
        };
        return NextResponse.json(errorResponse, { status: 409 });
      }
    }

    // Check for barcode uniqueness if updating barcode
    if (body.barcode && body.barcode !== inventoryItem.barcode) {
      const existingBarcode = await Inventory.findOne({
        barcode: body.barcode.toUpperCase(),
        pharmacy: inventoryItem.pharmacy,
        _id: { $ne: id },
      });

      if (existingBarcode) {
        const errorResponse: ApiResponse<null> = {
          success: false,
          message: 'Barcode already exists',
          error: 'An item with this barcode already exists in this pharmacy',
        };
        return NextResponse.json(errorResponse, { status: 409 });
      }
    }

    // Format fields
    if (body.sku) body.sku = body.sku.toUpperCase().trim();
    if (body.barcode) body.barcode = body.barcode.toUpperCase().trim();
    if (body.batchNumber)
      body.batchNumber = body.batchNumber.toUpperCase().trim();

    // Update inventory item
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('pharmacy', 'name address')
      .populate('createdBy', 'name email');

    const response: ApiResponse<typeof updatedItem> = {
      success: true,
      data: updatedItem,
      message: 'Inventory item updated successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error updating inventory item:', error);

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

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Duplicate entry',
        error: `An item with this ${field} already exists`,
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to update inventory item',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

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

    const { id } = await params;

    if (!id) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Inventory ID is required',
        error: 'Please provide an inventory ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!Types.ObjectId.isValid(id)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid inventory ID',
        error: 'Please provide a valid inventory ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const inventoryItem = await Inventory.findById(id);
    if (!inventoryItem) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Inventory item not found',
        error: 'No inventory item found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      {
        status: 'DISCONTINUED',
        quantity: 0,
        updatedAt: new Date(),
        deletedAt: new Date(),
        deletedBy: user._id,
      },
      { new: true }
    )
      .populate('pharmacy', 'name address')
      .populate('createdBy', 'name email');

    const response: ApiResponse<typeof updatedItem> = {
      success: true,
      data: updatedItem,
      message: 'Inventory item deleted successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to delete inventory item',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
