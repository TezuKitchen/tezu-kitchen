import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { uploadImage, getTransformedUrl } from '../../services/imageService';
import { MapPin, Edit3, Image as ImageIcon, Camera } from 'lucide-react';
import './StorePage.css';

interface RestaurantImage {
  imageUrl: string;
  imageType: 'BANNER' | 'LOGO' | 'GALLERY';
}

interface Restaurant {
  id: number;
  ownerId: number | string;
  name: string;
  description: string;
  location: string;
  open: boolean;
  images?: RestaurantImage[];
}

const StorePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [store, setStore] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchStore = async () => {
    try {
      if (!user?.id && !user?.userId) return;
      const uId = user.id || user.userId;
      
      const res = await api.get(`/restaurants/owner/${uId}`);
      if (res.data.data && res.data.data.length > 0) {
        setStore(res.data.data[0]);
        setFormData({
          name: res.data.data[0].name,
          description: res.data.data[0].description,
          location: res.data.data[0].location
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [user]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (store) {
        await api.put(`/restaurants/${store.id}`, {
          ...formData,
          open: store.open
        });
        setIsEditing(false);
      } else {
        await api.post('/restaurants', {
          ...formData,
          open: false
        });
        if (refreshProfile) await refreshProfile();
      }
      await fetchStore();
    } catch (err) {
      console.error(err);
      alert('Failed to save store details');
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async () => {
    if (!store) return;
    try {
      await api.put(`/restaurants/${store.id}`, {
        name: store.name,
        description: store.description,
        location: store.location,
        open: !store.open
      });
      setStore({ ...store, open: !store.open });
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'BANNER' | 'LOGO') => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    
    setUploadingImage(true);
    try {
      const uploadResult = await uploadImage(file, 'restaurants');
      await api.post(`/restaurants/${store.id}/images`, {
        imageUrl: uploadResult.url,
        cloudinaryPublicId: uploadResult.publicId,
        imageType: type,
        displayOrder: 0
      });
      await fetchStore();
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <div className="store-page__loading">Loading...</div>;

  if (!store) {
    return (
      <div className="store-page__container">
        <div className="store-page__create-card">
          <h1>Create Your Store</h1>
          <p>Setup your restaurant details to start accepting orders.</p>
          <form onSubmit={handleCreateOrUpdate} className="store-page__form">
            <div className="store-page__form-group">
              <label>Restaurant Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Tezu Cafe" />
            </div>
            <div className="store-page__form-group">
              <label>Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What kind of food do you serve?" />
            </div>
            <div className="store-page__form-group">
              <label>Location</label>
              <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Food Court, North Campus" />
            </div>
            <button type="submit" className="store-page__btn store-page__btn--primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Store'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const bannerImg = store.images?.find(i => i.imageType === 'BANNER')?.imageUrl;
  const logoImg = store.images?.find(i => i.imageType === 'LOGO')?.imageUrl;

  return (
    <div className="store-page__container">
      <div className="store-page__header">
        <h1 className="store-page__title">Store Management</h1>
        {!isEditing && (
          <button className="store-page__btn store-page__btn--outline" onClick={() => setIsEditing(true)}>
            <Edit3 size={18} /> Edit Details
          </button>
        )}
      </div>

      <div className="store-page__profile-card">
        <div className="store-page__banner">
          {bannerImg ? (
            <img src={getTransformedUrl(bannerImg, 'restaurant-hero')} alt="Banner" className="store-page__banner-img" />
          ) : (
            <div className="store-page__banner-placeholder"></div>
          )}
          <label className="store-page__upload-btn store-page__upload-btn--banner">
            <Camera size={16} /> {uploadingImage ? 'Uploading...' : 'Change Banner'}
            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'BANNER')} disabled={uploadingImage} />
          </label>
        </div>

        <div className="store-page__content">
          <div className="store-page__logo-section">
            <div className="store-page__logo">
              {logoImg ? (
                <img src={getTransformedUrl(logoImg, 'avatar-lg')} alt="Logo" />
              ) : (
                <ImageIcon size={40} className="store-page__logo-icon" />
              )}
              <label className="store-page__upload-btn store-page__upload-btn--logo">
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'LOGO')} disabled={uploadingImage} />
              </label>
            </div>
            
            <div className="store-page__status-toggle">
              <span className={`store-page__status-badge ${store.open ? 'open' : 'closed'}`}>
                {store.open ? 'Accepting Orders' : 'Currently Closed'}
              </span>
              <label className="store-page__switch">
                <input type="checkbox" checked={store.open} onChange={toggleOpen} />
                <span className="store-page__slider"></span>
              </label>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleCreateOrUpdate} className="store-page__form store-page__form--editing">
              <div className="store-page__form-group">
                <label>Restaurant Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="store-page__form-group">
                <label>Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="store-page__form-group">
                <label>Location</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="store-page__form-actions">
                <button type="button" className="store-page__btn store-page__btn--cancel" onClick={() => {
                  setIsEditing(false);
                  setFormData({ name: store.name, description: store.description, location: store.location });
                }}>Cancel</button>
                <button type="submit" className="store-page__btn store-page__btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="store-page__info">
              <h2>{store.name}</h2>
              <div className="store-page__location">
                <MapPin size={18} />
                <span>{store.location}</span>
              </div>
              <p className="store-page__desc">{store.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
