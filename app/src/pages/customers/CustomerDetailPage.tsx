import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import type { Customer, Invoice } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency, formatDate } from '../../utils/format';

export const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    customerService
      .getHistory(id)
      .then(({ customer: c, invoices: inv }) => {
        setCustomer(c);
        setInvoices(inv);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <Alert message={error} />;
  if (!customer) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/customers" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            ← Back to customers
          </Link>
          <h1>{customer.name}</h1>
        </div>
        <Link to="/invoices/new" className="btn btn-primary btn-md">New invoice</Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p><strong>Phone:</strong> {customer.phone}</p>
        {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
        {customer.address && <p><strong>Address:</strong> {customer.address}, {customer.city}</p>}
      </div>

      <h2 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Purchase history</h2>

      {invoices.length === 0 ? (
        <div className="empty-state">No invoices yet</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{formatDate(inv.createdAt)}</td>
                  <td>{formatCurrency(inv.total)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'cancelled' ? 'badge-danger' : 'badge-success'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/invoices/${inv._id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
