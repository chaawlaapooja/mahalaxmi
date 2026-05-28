import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProduct,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/productController.js';
import { PRODUCT_CATEGORIES } from '../constants/productCategories.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/categories', getCategories);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/', getProducts);
router.get('/:id', getProduct);

const productValidators = [
  body('name').trim().notEmpty(),
  body('barcode').trim().notEmpty(),
  body('category').isIn(PRODUCT_CATEGORIES),
  body('color').trim().notEmpty(),
  body('size').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('quantity').isInt({ min: 0 }),
  validate,
];

router.post('/', productValidators, createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
