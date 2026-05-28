import { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
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
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [profit, setProfit] = useState<ProfitPoint[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<{ _id: string; total: number }[]>([]);

  useEffect(() => {
    Promise.all([
      analyticsService.getSales(6),
      analyticsService.getProfit(6),
      analyticsService.getExpenses(6),
    ])
      .then(([s, p, e]) => {
        setSales(s as SalesPoint[]);
        setProfit(p);
        setExpenseByCategory(e.byCategory);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert message={error} />;

  const maxRevenue = Math.max(...sales.map((s) => s.revenue), 1);

  return (
    <div>
      <div className="page-header">
        <h1>Analytics & Reports</h1>
      </div>

      <section className="report-section card">
        <h2>Sales trend (6 months)</h2>
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
