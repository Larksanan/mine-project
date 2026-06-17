/* eslint-disable @typescript-eslint/no-unused-vars */
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

    let pharmacyData = { id: '', name: '', address: '' };

    if (productObj.pharmacy) {
      if (
        typeof productObj.pharmacy === 'object' &&
        productObj.pharmacy !== null
      ) {
        pharmacyData = {
          id: safeToString(productObj.pharmacy._id),
          name: String(productObj.pharmacy.name || ''),
          address: String(productObj.pharmacy.address || ''),
        };
      } else if (typeof productObj.pharmacy === 'string') {
        pharmacyData = {
          id: productObj.pharmacy,
          name: '',
          address: '',
        };
      }
    }

    const productId = safeToString(productObj._id);
    const stockQuantity = safeToNumber(productObj.stockQuantity, 0);
    const minStockLevel = safeToNumber(productObj.minStockLevel, 10);

    return {
      _id: productId,
      id: productId,
      name: String(productObj.name || 'Unnamed Product'),
      description: String(productObj.description || ''),
      price: safeToNumber(productObj.price, 0),
      category: String(productObj.category || 'Uncategorized'),
      image: String(productObj.image || '/placeholder-medicine.jpg'),
      inStock: Boolean(productObj.inStock),
      stockQuantity: stockQuantity,
      manufacturer: String(productObj.manufacturer || 'Unknown'),
      requiresPrescription: Boolean(productObj.requiresPrescription),
      sku: String(productObj.sku || 'N/A'),
      pharmacy: pharmacyData,
      isLowStock: stockQuantity <= minStockLevel,
      createdAt: productObj.createdAt,
      updatedAt: productObj.updatedAt,
    };
  } catch (err) {
    console.error('Error serializing product:', err);
    return {
      _id: safeToString(product?._id),
      id: safeToString(product?._id),
      name: 'Product',
      description: '',
      price: 0,
      category: 'Uncategorized',
      image: '/placeholder-medicine.jpg',
      inStock: false,
      stockQuantity: 0,
      manufacturer: 'Unknown',
      requiresPrescription: false,
      sku: 'N/A',
      pharmacy: { id: '', name: '', address: '' },
      isLowStock: true,
      createdAt: null,
      updatedAt: null,
    };
  }
};

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await connectDB();
    console.log('✅ [Step 1] Database connected successfully');

    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';
    console.log('Fetch All:', fetchAll);

    if (!Product) {
      throw new Error('Product model is not defined');
    }

    const query: any = {};
    console.log('Query built:', JSON.stringify(query));

    const total = await Product.countDocuments(query);
    console.log('Total products found:', total);

    if (total === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: 'No products found in database',
        },
        { status: 200 }
      );
    }

    const productsRaw = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    console.log('Fetched', productsRaw.length, 'raw products');

    const products = productsRaw
      .map((product: any) => {
        try {
          const id = product._id?.toString() || '';
          return {
            _id: id,
            id: id,
            name: String(product.name || 'Unnamed Product'),
            description: String(product.description || ''),
            price: Number(product.price) || 0,
            category: String(product.category || 'Uncategorized'),
            image: String(product.image || '/placeholder-medicine.jpg'),
            inStock: Boolean(product.inStock),
            stockQuantity: Number(product.stockQuantity) || 0,
            manufacturer: String(product.manufacturer || 'Unknown'),
            requiresPrescription: Boolean(product.requiresPrescription),
            sku: String(product.sku || 'N/A'),
            pharmacy: {
              id: product.pharmacy?.toString() || '',
              name: '',
              address: '',
            },
            isLowStock: (Number(product.stockQuantity) || 0) <= 10,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          };
        } catch (err) {
          console.error(' Error serializing product:', product._id, err);
          return null;
        }
      })
      .filter((p: any) => p !== null);

    console.log('Serialized', products.length, 'products');

    const response = {
      success: true,
      data: products,
      message: `${products.length} products fetched successfully`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch products',
        error: error?.message || 'Unknown error occurred',
        errorDetails: {
          name: error?.name,
          message: error?.message,
          stack:
            process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
