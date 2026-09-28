import React, { useState, useEffect, useRef } from 'react';
import {
  User, Camera, MapPin, Plus, Trash2, Edit3, Mail, Phone, Save, X, Loader2, Lock
} from 'lucide-react';
import api from '../../services/api';
import { uploadImage, getTransformedUrl } from '../../services/imageService';
import { useAuth } from '../../context/AuthContext';
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

const ProfilePage: React.FC = () => {
  const { refreshProfile } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
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
  const [passwordStatus, setPasswordStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
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

  const handleEditToggle = () => {
    if (isEditing && profile) {
      // Cancel edit, revert state
      initializeEditState(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
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
      
      setIsEditing(false);
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
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page__loading">
        <Loader2 className="profile-page__spinner" size={40} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page__error">
        <p>{error || 'Profile not found'}</p>
        <button onClick={fetchProfile} className="profile-page__retry-btn">Retry</button>
      </div>
    );
  }

  const avatarDisplayUrl = isEditing 
    ? (editAvatarUrl ? getTransformedUrl(editAvatarUrl, 'avatar-lg') : null)
    : (profile.avatarUrl ? getTransformedUrl(profile.avatarUrl, 'avatar-lg') : null);

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-card__header"></div>
          <div className="profile-card__body">
            
            {/* Avatar */}
            <div 
              className={`profile-card__avatar-container ${isEditing ? 'profile-card__avatar-container--editable' : ''}`}
              onClick={handleAvatarClick}
            >
              {avatarDisplayUrl ? (
                <img src={avatarDisplayUrl} alt={profile.name} className="profile-card__avatar" />
              ) : (
                <div className="profile-card__avatar-placeholder">
                  <User size={48} />
                </div>
              )}
              
              {isEditing && (
                <div className="profile-card__avatar-overlay">
                  {isUploading ? <Loader2 className="profile-card__spinner" size={24} /> : <Camera size={24} />}
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileChange}
            />

            {!isEditing ? (
              // View Mode Content
              <div className="profile-card__content">
                <div className="profile-card__info-header">
                  <h2 className="profile-card__name">{profile.name}</h2>
                  <span className="profile-card__role-badge">{profile.role}</span>
                  <button className="profile-card__edit-btn" onClick={handleEditToggle} aria-label="Edit Profile">
                    <Edit3 size={18} />
                  </button>
                </div>
                
                <div className="profile-card__contact-info">
                  <div className="profile-card__info-item">
                    <Mail size={18} className="profile-card__icon" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="profile-card__info-item">
                    <Phone size={18} className="profile-card__icon" />
                    {profile.phone ? <span>{profile.phone}</span> : <span className="profile-card__text-muted">Not set</span>}
                  </div>
                </div>

                <div className="profile-card__divider"></div>

                <div className="profile-card__section">
                  <h3 className="profile-card__section-title">Saved Addresses</h3>
                  {profile.savedAddresses && profile.savedAddresses.length > 0 ? (
                    <ul className="profile-card__address-list">
                      {profile.savedAddresses.map((addr, index) => (
                        <li key={index} className="profile-card__address-item">
                          <MapPin size={18} className="profile-card__icon" />
                          <span>{addr}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="profile-card__text-muted">No saved addresses</p>
                  )}
                </div>
              </div>
            ) : (
              // Edit Mode Content
              <div className="profile-card__content profile-card__content--edit">
                <div className="profile-card__edit-header">
                  <h2 className="profile-card__name">Edit Profile</h2>
                  <span className="profile-card__role-badge">{profile.role}</span>
                </div>
                
                <div className="profile-form">
                  <div className="profile-form__group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="profile-form__input"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="profile-form__group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      value={editPhone} 
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="profile-form__input"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="profile-card__divider"></div>
                  
                  <div className="profile-form__section">
                    <h3 className="profile-card__section-title">Manage Addresses</h3>
                    
                    {editAddresses.length > 0 && (
                      <ul className="profile-form__address-list">
                        {editAddresses.map((addr, index) => (
                          <li key={index} className="profile-form__address-item">
                            <span className="profile-form__address-text">{addr}</span>
                            <button 
                              className="profile-form__delete-btn"
                              onClick={() => handleRemoveAddress(index)}
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <div className="profile-form__add-address">
                      <input 
                        type="text" 
                        value={newAddress} 
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="profile-form__input profile-form__input--address"
                        placeholder="Add new address"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAddress()}
                      />
                      <button 
                        className="profile-form__add-btn" 
                        onClick={handleAddAddress}
                        disabled={!newAddress.trim()}
                        type="button"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="profile-form__actions">
                    <button 
                      className="btn btn--secondary" 
                      onClick={handleEditToggle}
                      disabled={isSaving}
                      type="button"
                    >
                      <X size={18} /> Cancel
                    </button>
                    <button 
                      className="btn btn--primary" 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      type="button"
                    >
                      {isSaving ? <Loader2 size={18} className="profile-page__spinner" /> : <Save size={18} />} 
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Section (Only show in view mode) */}
        {!isEditing && (
          <div className="password-card">
            <h3 className="password-card__title">
              <Lock size={20} /> Change Password
            </h3>
            
            {passwordStatus && (
              <div className={`password-card__alert password-card__alert--${passwordStatus.type}`}>
                {passwordStatus.message}
              </div>
            )}
            
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="profile-form__group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="profile-form__input"
                  required
                />
              </div>
              <div className="profile-form__group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="profile-form__input"
                  required
                />
              </div>
              <div className="profile-form__group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="profile-form__input"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn--primary password-form__submit"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
