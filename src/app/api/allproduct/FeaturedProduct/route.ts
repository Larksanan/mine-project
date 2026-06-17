/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectDB } from '@/lib/mongodb';
import FeaturedProduct from '@/models/FeaturedProduct';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';

// Validation schema
const featuredProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description too long'),
  link: z.string().url('Invalid URL').optional(),
  price: z.number().positive('Price must be positive').optional(),
  originalPrice: z
    .number()
    .positive('Original price must be positive')
    .optional(),
  isActive: z.boolean().default(true),
});

async function saveUploadedFile(file: File): Promise<string> {
  const uploadDir = join(
    process.cwd(),
    'public',
    'uploads',
    'featured-products'
  );

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const filename = `featured_${timestamp}.${ext}`;
  const filepath = join(uploadDir, filename);

  await writeFile(filepath, buffer);

  return `/uploads/featured-products/${filename}`;
}

// Helper function to check if user is admin
async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'PHARMACIST'
  );
}

// GET - Fetch all featured products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    const products = await FeaturedProduct.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await FeaturedProduct.countDocuments(query);

    return NextResponse.json({
      success: true,
      count: products.length,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch featured products',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new featured product (Admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authentication
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let image = '';
    let title = '';
    let description = '';
    let link = '';
    let price: number | undefined;
    let originalPrice: number | undefined;
    let isActive = true;

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      link = (formData.get('link') as string) || '';
      price = formData.get('price')
        ? parseFloat(formData.get('price') as string)
        : undefined;
      originalPrice = formData.get('originalPrice')
        ? parseFloat(formData.get('originalPrice') as string)
        : undefined;
      isActive = formData.get('isActive') === 'true';

      if (!file || file.size === 0) {
        return NextResponse.json(
          { success: false, message: 'No image file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid file type. Only JPG, PNG, WEBP allowed.',
          },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'File size exceeds 5MB limit.' },
          { status: 400 }
        );
      }

      image = await saveUploadedFile(file);
    } else {
      // JSON mode
      const body = await request.json();
      title = body.title;
      description = body.description;
      link = body.link;
      price = body.price;
      originalPrice = body.originalPrice;
      isActive = body.isActive !== undefined ? body.isActive : true;
      image = body.image;

      if (!image) {
        return NextResponse.json(
          { success: false, message: 'Image URL is required' },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: title, description',
        },
        { status: 400 }
      );
    }

    // Validate with zod
    const validation = featuredProductSchema.safeParse({
      title,
      description,
      link,
      price,
      originalPrice,
      isActive,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.toString(),
        },
        { status: 400 }
      );
    }

    const newProduct = new FeaturedProduct({
      image,
      title,
      description,
      link: link || '/shop',
      price,
      originalPrice,
      isActive,
    });

    const savedProduct = await newProduct.save();

    return NextResponse.json({
      success: true,
      message: 'Featured product created successfully',
      data: {
        ...savedProduct.toObject(),
        _id: savedProduct._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating featured product:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create featured product',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update a featured product (Admin only)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authentication
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let image = '';
    let title = '';
    let description = '';
    let link = '';
    let price: number | undefined;
    let originalPrice: number | undefined;
    let isActive = true;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      link = (formData.get('link') as string) || '';
      price = formData.get('price')
        ? parseFloat(formData.get('price') as string)
        : undefined;
      originalPrice = formData.get('originalPrice')
        ? parseFloat(formData.get('originalPrice') as string)
        : undefined;
      isActive = formData.get('isActive') === 'true';

      if (file && file.size > 0) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Invalid file type. Only JPG, PNG, WEBP allowed.',
            },
            { status: 400 }
          );
        }
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: 'File size exceeds 5MB limit.' },
            { status: 400 }
          );
        }
        image = await saveUploadedFile(file);
      } else {
        // Keep existing image
        const existing = await FeaturedProduct.findById(id);
        if (!existing) {
          return NextResponse.json(
            { success: false, message: 'Product not found' },
            { status: 404 }
          );
        }
        image = existing.image;
      }
    } else {
      const body = await request.json();
      title = body.title;
      description = body.description;
      link = body.link;
      price = body.price;
      originalPrice = body.originalPrice;
      isActive = body.isActive;
      image = body.image;
    }

    const updatedProduct = await FeaturedProduct.findByIdAndUpdate(
      id,
      {
        image,
        title,
        description,
        link: link || '/shop',
        price,
        originalPrice,
        isActive,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Featured product updated successfully',
      data: {
        ...updatedProduct.toObject(),
        _id: updatedProduct._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating featured product:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update featured product',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a featured product (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authentication
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const deletedProduct = await FeaturedProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Featured product deleted successfully',
      data: { _id: deletedProduct._id.toString() },
    });
  } catch (error) {
    console.error('Error deleting featured product:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete featured product',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
