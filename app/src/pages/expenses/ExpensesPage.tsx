import { FormEvent, useCallback, useEffect, useState } from 'react';
import { expenseService } from '../../services/expenseService';
import type { Expense } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency, formatDate } from '../../utils/format';

export const ExpensesPage = () => {
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [form, setForm] = useState({
    title: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ expenses: list, total: t }, cats] = await Promise.all([
        expenseService.getAll({ month, year }),
        expenseService.getCategories(),
      ]);
      setExpenses(list);
      setTotal(t);
      setCategories(cats);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await expenseService.create({
        title: form.title,
        category: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description || undefined,
      });
      setModalOpen(false);
      setForm({ title: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await expenseService.delete(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Expenses</h1>
        <Button onClick={() => setModalOpen(true)}>Add expense</Button>
      </div>

      {error && <Alert message={error} onClose={() => setError('')} />}

      <div className="filters">
        <Input label="Month" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} style={{ maxWidth: 100 }} />
        <Input label="Year" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} style={{ maxWidth: 120 }} />
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <strong>Monthly total: {formatCurrency(total)}</strong>
      </div>

      {loading ? (
        <Spinner />
      ) : expenses.length === 0 ? (
        <div className="empty-state">No expenses for this period</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id}>
                  <td>{formatDate(e.date)}</td>
                  <td><strong>{e.title}</strong></td>
                  <td>{e.category}</td>
                  <td>{formatCurrency(e.amount)}</td>
                  <td>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(e._id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add expense">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              list="expense-categories"
            />
            <datalist id="expense-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <Input label="Amount (₹)" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <div className="field">
              <label className="field-label">Description</label>
              <textarea className="field-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
