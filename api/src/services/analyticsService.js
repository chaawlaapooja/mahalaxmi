import { Invoice } from '../models/Invoice.js';
import { Expense } from '../models/Expense.js';
import { Product } from '../models/Product.js';

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

export const getDashboardStats = async () => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [invoiceStats, monthExpenses, lowStockCount, totalProducts, totalCustomers] =
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
  const expenses = monthExpenses[0]?.total || 0;

  return {
    totalRevenue: allTime.totalRevenue,
    totalInvoices: allTime.invoiceCount,
    monthRevenue: thisMonth.revenue,
    monthInvoices: thisMonth.count,
    monthExpenses: expenses,
    monthProfit: thisMonth.revenue - expenses,
    lowStockCount,
    totalProducts,
    totalCustomers,
  };
};

export const getSalesAnalytics = async (months = 6) => {
  const start = new Date();
  start.setMonth(start.getMonth() - months + 1);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  return Invoice.aggregate([
    {
      $match: {
        status: { $ne: 'cancelled' },
        createdAt: { $gte: start },
      },
    },
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

export const getExpenseReport = async (months = 6) => {
  const start = new Date();
  start.setMonth(start.getMonth() - months + 1);
  start.setDate(1);

  const [byMonth, byCategory] = await Promise.all([
    Expense.aggregate([
      { $match: { date: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  return { byMonth, byCategory };
};

export const getProfitOverview = async (months = 6) => {
  const start = new Date();
  start.setMonth(start.getMonth() - months + 1);
  start.setDate(1);

  const [revenue, expenses] = await Promise.all([
    Invoice.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const expenseMap = new Map(
    expenses.map((e) => [`${e._id.year}-${e._id.month}`, e.total])
  );

  return revenue.map((r) => {
    const key = `${r._id.year}-${r._id.month}`;
    const exp = expenseMap.get(key) || 0;
    return {
      year: r._id.year,
      month: r._id.month,
      revenue: r.total,
      expenses: exp,
      profit: r.total - exp,
    };
  });
};
