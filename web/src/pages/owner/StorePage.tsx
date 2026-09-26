import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { uploadImage } from '../../services/imageService';
import { Edit2, Camera, MapPin, Store, Check, X } from 'lucide-react';
import './StorePage.css';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  isOpen: boolean;
  images: { imageUrl: string, imageType: string }[];
}

const StorePage: React.FC = () => {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', location: '' });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const fetchStore = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/restaurants/owner/${user.id}`);
      const data = res.data.data;
      if (data && data.length > 0) {
        setRestaurant(data[0]);
        setFormData({
          name: data[0].name,
          description: data[0].description,
          location: data[0].location
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

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await api.post('/restaurants', { ...formData, ownerId: user.id });
      fetchStore();
    } catch (err) {
      console.error('Failed to create store', err);
    }
  };

  const handleUpdateStore = async () => {
    if (!restaurant) return;
    try {
      await api.put(`/restaurants/${restaurant.id}`, {
        ...formData,
        isOpen: restaurant.isOpen
      });
      setIsEditing(false);
      fetchStore();
    } catch (err) {
      console.error('Failed to update store', err);
    }
  };

  const handleToggleOpen = async () => {
    if (!restaurant) return;
    try {
      setRestaurant({ ...restaurant, isOpen: !restaurant.isOpen });
      await api.put(`/restaurants/${restaurant.id}`, {
        name: restaurant.name,
        description: restaurant.description,
        location: restaurant.location,
        isOpen: !restaurant.isOpen
      });
    } catch (err) {
      setRestaurant({ ...restaurant, isOpen: restaurant.isOpen });
      console.error('Failed to toggle status', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'LOGO' | 'BANNER') => {
    if (!e.target.files || !e.target.files[0] || !restaurant) return;
    const file = e.target.files[0];
    try {
      const result = await uploadImage(file, 'restaurants');
      await api.post(`/restaurants/${restaurant.id}/images`, {
        imageUrl: result.url,
        cloudinaryPublicId: result.publicId,
        imageType: type,
        displayOrder: 0
      });
      fetchStore();
    } catch (err) {
      console.error('Failed to upload image', err);
    }
  };

  if (loading) return <div className="store-page__loading">Loading...</div>;

  if (!restaurant) {
    return (
      <div className="store-page__create">
        <h2>Create Your Store</h2>
        <form onSubmit={handleCreateStore} className="store-form">
          <input placeholder="Store Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <textarea placeholder="Description" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <input placeholder="Location" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          <button type="submit" className="btn-primary">Create Store</button>
        </form>
      </div>
    );
  }

  const logoImg = restaurant.images?.find(img => img.imageType === 'LOGO')?.imageUrl;
  const bannerImg = restaurant.images?.find(img => img.imageType === 'BANNER')?.imageUrl;

  return (
    <div className="store-page">
      <div className="store-page__banner" style={{ backgroundImage: bannerImg ? `url(${bannerImg})` : 'none', backgroundColor: 'var(--color-border)' }}>
        <button className="change-img-btn" onClick={() => bannerInputRef.current?.click()}>
          <Camera size={16} /> Change Banner
        </button>
        <input type="file" hidden ref={bannerInputRef} onChange={e => handleImageUpload(e, 'BANNER')} accept="image/*" />
      </div>

      <div className="store-page__content">
        <div className="store-page__logo-wrapper">
          <div className="store-page__logo">
            {logoImg ? <img src={logoImg} alt="Logo" /> : <Store size={40} color="var(--color-text-muted)" />}
          </div>
          <button className="change-img-btn-sm" onClick={() => logoInputRef.current?.click()}>
            <Camera size={14} />
          </button>
          <input type="file" hidden ref={logoInputRef} onChange={e => handleImageUpload(e, 'LOGO')} accept="image/*" />
        </div>

        <div className="store-page__header-actions">
          <label className="toggle-switch">
            <input type="checkbox" checked={restaurant.isOpen} onChange={handleToggleOpen} />
            <span className="slider"></span>
            <span className="label-text">{restaurant.isOpen ? 'Accepting Orders' : 'Currently Closed'}</span>
          </label>
          {!isEditing && (
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="store-form inline-edit">
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            <div className="form-actions">
              <button onClick={() => setIsEditing(false)} className="btn-cancel"><X size={16} /> Cancel</button>
              <button onClick={handleUpdateStore} className="btn-save"><Check size={16} /> Save</button>
            </div>
          </div>
        ) : (
          <div className="store-page__info">
            <h1>{restaurant.name}</h1>
            <p className="description">{restaurant.description}</p>
            <p className="location"><MapPin size={16} /> {restaurant.location}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePage;
