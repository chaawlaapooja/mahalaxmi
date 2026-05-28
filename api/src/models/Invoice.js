import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    barcode: { type: String, trim: true },
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: [(v) => v.length > 0, 'At least one item required'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ['none', 'percent', 'fixed'], default: 'none' },
    discountValue: { type: Number, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    taxRate: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    paymentMode: { type: String, enum: ['cash', 'upi', 'credit_debit_card'], default: 'cash' },
    paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'paid' },
    status: { type: String, enum: ['draft', 'paid', 'cancelled'], default: 'paid' },
    billedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ customer: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
