import mongoose from 'mongoose';
import { PRODUCT_CATEGORIES } from '../constants/productCategories.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    barcode: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: PRODUCT_CATEGORIES,
    },
    color: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ barcode: 1 }, { unique: false });
productSchema.index({ name: 'text', category: 1 });
productSchema.virtual('isLowStock').get(function isLowStock() {
  return this.quantity <= this.lowStockThreshold;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model('Product', productSchema);
