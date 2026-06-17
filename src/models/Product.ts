/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, models, Document, Types, Model } from 'mongoose';

export interface IProduct {
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: string;
  image: string;
  inStock: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  minStockLevel: number;
  pharmacy: Types.ObjectId;
  sku: string;
  manufacturer: string;
  requiresPrescription: boolean;
  isControlledSubstance: boolean;
  sideEffects?: string;
  dosage?: string;
  activeIngredients?: string;
  barcode: string;
  createdBy: Types.ObjectId;
  tags?: string[];
  expiryDate?: Date;
}

export interface IProductDocument extends IProduct, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  availableQuantity: number;
  isLowStock: boolean;
  profitMargin: number;

  // Instance methods
  reserveStock(quantity: number): Promise<boolean>;
  releaseStock(quantity: number): Promise<void>;
  updateStock(newStock: number): Promise<void>;
  sellStock(quantity: number): Promise<boolean>;
}

// Define interface for static methods
interface IProductModel extends Model<IProductDocument> {
  findLowStock(pharmacyId?: Types.ObjectId): Promise<IProductDocument[]>;
  findByCategory(
    category: string,
    pharmacyId?: Types.ObjectId
  ): Promise<IProductDocument[]>;
  findAvailable(pharmacyId?: Types.ObjectId): Promise<IProductDocument[]>;
}

const ProductSchema = new Schema<IProductDocument, IProductModel>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Prescription',
        'OTC',
        'Supplements',
        'Medical Devices',
        'Personal Care',
        'First Aid',
        'Baby Care',
        'Vitamins',
        'Other',
      ],
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: [0, 'Minimum stock level cannot be negative'],
    },
    pharmacy: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: [true, 'Pharmacy is required'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
      maxlength: [100, 'Manufacturer name cannot exceed 100 characters'],
    },
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
    isControlledSubstance: {
      type: Boolean,
      default: false,
    },
    sideEffects: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        'Side effects description cannot exceed 1000 characters',
      ],
    },
    dosage: {
      type: String,
      trim: true,
      maxlength: [500, 'Dosage information cannot exceed 500 characters'],
    },
    activeIngredients: {
      type: String,
      trim: true,
      maxlength: [500, 'Active ingredients cannot exceed 500 characters'],
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    expiryDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        const { _id, __v, ...rest } = ret;
        return {
          id: _id.toString(),
          ...rest,
        };
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

// Virtual for available quantity (stock - reserved)
ProductSchema.virtual('availableQuantity').get(function () {
  return Math.max(0, this.stockQuantity - this.reservedQuantity);
});

// Virtual for low stock status
ProductSchema.virtual('isLowStock').get(function () {
  return this.availableQuantity <= this.minStockLevel;
});

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function () {
  if (this.costPrice === 0) return 0;
  return ((this.price - this.costPrice) / this.costPrice) * 100;
});

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ pharmacy: 1 });
ProductSchema.index({ inStock: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ expiryDate: 1 });
ProductSchema.index({ requiresPrescription: 1 });
ProductSchema.index({ isControlledSubstance: 1 });

// Compound indexes
ProductSchema.index({ name: 1, pharmacy: 1 }, { unique: true });
ProductSchema.index({ barcode: 1, pharmacy: 1 }, { unique: true });
ProductSchema.index({ sku: 1, pharmacy: 1 }, { unique: true });

// Pre-save middleware to update inStock status
ProductSchema.pre('save', function (next) {
  // Update inStock based on available quantity
  this.inStock = this.availableQuantity > 0;

  // Ensure reserved quantity doesn't exceed stock
  if (this.reservedQuantity > this.stockQuantity) {
    this.reservedQuantity = this.stockQuantity;
  }

  next();
});

// Static methods
ProductSchema.statics.findLowStock = function (
  pharmacyId?: Types.ObjectId
): Promise<IProductDocument[]> {
  const query: any = {
    $expr: {
      $lte: [
        { $subtract: ['$stockQuantity', '$reservedQuantity'] },
        '$minStockLevel',
      ],
    },
  };

  if (pharmacyId) {
    query.pharmacy = pharmacyId;
  }

  return this.find(query).populate('pharmacy', 'name address');
};

ProductSchema.statics.findByCategory = function (
  category: string,
  pharmacyId?: Types.ObjectId
): Promise<IProductDocument[]> {
  const query: any = { category };
  if (pharmacyId) query.pharmacy = pharmacyId;
  return this.find(query).populate('pharmacy', 'name');
};

ProductSchema.statics.findAvailable = function (
  pharmacyId?: Types.ObjectId
): Promise<IProductDocument[]> {
  const query: any = {
    inStock: true,
    $expr: { $gt: [{ $subtract: ['$stockQuantity', '$reservedQuantity'] }, 0] },
  };

  if (pharmacyId) query.pharmacy = pharmacyId;

  return this.find(query).populate('pharmacy', 'name');
};

// Instance methods
ProductSchema.methods.reserveStock = async function (
  quantity: number
): Promise<boolean> {
  if (this.availableQuantity < quantity) {
    return false;
  }

  this.reservedQuantity += quantity;
  await this.save();
  return true;
};

ProductSchema.methods.releaseStock = async function (
  quantity: number
): Promise<void> {
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  await this.save();
};

ProductSchema.methods.updateStock = async function (
  newStock: number
): Promise<void> {
  this.stockQuantity = Math.max(0, newStock);
  this.inStock = this.availableQuantity > 0;
  await this.save();
};

ProductSchema.methods.sellStock = async function (
  quantity: number
): Promise<boolean> {
  if (this.availableQuantity < quantity) {
    return false;
  }

  this.stockQuantity -= quantity;
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  this.inStock = this.availableQuantity > 0;

  await this.save();
  return true;
};

// Type-safe model creation
let Product: IProductModel;

if (models.Product) {
  // Model already exists, use it
  Product = models.Product as IProductModel;
} else {
  // Create new model
  Product = model<IProductDocument, IProductModel>('Product', ProductSchema);
}

export default Product;
