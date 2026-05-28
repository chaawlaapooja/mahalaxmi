import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getDashboardStats,
  getSalesAnalytics,
  getExpenseReport,
  getProfitOverview,
  getSalesByStaff,
  getStockBySize,
} from '../services/analyticsService.js';

export const dashboard = asyncHandler(async (_req, res) => {
  const data = await getDashboardStats();
  res.json({ success: true, data });
});

export const sales = asyncHandler(async (req, res) => {
  const data = await getSalesAnalytics(req.query);
  res.json({ success: true, data });
});

export const expenses = asyncHandler(async (req, res) => {
  const data = await getExpenseReport(req.query);
  res.json({ success: true, data });
});

export const profit = asyncHandler(async (req, res) => {
  const data = await getProfitOverview(req.query);
  res.json({ success: true, data });
});

export const salesByStaff = asyncHandler(async (req, res) => {
  const data = await getSalesByStaff(req.query);
  res.json({ success: true, data });
});

export const stockBySize = asyncHandler(async (_req, res) => {
  const data = await getStockBySize();
  res.json({ success: true, data });
});
