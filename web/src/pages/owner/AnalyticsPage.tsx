import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AnalyticsPage.css';

interface OrderItem {
  itemName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  placedAt: string;
  items: OrderItem[];
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<number>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;
      try {
        const res = await api.get(`/restaurants/owner/${user.id}`);
        const data = res.data.data;
        if (data && data.length > 0) {
          const rId = data[0].id;
          const ordersRes = await api.get(`/orders/restaurant/${rId}?size=500&sort=placedAt,desc`);
          setOrders(ordersRes.data.data.content || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  const metrics = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - period);

    const filtered = period === 0 ? orders : orders.filter(o => new Date(o.placedAt) >= cutoff);
    
    let deliveredCount = 0;
    let totalRevenue = 0;
    let inKitchenCount = 0;
    let cancelledCount = 0;

    const itemsMap: Record<string, { qty: number, rev: number }> = {};
    const dailyRev: Record<string, number> = {};

    filtered.forEach(o => {
      if (o.status === 'DELIVERED') {
        deliveredCount++;
        totalRevenue += o.totalAmount;
        
        const dateStr = new Date(o.placedAt).toLocaleDateString('en-US', { weekday: 'short' });
        dailyRev[dateStr] = (dailyRev[dateStr] || 0) + o.totalAmount;

        o.items.forEach(item => {
          if (!itemsMap[item.itemName]) itemsMap[item.itemName] = { qty: 0, rev: 0 };
          itemsMap[item.itemName].qty += item.quantity;
          itemsMap[item.itemName].rev += (item.quantity * item.price);
        });
      } else if (['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)) {
        inKitchenCount++;
      } else {
        cancelledCount++;
      }
    });

    const totalOrders = filtered.length;
    const avgOrderValue = deliveredCount > 0 ? totalRevenue / deliveredCount : 0;
    const completionRate = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;

    const topItems = Object.entries(itemsMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const chartData = [];
    let maxDailyRev = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const rev = dailyRev[label] || 0;
      if (rev > maxDailyRev) maxDailyRev = rev;
      chartData.push({ label, rev });
    }

    return {
      totalRevenue, totalOrders, avgOrderValue, completionRate,
      deliveredCount, inKitchenCount, cancelledCount, topItems, chartData, maxDailyRev
    };
  }, [orders, period]);

  if (loading) return <div className="analytics-page__loading">Loading analytics...</div>;

  return (
    <div className="analytics-page">
      <header className="analytics-page__header">
        <h1>Business Dashboard</h1>
        <div className="period-filters">
          <button className={period === 1 ? 'active' : ''} onClick={() => setPeriod(1)}>Today</button>
          <button className={period === 7 ? 'active' : ''} onClick={() => setPeriod(7)}>7 Days</button>
          <button className={period === 30 ? 'active' : ''} onClick={() => setPeriod(30)}>30 Days</button>
          <button className={period === 0 ? 'active' : ''} onClick={() => setPeriod(0)}>All Time</button>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="label">Total Revenue</span>
          <span className="value">₹{metrics.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="metric-card">
          <span className="label">Total Orders</span>
          <span className="value">{metrics.totalOrders}</span>
        </div>
        <div className="metric-card">
          <span className="label">Avg Order Value</span>
          <span className="value">₹{metrics.avgOrderValue.toFixed(0)}</span>
        </div>
        <div className="metric-card">
          <span className="label">Completion Rate</span>
          <span className="value">{metrics.completionRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="analytics-layout">
        <div className="chart-section">
          <h2>Revenue (Last 7 Days)</h2>
          <div className="bar-chart">
            {metrics.chartData.map(d => {
              const heightPct = metrics.maxDailyRev > 0 ? (d.rev / metrics.maxDailyRev) * 100 : 0;
              const isPeak = d.rev === metrics.maxDailyRev && d.rev > 0;
              return (
                <div key={d.label} className="bar-col">
                  <div className="bar-wrapper">
                    <div className={`bar ${isPeak ? 'peak' : ''}`} style={{ height: `${heightPct}%` }}>
                      <span className="tooltip">₹{d.rev}</span>
                    </div>
                  </div>
                  <span className="bar-label">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="breakdown-section">
          <h2>Order Status</h2>
          <div className="status-bars">
            <div className="status-bar-row">
              <div className="status-info">
                <span>Delivered</span>
                <span>{metrics.deliveredCount}</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill delivered" style={{ width: `${metrics.totalOrders ? (metrics.deliveredCount/metrics.totalOrders)*100 : 0}%` }}></div>
              </div>
            </div>
            <div className="status-bar-row">
              <div className="status-info">
                <span>In Kitchen</span>
                <span>{metrics.inKitchenCount}</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill kitchen" style={{ width: `${metrics.totalOrders ? (metrics.inKitchenCount/metrics.totalOrders)*100 : 0}%` }}></div>
              </div>
            </div>
            <div className="status-bar-row">
              <div className="status-info">
                <span>Cancelled</span>
                <span>{metrics.cancelledCount}</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill cancelled" style={{ width: `${metrics.totalOrders ? (metrics.cancelledCount/metrics.totalOrders)*100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="top-items-section">
        <h2>Top Selling Items</h2>
        <div className="top-items-list">
          {metrics.topItems.length > 0 ? metrics.topItems.map((item, idx) => (
            <div key={item.name} className="top-item-row">
              <span className="rank">#{idx + 1}</span>
              <span className="name">{item.name}</span>
              <span className="qty">{item.qty} sold</span>
              <span className="rev">₹{item.rev}</span>
            </div>
          )) : (
            <p className="no-data">No completed orders in this period.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
