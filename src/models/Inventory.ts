import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  name: string;
  description?: string;
  category: string;
  sku: string;
  barcode?: string;
  quantity: number;
  lowStockThreshold: number;
  reorderLevel: number;
  reorderQuantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: Date;
  location?: string;
  notes?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  pharmacy: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
  deletedAt?: Date;
  deletedBy?: mongoose.Schema.Types.ObjectId;
}

const InventorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: [0, 'Reorder level cannot be negative'],
    },
    reorderQuantity: {
      type: Number,
      default: 25,
      min: [0, 'Reorder quantity cannot be negative'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    supplier: {
      type: String,
      trim: true,
    },
    batchNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'],
      default: 'IN_STOCK',
    },
    pharmacy: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: [true, 'Pharmacy is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for SKU uniqueness per pharmacy
InventorySchema.index({ sku: 1, pharmacy: 1 }, { unique: true });

// Compound index for barcode uniqueness per pharmacy (sparse index for optional field)
InventorySchema.index(
  { barcode: 1, pharmacy: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { barcode: { $exists: true } },
  }
);

// Index for common queries
InventorySchema.index({ pharmacy: 1, status: 1 });
InventorySchema.index({ pharmacy: 1, category: 1 });
InventorySchema.index({ pharmacy: 1, updatedAt: -1 });
InventorySchema.index({ expiryDate: 1 });

export default mongoose.models.Inventory ||
  mongoose.model<IInventory>('Inventory', InventorySchema);
