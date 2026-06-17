/* eslint-disable prefer-const */
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IPharmacy {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email?: string;
    emergencyPhone?: string;
  };
  operatingHours: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  services: string[];
  pharmacists?: Array<{
    userId: Types.ObjectId; // ADDED: Reference to User
    name: string;
    licenseNumber: string;
  }>;
  inventory?: {
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  is24Hours: boolean;
  description?: string;
  createdBy: Types.ObjectId;
  website?: string;
}

export interface IPharmacyDocument extends IPharmacy, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  isOpen: boolean;
  formattedHours: string;

  // Methods
  isActive(): boolean;
  hasService(service: string): boolean;
}

const PharmacySchema = new Schema<IPharmacyDocument>(
  {
    name: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
      minlength: [2, 'Pharmacy name must be at least 2 characters'],
      maxlength: [100, 'Pharmacy name cannot exceed 100 characters'],
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
        maxlength: [100, 'Street address cannot exceed 100 characters'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters'],
      },
      zipCode: {
        type: String,
        required: [true, 'ZIP code is required'],
        trim: true,
        validate: {
          validator: function (zip: string) {
            return /^[A-Z0-9\-\s]{3,10}$/i.test(zip);
          },
          message: 'Please enter a valid ZIP/postal code',
        },
        maxlength: [10, 'ZIP code cannot exceed 10 characters'],
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'Sri Lanka',
        trim: true,
      },
    },
    contact: {
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'],
      },
      email: {
        type: String,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please enter a valid email',
        ],
      },
      emergencyPhone: {
        type: String,
        match: [/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'],
      },
    },
    operatingHours: {
      Monday: {
        type: String,
        default: '9:00 AM - 6:00 PM',
        trim: true,
      },
      Tuesday: {
        type: String,
        default: '9:00 AM - 6:00 PM',
        trim: true,
      },
      Wednesday: {
        type: String,
        default: '9:00 AM - 6:00 PM',
        trim: true,
      },
      Thursday: {
        type: String,
        default: '9:00 AM - 6:00 PM',
        trim: true,
      },
      Friday: {
        type: String,
        default: '9:00 AM - 6:00 PM',
        trim: true,
      },
      Saturday: {
        type: String,
        default: '9:00 AM - 2:00 PM',
        trim: true,
      },
      Sunday: {
        type: String,
        default: 'Closed',
        trim: true,
      },
    },
    services: [
      {
        type: String,
        trim: true,
      },
    ],
    pharmacists: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true, // ADDED: Required user reference
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        licenseNumber: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
        },
      },
    ],
    inventory: {
      totalProducts: {
        type: Number,
        default: 0,
        min: 0,
      },
      lowStockItems: {
        type: Number,
        default: 0,
        min: 0,
      },
      outOfStockItems: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
      default: 'ACTIVE',
    },
    is24Hours: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+\..+$/, 'Please enter a valid website URL'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        // Use destructuring to exclude _id and __v
        const { _id, __v, ...rest } = ret;

        // Add id field
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = {
          id: _id.toString(),
          ...rest,
        };

        // Ensure createdBy is properly serialized if populated
        if (
          result.createdBy &&
          typeof result.createdBy === 'object' &&
          result.createdBy._id
        ) {
          result.createdBy = {
            id: result.createdBy._id.toString(),
            name: result.createdBy.name,
            email: result.createdBy.email,
            role: result.createdBy.role,
          };
        }

        return result;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret) {
        // Use destructuring to exclude _id and __v
        const { _id, __v, ...rest } = ret;
        return {
          id: _id.toString(),
          ...rest,
        };
      },
    },
  }
);

// Virtual for checking if pharmacy is currently open
PharmacySchema.virtual('isOpen').get(function (this: IPharmacyDocument) {
  try {
    if (this.is24Hours) {
      return true;
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', {
      weekday: 'long',
    });

    const todayHours =
      this.operatingHours[currentDay as keyof typeof this.operatingHours];

    if (!todayHours || todayHours === 'Closed') {
      return false;
    }

    const [openTime, closeTime] = todayHours.split(' - ');

    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = parseTime(openTime);
    const closeMinutes = parseTime(closeTime);

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } catch (error) {
    console.error('Error calculating isOpen:', error);
    return false;
  }
});

// Virtual for formatted operating hours
PharmacySchema.virtual('formattedHours').get(function (
  this: IPharmacyDocument
) {
  if (this.is24Hours) {
    return '24/7';
  }

  const currentDay = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  });
  return (
    this.operatingHours[currentDay as keyof typeof this.operatingHours] ||
    'Closed'
  );
});

// Method to check if pharmacy is active
PharmacySchema.methods.isActive = function (this: IPharmacyDocument): boolean {
  return this.status === 'ACTIVE';
};

// Method to check if pharmacy offers a specific service
PharmacySchema.methods.hasService = function (
  this: IPharmacyDocument,
  service: string
): boolean {
  return this.services.includes(service);
};

// Indexes for better query performance
PharmacySchema.index({
  name: 'text',
  'address.city': 'text',
  'address.state': 'text',
});
PharmacySchema.index({ status: 1 });
PharmacySchema.index({ createdBy: 1 });
PharmacySchema.index({ is24Hours: 1 });
PharmacySchema.index({ createdAt: -1 });
PharmacySchema.index({ 'pharmacists.licenseNumber': 1 });
PharmacySchema.index({ 'pharmacists.userId': 1 }); // ADDED: Index for userId

// Static method to find active pharmacies
PharmacySchema.statics.findActive = function () {
  return this.find({ status: 'ACTIVE' });
};

// Static method to find pharmacies by service
PharmacySchema.statics.findByService = function (service: string) {
  return this.find({
    status: 'ACTIVE',
    services: { $in: [service] },
  });
};

// Static method to find 24/7 pharmacies
PharmacySchema.statics.find24Hours = function () {
  return this.find({
    status: 'ACTIVE',
    is24Hours: true,
  });
};

const Pharmacy =
  models.Pharmacy || model<IPharmacyDocument>('Pharmacy', PharmacySchema);

export default Pharmacy;
