/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { Types } from 'mongoose';

interface CartItemRequest {
  _id: string;
  quantity: number;
}

interface InsufficientStockItem {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

interface PharmacyAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface PharmacyData {
  _id: Types.ObjectId;
  name: string;
  address: PharmacyAddress | string;
  contact?: string;
  phone?: string;
  email?: string;
}

interface ProductData {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  inStock: boolean;
  stockQuantity: number;
  manufacturer: string;
  requiresPrescription: boolean;
  sku: string;
  isLowStock: boolean;
  pharmacy?: PharmacyData | Types.ObjectId;
}

interface CartValidationResult {
  valid: boolean;
  unavailableItems: string[];
  outOfStockItems: string[];
  insufficientStockItems: InsufficientStockItem[];

  validItems: any[];
  totalPrice: number;
}

/**
 * POST /api/products/user/my-cart
 * Validates cart items and returns full product details
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { items } = body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cart items are required' },
        { status: 400 }
      );
    }

    // Validate cart items format
    const isValidFormat = items.every(
      (item: any) =>
        item._id &&
        typeof item._id === 'string' &&
        item.quantity &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
    );

    if (!isValidFormat) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid cart item format. Each item must have _id and quantity',
        },
        { status: 400 }
      );
    }

    // Extract product IDs
    const productIds = items.map((item: CartItemRequest) => item._id);

    // Fetch all products from database
    const products = await Product.find({
      _id: { $in: productIds.map(id => new Types.ObjectId(id)) },
    })
      .populate<{ pharmacy: PharmacyData }>(
        'pharmacy',
        'name address contact phone email'
      )
      .lean();

    // Create a map for quick lookup
    const productMap = new Map(
      products.map(product => [product._id.toString(), product])
    );

    // Initialize validation result
    const validationResult: CartValidationResult = {
      valid: true,
      unavailableItems: [],
      outOfStockItems: [],
      insufficientStockItems: [],
      validItems: [],
      totalPrice: 0,
    };

    // Validate each cart item
    for (const cartItem of items) {
      const product = productMap.get(cartItem._id) as ProductData | undefined;

      // Product not found
      if (!product) {
        validationResult.valid = false;
        validationResult.unavailableItems.push(cartItem._id);
        continue;
      }

      // Product out of stock
      if (!product.inStock || product.stockQuantity === 0) {
        validationResult.valid = false;
        validationResult.outOfStockItems.push(product.name);
        continue;
      }

      // Insufficient stock
      if (product.stockQuantity < cartItem.quantity) {
        validationResult.valid = false;
        validationResult.insufficientStockItems.push({
          productId: product._id.toString(),
          name: product.name,
          requested: cartItem.quantity,
          available: product.stockQuantity,
        });
        continue;
      }

      // Valid item - add to valid items list
      const itemTotal = product.price * cartItem.quantity;
      validationResult.totalPrice += itemTotal;

      // Check if pharmacy is populated (Object vs ObjectId)
      let pharmacyData = null;

      if (product.pharmacy) {
        // Check if pharmacy is populated object or just ObjectId
        if (product.pharmacy instanceof Types.ObjectId) {
          // It's just an ObjectId, not populated
          pharmacyData = {
            id: product.pharmacy.toString(),
            name: 'Unknown Pharmacy',
            address: 'Address not available',
          };
        } else {
          // It's a populated pharmacy object
          const pharmacy = product.pharmacy as PharmacyData;
          pharmacyData = {
            id: pharmacy._id.toString(),
            name: pharmacy.name,
            address: pharmacy.address,
            contact: pharmacy.contact || null,
            phone: pharmacy.phone || null,
            email: pharmacy.email || null,
          };
        }
      }

      // Transform product data for response
      const transformedProduct = {
        _id: product._id.toString(),
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        images: product.images || [],
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        manufacturer: product.manufacturer,
        requiresPrescription: product.requiresPrescription,
        sku: product.sku,
        isLowStock: product.isLowStock,
        quantity: cartItem.quantity,
        itemTotal: itemTotal,
        pharmacy: pharmacyData,
      };

      validationResult.validItems.push(transformedProduct);
    }

    // Prepare response data
    const responseData = {
      items: validationResult.validItems,
      validation: {
        valid: validationResult.valid,
        unavailableItems: validationResult.unavailableItems,
        outOfStockItems: validationResult.outOfStockItems,
        insufficientStockItems: validationResult.insufficientStockItems,
      },
      summary: {
        totalItems: validationResult.validItems.length,
        totalPrice: parseFloat(validationResult.totalPrice.toFixed(2)),
        hasUnavailableItems: validationResult.unavailableItems.length > 0,
        hasOutOfStockItems: validationResult.outOfStockItems.length > 0,
        hasInsufficientStock:
          validationResult.insufficientStockItems.length > 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: validationResult.valid
        ? 'Cart validated successfully'
        : 'Some items in your cart have issues',
    });
  } catch (error: any) {
    console.error('Error validating cart:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to validate cart',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/user/my-cart
 * Get cart item details by product IDs (using query params)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { success: false, message: 'Product IDs are required' },
        { status: 400 }
      );
    }

    // Parse comma-separated IDs
    const productIds = idsParam
      .split(',')
      .filter(id => id.trim().length === 24);

    if (productIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid product IDs provided' },
        { status: 400 }
      );
    }

    // Fetch products with proper typing
    const products = await Product.find({
      _id: { $in: productIds.map(id => new Types.ObjectId(id)) },
    })
      .populate<{ pharmacy: PharmacyData }>(
        'pharmacy',
        'name address contact phone email'
      )
      .lean();

    // Transform products for response
    const transformedProducts = products.map(product => {
      let pharmacyData = null;

      if (product.pharmacy) {
        // Check if pharmacy is populated object or just ObjectId
        if (product.pharmacy instanceof Types.ObjectId) {
          // It's just an ObjectId, not populated
          pharmacyData = {
            id: product.pharmacy.toString(),
            name: 'Unknown Pharmacy',
            address: 'Address not available',
          };
        } else {
          // It's a populated pharmacy object
          const pharmacy = product.pharmacy as PharmacyData;
          pharmacyData = {
            id: pharmacy._id.toString(),
            name: pharmacy.name,
            address: pharmacy.address,
            contact: pharmacy.contact || null,
            phone: pharmacy.phone || null,
            email: pharmacy.email || null,
          };
        }
      }

      return {
        _id: product._id.toString(),
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        images: product.image || [],
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        manufacturer: product.manufacturer,
        requiresPrescription: product.requiresPrescription,
        sku: product.sku,
        isLowStock: product.isLowStock,
        pharmacy: pharmacyData,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      message: 'Cart items fetched successfully',
    });
  } catch (error: any) {
    console.error('Error fetching cart items:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch cart items',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
