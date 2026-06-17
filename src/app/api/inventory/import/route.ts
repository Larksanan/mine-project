// app/api/inventory/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import User from '@/models/User';
import { Types } from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

interface ImportItem {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  barcode?: string;
  description?: string;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  location?: string;
  lowStockThreshold?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  notes?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to import inventory',
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pharmacyId = formData.get('pharmacyId') as string;

    if (!file) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'No file provided',
        error: 'Please upload a CSV file',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

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

    // Check if user has access to this pharmacy
    // You might want to add additional checks here based on your user roles

    // Parse CSV file
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    const results: ImportItem[] = [];

    await new Promise((resolve, reject) => {
      const stream = Readable.from(text);
      stream
        .pipe(csv())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('data', (data: any) => {
          // Map CSV columns to inventory fields
          const item: ImportItem = {
            name: data['Item Name'] || data['Name'] || '',
            sku: data.SKU || data['SKU Code'] || '',
            category: data.Category || data['Product Category'] || 'General',
            quantity: parseInt(data.Quantity || data['Stock Quantity'] || '0'),
            costPrice: parseFloat(
              data['Cost Price'] || data['Purchase Price'] || '0'
            ),
            sellingPrice: parseFloat(
              data['Selling Price'] || data['Retail Price'] || '0'
            ),
            barcode: data.Barcode || data['Bar Code'] || undefined,
            description:
              data.Description || data['Product Description'] || undefined,
            supplier: data.Supplier || data['Vendor'] || undefined,
            batchNumber:
              data['Batch Number'] || data['Lot Number'] || undefined,
            expiryDate:
              data['Expiry Date'] || data['Expiration Date'] || undefined,
            location: data.Location || data['Storage Location'] || undefined,
            lowStockThreshold: data['Low Stock Threshold']
              ? parseInt(data['Low Stock Threshold'])
              : 10,
            reorderLevel: data['Reorder Level']
              ? parseInt(data['Reorder Level'])
              : 5,
            reorderQuantity: data['Reorder Quantity']
              ? parseInt(data['Reorder Quantity'])
              : 25,
            notes: data.Notes || data['Remarks'] || undefined,
          };
          results.push(item);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'No valid data found in file',
        error: 'The CSV file appears to be empty or improperly formatted',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate imported items
    const errors: string[] = [];
    const validItems: ImportItem[] = [];

    for (const item of results) {
      if (!item.name || !item.sku || !item.category) {
        errors.push(
          `Missing required fields for item: ${item.name || 'Unknown'}`
        );
        continue;
      }

      if (isNaN(item.quantity) || item.quantity < 0) {
        errors.push(`Invalid quantity for item: ${item.name}`);
        continue;
      }

      if (isNaN(item.costPrice) || item.costPrice < 0) {
        errors.push(`Invalid cost price for item: ${item.name}`);
        continue;
      }

      if (isNaN(item.sellingPrice) || item.sellingPrice < 0) {
        errors.push(`Invalid selling price for item: ${item.name}`);
        continue;
      }

      validItems.push(item);
    }

    if (errors.length > 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Validation errors found in imported data',
        error: errors.join('; '),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check for duplicate SKUs in the import data
    const skuSet = new Set();
    const duplicateSkus: string[] = [];

    for (const item of validItems) {
      if (skuSet.has(item.sku.toUpperCase())) {
        duplicateSkus.push(item.sku);
      }
      skuSet.add(item.sku.toUpperCase());
    }

    if (duplicateSkus.length > 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Duplicate SKUs found in import data',
        error: `The following SKUs appear more than once: ${duplicateSkus.join(', ')}`,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check for existing SKUs in database
    const existingSkus = await Inventory.find({
      sku: { $in: validItems.map(item => item.sku.toUpperCase()) },
      pharmacy: new Types.ObjectId(pharmacyId),
    }).select('sku');

    if (existingSkus.length > 0) {
      const existingSkuList = existingSkus.map(item => item.sku).join(', ');
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Some SKUs already exist in the pharmacy',
        error: `The following SKUs already exist: ${existingSkuList}`,
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Import valid items
    const importedItems = [];
    for (const item of validItems) {
      // Calculate status based on quantity
      let status = 'IN_STOCK';
      const lowStockThreshold = item.lowStockThreshold || 10;

      if (item.quantity === 0) {
        status = 'OUT_OF_STOCK';
      } else if (item.quantity <= lowStockThreshold) {
        status = 'LOW_STOCK';
      }

      const inventoryData = {
        ...item,
        sku: item.sku.toUpperCase().trim(),
        barcode: item.barcode ? item.barcode.toUpperCase().trim() : undefined,
        batchNumber: item.batchNumber
          ? item.batchNumber.toUpperCase().trim()
          : undefined,
        lowStockThreshold: lowStockThreshold,
        reorderLevel: item.reorderLevel || 5,
        reorderQuantity: item.reorderQuantity || 25,
        status: status,
        pharmacy: new Types.ObjectId(pharmacyId),
        createdBy: user._id,
      };

      const inventoryItem = new Inventory(inventoryData);
      await inventoryItem.save();
      importedItems.push(inventoryItem);
    }

    const response: ApiResponse<{ importedCount: number }> = {
      success: true,
      data: {
        importedCount: importedItems.length,
      },
      message: `Successfully imported ${importedItems.length} items`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error importing inventory:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to import inventory',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
