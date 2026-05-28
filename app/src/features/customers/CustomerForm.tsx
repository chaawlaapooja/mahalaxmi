import { FormEvent, useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Customer } from '../../types';

interface CustomerFormProps {
  initial?: Partial<Customer>;
  onSubmit: (data: Partial<Customer>) => Promise<void>;
  onCancel: () => void;
}

export const CustomerForm = ({ initial, onSubmit, onCancel }: CustomerFormProps) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    address: initial?.address || '',
    city: initial?.city || '',
    notes: initial?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid form-grid-2">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-grid-2" style={{ gridColumn: '1 / -1' }} />
      </div>
      <div className="field" style={{ marginTop: '1rem' }}>
        <label className="field-label">Notes</label>
        <textarea className="field-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Save customer</Button>
      </div>
    </form>
  );
};
