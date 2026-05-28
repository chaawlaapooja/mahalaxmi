import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import { Modal } from '../../components/ui/Modal';
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
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [styleSearch, setStyleSearch] = useState('');
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);

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
    const loadCustomers = async () => {
      try {
        const [walkInResults, allCustomers, staffUsers] = await Promise.all([
          customerService.getAll('Walk-in'),
          customerService.getAll(),
          userService.getStaff(),
        ]);

        setCustomers(allCustomers);
        setStaff(staffUsers);
        if (user?.id) setBilledById(user.id);

        const walkInCustomer = walkInResults.find((c) => /walk-in/i.test(c.name));
        if (walkInCustomer) {
          setCustomerId(walkInCustomer._id);
        } else if (allCustomers.length === 1) {
          setCustomerId(allCustomers[0]._id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
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

  const handleStyleSearch = async () => {
    const query = styleSearch.trim();
    if (!query) return;

    setProductLoading(true);
    setError('');
    try {
      const products = await productService.getAll({ search: query });
      setMatchingProducts(products);
      if (products.length === 0) {
        setError('No style variants found for this query');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search products');
    } finally {
      setProductLoading(false);
    }
  };

  const addMatchedProduct = (product: Product) => {
    if (product.quantity < 1) {
      setError(`Out of stock: ${product.name} (${product.color}/${product.size})`);
      return;
    }
    addProductToInvoice(product);
  };

  const handleCustomerSearch = async (value: string) => {
    setCustomerSearch(value);
    if (!value.trim()) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      const customers = await customerService.getAll(value);
      setCustomerSearchResults(customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search customers');
    }
  };

  const pickCustomer = (customer: Customer) => {
    setCustomerId(customer._id);
    setCustomerSearch(customer.name);
    setCustomerSearchResults([]);
  };

  const createQuickCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      setError('Name and phone are required to add a customer');
      return;
    }

    try {
      const customer = await customerService.create({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        email: newCustomerEmail.trim() || undefined,
      });
      setCustomers((prev) => [customer, ...prev]);
      setCustomerId(customer._id);
      setCustomerSearch(customer.name);
      setShowCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create customer');
    }
  };

  const styleGroups = useMemo(() => {
    return matchingProducts.reduce((groups, product) => {
      const key = product.name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(product);
      return groups;
    }, {} as Record<string, Product[]>);
  }, [matchingProducts]);

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
        {/* Three-column input modules */}
        <div className="input-modules">
          {/* Scan Barcode Module */}
          <div className="input-module">
            <h3>📦 Scan Barcode</h3>
            <p className="scan-hint">Scan or type barcode + Enter</p>
            <div className="module-scan-row">
              <Input
                ref={barcodeRef}
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeScan();
                  }
                }}
                placeholder="Scan barcode..."
                autoComplete="off"
              />
              <Button type="button" onClick={() => handleBarcodeScan()} loading={scanning}>
                Add
              </Button>
            </div>
          </div>

          {/* Style/Size Search Module */}
          <div className="input-module">
            <h3>🎨 Style Search</h3>
            <p className="scan-hint">Find by style name or code</p>
            <div className="module-search-row">
              <Input
                value={styleSearch}
                onChange={(e) => setStyleSearch(e.target.value)}
                placeholder="Style or code..."
                autoComplete="off"
              />
              <Button type="button" onClick={handleStyleSearch} loading={productLoading}>
                Search
              </Button>
            </div>
          </div>

          {/* Customer Module */}
          <div className="input-module">
            <h3>👤 Customer</h3>
            <p className="scan-hint">Search or add new</p>
            <div className="customer-search-container">
              <input
                className="field-input customer-search-input"
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                autoComplete="off"
              />
              {customerSearchResults.length > 0 && (
                <div className="autocomplete-list">
                  {customerSearchResults.map((customer) => (
                    <button
                      key={customer._id}
                      type="button"
                      className="autocomplete-item"
                      onClick={() => pickCustomer(customer)}
                    >
                      <div style={{ fontWeight: 600 }}>{customer.name}</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{customer.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setShowCustomerModal(true)}
              style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
            >
              + Add new
            </Button>
          </div>
        </div>

        {/* Style Search Results */}
        {Object.keys(styleGroups).length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-1)' }}>Search Results</h3>
            <div className="style-results">
              {Object.entries(styleGroups).map(([styleName, products]) => (
                <div key={styleName}>
                  <h4>{styleName}</h4>
                  {products.map((product) => (
                    <div key={product._id} className="style-item">
                      <div>
                        <strong>{product.color}</strong>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                          {product.quantity < 1 ? '❌ OOS' : `✓ ${product.quantity}`}
                        </span>
                      </div>
                      <div>
                        <span>Size: {product.size}</span>
                        <span>{formatCurrency(product.price)}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem' }}>#{product.barcode}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addMatchedProduct(product)}
                        disabled={product.quantity < 1}
                      >
                        Add to Invoice
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Table - Always visible on top */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="invoice-items-header">
            <h3>Invoice Items</h3>
            <div className="items-count">{items.length}</div>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">📭 Add items by scanning barcode or searching styles above</div>
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
                      <td><strong>{formatCurrency(lineTotals[index] || 0)}</strong></td>
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
        </div>

        {/* Invoice Details Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-1)' }}>Invoice Details</h3>
          <div className="form-grid form-grid-2" style={{ gap: '1.5rem' }}>
            <Select
              label="Billed by"
              value={billedById}
              onChange={(e) => setBilledById(e.target.value)}
              options={staff.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.role})`,
              }))}
            />
            <div>
              <label className="field-label">Selected Customer</label>
              <div style={{
                padding: '0.75rem',
                background: 'linear-gradient(135deg, rgba(38, 147, 96, 0.05) 0%, rgba(38, 193, 167, 0.05) 100%)',
                borderRadius: '0.5rem',
                borderLeft: '3px solid var(--color-1)',
                fontWeight: 600,
                color: 'var(--color-1)'
              }}>
                {customers.find((c) => c._id === customerId)?.name || '👤 Walk-in Customer'}
              </div>
            </div>
          </div>

          <div className="form-grid form-grid-2" style={{ gap: '1.5rem', marginTop: '1rem' }}>
            <Select
              label="Payment Mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
              options={[
                { value: 'cash', label: '💵 Cash' },
                { value: 'upi', label: '📱 UPI' },
                { value: 'credit_debit_card', label: '💳 Card' },
              ]}
            />
            <Select
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)}
              options={[
                { value: 'paid', label: '✓ Paid' },
                { value: 'pending', label: '⏳ Pending' },
              ]}
            />
          </div>
        </div>

        {/* Discount & Tax Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-1)' }}>Discount & Tax</h3>
          <div className="form-grid form-grid-2" style={{ gap: '1.5rem' }}>
            <Select
              label="Discount Type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'percent', label: 'Percentage (%)' },
                { value: 'fixed', label: 'Fixed Amount' },
              ]}
            />
            {discountType !== 'none' && (
              <Input
                label="Discount Value"
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              />
            )}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Input
              label="GST / Tax Rate (%)"
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
              placeholder="Add any notes..."
            />
          </div>

          {/* Summary */}
          <div className="invoice-summary">
            <p>
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </p>
            {discountAmount > 0 && (
              <p>
                <span>Discount</span>
                <strong style={{ color: 'var(--color-2)' }}>−{formatCurrency(discountAmount)}</strong>
              </p>
            )}
            {taxAmount > 0 && (
              <p>
                <span>Tax ({taxRate}%)</span>
                <strong>{formatCurrency(taxAmount)}</strong>
              </p>
            )}
            <p className="invoice-summary-total">
              <span>Total Amount</span>
              <strong>{formatCurrency(total)}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={() => navigate('/invoices')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={items.length === 0}>
            ✓ Generate Invoice
          </Button>
        </div>
      </form>

      <Modal open={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Add new customer">
        <div className="field">
          <label className="field-label">Name</label>
          <input
            className="field-input"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            placeholder="Customer name"
          />
        </div>
        <div className="field">
          <label className="field-label">Phone</label>
          <input
            className="field-input"
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
        <div className="field">
          <label className="field-label">Email</label>
          <input
            className="field-input"
            value={newCustomerEmail}
            onChange={(e) => setNewCustomerEmail(e.target.value)}
            placeholder="Email address"
          />
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <Button type="button" variant="ghost" onClick={() => setShowCustomerModal(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={createQuickCustomer}>
            Save customer
          </Button>
        </div>
      </Modal>
    </div>
  );
};
