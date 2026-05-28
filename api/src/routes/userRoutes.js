import { Router } from 'express';
import { getStaff } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/staff', getStaff);

export default router;
