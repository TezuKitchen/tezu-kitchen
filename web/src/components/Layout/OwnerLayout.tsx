import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, UtensilsCrossed, BarChart3, Store as StoreIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './OwnerLayout.css';

const getPageTitle = (pathname: string) => {
  if (pathname.includes('/menu')) return 'Menu Management';
  if (pathname.includes('/analytics')) return 'Analytics';
  if (pathname.includes('/store')) return 'Store Settings';
  return 'Live Orders';
};

export const OwnerLayout: React.FC = () => {
  const { user, logout } = useAuth?.() || { user: null, logout: () => {} };
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/owner', icon: <ClipboardList size={24} />, label: 'Live Orders', end: true },
    { to: '/owner/menu', icon: <UtensilsCrossed size={24} />, label: 'Menu' },
    { to: '/owner/analytics', icon: <BarChart3 size={24} />, label: 'Analytics' },
    { to: '/owner/store', icon: <StoreIcon size={24} />, label: 'Store' },
  ];

  return (
    <div className="owner-layout">
      {/* Sidebar / Bottom Nav */}
      <nav className="owner-layout__sidebar">
        <div className="owner-layout__sidebar-header">
          <h1 className="owner-layout__logo">TezuKitchen</h1>
          <span className="owner-layout__subtitle">Owner Dashboard</span>
        </div>

        <ul className="owner-layout__nav-list">
          {navItems.map((item) => (
            <li key={item.to} className="owner-layout__nav-item">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `owner-layout__nav-link ${isActive ? 'owner-layout__nav-link--active' : ''}`
                }
              >
                {item.icon}
                <span className="owner-layout__nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="owner-layout__sidebar-footer">
          <button className="owner-layout__logout-btn" onClick={handleLogout}>
            <LogOut size={24} />
            <span className="owner-layout__nav-label">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="owner-layout__main">
        <header className="owner-layout__header">
          <h2 className="owner-layout__page-title">{getPageTitle(location.pathname)}</h2>
          <div className="owner-layout__header-actions">
            <div className="owner-layout__user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
            </div>
          </div>
        </header>

        <main className="owner-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
