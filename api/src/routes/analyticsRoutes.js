import { Router } from 'express';
import {
  dashboard,
  sales,
  expenses,
  profit,
  salesByStaff,
  stockBySize,
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', dashboard);
router.get('/sales', sales);
router.get('/sales-by-staff', salesByStaff);
router.get('/stock-by-size', stockBySize);
router.get('/expenses', expenses);
router.get('/profit', profit);

export default router;
