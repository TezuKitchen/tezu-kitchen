import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { colors, typography, spacing, layout } from '../../src/theme';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  Calendar,
  IndianRupee,
} from 'lucide-react-native';

type Period = 'today' | '7days' | '30days' | 'all';
type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';

interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  priceAtOrder: number;
}

interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  totalAmount: number;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OwnerAnalyticsScreen() {
  const { user } = useAuth();
  const [restaurantName, setRestaurantName] = useState<string>('Your Restaurant');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7days');

  const effectiveUserId = user?.userId || (user as any)?.id;

  const fetchData = useCallback(async () => {
    try {
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }

      const resRes = await api.get(`/restaurants/owner/${effectiveUserId}`);
      const restaurants = resRes.data?.data;

      if (restaurants && restaurants.length > 0) {
        const myRes = restaurants[0];
        setRestaurantName(myRes.name);

        const ordersRes = await api.get(
          `/orders/restaurant/${myRes.id}?size=100&sort=placedAt,desc`
        );
        setOrders(ordersRes.data?.data?.content || []);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter orders by period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.placedAt);
      if (selectedPeriod === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (selectedPeriod === '7days') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (selectedPeriod === '30days') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [orders, selectedPeriod]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const deliveredOrders = filteredOrders.filter((o) => o.status === 'DELIVERED');
    const cancelledOrders = filteredOrders.filter(
      (o) => o.status === 'CANCELLED' || o.status === 'REJECTED'
    );
    const inProgressOrders = filteredOrders.filter(
      (o) =>
        o.status === 'PLACED' ||
        o.status === 'ACCEPTED' ||
        o.status === 'PREPARING' ||
        o.status === 'OUT_FOR_DELIVERY'
    );

    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0;
    const completionRate = totalOrders > 0 ? Math.round((deliveredOrders.length / totalOrders) * 100) : 0;

    return {
      totalRevenue,
      totalOrders,
      deliveredCount: deliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      inProgressCount: inProgressOrders.length,
      avgOrderValue,
      completionRate,
    };
  }, [filteredOrders]);

  // Daily Chart Data for the last 7 days
  const dailyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; date: string; revenue: number; ordersCount: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const daysOrders = orders.filter((o) => {
        const od = o.placedAt ? o.placedAt.split('T')[0] : '';
        return od === dateStr && o.status === 'DELIVERED';
      });

      const dayRevenue = daysOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      result.push({
        day: dayName,
        date: dateStr,
        revenue: dayRevenue,
        ordersCount: daysOrders.length,
      });
    }

    const maxRevenue = Math.max(...result.map((r) => r.revenue), 100);
    return { data: result, maxRevenue };
  }, [orders]);

  // Top Selling Items
  const topItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    filteredOrders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .forEach((order) => {
        order.items?.forEach((item) => {
          const existing = itemMap.get(item.itemName) || {
            name: item.itemName,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += item.quantity || 1;
          existing.revenue += (item.priceAtOrder || 0) * (item.quantity || 1);
          itemMap.set(item.itemName, existing);
        });
      });

    return Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics & Earnings</Text>
        <Text style={styles.headerSubtitle}>{restaurantName}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Tabs */}
        <View style={styles.periodTabs}>
          {(['today', '7days', '30days', 'all'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, selectedPeriod === p && styles.periodTabActive]}
              onPress={() => setSelectedPeriod(p)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodTabText,
                  selectedPeriod === p && styles.periodTabTextActive,
                ]}
              >
                {p === 'today' ? 'Today' : p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Metric Cards Grid */}
            <View style={styles.metricsGrid}>
              {/* Revenue Card */}
              <View style={[styles.metricCard, styles.revenueCard]}>
                <View style={styles.metricIconWrap}>
                  <TrendingUp size={20} color={colors.primary} />
                </View>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <Text style={styles.metricValue}>₹{metrics.totalRevenue.toLocaleString()}</Text>
                <Text style={styles.metricSub}>From {metrics.deliveredCount} delivered orders</Text>
              </View>

              {/* Total Orders */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <ShoppingBag size={20} color={colors.info} />
                </View>
                <Text style={styles.metricLabel}>Orders</Text>
                <Text style={styles.metricValue}>{metrics.totalOrders}</Text>
                <Text style={styles.metricSub}>{metrics.inProgressCount} in progress</Text>
              </View>

              {/* Avg Order Value */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#FDF2F8' }]}>
                  <Award size={20} color="#DB2777" />
                </View>
                <Text style={styles.metricLabel}>Avg Order Value</Text>
                <Text style={styles.metricValue}>₹{metrics.avgOrderValue}</Text>
                <Text style={styles.metricSub}>Per delivered order</Text>
              </View>

              {/* Completion Rate */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#F0FDF4' }]}>
                  <CheckCircle2 size={20} color={colors.success} />
                </View>
                <Text style={styles.metricLabel}>Completion Rate</Text>
                <Text style={styles.metricValue}>{metrics.completionRate}%</Text>
                <Text style={styles.metricSub}>{metrics.cancelledCount} cancelled</Text>
              </View>
            </View>

            {/* Daily Revenue Bar Chart */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>Daily Revenue (Past 7 Days)</Text>
                  <Text style={styles.cardSub}>Delivered sales per day</Text>
                </View>
                <Calendar size={18} color={colors.textMuted} />
              </View>

              <View style={styles.chartContainer}>
                {dailyData.data.map((item, idx) => {
                  const heightPercent = Math.max(
                    (item.revenue / dailyData.maxRevenue) * 100,
                    6
                  );
                  const isPeak = item.revenue === dailyData.maxRevenue && item.revenue > 0;

                  return (
                    <View key={idx} style={styles.chartColumn}>
                      <Text style={styles.barValueText}>
                        {item.revenue > 0 ? `₹${item.revenue}` : ''}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${heightPercent}%` },
                            isPeak && styles.barFillPeak,
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, isPeak && styles.barLabelPeak]}>
                        {item.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Order Status Breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Order Status Breakdown</Text>
              <Text style={styles.cardSub}>Fulfillment health for this period</Text>

              <View style={styles.statusBreakdown}>
                {/* Delivered */}
                <View style={styles.statusRow}>
                  <View style={styles.statusLeft}>
                    <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.statusName}>Delivered</Text>
                  </View>
                  <View style={styles.statusRight}>
                    <Text style={styles.statusCount}>{metrics.deliveredCount}</Text>
                    <Text style={styles.statusPercent}>
                      ({metrics.totalOrders ? Math.round((metrics.deliveredCount / metrics.totalOrders) * 100) : 0}%)
                    </Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.success,
                        width: `${metrics.totalOrders ? (metrics.deliveredCount / metrics.totalOrders) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>

                {/* In Progress */}
                <View style={[styles.statusRow, { marginTop: spacing.md }]}>
                  <View style={styles.statusLeft}>
                    <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                    <Text style={styles.statusName}>Active / In Kitchen</Text>
                  </View>
                  <View style={styles.statusRight}>
                    <Text style={styles.statusCount}>{metrics.inProgressCount}</Text>
                    <Text style={styles.statusPercent}>
                      ({metrics.totalOrders ? Math.round((metrics.inProgressCount / metrics.totalOrders) * 100) : 0}%)
                    </Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.warning,
                        width: `${metrics.totalOrders ? (metrics.inProgressCount / metrics.totalOrders) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>

                {/* Cancelled / Rejected */}
                <View style={[styles.statusRow, { marginTop: spacing.md }]}>
                  <View style={styles.statusLeft}>
                    <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
                    <Text style={styles.statusName}>Cancelled / Rejected</Text>
                  </View>
                  <View style={styles.statusRight}>
                    <Text style={styles.statusCount}>{metrics.cancelledCount}</Text>
                    <Text style={styles.statusPercent}>
                      ({metrics.totalOrders ? Math.round((metrics.cancelledCount / metrics.totalOrders) * 100) : 0}%)
                    </Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.error,
                        width: `${metrics.totalOrders ? (metrics.cancelledCount / metrics.totalOrders) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Top Selling Items */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>Top Selling Items</Text>
                  <Text style={styles.cardSub}>Most popular dishes by volume</Text>
                </View>
                <Award size={20} color={colors.primary} />
              </View>

              {topItems.length === 0 ? (
                <Text style={styles.emptyText}>No items sold yet in this period.</Text>
              ) : (
                topItems.map((item, idx) => (
                  <View
                    key={item.name}
                    style={[
                      styles.topItemRow,
                      idx === topItems.length - 1 && styles.topItemRowLast,
                    ]}
                  >
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemSalesSub}>{item.quantity} orders sold</Text>
                    </View>
                    <Text style={styles.itemRevenue}>₹{item.revenue.toLocaleString()}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.hero,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.borderSubtle,
    borderRadius: layout.radius.pill,
    padding: 3,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: layout.radius.pill,
  },
  periodTabActive: {
    backgroundColor: colors.surface,
    ...layout.shadows.sm,
  },
  periodTabText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  periodTabTextActive: {
    fontFamily: typography.fonts.heading,
    color: colors.primary,
  },
  centerBox: {
    paddingVertical: spacing.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    ...layout.shadows.sm,
  },
  revenueCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE2D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  metricValue: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginVertical: 2,
  },
  metricSub: {
    fontFamily: typography.fonts.body,
    fontSize: 10,
    color: colors.textLight,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.md,
    padding: spacing.lg,
    ...layout.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  cardSub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 22,
    height: 100,
    backgroundColor: colors.borderSubtle,
    borderRadius: layout.radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#FED7AA',
    borderRadius: layout.radius.sm,
  },
  barFillPeak: {
    backgroundColor: colors.primary,
  },
  barValueText: {
    fontFamily: typography.fonts.heading,
    fontSize: 9,
    color: colors.primary,
    marginBottom: 2,
  },
  barLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 10,
    color: colors.textMuted,
  },
  barLabelPeak: {
    fontFamily: typography.fonts.heading,
    color: colors.primary,
  },
  statusBreakdown: {
    marginTop: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusName: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusCount: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  statusPercent: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topItemRowLast: {
    borderBottomWidth: 0,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  itemSalesSub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  itemRevenue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
