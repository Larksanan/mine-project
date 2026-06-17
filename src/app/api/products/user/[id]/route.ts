/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import mongoose from 'mongoose';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

const safeToString = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return value.toString();
  } catch {
    return '';
  }
};

const safeToNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const serializeProductForUser = (product: any) => {
  try {
    const productObj = product.toObject ? product.toObject() : product;

    let pharmacyData = null;
    if (productObj.pharmacy) {
      if (
        typeof productObj.pharmacy === 'object' &&
        productObj.pharmacy !== null
      ) {
        pharmacyData = {
          id: safeToString(productObj.pharmacy._id),
          name: String(productObj.pharmacy.name || ''),
          address: String(productObj.pharmacy.address || ''),
          contact: String(productObj.pharmacy.contact || ''),
        };
      }
    }

    const stockQuantity = safeToNumber(productObj.stockQuantity, 0);
    const reservedQuantity = safeToNumber(productObj.reservedQuantity, 0);
    const minStockLevel = safeToNumber(productObj.minStockLevel, 10);
    const availableQuantity = stockQuantity - reservedQuantity;

    return {
      id: safeToString(productObj._id),
      _id: safeToString(productObj._id),
      name: String(productObj.name || 'Unnamed Product'),
      description: String(productObj.description || ''),
      price: safeToNumber(productObj.price, 0),
      category: String(productObj.category || 'Uncategorized'),
      image: String(productObj.image || '/placeholder-medicine.jpg'),
      inStock: Boolean(productObj.inStock),
      stockQuantity: stockQuantity,
      reservedQuantity: reservedQuantity,
      manufacturer: String(productObj.manufacturer || 'Unknown'),
      requiresPrescription: Boolean(productObj.requiresPrescription),
      sku: String(productObj.sku || 'N/A'),
      pharmacy: pharmacyData,
      availableQuantity: availableQuantity,
      isLowStock: availableQuantity <= minStockLevel,
      createdAt: productObj.createdAt || null,
      updatedAt: productObj.updatedAt || null,
    };
  } catch (err) {
    console.error('Error serializing product:', err);
    throw new Error('Failed to serialize product data');
  }
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid product ID',
          error: 'The provided ID is not a valid MongoDB ObjectId format',
        },
        { status: 400 }
      );
    }

    const product = await Product.findById(id).lean().exec();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product not found',
          error: 'No product found with the provided ID',
        },
        { status: 404 }
      );
    }

    let productWithPharmacy = product;
    try {
      const populated = await Product.findById(id)
        .populate('pharmacy', 'name address contact')
        .lean()
        .exec();

      if (populated) {
        productWithPharmacy = populated;
      }
    } catch (populateError) {
      // Continue without population if it fails
    }

    const serializedProduct = serializeProductForUser(productWithPharmacy);

    const response: ApiResponse<any> = {
      success: true,
      data: serializedProduct,
      message: 'Product fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : String(error),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
