/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, {
  Schema,
  model,
  models,
  Document,
  Types,
  Model,
} from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  prescriptionVerified: boolean;
  verifiedBy?: Types.ObjectId;
  prescriptionImage?: string;
}

export interface IOrder {
  orderNumber: string;
  customer?: Types.ObjectId;
  pharmacy?: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'insurance';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: string;
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  driver?: Types.ObjectId;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  prescriptionImages?: string[];
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdBy?: Types.ObjectId; // Optional for guest orders
  updatedBy?: Types.ObjectId;
}

export interface IOrderDocument extends IOrder, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IOrderModel extends Model<IOrderDocument> {
  generateOrderNumber(): Promise<string>;
  findByCustomer(customerId: Types.ObjectId): Promise<IOrderDocument[]>;
  findByPharmacy(pharmacyId: Types.ObjectId): Promise<IOrderDocument[]>;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  prescriptionVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  prescriptionImage: {
    type: String,
  },
});

const OrderSchema = new Schema<IOrderDocument, IOrderModel>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      validate: {
        validator: (v: string) =>
          v === null || mongoose.Types.ObjectId.isValid(v),
        message: (props: any) => `${props.value} is not a valid User ID!`,
      },
    },
    pharmacy: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: false, // ✅ Changed to false - extracted from products
    },
    items: [OrderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'insurance'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Delivery address cannot exceed 500 characters'],
    },
    shippingInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        required: true,
        trim: true,
      },
      instructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Instructions cannot exceed 500 characters'],
      },
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    estimatedDelivery: {
      type: Date,
    },
    actualDelivery: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    prescriptionImages: [
      {
        type: String,
      },
    ],
    stripeSessionId: {
      type: String,
    },
    stripePaymentIntentId: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // ✅ Changed to false for guest orders
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
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

// Virtual for formatted delivery address
OrderSchema.virtual('formattedAddress').get(function () {
  return `${this.shippingInfo.address}, ${this.shippingInfo.city} ${this.shippingInfo.postalCode}`;
});

// Indexes
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ pharmacy: 1, status: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ 'shippingInfo.email': 1 });
OrderSchema.index({ 'shippingInfo.phone': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'items.product': 1 });
OrderSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });
OrderSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });

// Static Methods
OrderSchema.statics.generateOrderNumber = async function (): Promise<string> {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');

  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^ORD-${dateString}`),
  }).sort({ orderNumber: -1 });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]) || 0;
    sequence = lastSequence + 1;
  }

  return `ORD-${dateString}-${sequence.toString().padStart(4, '0')}`;
};

OrderSchema.statics.findByCustomer = function (
  customerId: Types.ObjectId
): Promise<IOrderDocument[]> {
  return this.find({ customer: customerId })
    .populate('pharmacy', 'name address phone')
    .populate('items.product', 'name image')
    .sort({ createdAt: -1 })
    .exec();
};

OrderSchema.statics.findByPharmacy = function (
  pharmacyId: Types.ObjectId
): Promise<IOrderDocument[]> {
  return this.find({ pharmacy: pharmacyId })
    .populate('customer', 'name email phone')
    .populate('items.product', 'name')
    .sort({ createdAt: -1 })
    .exec();
};

// Instance Methods
OrderSchema.methods.updateStatus = async function (
  status: IOrder['status'],
  updatedBy?: Types.ObjectId
): Promise<IOrderDocument> {
  this.status = status;
  if (updatedBy) {
    this.updatedBy = updatedBy;
  }
  return this.save();
};

OrderSchema.methods.updatePaymentStatus = async function (
  paymentStatus: IOrder['paymentStatus'],
  stripeData?: { sessionId?: string; paymentIntentId?: string }
): Promise<IOrderDocument> {
  this.paymentStatus = paymentStatus;
  if (stripeData?.sessionId) this.stripeSessionId = stripeData.sessionId;
  if (stripeData?.paymentIntentId)
    this.stripePaymentIntentId = stripeData.paymentIntentId;
  return this.save();
};

// Pre-save middleware
OrderSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'delivered') {
    this.actualDelivery = new Date();
  }
  next();
});

const Order = (models.Order ||
  model<IOrderDocument, IOrderModel>('Order', OrderSchema)) as IOrderModel;

export default Order;
