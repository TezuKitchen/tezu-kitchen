import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { colors, typography, spacing, layout } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';

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
  deliveryAddress: string;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'DONE'>('NEW');

  const effectiveUserId = user?.userId || (user as any)?.id;

  const fetchRestaurantAndOrders = useCallback(async () => {
    try {
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }
      
      let currentRestaurantId = restaurantId;
      if (!currentRestaurantId) {
        const resRes = await api.get(`/restaurants/owner/${effectiveUserId}`);
        const restaurants = resRes.data?.data;
        if (restaurants && restaurants.length > 0) {
          currentRestaurantId = restaurants[0].id;
          setRestaurantId(currentRestaurantId);
        } else {
          setLoading(false);
          return;
        }
      }

      if (currentRestaurantId) {
        const ordersRes = await api.get(`/orders/restaurant/${currentRestaurantId}?size=50&sort=placedAt,desc`);
        setOrders(ordersRes.data?.data?.content || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveUserId, restaurantId]);

  useEffect(() => {
    fetchRestaurantAndOrders();
    const intervalId = setInterval(() => {
      fetchRestaurantAndOrders();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchRestaurantAndOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurantAndOrders();
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchRestaurantAndOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} d ago`;
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'NEW') return o.status === 'PLACED';
    if (activeTab === 'ACTIVE') return ['ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status);
    return ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(o.status);
  });

  const getStatusColor = (status: OrderStatus) => {
    const statusKey = status.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase()) as keyof typeof colors.status;
    return (colors.status as any)[statusKey] || colors.textLight;
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.substring(0, 8).toUpperCase()}</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(item.placedAt)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      
      <View style={styles.itemsList}>
        {item.items.map((orderItem) => (
          <Text key={orderItem.id} style={styles.itemText}>
            {orderItem.quantity} × {orderItem.itemName}
          </Text>
        ))}
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.totalText}>Total: ₹{item.totalAmount.toFixed(2)}</Text>
        <Text style={styles.addressText} numberOfLines={1}>{item.deliveryAddress}</Text>
      </View>

      {item.status === 'PLACED' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnReject]} 
            onPress={() => updateOrderStatus(item.id, 'REJECTED')}
          >
            <Text style={styles.btnTextReject}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnAccept]} 
            onPress={() => updateOrderStatus(item.id, 'ACCEPTED')}
          >
            <Text style={styles.btnTextAccept}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'ACCEPTED' && (
        <TouchableOpacity 
          style={[styles.btnFull, { backgroundColor: colors.status.preparing }]} 
          onPress={() => updateOrderStatus(item.id, 'PREPARING')}
        >
          <Text style={styles.btnFullText}>Start Preparing</Text>
        </TouchableOpacity>
      )}

      {item.status === 'PREPARING' && (
        <TouchableOpacity 
          style={[styles.btnFull, { backgroundColor: colors.status.outForDelivery }]} 
          onPress={() => updateOrderStatus(item.id, 'OUT_FOR_DELIVERY')}
        >
          <Text style={styles.btnFullText}>Out for Delivery</Text>
        </TouchableOpacity>
      )}

      {item.status === 'OUT_FOR_DELIVERY' && (
        <TouchableOpacity 
          style={[styles.btnFull, { backgroundColor: colors.status.delivered }]} 
          onPress={() => updateOrderStatus(item.id, 'DELIVERED')}
        >
          <Text style={styles.btnFullText}>Mark Delivered</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!restaurantId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="storefront-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyTitle}>Create your store first</Text>
        <Text style={styles.emptySub}>You need a restaurant to receive orders.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['NEW', 'ACTIVE', 'DONE'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontFamily: typography.fonts.bodyBold,
  },
  listContainer: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(layout.shadows as any).sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderId: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  timeAgo: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.pill,
  },
  badgeText: {
    color: '#FFF',
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.xs,
  },
  itemsList: {
    marginVertical: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  itemText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  addressText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReject: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.error,
  },
  btnTextReject: {
    color: colors.error,
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
  },
  btnAccept: {
    backgroundColor: colors.success,
  },
  btnTextAccept: {
    color: '#FFF',
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
  },
  btnFull: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFullText: {
    color: '#FFF',
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
  },
  emptyTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  }
});
