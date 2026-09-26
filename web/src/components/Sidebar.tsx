import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Home, Search, ClipboardList, User, ChefHat, Activity, Store,
  LogOut, ShoppingBag,
} from 'lucide-react';
import { getTransformedUrl } from '../services/imageService';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const studentLinks = [
    { to: '/student', icon: Home, label: 'Home', end: true },
    { to: '/student/search', icon: Search, label: 'Search' },
    { to: '/student/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/student/profile', icon: User, label: 'Profile' },
  ];

  const ownerLinks = [
    { to: '/owner', icon: ClipboardList, label: 'Live Orders', end: true },
    { to: '/owner/menu', icon: ChefHat, label: 'Menu' },
    { to: '/owner/analytics', icon: Activity, label: 'Analytics' },
    { to: '/owner/store', icon: Store, label: 'Store' },
  ];

  const links = role === 'OWNER' ? ownerLinks : studentLinks;

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">TK</div>
          <div>
            <div className="sidebar__title">TezuKitchen</div>
            <div className="sidebar__subtitle">
              {role === 'OWNER' ? 'Partner Dashboard' : 'Campus Delivery'}
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__section-label">
            {role === 'OWNER' ? 'Restaurant' : 'Menu'}
          </div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}

          {role === 'STUDENT' && (
            <>
              <div className="sidebar__section-label">Shopping</div>
              <NavLink
                to="/student/cart"
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
              >
                <ShoppingBag size={20} />
                Cart
                {totalItems > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: 'var(--color-primary)',
                      color: 'white',
                      borderRadius: 'var(--radius-pill)',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user?.avatarUrl ? (
                <img
                  src={getTransformedUrl(user.avatarUrl, 'avatar-sm')}
                  alt={user.name}
                />
              ) : (
                <User size={18} color="rgba(255,255,255,0.5)" />
              )}
            </div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{user?.name || 'User'}</div>
              <div className="sidebar__user-role">{role?.toLowerCase()}</div>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <ul className="mobile-nav__items">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
                }
              >
                <link.icon size={20} />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
