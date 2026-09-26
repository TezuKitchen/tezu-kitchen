import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Store, Loader2, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [role, setRole] = useState<'STUDENT' | 'OWNER'>('STUDENT');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (mode === 'LOGIN') {
        response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
      } else {
        response = await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: role,
        });
      }

      const payload = response.data.data;
      const { accessToken, refreshToken, ...userData } = payload;
      
      login(accessToken, userData, refreshToken);

      if (userData.role === 'OWNER') {
        navigate('/owner');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__left">
        <div className="login-page__brand">
          <div className="login-page__logo-container">
            <span className="login-page__logo-text">TezuKitchen</span>
          </div>
          <p className="login-page__tagline">
            Experience the best campus dining and delivery services right at your fingertips.
          </p>
        </div>
      </div>
      
      <div className="login-page__right">
        <div className="login-page__form-container">
          <div className="login-page__header">
            <h2>{mode === 'LOGIN' ? 'Welcome Back' : 'Create an Account'}</h2>
            <p>Select your role to continue</p>
          </div>

          <div className="login-page__roles">
            <button
              type="button"
              className={`role-card ${role === 'STUDENT' ? 'role-card--active' : ''}`}
              onClick={() => setRole('STUDENT')}
            >
              <div className="role-card__icon-wrapper">
                <User className="role-card__icon" />
              </div>
              <div className="role-card__content">
                <span className="role-card__title">Student</span>
                <span className="role-card__subtitle">Campus Dining & Delivery</span>
              </div>
            </button>
            <button
              type="button"
              className={`role-card ${role === 'OWNER' ? 'role-card--active' : ''}`}
              onClick={() => setRole('OWNER')}
            >
              <div className="role-card__icon-wrapper">
                <Store className="role-card__icon" />
              </div>
              <div className="role-card__content">
                <span className="role-card__title">Restaurant Owner</span>
                <span className="role-card__subtitle">Partner Dashboard</span>
              </div>
            </button>
          </div>

          <div className="login-page__tabs">
            <button
              type="button"
              className={`tab ${mode === 'LOGIN' ? 'tab--active' : ''}`}
              onClick={() => { setMode('LOGIN'); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`tab ${mode === 'REGISTER' ? 'tab--active' : ''}`}
              onClick={() => { setMode('REGISTER'); setError(null); }}
            >
              New Account
            </button>
          </div>

          {error && (
            <div className="alert alert--error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-page__form" onSubmit={handleSubmit}>
            {mode === 'REGISTER' && (
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">
                {role === 'STUDENT' ? 'University Email' : 'Email Address'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={role === 'STUDENT' ? 'ananya.s@tezu.ac.in' : 'owner@dhaba.com'}
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spinner" size={20} />
                  <span>Please wait...</span>
                </>
              ) : (
                <span>{mode === 'LOGIN' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
