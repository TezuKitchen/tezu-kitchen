import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, Search, Package, Heart, User, ShoppingCart, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import './StudentLayout.css';

const getPageTitle = (pathname: string) => {
  if (pathname.includes('/search')) return 'Search';
  if (pathname.includes('/orders')) return 'My Orders';
  if (pathname.includes('/favorites')) return 'Favorites';
  if (pathname.includes('/profile')) return 'Profile';
  if (pathname.includes('/cart')) return 'Cart';
  if (pathname.includes('/notifications')) return 'Notifications';
  return 'Home';
};

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth?.() || { user: null, logout: () => {} };
  const { totalItems } = useCart?.() || { totalItems: 0 };
  const { unreadCount } = useNotification();
  
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/student', icon: <Home size={24} />, label: 'Home', end: true },
    { to: '/student/search', icon: <Search size={24} />, label: 'Search' },
    { to: '/student/orders', icon: <Package size={24} />, label: 'Orders' },
    { to: '/student/favorites', icon: <Heart size={24} />, label: 'Favorites' },
    { to: '/student/profile', icon: <User size={24} />, label: 'Profile' },
  ];

  return (
    <div className="student-layout">
      {/* Sidebar / Bottom Nav */}
      <nav className="student-layout__sidebar">
        <div className="student-layout__sidebar-header">
          <h1 className="student-layout__logo">TezuKitchen</h1>
          <span className="student-layout__subtitle">Student</span>
        </div>

        <ul className="student-layout__nav-list">
          {navItems.map((item) => (
            <li key={item.to} className="student-layout__nav-item">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `student-layout__nav-link ${isActive ? 'student-layout__nav-link--active' : ''}`
                }
              >
                {item.icon}
                <span className="student-layout__nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="student-layout__sidebar-footer">
          <button className="student-layout__logout-btn" onClick={handleLogout}>
            <LogOut size={24} />
            <span className="student-layout__nav-label">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="student-layout__main">
        <header className="student-layout__header">
          <h2 className="student-layout__page-title">{getPageTitle(location.pathname)}</h2>
          <div className="student-layout__header-actions">
            <Link to="/student/notifications" className="student-layout__cart-btn">
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="student-layout__cart-badge" style={{ backgroundColor: 'var(--color-secondary)' }}>{unreadCount}</span>
              )}
            </Link>
            <Link to="/student/cart" className="student-layout__cart-btn">
              <ShoppingCart size={24} />
              {(totalItems || 0) > 0 && (
                <span className="student-layout__cart-badge">{totalItems}</span>
              )}
            </Link>
            <div className="student-layout__user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
        </header>

        <main className="student-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
