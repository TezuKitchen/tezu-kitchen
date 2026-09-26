import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { uploadImage, getTransformedUrl } from '../../services/imageService';
import { User, Camera, MapPin, Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import './ProfilePage.css';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  savedAddresses: string[];
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users/profile');
      setProfile(response.data.data);
      setEditForm(response.data.data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit mode and reset form
      setEditForm(profile);
      setNewAddress('');
    }
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddAddress = () => {
    if (!newAddress.trim() || !editForm) return;
    setEditForm({
      ...editForm,
      savedAddresses: [...editForm.savedAddresses, newAddress.trim()]
    });
    setNewAddress('');
  };

  const handleDeleteAddress = (index: number) => {
    if (!editForm) return;
    const newAddresses = [...editForm.savedAddresses];
    newAddresses.splice(index, 1);
    setEditForm({
      ...editForm,
      savedAddresses: newAddresses
    });
  };

  const handleAvatarClick = () => {
    if (isEditMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm) return;

    try {
      setIsUploading(true);
      const { url } = await uploadImage(file, 'avatars');
      setEditForm({
        ...editForm,
        avatarUrl: url
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!editForm) return;
    try {
      setIsSaving(true);
      const payload = {
        name: editForm.name,
        phone: editForm.phone,
        avatarUrl: editForm.avatarUrl,
        savedAddresses: editForm.savedAddresses
      };
      const response = await api.put('/users/profile', payload);
      setProfile(response.data.data);
      setEditForm(response.data.data);
      setIsEditMode(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <Loader2 className="spinner" size={48} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile || !editForm) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <p className="error-text">{error || 'Profile not found'}</p>
          <button className="btn btn--primary" onClick={fetchProfile}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1 className="profile-page__title">My Profile</h1>
        {!isEditMode && (
          <button className="btn btn--secondary" onClick={handleEditToggle}>
            <Edit3 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-card__header-bg"></div>
        <div className="profile-card__content">
          <div 
            className={`profile-card__avatar-container ${isEditMode ? 'cursor-pointer' : ''}`}
            onClick={handleAvatarClick}
            title={isEditMode ? "Click to change avatar" : ""}
          >
            {editForm.avatarUrl ? (
              <img 
                src={getTransformedUrl ? getTransformedUrl(editForm.avatarUrl, 'avatar-lg') : editForm.avatarUrl} 
                alt="Avatar" 
                className="profile-card__avatar"
              />
            ) : (
              <User size={48} className="profile-card__avatar-placeholder" />
            )}
            
            {isEditMode && (
              <div className="profile-card__avatar-edit">
                {isUploading ? (
                  <Loader2 className="spinner" size={20} />
                ) : (
                  <Camera className="profile-card__avatar-edit-icon" />
                )}
                <span style={{ fontSize: '12px', marginTop: '4px' }}>
                  {isUploading ? 'Uploading...' : 'Change'}
                </span>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="profile-card__info">
            {isEditMode ? (
              <>
                <div className="profile-section">
                  <h3 className="profile-section__title">Personal Information</h3>
                  <div className="form-group">
                    <label className="form-group__label">Name</label>
                    <input 
                      type="text" 
                      name="name"
                      className="form-group__input" 
                      value={editForm.name} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-group__label">Email (Cannot be changed)</label>
                    <input 
                      type="email" 
                      className="form-group__input" 
                      value={editForm.email} 
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-group__label">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      className="form-group__input" 
                      value={editForm.phone} 
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="profile-section">
                  <h3 className="profile-section__title">Saved Addresses</h3>
                  <div className="addresses-list">
                    {editForm.savedAddresses.length > 0 ? (
                      editForm.savedAddresses.map((addr, index) => (
                        <div key={index} className="address-item">
                          <MapPin size={20} className="address-item__icon" />
                          <p className="address-item__text">{addr}</p>
                          <button 
                            className="address-item__delete" 
                            onClick={() => handleDeleteAddress(index)}
                            aria-label="Delete address"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No saved addresses yet.</p>
                    )}
                  </div>
                  
                  <div className="add-address">
                    <input 
                      type="text" 
                      className="form-group__input add-address__input" 
                      placeholder="Add a new address..."
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAddress();
                        }
                      }}
                    />
                    <button 
                      className="btn btn--secondary btn--icon"
                      onClick={handleAddAddress}
                      disabled={!newAddress.trim()}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="actions">
                  <button 
                    className="btn btn--secondary" 
                    onClick={handleEditToggle}
                    disabled={isSaving || isUploading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn--primary" 
                    onClick={handleSave}
                    disabled={isSaving || isUploading}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="spinner" size={18} />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="profile-section">
                  <h3 className="profile-section__title">Personal Information</h3>
                  <div className="info-item">
                    <span className="info-item__label">Name</span>
                    <span className="info-item__value">{profile.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-item__label">Email</span>
                    <span className="info-item__value">{profile.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-item__label">Phone Number</span>
                    <span className="info-item__value">{profile.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="profile-section">
                  <h3 className="profile-section__title">Saved Addresses</h3>
                  <div className="addresses-list">
                    {profile.savedAddresses && profile.savedAddresses.length > 0 ? (
                      profile.savedAddresses.map((addr, index) => (
                        <div key={index} className="address-item">
                          <MapPin size={20} className="address-item__icon" />
                          <p className="address-item__text">{addr}</p>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No saved addresses yet.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
