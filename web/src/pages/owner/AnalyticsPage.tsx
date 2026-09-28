import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AnalyticsPage.css';

interface OrderItem {
  itemName: string;
  quantity: number;
}

interface Order {
  id: string | number;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  placedAt: string;
}

type Period = 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7_DAYS');

  useEffect(() => {
    const fetchAnalytics = async () => {
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
        
        const ordRes = await api.get(`/orders/restaurant/${rId}?size=500&sort=placedAt,desc`);
        setOrders(ordRes.data.data.content || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.placedAt);
      if (period === 'ALL_TIME') return true;
      if (period === 'TODAY') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (period === '7_DAYS') {
        const diff = now.getTime() - orderDate.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      if (period === '30_DAYS') {
        const diff = now.getTime() - orderDate.getTime();
        return diff <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [orders, period]);

  const metrics = useMemo(() => {
    const totalCount = filteredOrders.length;
    let deliveredCount = 0;
    let totalRevenue = 0;
    let cancelledCount = 0;
    let activeCount = 0;

    const itemSales: Record<string, { qty: number; rev: number }> = {};
    const dailyRevenue: Record<string, number> = {};

    filteredOrders.forEach(order => {
      if (order.status === 'DELIVERED') {
        deliveredCount++;
        totalRevenue += order.totalAmount;
        
        order.items.forEach(item => {
          if (!itemSales[item.itemName]) itemSales[item.itemName] = { qty: 0, rev: 0 };
          itemSales[item.itemName].qty += item.quantity;
          itemSales[item.itemName].rev += (order.totalAmount / order.items.length) * item.quantity; // rough estimate
        });
      } else if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
        cancelledCount++;
      } else {
        activeCount++;
      }

      // Daily revenue for last 7 days chart
      if (order.status === 'DELIVERED') {
        const d = new Date(order.placedAt);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        dailyRevenue[dayStr] = (dailyRevenue[dayStr] || 0) + order.totalAmount;
      }
    });

    const avgOrderValue = deliveredCount > 0 ? totalRevenue / deliveredCount : 0;
    const completionRate = totalCount > 0 ? (deliveredCount / totalCount) * 100 : 0;

    const topItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, qty: data.qty, rev: data.rev }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalRevenue,
      totalCount,
      avgOrderValue,
      completionRate,
      deliveredCount,
      cancelledCount,
      activeCount,
      topItems,
      dailyRevenue
    };
  }, [filteredOrders]);

  if (loading) return <div className="analytics-page__loading">Loading analytics...</div>;

  if (!restaurantId) {
    return <div className="analytics-page__empty">Create your store first to view analytics.</div>;
  }

  // Build chart data
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return daysOfWeek[d.getDay()];
  });

  const chartData = last7Days.map(day => ({
    day,
    revenue: metrics.dailyRevenue[day] || 0
  }));
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="analytics-page__container">
      <div className="analytics-page__header">
        <h1 className="analytics-page__title">Analytics Dashboard</h1>
        
        <div className="analytics-page__filters">
          <button className={`analytics-page__filter ${period === 'TODAY' ? 'active' : ''}`} onClick={() => setPeriod('TODAY')}>Today</button>
          <button className={`analytics-page__filter ${period === '7_DAYS' ? 'active' : ''}`} onClick={() => setPeriod('7_DAYS')}>7 Days</button>
          <button className={`analytics-page__filter ${period === '30_DAYS' ? 'active' : ''}`} onClick={() => setPeriod('30_DAYS')}>30 Days</button>
          <button className={`analytics-page__filter ${period === 'ALL_TIME' ? 'active' : ''}`} onClick={() => setPeriod('ALL_TIME')}>All Time</button>
        </div>
      </div>

      <div className="analytics-page__metrics-grid">
        <div className="analytics-page__metric-card">
          <span className="analytics-page__metric-label">Total Revenue</span>
          <span className="analytics-page__metric-value">₹{metrics.totalRevenue.toFixed(0)}</span>
        </div>
        <div className="analytics-page__metric-card">
          <span className="analytics-page__metric-label">Total Orders</span>
          <span className="analytics-page__metric-value">{metrics.totalCount}</span>
        </div>
        <div className="analytics-page__metric-card">
          <span className="analytics-page__metric-label">Avg Order Value</span>
          <span className="analytics-page__metric-value">₹{metrics.avgOrderValue.toFixed(0)}</span>
        </div>
        <div className="analytics-page__metric-card">
          <span className="analytics-page__metric-label">Completion Rate</span>
          <span className="analytics-page__metric-value">{metrics.completionRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="analytics-page__main-grid">
        <div className="analytics-page__card analytics-page__chart-section">
          <h2>Revenue (Last 7 Days)</h2>
          <div className="analytics-page__bar-chart">
            {chartData.map((data, idx) => {
              const heightPct = (data.revenue / maxRevenue) * 100;
              const isPeak = data.revenue === maxRevenue && data.revenue > 0;
              return (
                <div key={idx} className="analytics-page__bar-container">
                  <div className="analytics-page__bar-tooltip">₹{data.revenue.toFixed(0)}</div>
                  <div 
                    className={`analytics-page__bar ${isPeak ? 'peak' : ''}`} 
                    style={{ height: `${Math.max(heightPct, 5)}%` }}
                  ></div>
                  <span className="analytics-page__bar-label">{data.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="analytics-page__side-grid">
          <div className="analytics-page__card">
            <h2>Order Status</h2>
            <div className="analytics-page__progress-wrapper">
              <div className="analytics-page__progress-label">
                <span>Delivered</span>
                <span>{metrics.totalCount > 0 ? ((metrics.deliveredCount / metrics.totalCount) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="analytics-page__progress-track">
                <div className="analytics-page__progress-fill success" style={{ width: `${metrics.totalCount > 0 ? (metrics.deliveredCount / metrics.totalCount) * 100 : 0}%` }}></div>
              </div>
            </div>
            
            <div className="analytics-page__progress-wrapper">
              <div className="analytics-page__progress-label">
                <span>Active / Preparing</span>
                <span>{metrics.totalCount > 0 ? ((metrics.activeCount / metrics.totalCount) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="analytics-page__progress-track">
                <div className="analytics-page__progress-fill warning" style={{ width: `${metrics.totalCount > 0 ? (metrics.activeCount / metrics.totalCount) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div className="analytics-page__progress-wrapper">
              <div className="analytics-page__progress-label">
                <span>Cancelled / Rejected</span>
                <span>{metrics.totalCount > 0 ? ((metrics.cancelledCount / metrics.totalCount) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="analytics-page__progress-track">
                <div className="analytics-page__progress-fill error" style={{ width: `${metrics.totalCount > 0 ? (metrics.cancelledCount / metrics.totalCount) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          <div className="analytics-page__card">
            <h2>Top Selling Items</h2>
            {metrics.topItems.length === 0 ? (
              <p className="analytics-page__empty-text">No sales data available yet.</p>
            ) : (
              <div className="analytics-page__top-items">
                {metrics.topItems.map((item, idx) => (
                  <div key={idx} className="analytics-page__top-item">
                    <div className="analytics-page__top-item-info">
                      <span className="analytics-page__top-item-rank">#{idx + 1}</span>
                      <span className="analytics-page__top-item-name">{item.name}</span>
                    </div>
                    <div className="analytics-page__top-item-stats">
                      <span className="analytics-page__top-item-qty">{item.qty} sold</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
