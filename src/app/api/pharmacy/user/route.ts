/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

// Helper function to serialize product data for public users
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
        }
      : null,
    // Add calculated fields
    isLowStock: productObj.stockQuantity <= productObj.minStockLevel,
    // Remove sensitive information
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

// GET - Fetch products for public users (no authentication required)
export async function GET(request: NextRequest): Promise<Response> {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const pharmacyId = searchParams.get('pharmacy') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build query for public users - only show available products
    const query: any = {
      inStock: true,
      stockQuantity: { $gt: 0 },
    };

    // Search across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (pharmacyId) {
      query.pharmacy = pharmacyId;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sort configuration
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const productsRaw = await Product.find(query)
      .populate('pharmacy', 'name address contact') // Populate pharmacy info
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Serialize products for public consumption
    const products = productsRaw.map(product =>
      serializeProductForUser(product)
    );

    const total = await Product.countDocuments(query);

    const response: ApiResponse<{
      products: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
      filters?: {
        categories: string[];
        manufacturers: string[];
        priceRange: {
          min: number;
          max: number;
        };
      };
    }> = {
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        filters: {
          categories: await Product.distinct('category', query),
          manufacturers: await Product.distinct('manufacturer', query),
          priceRange: {
            min: await Product.findOne(query)
              .sort('price')
              .select('price')
              .then(p => p?.price || 0),
            max: await Product.findOne(query)
              .sort('-price')
              .select('price')
              .then(p => p?.price || 1000),
          },
        },
      },
      message: 'Products fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching products for users:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
