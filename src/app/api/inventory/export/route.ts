import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import User from '@/models/User';
import { Types } from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import { Parser } from 'json2csv';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to export inventory',
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

    if (!Types.ObjectId.isValid(pharmacyId)) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid pharmacy ID',
        error: 'Please provide a valid pharmacy ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get all inventory items for this pharmacy
    const inventoryItems = await Inventory.find({
      pharmacy: new Types.ObjectId(pharmacyId),
      status: { $ne: 'DISCONTINUED' }, // Exclude discontinued items
    })
      .populate('pharmacy', 'name')
      .sort({ category: 1, name: 1 })
      .lean();

    // Prepare data for CSV
    const csvData = inventoryItems.map(item => ({
      'Item Name': item.name,
      SKU: item.sku,
      Barcode: item.barcode || '',
      Category: item.category,
      Quantity: item.quantity,
      'Low Stock Threshold': item.lowStockThreshold,
      'Reorder Level': item.reorderLevel,
      'Reorder Quantity': item.reorderQuantity,
      'Cost Price': item.costPrice,
      'Selling Price': item.sellingPrice,
      Status: item.status,
      Supplier: item.supplier || '',
      'Batch Number': item.batchNumber || '',
      'Expiry Date': item.expiryDate
        ? new Date(item.expiryDate).toLocaleDateString()
        : '',
      Location: item.location || '',
      Description: item.description || '',
      Notes: item.notes || '',
      'Created At': new Date(item.createdAt).toLocaleString(),
      'Updated At': new Date(item.updatedAt).toLocaleString(),
    }));

    // Define CSV fields
    const fields = [
      'Item Name',
      'SKU',
      'Barcode',
      'Category',
      'Quantity',
      'Low Stock Threshold',
      'Reorder Level',
      'Reorder Quantity',
      'Cost Price',
      'Selling Price',
      'Status',
      'Supplier',
      'Batch Number',
      'Expiry Date',
      'Location',
      'Description',
      'Notes',
      'Created At',
      'Updated At',
    ];

    // Create CSV parser
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // Create response with CSV file
    const response = new NextResponse(csv);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`
    );

    return response;
  } catch (error) {
    console.error('Error exporting inventory:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to export inventory',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
