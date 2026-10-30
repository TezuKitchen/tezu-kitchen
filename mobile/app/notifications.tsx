import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
  ChefHat,
  Bike,
  PackageCheck,
  Clock,
  AlertCircle,
  Tag,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useNotification, NotificationItem } from '../src/context/NotificationContext';
import { useTheme } from '../src/context/ThemeContext';
import { typography, spacing, layout } from '../src/theme';
import { ThemeColors } from '../src/theme/colors';

type FilterType = 'ALL' | 'ORDERS' | 'OFFERS';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications,
  } = useNotification();

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to remove all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'ORDERS') return item.type === 'ORDER' || !!item.orderId;
    if (filter === 'OFFERS') return item.type === 'PROMO';
    return true;
  });

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return new Date(timestamp).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (item: NotificationItem) => {
    if (item.status === 'ACCEPTED' || item.status === 'PREPARING') {
      return {
        icon: ChefHat,
        bgColor: '#FFEDD5',
        iconColor: '#EA580C',
      };
    }
    if (item.status === 'OUT_FOR_DELIVERY') {
      return {
        icon: Bike,
        bgColor: '#DCFCE7',
        iconColor: '#16A34A',
      };
    }
    if (item.status === 'DELIVERED') {
      return {
        icon: PackageCheck,
        bgColor: '#DCFCE7',
        iconColor: '#16A34A',
      };
    }
    if (item.status === 'CANCELLED' || item.status === 'REJECTED') {
      return {
        icon: AlertCircle,
        bgColor: '#FEE2E2',
        iconColor: '#DC2626',
      };
    }
    if (item.type === 'PROMO') {
      return {
        icon: Tag,
        bgColor: '#FEF3C7',
        iconColor: '#D97706',
      };
    }
    if (item.orderId) {
      return {
        icon: Clock,
        bgColor: '#F3F4F6',
        iconColor: '#6B7280',
      };
    }
    return {
      icon: Bell,
      bgColor: '#E0E7FF',
      iconColor: '#4F46E5',
    };
  };

  const handleNotificationPress = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.orderId) {
      router.push(`/order/${item.orderId}` as any);
    } else if (item.type === 'PROMO') {
      router.push('/(student)' as any);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconInfo = getNotificationIcon(item);
    const IconComponent = iconInfo.icon;

    return (
      <TouchableOpacity
        style={[
          styles.notifCard,
          !item.read && styles.notifCardUnread,
        ]}
        activeOpacity={0.75}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconWrapper, { backgroundColor: iconInfo.bgColor }]}>
          <IconComponent size={20} color={iconInfo.iconColor} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.notifTitle, !item.read && styles.notifTitleBold]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.timeText}>{formatRelativeTime(item.timestamp)}</Text>
          </View>

          <Text style={styles.notifBody} numberOfLines={2}>
            {item.body}
          </Text>

          {item.orderId && (
            <View style={styles.orderBadgeWrap}>
              <Text style={styles.orderBadgeText}>View Order Details</Text>
              <ChevronRight size={14} color={colors.primary} />
            </View>
          )}
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(student)');
            }
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.actionIconBtn}
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.actionIconBtn}
              accessibilityLabel="Clear all notifications"
            >
              <Trash2 size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'ORDERS', 'OFFERS'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
            onPress={() => setFilter(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === tab && styles.filterChipTextActive,
              ]}
            >
              {tab === 'ALL' ? 'All' : tab === 'ORDERS' ? 'Orders' : 'Campus Offers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.borderSubtle }]}>
              <Bell size={40} color={colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'ALL'
                ? "You're all caught up! Updates on your food orders and campus announcements will show up here."
                : `No ${filter.toLowerCase()} notifications found right now.`}
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(student)' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreBtnText}>Browse Campus Kitchens</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    backBtn: {
      padding: spacing.xs,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.lg,
      color: colors.text,
    },
    countBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: layout.radius.pill,
    },
    countBadgeText: {
      color: '#FFF',
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.xs,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    actionIconBtn: {
      padding: spacing.xs,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.borderSubtle,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
    },
    filterChipText: {
      fontFamily: typography.fonts.bodyMedium,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    filterChipTextActive: {
      color: '#FFF',
      fontFamily: typography.fonts.bodyBold,
    },
    listContent: {
      padding: spacing.md,
      gap: spacing.sm,
      flexGrow: 1,
    },
    notifCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: layout.radius.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...layout.shadows.sm,
    },
    notifCardUnread: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    cardContent: {
      flex: 1,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    notifTitle: {
      fontFamily: typography.fonts.bodyMedium,
      fontSize: typography.sizes.sm,
      color: colors.text,
      flex: 1,
      marginRight: spacing.xs,
    },
    notifTitleBold: {
      fontFamily: typography.fonts.heading,
      color: colors.text,
    },
    timeText: {
      fontFamily: typography.fonts.body,
      fontSize: 11,
      color: colors.textLight,
    },
    notifBody: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      lineHeight: 18,
    },
    orderBadgeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      gap: 2,
    },
    orderBadgeText: {
      fontFamily: typography.fonts.bodyBold,
      fontSize: 11,
      color: colors.primary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginLeft: spacing.xs,
      marginTop: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      marginTop: spacing.xl * 2,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.lg,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    exploreBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: layout.radius.md,
    },
    exploreBtnText: {
      color: '#FFF',
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.sm,
    },
  });
