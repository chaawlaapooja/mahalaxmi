import { useCallback, useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { ProductForm } from '../../features/inventory/ProductForm';
import { formatCurrency } from '../../utils/format';
import { categoryLabel, PRODUCT_CATEGORIES } from '../../constants/productCategories';

export const InventoryPage = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productService.getAll({
          search: search || undefined,
          category: category || undefined,
          lowStock: lowStockOnly || undefined,
        }),
        productService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [search, category, lowStockOnly]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleSave = async (data: Partial<Product>) => {
    if (editing) {
      await productService.update(editing._id, data);
    } else {
      await productService.create(data);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await productService.delete(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          Add product
        </Button>
      </div>

      {error && <Alert message={error} onClose={() => setError('')} />}

      <div className="filters">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field-input"
          style={{ maxWidth: 180 }}
        >
          <option value="">All categories</option>
          {(categories.length ? categories : PRODUCT_CATEGORIES).map((c) => (
            <option key={c} value={c}>{categoryLabel(c)}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <div className="empty-state">No products found</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Barcode</th>
                <th>Color</th>
                <th>Size</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{categoryLabel(p.category)}</td>
                  <td><code>{p.barcode}</code></td>
                  <td>{p.color}</td>
                  <td>{p.size}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{p.quantity}</td>
                  <td>
                    {p.isLowStock ? (
                      <span className="badge badge-warning">Low stock</span>
                    ) : (
                      <span className="badge badge-success">In stock</span>
                    )}
                  </td>
                  <td>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setModalOpen(true); }}>
                      Edit
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(p._id)}>
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit product' : 'Add product'}
        wide
      >
        <ProductForm
          initial={editing || undefined}
          onSubmit={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
};
