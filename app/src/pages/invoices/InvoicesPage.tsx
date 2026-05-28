import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { invoiceService } from '../../services/invoiceService';
import type { Customer, Invoice } from '../../types';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency, formatDate } from '../../utils/format';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    invoiceService
      .getAll()
      .then(setInvoices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const getCustomerName = (customer: Customer | string) =>
    typeof customer === 'object' ? customer.name : '—';

  return (
    <div>
      <div className="page-header">
        <h1>Invoices</h1>
        <Link to="/invoices/new">
          <Button>Create invoice</Button>
        </Link>
      </div>

      {error && <Alert message={error} />}

      {loading ? (
        <Spinner />
      ) : invoices.length === 0 ? (
        <div className="empty-state">No invoices yet</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td><strong>{inv.invoiceNumber}</strong></td>
                  <td>{getCustomerName(inv.customer)}</td>
                  <td>{formatDate(inv.createdAt)}</td>
                  <td>{formatCurrency(inv.total)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'cancelled' ? 'badge-danger' : 'badge-success'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/invoices/${inv._id}`} className="btn btn-sm btn-ghost">View / Print</Link>
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
