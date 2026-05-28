import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/invoices/new', label: 'New Invoice', icon: '🧾', end: false },
  { to: '/dashboard', label: 'Dashboard', icon: '📊', adminOnly: true },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/invoices', label: 'Invoice History', icon: '📋' },
  { to: '/expenses', label: 'Expenses', icon: '💰', adminOnly: true },
  { to: '/reports', label: 'Reports', icon: '📈', adminOnly: true },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { user, isAdmin, logout } = useAuth();

  const items = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {open && <div className="sidebar-backdrop no-print" onClick={onClose} />}
      <aside className={`sidebar no-print ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">M</span>
          <div>
            <strong>Mahalaxmi</strong>
            <small>Jockey Showroom</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/invoices/new'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role badge badge-success">{user?.role}</span>
          </div>
          <button type="button" className="logout-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};
