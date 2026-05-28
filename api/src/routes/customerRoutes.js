import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCustomers,
  getCustomer,
  getCustomerHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getCustomers);
router.get('/:id/history', getCustomerHistory);
router.get('/:id', getCustomer);

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    validate,
  ],
  createCustomer
);

router.put('/:id', updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

export default router;
