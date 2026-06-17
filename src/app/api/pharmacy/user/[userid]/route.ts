/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/option';
import Order from '../../../../../models/order';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

const serializeProductForUser = (product: any) => {
  const productObj = product.toObject ? product.toObject() : product;

  return {
    id: productObj._id?.toString(),
    name: productObj.name,
    description: productObj.description,
    price: productObj.price,
    category: productObj.category,
    image: productObj.image,
    inStock: productObj.inStock,
    stockQuantity: productObj.stockQuantity,
    manufacturer: productObj.manufacturer,
    requiresPrescription: productObj.requiresPrescription,
    sku: productObj.sku,
    pharmacy: productObj.pharmacy
      ? {
          id: productObj.pharmacy._id?.toString(),
          name: productObj.pharmacy.name,
          address: productObj.pharmacy.address,
          contact: productObj.pharmacy.contact,
        }
      : null,

    isLowStock: productObj.stockQuantity <= productObj.minStockLevel,

    costPrice: undefined,
    minStockLevel: undefined,
    reservedQuantity: undefined,
    createdBy: undefined,
    isControlledSubstance: undefined,
    sideEffects: undefined,
    dosage: undefined,
    activeIngredients: undefined,
    barcode: undefined,
    tags: undefined,
    expiryDate: undefined,
    createdAt: productObj.createdAt,
    updatedAt: productObj.updatedAt,
  };
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userid: string }> }
): Promise<Response> {
  try {
    await connectDB();

    const { userid } = await context.params;

    if (!userid || userid.length !== 24) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid product ID format',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const product = await Product.findById(userid)
      .populate('pharmacy', 'name address contact')
      .lean();

    if (!product) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product not found',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (!product.inStock || product.stockQuantity <= 0) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product is currently unavailable',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const serializedProduct = serializeProductForUser(product);

    const response: ApiResponse<any> = {
      success: true,
      data: serializedProduct,
      message: 'Product fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching product for user:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userid: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userid } = await context.params;

    const body = await request.json();
    const { status, paymentStatus, driver, estimatedDelivery, notes } = body;

    const order = await Order.findByIdAndUpdate(
      userid,
      {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(driver && { driver }),
        ...(estimatedDelivery && { estimatedDelivery }),
        ...(notes && { notes }),
      },
      { new: true }
    )
      .populate('customer', 'name email phone')
      .populate('pharmacy', 'name address phone')
      .populate('items.product', 'name price image requiresPrescription')
      .populate('createdBy', 'name email');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userid: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userid } = await context.params;

    const order = await Order.findByIdAndDelete(userid)
      .populate('customer', 'name email phone')
      .populate('pharmacy', 'name address phone')
      .populate('items.product', 'name price image requiresPrescription')
      .populate('createdBy', 'name email');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
