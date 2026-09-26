import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import Sidebar from './Sidebar';

interface ProtectedRouteProps {
  allowedRole?: UserRole;
}

export default function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-spinner" style={{ height: '100vh' }}>
        <div className="loading-spinner__circle" />
        <span className="loading-spinner__text">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    const redirect = role === 'OWNER' ? '/owner' : '/student';
    return <Navigate to={redirect} replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
