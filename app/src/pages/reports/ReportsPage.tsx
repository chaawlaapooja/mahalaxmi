import { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { userService } from '../../services/userService';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { Select } from '../../components/ui/Select';
import { formatCurrency, monthLabel } from '../../utils/format';
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
  const [months, setMonths] = useState(6);
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
  const [stockBySize, setStockBySize] = useState<{ _id: string; quantity: number; skuCount: number }[]>([]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');

    const params: Record<string, string | number> = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    if (staffId) params.staffId = staffId;
    if (!fromDate && !toDate) params.months = months;

    try {
      const [salesData, profitData, expensesData, salesByStaffData, stockData] = await Promise.all([
        analyticsService.getSales(params),
        analyticsService.getProfit(params),
        analyticsService.getExpenses(params),
        analyticsService.getSalesByStaff(params),
        analyticsService.getStockBySize(),
      ]);
      setSales(salesData as SalesPoint[]);
      setProfit(profitData);
      setExpenseByCategory(expensesData.byCategory);
      setSalesByStaff(salesByStaffData as any[]);
      setStockBySize(stockData as any[]);
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
  }, [months, fromDate, toDate, staffId]);

  if (loading) return <Spinner />;
  if (error) return <Alert message={error} />;

  const maxRevenue = Math.max(...sales.map((s) => s.revenue), 1);

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
            value={String(months)}
            onChange={(e) => setMonths(Number(e.target.value))}
            options={[
              { value: '3', label: 'Last 3 months' },
              { value: '6', label: 'Last 6 months' },
              { value: '12', label: 'Last 12 months' },
            ]}
          />
          <div>
            <label className="field-label">From</label>
            <input
              className="field-input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
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
          Use custom dates to override preset range. The report values refresh automatically.
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
        <h2>Stock by size</h2>
        {stockBySize.length === 0 ? (
          <p className="empty-state">No stock size data</p>
        ) : (
          <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>SKU count</th>
                  <th>Total quantity</th>
                </tr>
              </thead>
              <tbody>
                {stockBySize.map((row) => (
                  <tr key={row._id}>
                    <td>{row._id}</td>
                    <td>{row.skuCount}</td>
                    <td>{row.quantity}</td>
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
