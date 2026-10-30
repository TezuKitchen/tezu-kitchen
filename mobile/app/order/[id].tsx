import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  PackageCheck,
  AlertCircle,
  XCircle,
  MapPin,
  Store,
  Receipt,
  RotateCw,
} from 'lucide-react-native';
import api from '../../src/services/api';
import { typography, spacing, layout } from '../../src/theme';
import { ThemeColors } from '../../src/theme/colors';
import { useTheme } from '../../src/context/ThemeContext';

type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  priceAtOrder: number;
}

interface OrderDetails {
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

const ORDER_STEPS: { status: OrderStatus; label: string; description: string; icon: any }[] = [
  {
    status: 'PLACED',
    label: 'Order Placed',
    description: 'Sent to restaurant for confirmation',
    icon: Clock,
  },
  {
    status: 'ACCEPTED',
    label: 'Order Accepted',
    description: 'Restaurant has accepted your order',
    icon: CheckCircle2,
  },
  {
    status: 'PREPARING',
    label: 'In the Kitchen',
    description: 'Food is being freshly prepared',
    icon: ChefHat,
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    description: 'Your food is on its way to you',
    icon: Bike,
  },
  {
    status: 'DELIVERED',
    label: 'Delivered',
    description: 'Enjoy your delicious meal!',
    icon: PackageCheck,
  },
];

const STEP_ORDER: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrder = useCallback(
    async (isManualRefresh = false) => {
      if (!id) return;
      if (isManualRefresh) setRefreshing(true);
      try {
        const response = await api.get(`/orders/${id}`);
        const data = response.data?.data;
        if (data) {
          setOrder(data);
        }
      } catch (err) {
        console.error('Failed to load order details:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchOrder();

    // Auto poll every 6s if order is active
    timerRef.current = setInterval(() => {
      fetchOrder();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchOrder]);

  // Stop polling once order reaches terminal state
  useEffect(() => {
    if (order && ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(order.status)) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [order?.status]);

  const handleCancelOrder = async () => {
    if (!order) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.put(`/orders/${order.id}/cancel`);
              await fetchOrder();
            } catch (err: any) {
              const msg = err?.response?.data?.message || 'Could not cancel order. It might already be in preparation.';
              Alert.alert('Unable to Cancel', msg);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return colors.status.placed; // Grey
      case 'ACCEPTED':
      case 'PREPARING':
        return colors.status.accepted; // Orange (middle kitchen steps)
      case 'OUT_FOR_DELIVERY':
      case 'DELIVERED':
        return colors.status.delivered; // Green
      case 'CANCELLED':
      case 'REJECTED':
        return colors.status.cancelled; // Red
      default:
        return colors.textLight;
    }
  };

  const getStepState = (stepStatus: OrderStatus, currentStatus: OrderStatus) => {
    if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') {
      return 'inactive';
    }
    const currentIndex = STEP_ORDER.indexOf(currentStatus);
    const stepIndex = STEP_ORDER.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.emptyTitle}>Order Not Found</Text>
          <Text style={styles.emptySubtitle}>We couldn't retrieve the details for this order.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(student)/orders')}>
            <Text style={styles.primaryButtonText}>View All Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isTerminal = ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(order.status);
  const canCancel = order.status === 'PLACED' || order.status === 'ACCEPTED';
  const subtotal = order.items.reduce((sum, item) => sum + item.priceAtOrder * item.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(student)/orders');
            }
          }}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>{formatDateTime(order.placedAt)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchOrder(true)}
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <RotateCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrder(true)}
            colors={[colors.primary]}
          />
        }
      >
        {/* Terminal Alert Banner for Cancelled/Rejected */}
        {order.status === 'CANCELLED' && (
          <View style={[styles.terminalBanner, { backgroundColor: '#FEE2E2', borderColor: colors.error }]}>
            <XCircle size={28} color={colors.error} />
            <View style={styles.terminalBannerText}>
              <Text style={[styles.terminalBannerTitle, { color: colors.error }]}>Order Cancelled</Text>
              <Text style={styles.terminalBannerDesc}>
                This order was cancelled. Any online payment will be refunded to the source account.
              </Text>
            </View>
          </View>
        )}

        {order.status === 'REJECTED' && (
          <View style={[styles.terminalBanner, { backgroundColor: '#FEF3C7', borderColor: '#D97706' }]}>
            <AlertCircle size={28} color="#D97706" />
            <View style={styles.terminalBannerText}>
              <Text style={[styles.terminalBannerTitle, { color: '#D97706' }]}>Order Rejected</Text>
              <Text style={styles.terminalBannerDesc}>
                The restaurant was unable to accept this order. Any online payment will be refunded.
              </Text>
            </View>
          </View>
        )}

        {/* Live Tracking Progress Card */}
        {order.status !== 'CANCELLED' && order.status !== 'REJECTED' && (
          <View style={styles.card}>
            <View style={styles.statusHeader}>
              <Text style={styles.sectionHeaderTitle}>Live Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusBadgeText}>{order.status.replace(/_/g, ' ')}</Text>
              </View>
            </View>

            <View style={styles.timeline}>
              {ORDER_STEPS.map((step, index) => {
                const stepState = getStepState(step.status, order.status);
                const isLast = index === ORDER_STEPS.length - 1;
                const IconComponent = step.icon;

                let iconColor = colors.textLight;
                let circleBg = colors.borderSubtle;
                let circleBorder = colors.borderSubtle;
                let titleColor = colors.textMuted;

                if (stepState === 'completed') {
                  iconColor = '#FFF';
                  circleBg = colors.success;
                  circleBorder = colors.success;
                  titleColor = colors.text;
                } else if (stepState === 'current') {
                  const stepColor = getStatusColor(step.status);
                  iconColor = '#FFF';
                  circleBg = stepColor;
                  circleBorder = stepColor;
                  titleColor = stepColor;
                }

                return (
                  <View key={step.status} style={styles.stepRow}>
                    <View style={styles.stepIndicatorColumn}>
                      <View style={[styles.stepCircle, { backgroundColor: circleBg, borderColor: circleBorder }]}>
                        <IconComponent size={16} color={iconColor} />
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.stepLine,
                            {
                              backgroundColor:
                                stepState === 'completed' ? colors.success : colors.borderSubtle,
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, { color: titleColor }]}>{step.label}</Text>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Restaurant & Delivery Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Delivery Info</Text>

          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: colors.borderSubtle }]}>
              <Store size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Restaurant</Text>
              <Text style={styles.infoValue}>{order.restaurantName}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: colors.borderSubtle }]}>
              <MapPin size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Delivery Location</Text>
              <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        {/* Order Items & Bill Breakdown */}
        <View style={styles.card}>
          <View style={styles.billHeader}>
            <Receipt size={18} color={colors.primary} />
            <Text style={[styles.sectionHeaderTitle, { marginLeft: spacing.sm }]}>Order Summary</Text>
          </View>

          <View style={styles.itemsList}>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemQuantityBadge}>
                  <Text style={styles.itemQuantityText}>{item.quantity}×</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.itemName}
                </Text>
                <Text style={styles.itemPrice}>₹{(item.priceAtOrder * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.billRow}>
            <Text style={styles.billRowLabel}>Item Total</Text>
            <Text style={styles.billRowValue}>₹{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billRowLabel}>Delivery Partner Fee</Text>
            <Text style={[styles.billRowValue, { color: colors.success }]}>FREE (Campus)</Text>
          </View>

          <View style={[styles.infoDivider, { marginVertical: spacing.sm }]} />

          <View style={styles.billRowTotal}>
            <Text style={styles.billTotalLabel}>Grand Total</Text>
            <Text style={styles.billTotalValue}>₹{order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Cancellation Section */}
        {canCancel && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.cancelOrderButton}
              onPress={handleCancelOrder}
              disabled={cancelling}
              activeOpacity={0.7}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.cancelHint}>
              You can cancel this order until the kitchen begins food preparation.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    backButton: {
      padding: spacing.xs,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.lg,
      color: colors.text,
    },
    headerSubtitle: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 2,
    },
    refreshButton: {
      padding: spacing.xs,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    loadingText: {
      marginTop: spacing.md,
      fontFamily: typography.fonts.bodyMedium,
      fontSize: typography.sizes.md,
      color: colors.textMuted,
    },
    emptyTitle: {
      marginTop: spacing.lg,
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xl,
      color: colors.text,
    },
    emptySubtitle: {
      marginTop: spacing.xs,
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
    primaryButton: {
      marginTop: spacing.lg,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: layout.radius.md,
    },
    primaryButtonText: {
      color: '#FFF',
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.md,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    terminalBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: layout.radius.md,
      borderWidth: 1,
      gap: spacing.md,
    },
    terminalBannerText: {
      flex: 1,
    },
    terminalBannerTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.md,
      marginBottom: 2,
    },
    terminalBannerDesc: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.xs,
      color: '#4B5563',
      lineHeight: 18,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    statusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionHeaderTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: layout.radius.pill,
    },
    statusBadgeText: {
      color: '#FFF',
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.xs,
    },
    timeline: {
      paddingLeft: spacing.xs,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepIndicatorColumn: {
      alignItems: 'center',
      width: 32,
    },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      zIndex: 2,
    },
    stepLine: {
      width: 2,
      height: 38,
      marginVertical: -2,
    },
    stepContent: {
      flex: 1,
      marginLeft: spacing.md,
      paddingBottom: spacing.lg,
    },
    stepTitle: {
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.sm,
    },
    stepDesc: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: spacing.xs,
    },
    infoIconBox: {
      width: 36,
      height: 36,
      borderRadius: layout.radius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoTextBox: {
      flex: 1,
    },
    infoLabel: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.xs,
      color: colors.textLight,
    },
    infoValue: {
      fontFamily: typography.fonts.bodyMedium,
      fontSize: typography.sizes.sm,
      color: colors.text,
      marginTop: 2,
    },
    infoDivider: {
      height: 1,
      backgroundColor: colors.borderSubtle,
      marginVertical: spacing.sm,
    },
    billHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    itemsList: {
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemQuantityBadge: {
      backgroundColor: colors.borderSubtle,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: layout.radius.sm,
      marginRight: spacing.sm,
    },
    itemQuantityText: {
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.xs,
      color: colors.text,
    },
    itemName: {
      flex: 1,
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    itemPrice: {
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.sm,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    billRowLabel: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
    billRowValue: {
      fontFamily: typography.fonts.bodyMedium,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    billRowTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    billTotalLabel: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    billTotalValue: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.lg,
      color: colors.primary,
    },
    actionContainer: {
      marginTop: spacing.sm,
      alignItems: 'center',
      gap: spacing.xs,
    },
    cancelOrderButton: {
      width: '100%',
      paddingVertical: spacing.md,
      borderRadius: layout.radius.md,
      borderWidth: 1,
      borderColor: colors.error,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelOrderButtonText: {
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.md,
      color: colors.error,
    },
    cancelHint: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
