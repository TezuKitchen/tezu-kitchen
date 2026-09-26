import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { uploadImage } from '../../services/imageService';
import { Plus, Edit2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import './MenuPage.css';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  imageUrl?: string;
}

const MenuPage: React.FC = () => {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;
      try {
        const res = await api.get(`/restaurants/owner/${user.id}`);
        const data = res.data.data;
        if (data && data.length > 0) {
          setRestaurantId(data[0].id);
          fetchMenu(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const fetchMenu = async (rId: string) => {
    try {
      const res = await api.get(`/menu/restaurant/${rId}`);
      setMenuItems(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', category: '' });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      let savedItem: any;
      if (editingItem) {
        const res = await api.put(`/menu/${editingItem.id}`, {
          ...formData,
          price: parseFloat(formData.price),
          isAvailable: editingItem.isAvailable
        });
        savedItem = res.data.data;
      } else {
        const res = await api.post('/menu', {
          ...formData,
          price: parseFloat(formData.price),
          restaurantId
        });
        savedItem = res.data.data;
      }

      if (selectedFile && savedItem) {
        const imgRes = await uploadImage(selectedFile, 'menu-items');
        await api.post(`/menu/${savedItem.id}/images`, {
          imageUrl: imgRes.url,
          cloudinaryPublicId: imgRes.publicId,
          displayOrder: 0
        });
      }

      fetchMenu(restaurantId);
      closeModal();
    } catch (err) {
      console.error('Failed to save menu item', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      fetchMenu(restaurantId!);
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !m.isAvailable } : m));
      await api.put(`/menu/${item.id}`, {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: !item.isAvailable
      });
    } catch (err) {
      setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: item.isAvailable } : m));
      console.error('Failed to toggle availability', err);
    }
  };

  if (loading) return <div className="menu-page__loading">Loading...</div>;
  if (!restaurantId) return <div className="menu-page__empty">Create your store first.</div>;

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="menu-page">
      <header className="menu-page__header">
        <h1>Menu Management</h1>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Add Item
        </button>
      </header>

      {menuItems.length === 0 ? (
        <div className="menu-page__empty-state">
          <ImageIcon size={48} />
          <p>No items on your menu yet.</p>
        </div>
      ) : (
        <div className="menu-page__content">
          {categories.map(category => (
            <div key={category} className="menu-category">
              <h2>{category}</h2>
              <div className="menu-grid">
                {menuItems.filter(item => item.category === category).map(item => (
                  <div key={item.id} className={`menu-card ${!item.isAvailable ? 'unavailable' : ''}`}>
                    <div className="menu-card__image">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className="placeholder-img"><ImageIcon size={24} /></div>}
                    </div>
                    <div className="menu-card__info">
                      <div className="menu-card__header">
                        <h3>{item.name}</h3>
                        <span className="price">₹{item.price}</span>
                      </div>
                      <p className="description">{item.description}</p>
                      
                      <div className="menu-card__actions">
                        <label className="toggle-switch">
                          <input type="checkbox" checked={item.isAvailable} onChange={() => toggleAvailability(item)} />
                          <span className="slider"></span>
                        </label>
                        <div className="action-btns">
                          <button onClick={() => openModal(item)} className="btn-icon"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(item.id)} className="btn-icon delete"><Trash2 size={16} /></button>
                        </div>
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button onClick={closeModal} className="btn-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" required min="0" step="1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Image</label>
                <input type="file" ref={fileInputRef} onChange={e => setSelectedFile(e.target.files?.[0] || null)} accept="image/*" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
