import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, Palette, Bell, CreditCard, Heart, MessageCircle,
  HelpCircle, Lock, LogOut, ChevronRight, Check, Sun, Moon, Smartphone,
  X, Camera, Loader2, ArrowLeft, Edit3
} from 'lucide-react';
import api from '../../services/api';
import { uploadImage, getTransformedUrl } from '../../services/imageService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './ProfilePage.css';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string;
  savedAddresses: string[];
}

type ViewState = 'settings' | 'edit-profile' | 'change-password' | 'appearance';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  const [currentView, setCurrentView] = useState<ViewState>('settings');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editAddresses, setEditAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users/profile');
      const data = response.data.data;
      setProfile(data);
      initializeEditState(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const initializeEditState = (data: UserProfile) => {
    setEditName(data.name || '');
    setEditPhone(data.phone || '');
    setEditAvatarUrl(data.avatarUrl || '');
    setEditAddresses(data.savedAddresses || []);
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadImage(file, 'avatars');
      setEditAvatarUrl(result.url);
    } catch (err: any) {
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      setEditAddresses([...editAddresses, newAddress.trim()]);
      setNewAddress('');
    }
  };

  const handleRemoveAddress = (index: number) => {
    setEditAddresses(editAddresses.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const data = {
        name: editName,
        phone: editPhone,
        avatarUrl: editAvatarUrl,
        savedAddresses: editAddresses
      };

      const response = await api.put('/users/profile', data);
      const updatedProfile = response.data.data;
      setProfile(updatedProfile);

      if (refreshProfile) {
        await refreshProfile();
      }

      setCurrentView('settings');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordStatus(null);
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPasswordStatus({ type: 'success', message: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setCurrentView('settings'), 1500);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const MenuItem = ({ icon, label, subLabel, onClick, isDestructive = false, showChevron = true }: any) => (
    <div className="menu-item" onClick={onClick}>
      <div className="menu-item__left">
        <div className={`menu-icon-container ${isDestructive ? 'menu-icon-container--destructive' : ''}`}>
          {icon}
        </div>
        <div>
          <div className={`menu-item__label ${isDestructive ? 'text-danger' : ''}`}>{label}</div>
          {subLabel && <div className="menu-item__sublabel">{subLabel}</div>}
        </div>
      </div>
      {showChevron && !isDestructive && <ChevronRight size={20} className="menu-item__chevron" />}
    </div>
  );

  const getThemeModeLabel = (mode: string) => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  if (loading) {
    return (
      <div className="profile-page__loading">
        <Loader2 className="spin" size={40} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page__error">
        <p>{error || 'Profile not found'}</p>
        <button onClick={fetchProfile} className="btn btn--primary">Retry</button>
      </div>
    );
  }

  // View: Settings (Main Menu)
  if (currentView === 'settings') {
    return (
      <div className="profile-page">
        <div className="profile-page__container">
          <h1 className="profile-page__title">Settings</h1>

          <div className="profile-card profile-card--settings">
            <div className="profile-card__avatar-wrap">
              {profile.avatarUrl ? (
                <img src={getTransformedUrl(profile.avatarUrl, 'avatar-lg')} alt={profile.name} className="profile-card__avatar" />
              ) : (
                <div className="profile-card__avatar-placeholder">
                  <User size={36} />
                </div>
              )}
            </div>
            <h2 className="profile-card__name">{profile.name}</h2>
            <p className="profile-card__email">{profile.email}</p>
            <button className="btn btn--outline profile-card__edit-btn" onClick={() => {
              initializeEditState(profile);
              setCurrentView('edit-profile');
            }}>
              Edit Profile
            </button>
          </div>

          <div className="settings-section">
            <h3 className="settings-section__title">General</h3>
            <div className="settings-card">
              <MenuItem
                icon={<User size={20} className="text-primary" />}
                label="Account Information"
                onClick={() => setCurrentView('edit-profile')}
              />
              <div className="settings-separator"></div>
              <MenuItem
                icon={<MapPin size={20} className="text-primary" />}
                label="Your Addresses"
                onClick={() => setCurrentView('edit-profile')}
              />
              <div className="settings-separator"></div>
              <MenuItem
                icon={<Palette size={20} className="text-primary" />}
                label="Appearance"
                subLabel={`Theme: ${getThemeModeLabel(themeMode)}`}
                onClick={() => setCurrentView('appearance')}
              />
              <div className="settings-separator"></div>
              <MenuItem
                icon={<Bell size={20} className="text-primary" />}
                label="Notifications"
                subLabel="View order updates"
                onClick={() => navigate('/student/notifications')}
              />
              <div className="settings-separator"></div>
              <MenuItem
                icon={<CreditCard size={20} className="text-primary" />}
                label="Payment Methods"
                onClick={() => alert('This feature is coming soon!')}
              />
              <div className="settings-separator"></div>
              <MenuItem
                icon={<Heart size={20} className="text-primary" />}
                label="Favourites"
                subLabel="Saved kitchens & dhabas"
                onClick={() => navigate('/student/favorites')}
              />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section__title">Support</h3>
            <div className="settings-card">
              <MenuItem
                icon={<MessageCircle size={20} className="text-primary" />}
                label="Report an Issue"
                onClick={() => alert('This feature is coming soon!')}
              />
              <div className="settings-separator"></div>
              <MenuItem
                icon={<HelpCircle size={20} className="text-primary" />}
                label="Help"
                onClick={() => alert('This feature is coming soon!')}
              />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section__title">Account</h3>
            <div className="settings-card">
              <MenuItem
                icon={<Lock size={20} className="text-primary" />}
                label="Change Password"
                onClick={() => setCurrentView('change-password')}
              />
              <div className="settings-separator"></div>
              <MenuItem
                icon={<LogOut size={20} className="text-danger" />}
                label="Log Out"
                isDestructive
                onClick={logout}
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  // View: Edit Profile
  if (currentView === 'edit-profile') {
    const avatarDisplayUrl = editAvatarUrl ? getTransformedUrl(editAvatarUrl, 'avatar-lg') : null;
    return (
      <div className="profile-page">
        <div className="profile-page__container">
          <button className="btn btn--icon settings-back-btn" onClick={() => setCurrentView('settings')}>
            <ArrowLeft size={24} /> <span>Back to Settings</span>
          </button>
          <h1 className="profile-page__title">Edit Profile</h1>
          
          <div className="profile-card">
            <div className="profile-card__avatar-container profile-card__avatar-container--editable" onClick={handleAvatarClick}>
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt="Avatar" className="profile-card__avatar" />
              ) : (
                <div className="profile-card__avatar-placeholder">
                  <User size={48} />
                </div>
              )}
              <div className="profile-card__avatar-overlay">
                {isUploading ? <Loader2 className="spin" size={24} /> : <Camera size={24} />}
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            
            <div className="form-group mt-4">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            </div>

            <div className="profile-addresses">
              <h3 className="profile-addresses__title">Saved Addresses</h3>
              <ul className="profile-addresses__list">
                {editAddresses.map((addr, idx) => (
                  <li key={idx} className="profile-addresses__item">
                    <MapPin size={18} className="text-primary" />
                    <span>{addr}</span>
                    <button className="btn btn--icon text-danger" onClick={() => handleRemoveAddress(idx)}>
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="profile-addresses__add">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="E.g. Saraighat Hostel, Room 112" 
                  value={newAddress} 
                  onChange={e => setNewAddress(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddAddress()}
                />
                <button className="btn btn--primary" onClick={handleAddAddress} disabled={!newAddress.trim()}>
                  Add
                </button>
              </div>
            </div>

            <button className="btn btn--primary btn--full mt-4" onClick={handleSaveProfile} disabled={isSaving || isUploading}>
              {isSaving ? <Loader2 className="spin" size={20} /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View: Change Password
  if (currentView === 'change-password') {
    return (
      <div className="profile-page">
        <div className="profile-page__container">
          <button className="btn btn--icon settings-back-btn" onClick={() => setCurrentView('settings')}>
            <ArrowLeft size={24} /> <span>Back to Settings</span>
          </button>
          <h1 className="profile-page__title">Change Password</h1>
          
          <div className="profile-card">
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>
              
              {passwordStatus && (
                <div className={`alert alert--${passwordStatus.type} mb-3`}>
                  {passwordStatus.message}
                </div>
              )}
              
              <button type="submit" className="btn btn--primary btn--full" disabled={isChangingPassword}>
                {isChangingPassword ? <Loader2 className="spin" size={20} /> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // View: Appearance
  if (currentView === 'appearance') {
    return (
      <div className="profile-page">
        <div className="profile-page__container">
          <button className="btn btn--icon settings-back-btn" onClick={() => setCurrentView('settings')}>
            <ArrowLeft size={24} /> <span>Back to Settings</span>
          </button>
          <h1 className="profile-page__title">Appearance</h1>
          
          <div className="settings-card appearance-card">
            <div className="appearance-header">
              <Palette size={24} className="text-primary" />
              <p>Choose how TezuKitchen looks to you.</p>
            </div>
            
            <div className={`theme-option ${themeMode === 'light' ? 'theme-option--active' : ''}`} onClick={() => setThemeMode('light')}>
              <div className="theme-option__left">
                <div className="theme-option__icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <Sun size={20} />
                </div>
                <div>
                  <h4>Light Mode</h4>
                  <p>Crisp and clear daytime view</p>
                </div>
              </div>
              {themeMode === 'light' && <Check size={20} className="text-primary" />}
            </div>

            <div className={`theme-option ${themeMode === 'dark' ? 'theme-option--active' : ''}`} onClick={() => setThemeMode('dark')}>
              <div className="theme-option__left">
                <div className="theme-option__icon" style={{ backgroundColor: '#312E81', color: '#818CF8' }}>
                  <Moon size={20} />
                </div>
                <div>
                  <h4>Dark Mode</h4>
                  <p>Easy on the eyes in low light</p>
                </div>
              </div>
              {themeMode === 'dark' && <Check size={20} className="text-primary" />}
            </div>

            <div className={`theme-option ${themeMode === 'system' ? 'theme-option--active' : ''}`} onClick={() => setThemeMode('system')}>
              <div className="theme-option__left">
                <div className="theme-option__icon" style={{ backgroundColor: 'var(--color-border-subtle)', color: 'var(--color-primary)' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4>System Default</h4>
                  <p>Matches your device settings</p>
                </div>
              </div>
              {themeMode === 'system' && <Check size={20} className="text-primary" />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ProfilePage;
