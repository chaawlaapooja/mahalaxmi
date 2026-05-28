import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { Expense } from '../models/Expense.js';
import { Product } from '../models/Product.js';

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const parseDate = (value) => (value ? new Date(value) : null);

const buildInvoiceFilter = ({ from, to, staffId } = {}) => {
  const filter = { status: { $ne: 'cancelled' } };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = parseDate(from);
    if (to) filter.createdAt.$lte = parseDate(to);
  }
  if (staffId) filter.billedBy = new mongoose.Types.ObjectId(staffId);
  return filter;
};

export const getDashboardStats = async () => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [invoiceStats, monthProfitData, monthExpenses, lowStockCount, totalProducts, totalCustomers] =
    await Promise.all([
      Invoice.aggregate([
        {
          $facet: {
            allTime: [
              { $match: { status: { $ne: 'cancelled' } } },
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: '$total' },
                  invoiceCount: { $sum: 1 },
                },
              },
            ],
            thisMonth: [
              {
                $match: {
                  status: { $ne: 'cancelled' },
                  createdAt: { $gte: monthStart, $lte: monthEnd },
                },
              },
              {
                $group: {
                  _id: null,
                  revenue: { $sum: '$total' },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      Invoice.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            profit: {
              $sum: {
                $multiply: [
                  { $subtract: ['$items.unitPrice', '$items.costPrice'] },
                  '$items.quantity',
                ],
              },
            },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      }),
      Product.countDocuments({ isActive: true }),
      import('../models/Customer.js').then((m) => m.Customer.countDocuments()),
    ]);

  const allTime = invoiceStats[0]?.allTime[0] || { totalRevenue: 0, invoiceCount: 0 };
  const thisMonth = invoiceStats[0]?.thisMonth[0] || { revenue: 0, count: 0 };
  const profitRecord = monthProfitData[0] || { profit: 0 };
  const expenses = monthExpenses[0]?.total || 0;

  return {
    totalRevenue: allTime.totalRevenue,
    totalInvoices: allTime.invoiceCount,
    monthRevenue: thisMonth.revenue,
    monthInvoices: thisMonth.count,
    monthExpenses: expenses,
    monthProfit: profitRecord.profit,
    lowStockCount,
    totalProducts,
    totalCustomers,
  };
};

export const getSalesAnalytics = async ({ months = 6, from, to, staffId } = {}) => {
  const match = buildInvoiceFilter({ from, to, staffId });
  if (!from && !to) {
    const start = new Date();
    start.setMonth(start.getMonth() - months + 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    match.createdAt = { $gte: start };
  }

  return Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$total' },
        invoices: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

export const getExpenseReport = async ({ months = 6, from, to } = {}) => {
  const match = {};
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = parseDate(from);
    if (to) match.date.$lte = parseDate(to);
  } else {
    const d = new Date();
    d.setMonth(d.getMonth() - months + 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    match.date = { $gte: d };
  }

  const [byMonth, byCategory] = await Promise.all([
    Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  return { byMonth, byCategory };
};

export const getProfitOverview = async ({ months = 6, from, to, staffId } = {}) => {
  const match = buildInvoiceFilter({ from, to, staffId });
  if (!from && !to) {
    const start = new Date();
    start.setMonth(start.getMonth() - months + 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    match.createdAt = { $gte: start };
  }

  const [revenue, expenses, profitData] = await Promise.all([
    Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Expense.aggregate([
      { $match: match.createdAt ? { date: match.createdAt } : {} },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Invoice.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          profit: {
            $sum: {
              $multiply: [
                { $subtract: ['$items.unitPrice', '$items.costPrice'] },
                '$items.quantity',
              ],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const expenseMap = new Map(expenses.map((e) => [`${e._id.year}-${e._id.month}`, e.total]));
  const profitMap = new Map(profitData.map((p) => [`${p._id.year}-${p._id.month}`, p.profit]));

  return revenue.map((r) => {
    const key = `${r._id.year}-${r._id.month}`;
    return {
      year: r._id.year,
      month: r._id.month,
      revenue: r.total,
      expenses: expenseMap.get(key) || 0,
      profit: profitMap.get(key) || 0,
    };
  });
};

export const getSalesByStaff = async ({ from, to } = {}) => {
  const match = buildInvoiceFilter({ from, to });

  return Invoice.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'billedBy',
        foreignField: '_id',
        as: 'staff',
      },
    },
    { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        invoiceProfit: {
          $sum: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $multiply: [
                  { $subtract: ['$$item.unitPrice', '$$item.costPrice'] },
                  '$$item.quantity',
                ],
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: '$billedBy',
        name: { $first: '$staff.name' },
        revenue: { $sum: '$total' },
        invoices: { $sum: 1 },
        profit: { $sum: '$invoiceProfit' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
};

export const getTopProducts = async ({ limit = 10, category, from, to } = {}) => {
  const match = buildInvoiceFilter({ from, to });

  const pipeline = [
    { $match: match },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
  ];

  if (category) {
    pipeline.push({ $match: { 'product.category': category } });
  }

  pipeline.push(
    {
      $group: {
        _id: '$product._id',
        name: { $first: '$product.name' },
        category: { $first: '$product.category' },
        soldQuantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        profit: {
          $sum: {
            $multiply: [
              { $subtract: ['$items.unitPrice', '$items.costPrice'] },
              '$items.quantity',
            ],
          },
        },
      },
    },
    { $sort: { soldQuantity: -1, revenue: -1 } },
    { $limit: Number(limit) },
  );

  return Invoice.aggregate(pipeline);
};

export const getStockBySize = async () => {
  return Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$size',
        quantity: { $sum: '$quantity' },
        value: { $sum: { $multiply: ['$price', '$quantity'] } },
        profit: {
          $sum: {
            $multiply: [
              { $subtract: ['$price', '$costPrice'] },
              '$quantity',
            ],
          },
        },
      },
    },
    { $sort: { quantity: -1, _id: 1 } },
  ]);
};
