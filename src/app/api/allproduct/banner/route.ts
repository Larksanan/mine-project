/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import { connectDB } from '@/lib/mongodb';
import banner from '@/models/banner';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Types
interface BannerData {
  image: string;
  title: string;
  description: string;
  link: string;
  isActive: boolean;
}

interface BannerDocument extends BannerData {
  _id: any;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: any;
  toObject(): any;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

async function saveUploadedFile(file: File): Promise<string> {
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'banners');

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const filename = `banner_${timestamp}.${ext}`;
  const filepath = join(uploadDir, filename);

  await writeFile(filepath, buffer);

  return `/uploads/banners/${filename}`;
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();

    const banners = await banner.find({}).sort({ createdAt: -1 });
    console.log(`Found ${banners.length} banners`);

    const transformedBanners = banners.map((bannerItem: BannerDocument) => {
      const bannerObj = bannerItem.toObject();
      return {
        ...bannerObj,
        _id: bannerObj._id.toString(),
        createdBy: bannerObj.createdBy?.toString(),
      };
    });

    return NextResponse.json({
      success: true,
      count: transformedBanners.length,
      data: transformedBanners,
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch banners',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();

    const contentType = request.headers.get('content-type') || '';
    let image: string = '';
    let title: string = '';
    let description: string = '';
    let link: string = '';
    let isActive: boolean = true;

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      title = (formData.get('title') as string) || '';
      link = (formData.get('link') as string) || '';
      isActive = formData.get('isActive') === 'true';
      description = (formData.get('description') as string) || '';

      if (!file || file.size === 0) {
        return NextResponse.json(
          { success: false, message: 'No image file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];
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
      // JSON / URL fallback
      const body = await request.json();
      image = body.image || '';
      title = body.title || '';
      link = body.link || '';
      isActive = body.isActive === true;
      description = body.description || '';

      const urlPattern: RegExp =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w .-]*)*\/?$/;
      if (image && !urlPattern.test(image)) {
        return NextResponse.json(
          { success: false, message: 'Invalid image URL format' },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!image || !title || !description || !link) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: image, title, description, link',
        },
        { status: 400 }
      );
    }

    const newBanner = new banner({ image, title, description, link, isActive });
    const savedBanner = await newBanner.save();

    return NextResponse.json({
      success: true,
      message: 'Banner created successfully',
      data: {
        ...savedBanner.toObject(),
        _id: savedBanner._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create banner',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Banner ID is required' },
        { status: 400 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let image: string = '';
    let title: string = '';
    let description: string = '';
    let link: string = '';
    let isActive: boolean = true;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      title = (formData.get('title') as string) || '';
      link = (formData.get('link') as string) || '';
      isActive = formData.get('isActive') === 'true';
      description = (formData.get('description') as string) || '';

      if (file && file.size > 0) {
        const allowedTypes: string[] = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];
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
        // Keep existing image if no new file provided
        const existing = await banner.findById(id);
        if (existing) {
          image = existing.image || '';
        } else {
          return NextResponse.json(
            { success: false, message: 'Banner not found' },
            { status: 404 }
          );
        }
      }
    } else {
      const body = await request.json();
      image = body.image || '';
      title = body.title || '';
      link = body.link || '';
      isActive = body.isActive === true;
      description = body.description || '';
    }

    // Validate required fields for update
    if (!title || !description || !link) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: title, description, link',
        },
        { status: 400 }
      );
    }

    const updatedBanner = await banner.findByIdAndUpdate(
      id,
      { image, title, description, link, isActive, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return NextResponse.json(
        { success: false, message: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Banner updated successfully',
      data: {
        ...updatedBanner.toObject(),
        _id: updatedBanner._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update banner',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Banner ID is required' },
        { status: 400 }
      );
    }

    const deletedBanner = await banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return NextResponse.json(
        { success: false, message: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully',
      data: { _id: deletedBanner._id.toString() },
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete banner',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
