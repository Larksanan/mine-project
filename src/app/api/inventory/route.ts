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

// GET - Fetch inventory with filtering, pagination, and search
export async function GET(request: NextRequest): Promise<Response> {
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

    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacy');

    if (!pharmacyId) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy ID is required',
        error: 'Please provide a pharmacy ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate pharmacy ID format
    if (!Types.ObjectId.isValid(pharmacyId)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid pharmacy ID',
        error: 'Please provide a valid pharmacy ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get query parameters
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const lowStock = searchParams.get('lowStock');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { pharmacy: new Types.ObjectId(pharmacyId) };

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Low stock filter
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
      query.quantity = { $gt: 0 }; // Exclude out of stock items
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }

    // Determine sort order
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with population
    const inventory = await Inventory.find(query)
      .populate('pharmacy', 'name address')
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Inventory.countDocuments(query);

    // Calculate inventory statistics
    const totalItems = await Inventory.countDocuments({
      pharmacy: new Types.ObjectId(pharmacyId),
    });

    const totalValue = await Inventory.aggregate([
      { $match: { pharmacy: new Types.ObjectId(pharmacyId) } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
        },
      },
    ]);

    const lowStockCount = await Inventory.countDocuments({
      pharmacy: new Types.ObjectId(pharmacyId),
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      quantity: { $gt: 0 },
    });

    const outOfStockCount = await Inventory.countDocuments({
      pharmacy: new Types.ObjectId(pharmacyId),
      quantity: 0,
    });

    const expiredCount = await Inventory.countDocuments({
      pharmacy: new Types.ObjectId(pharmacyId),
      expiryDate: { $lt: new Date() },
    });

    // Get category distribution
    const categoryDistribution = await Inventory.aggregate([
      { $match: { pharmacy: new Types.ObjectId(pharmacyId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const response: ApiResponse<{
      inventory: any[];
      statistics: {
        totalItems: number;
        totalValue: number;
        lowStockCount: number;
        outOfStockCount: number;
        expiredCount: number;
        categoryDistribution: any[];
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        inventory,
        statistics: {
          totalItems,
          totalValue: totalValue[0]?.total || 0,
          lowStockCount,
          outOfStockCount,
          expiredCount,
          categoryDistribution,
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      message: 'Inventory fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch inventory',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to create inventory items',
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

    // Validate required fields
    const requiredFields = [
      'name',
      'category',
      'sku',
      'quantity',
      'costPrice',
      'sellingPrice',
      'pharmacy',
    ];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Missing required fields',
        error: `The following fields are required: ${missingFields.join(', ')}`,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate pharmacy ID
    if (!Types.ObjectId.isValid(body.pharmacy)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid pharmacy ID',
        error: 'Please provide a valid pharmacy ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if SKU already exists
    const existingSku = await Inventory.findOne({
      sku: body.sku.toUpperCase(),
      pharmacy: new Types.ObjectId(body.pharmacy),
    });

    if (existingSku) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'SKU already exists',
        error: 'An item with this SKU already exists in this pharmacy',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Check if barcode already exists (if provided)
    if (body.barcode) {
      const existingBarcode = await Inventory.findOne({
        barcode: body.barcode.toUpperCase(),
        pharmacy: new Types.ObjectId(body.pharmacy),
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

    // Calculate status based on quantity
    let status = 'IN_STOCK';
    const quantity = parseInt(body.quantity);
    const lowStockThreshold = body.lowStockThreshold || 10;

    if (quantity === 0) {
      status = 'OUT_OF_STOCK';
    } else if (quantity <= lowStockThreshold) {
      status = 'LOW_STOCK';
    }

    // Create new inventory item
    const inventoryData = {
      ...body,
      sku: body.sku.toUpperCase().trim(),
      barcode: body.barcode ? body.barcode.toUpperCase().trim() : undefined,
      batchNumber: body.batchNumber
        ? body.batchNumber.toUpperCase().trim()
        : undefined,
      quantity: quantity,
      lowStockThreshold: lowStockThreshold,
      reorderLevel: body.reorderLevel || 5,
      reorderQuantity: body.reorderQuantity || 25,
      status: status,
      createdBy: user._id,
    };

    const inventoryItem = new Inventory(inventoryData);
    await inventoryItem.save();

    // Populate references for response
    await inventoryItem.populate('pharmacy', 'name address');
    await inventoryItem.populate('createdBy', 'name email');

    const response: ApiResponse<typeof inventoryItem> = {
      success: true,
      data: inventoryItem,
      message: 'Inventory item created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);

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
      message: 'Failed to create inventory item',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT - Bulk update inventory items
export async function PUT(request: NextRequest): Promise<Response> {
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

    const body = await request.json();
    const { updates, pharmacyId } = body;

    if (!pharmacyId) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Pharmacy ID is required',
        error: 'Please provide a pharmacy ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'No updates provided',
        error: 'Please provide an array of items to update',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Process bulk updates
    const bulkOperations = updates.map(update => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(update.itemId),
          pharmacy: new Types.ObjectId(pharmacyId),
        },
        update: {
          $set: {
            ...update.fields,
            updatedAt: new Date(),
          },
        },
      },
    }));

    const result = await Inventory.bulkWrite(bulkOperations);

    const response: ApiResponse<{ modifiedCount: number }> = {
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
      message: `Successfully updated ${result.modifiedCount} items`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating inventory:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to update inventory',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
