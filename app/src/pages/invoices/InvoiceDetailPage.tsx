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
  let taxableAmount = invoice.subtotal;
  const cgstAmount = taxableAmount * 0.025;
  const sgstAmount = taxableAmount * 0.025;
  taxableAmount = invoice.subtotal - cgstAmount - sgstAmount;
  const gstTotalAmount = invoice.subtotal;

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

      <div className="invoice-print card invoice-card">
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
          </div>
        </div>

        <div className="invoice-parties">
          <div className="invoice-party-row">
            <div>
              <span className="invoice-party-label">Bill to : </span>
              <span className="invoice-party-details">
                {customer?.name} | {customer?.phone}
              </span>
            </div>
            <div>
              <span className='invoice-party-details'>{invoice.paymentStatus} </span>{invoice.paymentMode.toUpperCase() && <span>using <span className='invoice-party-details'>{invoice.paymentMode.replace(/_/g, ' ')}</span></span>}
            </div>
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

        <table className="tax-summary">
          <thead>
            <tr>
              <th>Taxable Amount</th>
              <th>CGST (2.5%)</th>
              <th>SGST (2.5%)</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatCurrency(taxableAmount)}</td>
              <td>{formatCurrency(cgstAmount)}</td>
              <td>{formatCurrency(sgstAmount)}</td>
              <td>{formatCurrency(gstTotalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="invoice-totals">
          <p>Subtotal: {formatCurrency(invoice.subtotal)}</p>
          {invoice.discountAmount > 0 && (
            <p>Discount: −{formatCurrency(invoice.discountAmount)}</p>
          )}
          <p className="invoice-grand-total">Total: {formatCurrency(invoice.total)}</p>
        </div>

        {invoice.notes && (
          <div className="invoice-notes">
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}

        <div className="invoice-footer">
          <p>Note: Certified that particulars given above are true and correct.</p>
          <p><strong>Terms & Conditions</strong></p>
          <ol>
            <li>For hygiene reasons, goods once sold cannot be returned or exchanged.</li>
            <li>No cash refunds are allowed.</li>
            <li>Subject to Kolhapur jurisdiction only.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
