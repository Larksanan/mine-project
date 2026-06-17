/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import Pharmacy from '@/models/Pharmacy';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

// POST - Create a new product
export async function POST(request: NextRequest): Promise<Response> {
  console.log('POST /api/products - Starting request processing');

  try {
    const session = await getServerSession(authOptions);
    console.log(
      'Session:',
      session?.user?.email ? 'User found' : 'No user session'
    );

    if (!session?.user?.email) {
      console.log('Unauthorized: No user session');
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Unauthorized access',
        error: 'You must be logged in to create a product',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    await connectDB();
    console.log('Database connected');

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    console.log(
      'User found:',
      user ? `ID: ${user._id}, Role: ${user.role}` : 'No user found'
    );

    if (!user) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'User not found',
        error: 'Unable to verify user account',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if user has permission to create product
    if (!['ADMIN', 'PHARMACIST'].includes(user.role)) {
      console.log('Insufficient permissions. User role:', user.role);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Insufficient permissions',
        error: 'Only admins and pharmacists can create products',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));

    const {
      name,
      description,
      price,
      costPrice,
      category,
      image,
      inStock,
      stockQuantity,
      minStockLevel,
      pharmacy,
      sku,
      manufacturer,
      requiresPrescription,
      isControlledSubstance,
      sideEffects,
      dosage,
      activeIngredients,
      barcode,
      tags,
      expiryDate,
    } = body;

    // Validate required fields based on your schema
    console.log('Validating required fields...');

    // REQUIRED FIELDS according to your Product schema:
    // 1. name (required)
    // 2. description (required)
    // 3. price (required)
    // 4. category (required)
    // 5. image (required)
    // 6. pharmacy (required)
    // 7. manufacturer (required) - THIS IS MISSING IN YOUR FORM!
    // 8. sku (required)
    // 9. barcode (required) - THIS IS MISSING IN YOUR FORM!
    // 10. createdBy is added automatically

    const requiredFields = [
      { field: 'name', value: name, label: 'Product name' },
      { field: 'description', value: description, label: 'Description' },
      { field: 'price', value: price, label: 'Price' },
      { field: 'category', value: category, label: 'Category' },
      { field: 'image', value: image, label: 'Image' },
      { field: 'pharmacy', value: pharmacy, label: 'Pharmacy' },
      { field: 'manufacturer', value: manufacturer, label: 'Manufacturer' },
      { field: 'sku', value: sku, label: 'SKU' },
      { field: 'barcode', value: barcode, label: 'Barcode' },
    ];

    const missingFields = requiredFields
      .map(item => ({
        ...item,
        isMissing:
          item.value === undefined || item.value === null || item.value === '',
      }))
      .filter(item => item.isMissing);

    if (missingFields.length > 0) {
      console.log(
        'Missing fields:',
        missingFields.map(f => f.field)
      );
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Missing required fields',
        error: `The following fields are required: ${missingFields.map(f => f.label).join(', ')}`,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate price
    console.log('Validating price...');
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      console.log('Invalid price:', price);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid price',
        error: `Price must be a number greater than 0. Received: ${price} (type: ${typeof price})`,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate stock quantity
    console.log('Validating stock quantity...');
    const stockQuantityNum = parseInt(stockQuantity);
    if (isNaN(stockQuantityNum) || stockQuantityNum < 0) {
      console.log('Invalid stock quantity:', stockQuantity);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid stock quantity',
        error: `Stock quantity must be a non-negative integer. Received: ${stockQuantity} (type: ${typeof stockQuantity})`,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate cost price
    console.log('Validating cost price...');
    const costPriceNum = costPrice ? parseFloat(costPrice) : 0;
    if (isNaN(costPriceNum) || costPriceNum < 0) {
      console.log('Invalid cost price:', costPrice);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid cost price',
        error: 'Cost price must be a non-negative number',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate min stock level
    console.log('Validating min stock level...');
    const minStockLevelNum = parseInt(minStockLevel) || 10;
    if (isNaN(minStockLevelNum) || minStockLevelNum < 0) {
      console.log('Invalid min stock level:', minStockLevel);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Invalid min stock level',
        error: 'Min stock level must be a non-negative integer',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Resolve pharmacy input to a valid ObjectId
    console.log('Resolving pharmacy:', pharmacy);
    let pharmacyId: any = pharmacy;
    if (!/^[0-9a-fA-F]{24}$/.test(String(pharmacy))) {
      console.log('Pharmacy is not a valid ObjectId, looking up by name/slug');
      const foundPharmacy = await Pharmacy.findOne({
        $or: [{ slug: pharmacy }, { name: pharmacy }],
      });

      if (!foundPharmacy) {
        console.log('Pharmacy not found:', pharmacy);
        const errorResponse: ApiResponse<null> = {
          success: false,
          message: 'Invalid pharmacy',
          error: 'Provided pharmacy does not exist',
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
      pharmacyId = foundPharmacy._id;
      console.log('Found pharmacy:', foundPharmacy.name, 'ID:', pharmacyId);
    } else {
      // Verify pharmacy exists
      const pharmacyExists = await Pharmacy.findById(pharmacyId);
      if (!pharmacyExists) {
        console.log('Pharmacy ID not found in database:', pharmacyId);
        const errorResponse: ApiResponse<null> = {
          success: false,
          message: 'Invalid pharmacy',
          error: 'Provided pharmacy ID does not exist',
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    // Check for duplicate products
    console.log('Checking for duplicate products...');

    // Check duplicate name in same pharmacy
    const existingByName = await Product.findOne({
      name: name.trim(),
      pharmacy: pharmacyId,
    });

    if (existingByName) {
      console.log('Duplicate product name found:', existingByName.name);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Product already exists',
        error: 'A product with this name already exists in this pharmacy',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Check duplicate SKU in same pharmacy
    const existingBySku = await Product.findOne({
      sku: sku.trim().toUpperCase(),
      pharmacy: pharmacyId,
    });

    if (existingBySku) {
      console.log('Duplicate SKU found:', existingBySku.sku);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Duplicate SKU',
        error: 'A product with this SKU already exists in this pharmacy',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Check duplicate barcode in same pharmacy
    const existingByBarcode = await Product.findOne({
      barcode: barcode.trim(),
      pharmacy: pharmacyId,
    });

    if (existingByBarcode) {
      console.log('Duplicate barcode found:', existingByBarcode.barcode);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Duplicate barcode',
        error: 'A product with this barcode already exists in this pharmacy',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Prepare product data according to your schema
    console.log('Preparing product data...');
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      costPrice: costPriceNum,
      category: category.trim(),
      image: image.trim(),
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      stockQuantity: stockQuantityNum,
      reservedQuantity: 0,
      minStockLevel: minStockLevelNum,
      pharmacy: pharmacyId,
      sku: sku.trim().toUpperCase(),
      manufacturer: manufacturer.trim(),
      requiresPrescription: Boolean(requiresPrescription) || false,
      isControlledSubstance: Boolean(isControlledSubstance) || false,
      sideEffects: sideEffects?.trim(),
      dosage: dosage?.trim(),
      activeIngredients: activeIngredients?.trim(),
      barcode: barcode.trim(),
      tags: tags ? tags.map((tag: string) => tag.trim().toLowerCase()) : [],
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      createdBy: user._id,
    };

    console.log('Product data prepared:', JSON.stringify(productData, null, 2));

    // Create new product
    console.log('Creating new product...');
    const newProduct = new Product(productData);

    console.log('Saving product to database...');
    await newProduct.save();
    console.log('Product saved successfully, ID:', newProduct._id);

    // Populate fields for response
    await newProduct.populate('createdBy', 'name email role');
    await newProduct.populate('pharmacy', 'name address');

    const response: ApiResponse<typeof newProduct> = {
      success: true,
      data: newProduct,
      message: 'Product created successfully',
    };

    console.log('Returning success response');
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);

    if (error.errors) {
      console.error(
        'Validation errors:',
        JSON.stringify(error.errors, null, 2)
      );
    }

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.message);
      const keyValue = error.keyValue
        ? JSON.stringify(error.keyValue)
        : 'unknown';
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Duplicate key error',
        error: `A product with this SKU, barcode, or name already exists in this pharmacy. Duplicate value: ${keyValue}`,
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      console.error('Validation errors:', validationErrors);
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: 'Validation error',
        error: validationErrors.join(', '),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET - Fetch products with filtering
export async function GET(request: NextRequest): Promise<Response> {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const pharmacy = searchParams.get('pharmacy') || '';
    const inStock = searchParams.get('inStock');

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (pharmacy) {
      query.pharmacy = pharmacy;
    }

    if (inStock !== null) {
      query.inStock = inStock === 'true';
    }

    // Execute query with population
    const products = await Product.find(query)
      .populate('createdBy', 'name email role')
      .populate('pharmacy', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(query);

    const response: ApiResponse<{
      products: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
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
      },
      message: 'Products fetched successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
