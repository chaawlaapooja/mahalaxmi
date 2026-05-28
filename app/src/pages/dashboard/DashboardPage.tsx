import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import type { DashboardStats } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency } from '../../utils/format';

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    analyticsService
      .getDashboard()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert message={error} />;
  if (!stats) return null;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/invoices/new" className="btn btn-primary btn-md">
          New invoice
        </Link>
        <Link to="/reports" className="btn btn-secondary btn-md">
          View reports
        </Link>
      </div>

      <div className="grid-stats">
        <StatCard label="Total revenue" value={formatCurrency(stats.totalRevenue)} accent="green" />
        <StatCard
          label="This month"
          value={formatCurrency(stats.monthRevenue)}
          sub={`${stats.monthInvoices} invoices`}
          accent="teal"
        />
        <StatCard
          label="Month expenses"
          value={formatCurrency(stats.monthExpenses)}
          accent="orange"
        />
        <StatCard
          label="Month profit"
          value={formatCurrency(stats.monthProfit)}
          accent="blue"
        />
        <StatCard label="Products" value={String(stats.totalProducts)} accent="green" />
        <StatCard label="Customers" value={String(stats.totalCustomers)} accent="teal" />
        <StatCard
          label="Low stock items"
          value={String(stats.lowStockCount)}
          sub={stats.lowStockCount > 0 ? 'Needs attention' : 'All good'}
          accent={stats.lowStockCount > 0 ? 'orange' : 'green'}
        />
        <StatCard label="Total invoices" value={String(stats.totalInvoices)} accent="blue" />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>Quick actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/invoices/new" className="btn btn-primary btn-md">
            Create invoice
          </Link>
          <Link to="/inventory" className="btn btn-secondary btn-md">
            Manage inventory
          </Link>
          <Link to="/expenses" className="btn btn-secondary btn-md">
            Add expense
          </Link>
        </div>
      </div>
    </div>
  );
};
