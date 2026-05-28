import { Router } from 'express';
import { body } from 'express-validator';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/categories', getExpenseCategories);
router.get('/', getExpenses);
router.get('/:id', getExpense);

router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('amount').isFloat({ min: 0 }),
    validate,
  ],
  createExpense
);

router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
