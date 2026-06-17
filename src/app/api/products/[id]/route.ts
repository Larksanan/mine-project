/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import { Types } from 'mongoose';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!id || id === 'undefined') {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product ID is required',
        error: 'Please provide a valid product ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    let product;

    // Try different ID formats
    if (Types.ObjectId.isValid(id)) {
      product = await Product.findById(id)
        .populate('createdBy', 'name email role')
        .populate('pharmacy', 'name address phone')
        .lean();
    } else {
      // Try finding by SKU
      product = await Product.findOne({ sku: id.toUpperCase() })
        .populate('createdBy', 'name email role')
        .populate('pharmacy', 'name address phone')
        .lean();
    }

    if (!product) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product not found',
        error: 'No product found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Transform product to ensure consistent ID format
    const productObj = product as any;
    const productId =
      productObj._id?.toString() || productObj.id?.toString() || '';

    const transformedProduct = {
      ...productObj,
      id: productId,
      _id: productId,
    };

    const response: ApiResponse<typeof transformedProduct> = {
      success: true,
      data: transformedProduct,
      message: 'Product fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT - Update a product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to update a product',
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

    const { id } = await context.params;
    const body = await request.json();

    if (!id || id === 'undefined') {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product ID is required',
        error: 'Please provide a valid product ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product not found',
        error: 'No product found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check permissions - only admin, pharmacist who created it, or owner can update
    const canUpdate =
      user.role === 'ADMIN' ||
      product.createdBy.toString() === user._id.toString();

    if (!canUpdate) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Insufficient permissions',
        error: 'You can only update products you created',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Validate price if provided
    if (body.price !== undefined && body.price <= 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid price',
        error: 'Price must be greater than 0',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate stock quantity if provided
    if (body.stockQuantity !== undefined && body.stockQuantity < 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid stock quantity',
        error: 'Stock quantity cannot be negative',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Update product
    const updatedProductRaw = await Product.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email role')
      .populate('pharmacy', 'name address phone')
      .lean();

    if (!updatedProductRaw) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Failed to update product',
        error: 'Product not found after update',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Transform to ensure consistent ID format
    const updatedProductObj = updatedProductRaw as any;
    const productId =
      updatedProductObj._id?.toString() ||
      updatedProductObj.id?.toString() ||
      '';

    const transformedProduct = {
      ...updatedProductObj,
      id: productId,
      _id: productId,
    };

    const response: ApiResponse<typeof transformedProduct> = {
      success: true,
      data: transformedProduct,
      message: 'Product updated successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error updating product:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product already exists',
        error: 'A product with this SKU or name already exists',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to update product',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to delete a product',
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

    const { id } = await context.params;

    if (!id || id === 'undefined') {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product ID is required',
        error: 'Please provide a valid product ID',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product not found',
        error: 'No product found with the provided ID',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check permissions - only admin or creator can delete
    const canDelete =
      user.role === 'ADMIN' ||
      product.createdBy.toString() === user._id.toString();

    if (!canDelete) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Insufficient permissions',
        error: 'You can only delete products you created',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Hard delete - completely remove from database
    await Product.findByIdAndDelete(id);

    // OR for soft delete (keep in database but mark as deleted):
    // await Product.findByIdAndUpdate(id, {
    //   inStock: false,
    //   stockQuantity: 0,
    //   isDeleted: true  // You'd need to add this field to the schema
    // });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Product deleted successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
