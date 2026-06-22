import mongoose, { Schema, Document } from 'mongoose';

export interface IDelivery extends Document {
  prescriptionId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  pharmaciesID: mongoose.Types.ObjectId;
  address: {
    line1: string;
    line2?: string;
    city: string;
    postalCode?: string;
    phone: string;
  };
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';
  deliveryFee: number;
  trackingNumber?: string;
  notes?: string;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    pharmaciesID: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      postalCode: { type: String, default: '' },
      phone: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'PENDING',
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    trackingNumber: {
      type: String,
      sparse: true, // This allows multiple null values
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Remove unique index if it exists, or keep but with sparse option
// If you already have a unique index, drop it and recreate with sparse
// You can run this in MongoDB shell:
// db.deliveries.dropIndex("trackingNumber_1")

// Export the model
export default mongoose.models.Delivery ||
  mongoose.model<IDelivery>('Delivery', DeliverySchema);
