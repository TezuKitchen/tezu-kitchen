import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/student/HomePage';
import SearchPage from './pages/student/SearchPage';
import OrdersPage from './pages/student/OrdersPage';
import ProfilePage from './pages/student/ProfilePage';
import RestaurantPage from './pages/student/RestaurantPage';
import CartPage from './pages/student/CartPage';
import ReviewPage from './pages/student/ReviewPage';
import LiveOrdersPage from './pages/owner/LiveOrdersPage';
import MenuPage from './pages/owner/MenuPage';
import AnalyticsPage from './pages/owner/AnalyticsPage';
import StorePage from './pages/owner/StorePage';
import './styles/global.css';

function RootRedirect() {
  const { user, role, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="loading-spinner" style={{ height: '100vh' }}>
        <div className="loading-spinner__circle" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'OWNER' ? '/owner' : '/student'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Student routes */}
              <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
                <Route path="/student" element={<HomePage />} />
                <Route path="/student/search" element={<SearchPage />} />
                <Route path="/student/orders" element={<OrdersPage />} />
                <Route path="/student/profile" element={<ProfilePage />} />
                <Route path="/student/restaurant/:id" element={<RestaurantPage />} />
                <Route path="/student/cart" element={<CartPage />} />
                <Route path="/student/review" element={<ReviewPage />} />
              </Route>

              {/* Owner routes */}
              <Route element={<ProtectedRoute allowedRole="OWNER" />}>
                <Route path="/owner" element={<LiveOrdersPage />} />
                <Route path="/owner/menu" element={<MenuPage />} />
                <Route path="/owner/analytics" element={<AnalyticsPage />} />
                <Route path="/owner/store" element={<StorePage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
