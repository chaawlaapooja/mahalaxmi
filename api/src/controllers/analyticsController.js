import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getDashboardStats,
  getSalesAnalytics,
  getExpenseReport,
  getProfitOverview,
} from '../services/analyticsService.js';

export const dashboard = asyncHandler(async (_req, res) => {
  const data = await getDashboardStats();
  res.json({ success: true, data });
});

export const sales = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months, 10) || 6;
  const data = await getSalesAnalytics(months);
  res.json({ success: true, data });
});

export const expenses = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months, 10) || 6;
  const data = await getExpenseReport(months);
  res.json({ success: true, data });
});

export const profit = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months, 10) || 6;
  const data = await getProfitOverview(months);
  res.json({ success: true, data });
});
