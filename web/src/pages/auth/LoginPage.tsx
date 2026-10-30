import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Store, Eye, EyeOff, Loader2 } from 'lucide-react';
import './LoginPage.css';

type Role = 'STUDENT' | 'OWNER';
type Mode = 'LOGIN' | 'REGISTER';

import foodLogo from '../../assets/food_logo.jpg';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [role, setRole] = useState<Role>('STUDENT');
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        const response = await api.post('/auth/login', { email, password, role });
        const data = response.data.data;
        login(data.accessToken, data, data.refreshToken);
        navigate(role === 'OWNER' ? '/owner' : '/student');
      } else {
        const response = await api.post('/auth/register', { 
          name, 
          email, 
          phone, 
          password, 
          role 
        });
        const data = response.data.data;
        login(data.accessToken, data, data.refreshToken);
        navigate(role === 'OWNER' ? '/owner' : '/student');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const backendMessage = err.response?.data?.message;
      if (backendMessage) {
        setError(backendMessage);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Cannot connect to the backend API. Please make sure the backend server is running and reachable.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getEmailPlaceholder = () => {
    return role === 'STUDENT' ? 'ananya.s@tezu.ac.in' : 'owner@dhaba.com';
  };

  const getEmailLabel = () => {
    return role === 'STUDENT' ? 'University Email' : 'Email Address';
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        {/* Left Panel */}
        <div className="login-page__left">
          <img src={foodLogo} alt="Food Logo" className="login-page__left-bg" />
          <div className="login-page__left-overlay">
            <h1 className="login-page__logo-text">The mess let you down? TezuKitchen won’t.</h1>
            <p className="login-page__illustration">C'mon and order from nearby campus delivery and pickup restaurants</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-page__right">
        <div className="login-page__header">
          <h2 className="login-page__title">Welcome to <span style={{ color: 'var(--color-primary)' }}>TezuKitchen</span></h2>
          <p className="login-page__subtitle">Select your role to get started</p>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          <div 
            className={`role-card ${role === 'STUDENT' ? 'role-card--active' : ''}`}
            onClick={() => setRole('STUDENT')}
          >
            <User size={32} className="role-card__icon" />
            <h3 className="role-card__title">Student</h3>
            <p className="role-card__subtitle">Campus Dining & Delivery</p>
          </div>
          
          <div 
            className={`role-card ${role === 'OWNER' ? 'role-card--active' : ''}`}
            onClick={() => setRole('OWNER')}
          >
            <Store size={32} className="role-card__icon" />
            <h3 className="role-card__title">Restaurant Owner</h3>
            <p className="role-card__subtitle">Partner Dashboard</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button 
            className={`mode-tab ${mode === 'LOGIN' ? 'mode-tab--active' : ''}`}
            onClick={() => setMode('LOGIN')}
            type="button"
          >
            Sign In
          </button>
          <button 
            className={`mode-tab ${mode === 'REGISTER' ? 'mode-tab--active' : ''}`}
            onClick={() => setMode('REGISTER')}
            type="button"
          >
            New Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'REGISTER' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-wrapper">
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="+91 9876543210" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">{getEmailLabel()}</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                className="form-input" 
                placeholder={getEmailPlaceholder()}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={20} className="spin" />
                {mode === 'LOGIN' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              mode === 'LOGIN' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
