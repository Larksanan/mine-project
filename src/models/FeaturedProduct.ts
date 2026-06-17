import mongoose from 'mongoose';

const FeaturedProductSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    link: {
      type: String,
      default: '/shop',
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
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

// Create indexes for better query performance
FeaturedProductSchema.index({ isActive: 1 });
FeaturedProductSchema.index({ createdAt: -1 });
FeaturedProductSchema.index({ title: 'text' });

export default mongoose.models.FeaturedProduct ||
  mongoose.model('FeaturedProduct', FeaturedProductSchema);
