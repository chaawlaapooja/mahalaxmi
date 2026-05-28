import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import type { Customer } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { CustomerForm } from '../../features/customers/CustomerForm';

export const CustomersPage = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await customerService.getAll(search || undefined));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleSave = async (data: Partial<Customer>) => {
    if (editing) {
      await customerService.update(editing._id, data);
    } else {
      await customerService.create(data);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    await customerService.delete(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>Add customer</Button>
      </div>

      {error && <Alert message={error} onClose={() => setError('')} />}

      <div className="filters">
        <Input placeholder="Search by name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      {loading ? (
        <Spinner />
      ) : customers.length === 0 ? (
        <div className="empty-state">No customers found</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>City</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.city || '—'}</td>
                  <td>
                    <Link to={`/customers/${c._id}`} className="btn btn-sm btn-ghost">History</Link>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setModalOpen(true); }}>Edit</Button>
                    {isAdmin && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(c._id)}>Delete</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit customer' : 'Add customer'} wide>
        <CustomerForm initial={editing || undefined} onSubmit={handleSave} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
};
