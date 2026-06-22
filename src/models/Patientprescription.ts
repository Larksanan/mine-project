import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescription extends Document {
  patientId: mongoose.Types.ObjectId;
  prescriptionNumber: string;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
    refills: number;
  }>;
  notes?: string;
  startDate: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  attachmentUrl?: string;
  uploadedByPatient: boolean;
  wantsDelivery: boolean;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postalCode?: string;
    phone: string;
  };
  delivery?: mongoose.Types.ObjectId;
  pharmaciesID?: mongoose.Types.ObjectId;
  sentTopharmacies: boolean;
  pharmaciesSentAt?: Date;
  pharmaciesStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FULFILLED';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    prescriptionNumber: {
      type: String,
      required: true,
      unique: true,
    },
    diagnosis: {
      type: String,
      required: true,
    },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String },
        quantity: { type: Number, required: true, default: 1 },
        refills: { type: Number, required: true, default: 0 },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    attachmentUrl: {
      type: String,
    },
    uploadedByPatient: {
      type: Boolean,
      default: false,
    },
    wantsDelivery: {
      type: Boolean,
      default: false,
    },
    deliveryAddress: {
      line1: { type: String },
      line2: { type: String, default: '' },
      city: { type: String },
      postalCode: { type: String, default: '' },
      phone: { type: String },
    },
    delivery: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    pharmaciesID: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
    },
    sentTopharmacies: {
      type: Boolean,
      default: false,
    },
    pharmaciesSentAt: {
      type: Date,
    },
    pharmaciesStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'FULFILLED'],
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

// Create indexes (remove duplicate index warning)
PrescriptionSchema.index({ patientId: 1, status: 1 });
PrescriptionSchema.index({ patientId: 1, isActive: 1 });

export default mongoose.models.Patientprescription ||
  mongoose.model<IPrescription>('Patientprescription', PrescriptionSchema);
