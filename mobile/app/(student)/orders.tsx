import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { colors, typography, spacing, layout } from '../../src/theme';

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

export default function StudentOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE');

  const fetchOrders = useCallback(async () => {
    try {
      if (!user?.userId) return;
      const response = await api.get(`/orders/user/${user.userId}?size=50&sort=placedAt,desc`);
      setOrders(response.data.data.content || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const cancelOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/orders/${orderId}/status`, { status: 'CANCELLED' });
              fetchOrders();
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order');
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: OrderStatus) => {
    const statusKey = status.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase()) as keyof typeof colors.status;
    return (colors.status as any)[statusKey] || colors.textLight;
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'ACTIVE') return ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status);
    return ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(o.status);
  });

  const renderOrder = ({ item }: { item: Order }) => {
    const itemSummary = item.items.map(i => `${i.quantity}× ${i.itemName}`).join(', ');
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>{itemSummary}</Text>
        </View>
        
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalText}>₹{item.totalAmount.toFixed(2)}</Text>
            <Text style={styles.timeText}>{formatDateTime(item.placedAt)}</Text>
          </View>
          
          {(item.status === 'PLACED' || item.status === 'ACCEPTED') && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => cancelOrder(item.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabs}>
        {(['ACTIVE', 'PAST'] as const).map(tab => (
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
        renderItem={renderOrder}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} orders</Text>
            <Text style={styles.emptySub}>When you place an order, it will show up here.</Text>
          </View>
        }
      />
    </SafeAreaView>
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
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  restaurantName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
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
  summaryContainer: {
    marginVertical: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  summaryText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  totalText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: 2,
  },
  timeText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.radius.sm,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  emptyTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
