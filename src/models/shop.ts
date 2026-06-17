import { Schema, model, models } from 'mongoose';

const shopSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      // REMOVE THIS: index: true, // ← This causes duplicate with schema.index()
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ONLY define indexes here, NOT in the field definitions above
// shopSchema.index({ email: 1 }); // ← COMMENT THIS OUT if you don't need email index

const Shop = models.Shop || model('Shop', shopSchema);
export default Shop;
