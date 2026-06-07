import { Product } from '../models/Product.js';
import { PRODUCT_CATEGORIES } from '../constants/productCategories.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, lowStock } = req.query;
  const filter = { isActive: true };

  if (category) filter.category = category;
  if (lowStock === 'true') {
    filter.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
      { color: { $regex: search, $options: 'i' } },
      { size: { $regex: search, $options: 'i' } },
    ];
  }

  const products = await Product.find(filter).sort({ category: 1, name: 1 });
  res.json({ success: true, data: products });
});

export const getProductByBarcode = asyncHandler(async (req, res) => {
  const barcode = req.params.barcode?.trim();
  if (!barcode) throw new AppError('Barcode is required', 400);

  const products = await Product.find({ barcode, isActive: true }).sort({ price: 1 });
  if (!products.length) throw new AppError('No product found for this barcode', 404);
  res.json({ success: true, data: products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, message: 'Product deleted' });
});

export const getCategories = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: PRODUCT_CATEGORIES });
});
