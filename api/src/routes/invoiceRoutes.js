import { Router } from 'express';
import { body } from 'express-validator';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  cancelInvoice,
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getInvoices);
router.get('/:id', getInvoice);

router.post(
  '/',
  [
    body('customer').notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.product').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    validate,
  ],
  createInvoice
);

router.patch('/:id/cancel', cancelInvoice);

export default router;
