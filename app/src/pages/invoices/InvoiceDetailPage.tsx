import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { invoiceService } from '../../services/invoiceService';
import type { Customer, Invoice } from '../../types';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency, formatDate } from '../../utils/format';
import './InvoicePrint.css';

export const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    if (!id) return;
    invoiceService
      .getById(id)
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handlePrint = () => window.print();

  const handleCancel = async () => {
    if (!id || !confirm('Cancel this invoice? Stock will be restored.')) return;
    await invoiceService.cancel(id);
    load();
  };

  if (loading) return <Spinner />;
  if (error) return <Alert message={error} />;
  if (!invoice) return null;

  const customer = invoice.customer as Customer;

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <Link to="/invoices" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            ← Back to invoices
          </Link>
          <h1>{invoice.invoiceNumber}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={handlePrint}>Print</Button>
          {invoice.status !== 'cancelled' && (
            <Button variant="danger" onClick={handleCancel}>Cancel invoice</Button>
          )}
        </div>
      </div>

      <div className="invoice-print card">
        <div className="invoice-header">
          <div>
            <h1 className="invoice-brand">Mahalaxmi Exclusive</h1>
            <p className="invoice-tagline">G-8, Waterfront building, Opp Shalini Palace, Rankala, Kolhapur - 416010</p>
            <p className="invoice-tagline">Contact: 9623355664</p>
            <p className="invoice-tagline">GSTIN: 27BPGPC2450G1Z9</p>
          </div>
          <div className="invoice-meta">
            <h2>INVOICE</h2>
            <p><strong>{invoice.invoiceNumber}</strong></p>
            <p>Date: {formatDate(invoice.createdAt)}</p>
            {invoice.billedBy && (
              <p>Billed by: <strong>{invoice.billedBy.name}</strong></p>
            )}
            <p>Payment mode: <strong>{invoice.paymentMode?.replace(/_/g, ' ')}</strong></p>
            <p>
              Payment Status:{' '}
              <span className={`badge ${invoice.paymentStatus === 'pending' ? 'badge-danger' : 'badge-success'}`}>
                {invoice.paymentStatus}
              </span>
            </p>
          </div>
        </div>

        <div className="invoice-parties">
          <div>
            <h3>Bill to</h3>
            <p><strong>{customer?.name}</strong></p>
            <p>{customer?.phone}</p>
            {customer?.address && <p>{customer.address}{customer.city ? `, ${customer.city}` : ''}</p>}
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Color</th>
              <th>Size</th>
              <th>Qty</th>
              <th>MRP</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.productName}</td>
                <td>{item.color || '—'}</td>
                <td>{item.size || '—'}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-totals">
          <p>Subtotal: {formatCurrency(invoice.subtotal)}</p>
          {invoice.discountAmount > 0 && (
            <p>Discount: −{formatCurrency(invoice.discountAmount)}</p>
          )}
          {invoice.taxAmount > 0 && <p>Tax ({invoice.taxRate}%): {formatCurrency(invoice.taxAmount)}</p>}
          <p className="invoice-grand-total">Total: {formatCurrency(invoice.total)}</p>
        </div>

        {invoice.notes && (
          <div className="invoice-notes">
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}

        <p className="invoice-footer">Thank you for your business!</p>
      </div>
    </div>
  );
};
