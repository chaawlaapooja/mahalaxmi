import { FormEvent, useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { PRODUCT_CATEGORIES, categoryLabel } from '../../constants/productCategories';
import type { Product } from '../../types';

interface ProductFormProps {
  initial?: Partial<Product>;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

export const ProductForm = ({ initial, onSubmit, onCancel }: ProductFormProps) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    barcode: initial?.barcode || '',
    category: initial?.category || 'men',
    color: initial?.color || '',
    size: initial?.size || '',
    price: initial?.price?.toString() || '',
    costPrice: initial?.costPrice?.toString() || '',
    quantity: initial?.quantity?.toString() || '0',
    lowStockThreshold: initial?.lowStockThreshold?.toString() || '5',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name: form.name,
        barcode: form.barcode.trim(),
        category: form.category,
        color: form.color,
        size: form.size,
        price: parseFloat(form.price),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        quantity: parseInt(form.quantity, 10),
        lowStockThreshold: parseInt(form.lowStockThreshold, 10),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid form-grid-2">
        <Input
          label="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Barcode"
          value={form.barcode}
          onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          required
          placeholder="Scan or type barcode"
          autoComplete="off"
        />
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          options={PRODUCT_CATEGORIES.map((c) => ({
            value: c,
            label: categoryLabel(c),
          }))}
        />
        <Input
          label="Color"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          required
          placeholder="e.g. Black, Navy"
        />
        <Input
          label="Size"
          value={form.size}
          onChange={(e) => setForm({ ...form, size: e.target.value })}
          required
          placeholder="e.g. M, L, Free"
        />
        <Input
          label="Selling price (₹)"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <Input
          label="Cost price (₹)"
          type="number"
          min="0"
          step="0.01"
          value={form.costPrice}
          onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
        />
        <Input
          label="Stock quantity"
          type="number"
          min="0"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />
        <Input
          label="Low stock alert"
          type="number"
          min="0"
          value={form.lowStockThreshold}
          onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
        />
      </div>
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save product
        </Button>
      </div>
    </form>
  );
};
