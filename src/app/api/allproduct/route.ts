import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({}).sort({ createdAt: -1 });

    console.log(`Found ${products.length} products`);

    const transformedProducts = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        _id: productObj._id.toString(),
        pharmacy: productObj.pharmacy?.toString(),
        createdBy: productObj.createdBy?.toString(),
      };
    });

    return NextResponse.json({
      success: true,
      count: transformedProducts.length,
      data: transformedProducts,
    });
  } catch (error) {
    console.error('Error fetching products:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch products',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
