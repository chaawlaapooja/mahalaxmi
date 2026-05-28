import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { invoiceService } from '../../services/invoiceService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import type { Customer, Product, StaffUser } from '../../types';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/format';
import './CreateInvoicePage.css';

interface LineItem {
  productId: string;
  productName: string;
  barcode: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [scanning, setScanning] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [billedById, setBilledById] = useState(user?.id || '');
  const [items, setItems] = useState<LineItem[]>([]);
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'credit_debit_card'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([customerService.getAll(), userService.getStaff()])
      .then(([c, s]) => {
        setCustomers(c);
        setStaff(s);
        if (user?.id) setBilledById(user.id);
        if (c.length === 1) setCustomerId(c[0]._id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, [loading]);

  const lineTotals = items.map((item) => (item.quantity || 0) * (item.unitPrice || 0));
  const subtotal = lineTotals.reduce((a, b) => a + b, 0);
  let discountAmount = 0;
  if (discountType === 'percent') discountAmount = (subtotal * discountValue) / 100;
  else if (discountType === 'fixed') discountAmount = Math.min(discountValue, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + taxAmount;

  const addProductToInvoice = (product: Product) => {
    const existingIndex = items.findIndex((i) => i.productId === product._id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: product._id,
        productName: product.name,
        barcode: product.barcode,
        color: product.color,
        size: product.size,
        quantity: 1,
        unitPrice: product.price,
      },
    ]);
  };

  const handleBarcodeScan = async (e?: FormEvent) => {
    e?.preventDefault();
    const code = scanValue.trim();
    if (!code) return;

    setScanning(true);
    setError('');
    try {
      const product = await productService.getByBarcode(code);
      if (product.quantity < 1) {
        setError(`Out of stock: ${product.name} (${product.size})`);
      } else {
        addProductToInvoice(product);
        setScanValue('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Barcode not found');
    } finally {
      setScanning(false);
      barcodeRef.current?.focus();
    }
  };

  const updateItemQty = (index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  };

  const removeLine = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Select a customer');
      return;
    }
    if (!billedById) {
      setError('Select who billed this sale');
      return;
    }
    if (items.length === 0) {
      setError('Scan at least one product barcode');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const invoice = await invoiceService.create({
        customer: customerId,
        billedBy: billedById,
        items: items.map((i) => ({
          product: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discountType,
        discountValue,
        taxRate,
        paymentMode,
        paymentStatus,
        notes,
      });
      navigate(`/invoices/${invoice._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="create-invoice">
      <div className="page-header">
        <h1>New invoice</h1>
      </div>

      {error && <Alert message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div className="card scan-card">
          <h3>Scan barcode</h3>
          <p className="scan-hint">
            Focus this field and scan with your barcode gun (or type barcode + Enter).
          </p>
          <div className="scan-row">
            <Input
              ref={barcodeRef}
              label="Barcode"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBarcodeScan();
                }
              }}
              placeholder="Scan Jockey product barcode..."
              autoComplete="off"
            />
            <Button type="button" onClick={() => handleBarcodeScan()} loading={scanning}>
              Add item
            </Button>
          </div>
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="form-grid form-grid-2">
            <Select
              label="Customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={[
                { value: '', label: 'Select customer' },
                ...customers.map((c) => ({
                  value: c._id,
                  label: `${c.name} (${c.phone})`,
                })),
              ]}
            />
            <Select
              label="Billed by"
              value={billedById}
              onChange={(e) => setBilledById(e.target.value)}
              options={staff.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.role})`,
              }))}
            />
          </div>
          <div className="form-grid form-grid-2">
            <Select
              label="Payment mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'upi', label: 'UPI' },
                { value: 'credit_debit_card', label: 'Credit / Debit Card' },
              ]}
            />
            <Select
              label="Payment status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)}
              options={[
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
          </div>
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem' }}>Items ({items.length})</h3>

        {items.length === 0 ? (
          <div className="empty-state card">Scan a barcode to add Jockey products</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.productId}-${index}`}>
                    <td><strong>{item.productName}</strong></td>
                    <td><code>{item.barcode}</code></td>
                    <td>{item.color}</td>
                    <td>{item.size}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className="field-input qty-input"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItemQty(index, parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(lineTotals[index] || 0)}</td>
                    <td>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeLine(index)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="form-grid form-grid-2">
            <Select
              label="Discount type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'percent', label: 'Percentage' },
                { value: 'fixed', label: 'Fixed amount' },
              ]}
            />
            {discountType !== 'none' && (
              <Input
                label="Discount value"
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              />
            )}
            <Input
              label="GST / Tax rate (%)"
              type="number"
              min={0}
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="field" style={{ marginTop: '1rem' }}>
            <label className="field-label">Notes</label>
            <textarea
              className="field-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="invoice-summary">
            <p>Subtotal: {formatCurrency(subtotal)}</p>
            {discountAmount > 0 && <p>Discount: −{formatCurrency(discountAmount)}</p>}
            {taxAmount > 0 && <p>Tax: {formatCurrency(taxAmount)}</p>}
            <p className="invoice-summary-total">Total: {formatCurrency(total)}</p>
          </div>
        </div>

        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={() => navigate('/invoices')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={items.length === 0}>
            Generate invoice
          </Button>
        </div>
      </form>
    </div>
  );
};
