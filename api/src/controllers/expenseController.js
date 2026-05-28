import { Expense } from '../models/Expense.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getExpenses = asyncHandler(async (req, res) => {
  const { category, month, year } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }

  const expenses = await Expense.find(filter)
    .populate('createdBy', 'name')
    .sort({ date: -1 });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  res.json({ success: true, data: expenses, total });
});

export const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id).populate('createdBy', 'name');
  if (!expense) throw new AppError('Expense not found', 404);
  res.json({ success: true, data: expense });
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: expense });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!expense) throw new AppError('Expense not found', 404);
  res.json({ success: true, data: expense });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) throw new AppError('Expense not found', 404);
  res.json({ success: true, message: 'Expense deleted' });
});

export const getExpenseCategories = asyncHandler(async (_req, res) => {
  const categories = await Expense.distinct('category');
  res.json({ success: true, data: categories });
});
