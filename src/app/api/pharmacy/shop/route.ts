import { connectDB } from '@/lib/mongodb';
import shopModel from '@/models/shop';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await connectDB();
    console.log(' Database connection state:', db.connection.readyState);

    const shops = await shopModel.find({});
    console.log(`Found ${shops.length} shops`);

    return NextResponse.json({
      success: true,
      count: shops.length,
      data: shops,
    });
  } catch (error) {
    console.error('Error fetching shops:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch shops',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    console.log('Creating new shop:', body);

    const newShop = await shopModel.create(body);

    return NextResponse.json(
      {
        success: true,
        data: newShop,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating shop:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create shop',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
