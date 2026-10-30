import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { uploadImage, getTransformedUrl } from '../../services/imageService';
import { Trash2, Edit2, Plus, Image as ImageIcon } from 'lucide-react';
import './MenuPage.css';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  images?: { imageUrl: string; cloudinaryPublicId: string; displayOrder: number }[];
}

const MenuPage: React.FC = () => {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = async () => {
    try {
      if (!user?.id && !user?.userId) return;
      const uId = user.id || user.userId;
      
      const restRes = await api.get(`/restaurants/owner/${uId}`);
      const restaurants = restRes.data.data;
      if (!restaurants || restaurants.length === 0) {
        setLoading(false);
        return;
      }
      
      const rId = restaurants[0].id;
      setRestaurantId(rId);
      
      const menuRes = await api.get(`/menu/restaurant/${rId}`);
      setMenuItems(menuRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [user]);

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await api.put(`/menu/${item.id}`, { ...item, available: !item.available });
      setMenuItems(items => items.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
    } catch (err) {
      console.error(err);
      alert('Failed to update availability');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      setMenuItems(items => items.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', category: '' });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setSubmitting(true);
    
    try {
      let savedItem: MenuItem;
      
      if (editingItem) {
        const res = await api.put(`/menu/${editingItem.id}`, {
          ...editingItem,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category
        });
        savedItem = res.data.data;
      } else {
        const res = await api.post('/menu', {
          restaurantId,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          available: true
        });
        savedItem = res.data.data;
      }

      if (imageFile) {
        const uploadResult = await uploadImage(imageFile, 'menu-items');
        await api.post(`/menu/${savedItem.id}/images`, {
          imageUrl: uploadResult.url,
          cloudinaryPublicId: uploadResult.publicId,
          displayOrder: 0
        });
      }

      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      console.error(err);
      alert('Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="menu-page__loading">Loading...</div>;

  if (!restaurantId) {
    return <div className="menu-page__empty">Create your store first to manage menu items.</div>;
  }

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="menu-page__container">
      <div className="menu-page__header">
        <h1 className="menu-page__title">Menu Items</h1>
        <button className="menu-page__add-btn" onClick={openAddModal}>
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {menuItems.length === 0 ? (
        <div className="menu-page__empty-state">
          <h2>No items on your menu yet</h2>
          <p>Start by adding your first delicious dish.</p>
          <button className="menu-page__add-btn-large" onClick={openAddModal}>Add Item</button>
        </div>
      ) : (
        <div className="menu-page__content">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="menu-page__category-section">
              <h2 className="menu-page__category-title">{category}</h2>
              <div className="menu-page__grid">
                {items.map(item => (
                  <div key={item.id} className="menu-page__card">
                    <div className="menu-page__image-container">
                      {item.images && item.images.length > 0 ? (
                        <img src={getTransformedUrl(item.images[0].imageUrl, 'menu-card')} alt={item.name} className="menu-page__image" />
                      ) : (
                        <div className="menu-page__image-placeholder">
                          <ImageIcon size={40} />
                        </div>
                      )}
                      <div className="menu-page__actions">
                        <button className="menu-page__action-btn edit" onClick={() => openEditModal(item)}><Edit2 size={16} /></button>
                        <button className="menu-page__action-btn delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    
                    <div className="menu-page__details">
                      <div className="menu-page__name-price">
                        <h3 className="menu-page__item-name">{item.name}</h3>
                        <span className="menu-page__item-price">₹{item.price}</span>
                      </div>
                      <p className="menu-page__item-desc">{item.description}</p>
                      
                      <div className="menu-page__footer">
                        <span className="menu-page__category-tag">{item.category}</span>
                        <label className="menu-page__toggle">
                          <input 
                            type="checkbox" 
                            checked={item.available} 
                            onChange={() => toggleAvailability(item)}
                          />
                          <span className="menu-page__slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="menu-page__modal-overlay">
          <div className="menu-page__modal">
            <h2 className="menu-page__modal-title">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
            <form onSubmit={handleSubmit} className="menu-page__form">
              <div className="menu-page__form-group">
                <label>Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="menu-page__form-group">
                <label>Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="menu-page__form-row">
                <div className="menu-page__form-group">
                  <label>Price (₹)</label>
                  <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="menu-page__form-group">
                  <label>Category</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Starters, Mains" />
                </div>
              </div>
              <div className="menu-page__form-group">
                <label>Image {editingItem && '(Leave empty to keep current)'}</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              </div>
              
              <div className="menu-page__modal-actions">
                <button type="button" className="menu-page__btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="menu-page__btn-save" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
