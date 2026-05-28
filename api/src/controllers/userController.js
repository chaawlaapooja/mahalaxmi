import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getStaff = asyncHandler(async (_req, res) => {
  const staff = await User.find().select('name email role').sort({ name: 1 });
  res.json({ success: true, data: staff });
});
