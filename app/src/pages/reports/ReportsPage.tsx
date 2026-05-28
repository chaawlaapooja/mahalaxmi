import { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { userService } from '../../services/userService';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Select } from '../../components/ui/Select';
import { formatCurrency, monthLabel } from '../../utils/format';
import { PRODUCT_CATEGORIES, categoryLabel } from '../../constants/productCategories';
import './ReportsPage.css';

interface SalesPoint {
  _id: { year: number; month: number };
  revenue: number;
  invoices: number;
}

interface ProfitPoint {
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
}

export const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangePreset, setRangePreset] = useState<'current' | 'last' | '3' | '6' | '12'>('current');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffUsers, setStaffUsers] = useState<{ _id: string; name: string }[]>([]);
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [profit, setProfit] = useState<ProfitPoint[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<{ _id: string; total: number }[]>([]);
  const [salesByStaff, setSalesByStaff] = useState<
    { _id: string; name?: string; revenue: number; invoices: number; profit: number }[]
  >([]);
  const [stockBySize, setStockBySize] = useState<{ _id: string; quantity: number; value: number; profit: number }[]>([]);
  const [topProducts, setTopProducts] = useState<
    { _id: string; name: string; category: string; soldQuantity: number; revenue: number; profit: number }[]
  >([]);
  const [topProductsLimit, setTopProductsLimit] = useState(10);
  const [topProductsCategory, setTopProductsCategory] = useState('');

  const getDateRangeParams = () => {
    const params: Record<string, string | number> = {};
    if (staffId) params.staffId = staffId;
    if (fromDate || toDate) {
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      return params;
    }

    if (rangePreset === 'last') {
      const now = new Date();
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const rangeEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      params.from = rangeStart.toISOString().slice(0, 10);
      params.to = rangeEnd.toISOString().slice(0, 10);
      return params;
    }

    params.months = Number(rangePreset);
    return params;
  };

  const fetchReports = async () => {
    setLoading(true);
    setError('');

    const params = getDateRangeParams();

    try {
      const [salesData, profitData, expensesData, salesByStaffData, stockData, topProductsData] =
        await Promise.all([
          analyticsService.getSales(params),
          analyticsService.getProfit(params),
          analyticsService.getExpenses(params),
          analyticsService.getSalesByStaff(params),
          analyticsService.getStockBySize(),
          analyticsService.getTopProducts({
            ...params,
            limit: topProductsLimit,
            category: topProductsCategory || undefined,
          }),
        ]);
      setSales(salesData as SalesPoint[]);
      setProfit(profitData);
      setExpenseByCategory(expensesData.byCategory);
      setSalesByStaff(salesByStaffData as any[]);
      setStockBySize(stockData as any[]);
      setTopProducts(topProductsData as any[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    userService
      .getStaff()
      .then((users) => setStaffUsers(users))
      .catch(() => undefined);
    fetchReports();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [rangePreset, fromDate, toDate, staffId, topProductsLimit, topProductsCategory]);

  if (loading) return <Spinner />;
  if (error) return <Alert message={error} />;

  const maxRevenue = Math.max(...sales.map((s) => s.revenue), 1);
  const stockTotalQuantity = stockBySize.reduce((total, row) => total + row.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <h1>Analytics & Reports</h1>
      </div>

      <section className="report-section card report-filters">
        <h2>Report filters</h2>
        <div className="form-grid form-grid-4">
          <Select
            label="Preset range"
            value={rangePreset}
            onChange={(e) => {
              setRangePreset(e.target.value as 'current' | 'last' | '3' | '6' | '12');
              setFromDate('');
              setToDate('');
            }}
            options={[
              { value: 'current', label: 'Current month' },
              { value: 'last', label: 'Last month' },
              { value: '3', label: 'Last 3 months' },
              { value: '6', label: 'Last 6 months' },
              { value: '12', label: 'Last 12 months' },
            ]}
          />
          <div className="field">
            <label className="field-label">From</label>
            <input
              className="field-input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label">To</label>
            <input
              className="field-input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <Select
            label="Staff filter"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            options={[
              { value: '', label: 'All staff' },
              ...staffUsers.map((user) => ({ value: user._id, label: user.name })),
            ]}
          />
        </div>
        <p className="small-note">
          Custom dates override preset range. The report values refresh automatically.
        </p>
      </section>

      <section className="report-section card">
        <h2>Sales trend</h2>
        {sales.length === 0 ? (
          <p className="empty-state">No sales data</p>
        ) : (
          <div className="bar-chart">
            {sales.map((s) => (
              <div key={`${s._id.year}-${s._id.month}`} className="bar-item">
                <div
                  className="bar-fill"
                  style={{ height: `${(s.revenue / maxRevenue) * 100}%` }}
                  title={formatCurrency(s.revenue)}
                />
                <span className="bar-label">{monthLabel(s._id.year, s._id.month)}</span>
                <span className="bar-value">{formatCurrency(s.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="report-section card">
        <h2>Profit overview</h2>
        <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Expenses</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {profit.map((p) => (
                <tr key={`${p.year}-${p.month}`}>
                  <td>{monthLabel(p.year, p.month)}</td>
                  <td>{formatCurrency(p.revenue)}</td>
                  <td>{formatCurrency(p.expenses)}</td>
                  <td style={{ color: p.profit >= 0 ? 'var(--color-1)' : 'var(--danger)', fontWeight: 600 }}>
                    {formatCurrency(p.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section card">
        <h2>Sales by staff</h2>
        {salesByStaff.length === 0 ? (
          <p className="empty-state">No staff sales data</p>
        ) : (
          <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Revenue</th>
                  <th>Invoices</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {salesByStaff.map((row) => (
                  <tr key={row._id}>
                    <td>{row.name || row._id}</td>
                    <td>{formatCurrency(row.revenue)}</td>
                    <td>{row.invoices}</td>
                    <td style={{ color: row.profit >= 0 ? 'var(--color-1)' : 'var(--danger)', fontWeight: 600 }}>
                      {formatCurrency(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="report-section card">
        <div className="report-section-header">
          <h2>Top selling products</h2>
          <div className="report-section-controls">
            <Select
              label="Top products"
              value={String(topProductsLimit)}
              onChange={(e) => setTopProductsLimit(Number(e.target.value))}
              options={[
                { value: '10', label: 'Top 10' },
                { value: '20', label: 'Top 20' },
                { value: '30', label: 'Top 30' },
              ]}
            />
            <Select
              label="Category"
              value={topProductsCategory}
              onChange={(e) => setTopProductsCategory(e.target.value)}
              options={[
                { value: '', label: 'All categories' },
                ...PRODUCT_CATEGORIES.map((category) => ({
                  value: category,
                  label: categoryLabel(category),
                })),
              ]}
            />
          </div>
        </div>
        {topProducts.length === 0 ? (
          <p className="empty-state">No product sales data</p>
        ) : (
          <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty sold</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((row) => (
                  <tr key={row._id}>
                    <td>{row.name}</td>
                    <td>{categoryLabel(row.category)}</td>
                    <td>{row.soldQuantity}</td>
                    <td>{formatCurrency(row.revenue)}</td>
                    <td style={{ color: row.profit >= 0 ? 'var(--color-1)' : 'var(--danger)', fontWeight: 600 }}>
                      {formatCurrency(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="report-section card">
        <h2>Stock by size</h2>
        {stockBySize.length === 0 ? (
          <p className="empty-state">No stock size data</p>
        ) : (
          <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Total quantity ({stockTotalQuantity})</th>
                  <th>Price</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {stockBySize.map((row) => (
                  <tr key={row._id}>
                    <td>{row._id}</td>
                    <td>{row.quantity}</td>
                    <td>{formatCurrency(row.value)}</td>
                    <td style={{ color: row.profit >= 0 ? 'var(--color-1)' : 'var(--danger)', fontWeight: 600 }}>
                      {formatCurrency(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="report-section card">
        <h2>Expenses by category</h2>
        {expenseByCategory.length === 0 ? (
          <p className="empty-state">No expense data</p>
        ) : (
          <ul className="category-list">
            {expenseByCategory.map((c) => (
              <li key={c._id}>
                <span>{c._id}</span>
                <strong>{formatCurrency(c.total)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
