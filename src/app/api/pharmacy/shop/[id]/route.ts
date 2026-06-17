import { connectDB } from '@/lib/mongodb';
import shopModel from '@/models/shop';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`Fetching shop with ID: ${id}`);

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid shop ID format',
        },
        { status: 400 }
      );
    }

    const db = await connectDB();
    console.log(' Database connection state:', db.connection.readyState);

    const shop = await shopModel.findById(id);

    if (!shop) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shop not found',
        },
        { status: 404 }
      );
    }

    console.log(` Found shop: ${shop.name}`);

    return NextResponse.json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error('Error fetching shop:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch shop',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`Updating shop with ID: ${id}`);

    // Validate MongoDB ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid shop ID format',
        },
        { status: 400 }
      );
    }

    const db = await connectDB();
    console.log(' Database connection state:', db.connection.readyState);

    const body = await request.json();

    console.log('Update data:', body);

    const updatedShop = await shopModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedShop) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shop not found',
        },
        { status: 404 }
      );
    }

    console.log(`Updated shop: ${updatedShop.name}`);

    return NextResponse.json({
      success: true,
      data: updatedShop,
    });
  } catch (error) {
    console.error('Error updating shop:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update shop',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await the params Promise

    console.log(`🗑️ Deleting shop with ID: ${id}`);

    // Validate MongoDB ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid shop ID format',
        },
        { status: 400 }
      );
    }

    const db = await connectDB();
    console.log('Database connection state:', db.connection.readyState);

    const deletedShop = await shopModel.findByIdAndDelete(id);

    if (!deletedShop) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shop not found',
        },
        { status: 404 }
      );
    }

    console.log(` Deleted shop: ${deletedShop.name}`);

    return NextResponse.json({
      success: true,
      message: 'Shop deleted successfully',
      data: deletedShop,
    });
  } catch (error) {
    console.error(' Error deleting shop:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete shop',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Optional: PATCH method for partial updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`🔧 Partially updating shop with ID: ${id}`);

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid shop ID format',
        },
        { status: 400 }
      );
    }

    const db = await connectDB();
    console.log('Database connection state:', db.connection.readyState);

    const body = await request.json();

    console.log(' Partial update data:', body);

    const updatedShop = await shopModel.findByIdAndUpdate(
      id,
      { $set: body },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedShop) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shop not found',
        },
        { status: 404 }
      );
    }

    console.log(`Partially updated shop: ${updatedShop.name}`);

    return NextResponse.json({
      success: true,
      data: updatedShop,
    });
  } catch (error) {
    console.error(' Error partially updating shop:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update shop',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
