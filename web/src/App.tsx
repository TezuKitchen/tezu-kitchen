import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLayout from './components/Layout/StudentLayout';
import OwnerLayout from './components/Layout/OwnerLayout';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/student/HomePage';
import SearchPage from './pages/student/SearchPage';
import RestaurantPage from './pages/student/RestaurantPage';
import CartPage from './pages/student/CartPage';
import OrdersPage from './pages/student/OrdersPage';
import ProfilePage from './pages/student/ProfilePage';
import FavoritesPage from './pages/student/FavoritesPage';
import ReviewPage from './pages/student/ReviewPage';
import LiveOrdersPage from './pages/owner/LiveOrdersPage';
import MenuPage from './pages/owner/MenuPage';
import AnalyticsPage from './pages/owner/AnalyticsPage';
import StorePage from './pages/owner/StorePage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="restaurant/:id" element={<RestaurantPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="review" element={<ReviewPage />} />
      </Route>

      {/* Owner Routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute requiredRole="OWNER">
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LiveOrdersPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="store" element={<StorePage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
