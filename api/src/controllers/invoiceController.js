import { Invoice } from '../models/Invoice.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
};

const calculateTotals = (items, discountType, discountValue, taxRate) => {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = (subtotal * Math.min(discountValue, 100)) / 100;
  } else if (discountType === 'fixed') {
    discountAmount = Math.min(discountValue, subtotal);
  }
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * (taxRate || 0)) / 100;
  const total = afterDiscount + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
};

export const getInvoices = asyncHandler(async (req, res) => {
  const { customer, from, to } = req.query;
  const filter = {};

  if (customer) filter.customer = customer;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const invoices = await Invoice.find(filter)
    .populate('customer', 'name phone email')
    .populate('createdBy', 'name')
    .populate('billedBy', 'name role')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: invoices });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer')
    .populate('createdBy', 'name email')
    .populate('billedBy', 'name role')
    .populate('items.product');

  if (!invoice) throw new AppError('Invoice not found', 404);
  res.json({ success: true, data: invoice });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const {
    customer: customerId,
    items,
    discountType,
    discountValue,
    taxRate,
    notes,
    status,
    billedBy: billedById,
  } = req.body;

  const customer = await Customer.findById(customerId);
  if (!customer) throw new AppError('Customer not found', 404);

  const billedByUserId = billedById || req.user._id;
  const billedByUser = await User.findById(billedByUserId);
  if (!billedByUser) throw new AppError('Billed by user not found', 404);

  const invoiceItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new AppError(`Product not found: ${item.product}`, 404);
    if (product.quantity < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name} (${product.size})`, 400);
    }

    const unitPrice = item.unitPrice ?? product.price;
    invoiceItems.push({
      product: product._id,
      productName: product.name,
      barcode: product.barcode,
      color: product.color,
      size: product.size,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    });
  }

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals(
    invoiceItems,
    discountType || 'none',
    discountValue || 0,
    taxRate || 0
  );

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await Invoice.create({
    invoiceNumber,
    customer: customerId,
    items: invoiceItems,
    subtotal,
    discountType: discountType || 'none',
    discountValue: discountValue || 0,
    discountAmount,
    taxRate: taxRate || 0,
    taxAmount,
    total,
    notes,
    status: status || 'paid',
    billedBy: billedByUserId,
    createdBy: req.user._id,
  });

  if (invoice.status !== 'cancelled') {
    for (const item of invoiceItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }
  }

  const populated = await Invoice.findById(invoice._id)
    .populate('customer')
    .populate('createdBy', 'name')
    .populate('billedBy', 'name role');

  res.status(201).json({ success: true, data: populated });
});

export const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.status === 'cancelled') {
    throw new AppError('Invoice already cancelled', 400);
  }

  for (const item of invoice.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantity: item.quantity },
    });
  }

  invoice.status = 'cancelled';
  await invoice.save();

  res.json({ success: true, data: invoice });
});
