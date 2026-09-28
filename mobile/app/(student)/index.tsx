import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MapPin, Bell, User } from 'lucide-react-native';
import { typography, spacing, layout } from '../../src/theme';
import { ThemeColors } from '../../src/theme/colors';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import RestaurantCard from '../../src/components/RestaurantCard';
import { useAuth } from '../../src/context/AuthContext';
import { useNotification } from '../../src/context/NotificationContext';
import { getTransformedUrl } from '../../src/services/imageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
  bannerUrl?: string;
  logoUrl?: string;
}

import { FavoriteRestaurant } from '../../src/types';

const DISH_CATEGORIES = [
  {
    id: 'biryani',
    name: 'Biryani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80',
    query: 'Biryani',
  },
  {
    id: 'paneer',
    name: 'Paneer',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&auto=format&fit=crop&q=80',
    query: 'Paneer',
  },
  {
    id: 'momos',
    name: 'Momos',
    image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=200&auto=format&fit=crop&q=80',
    query: 'Momo',
  },
  {
    id: 'rolls',
    name: 'Rolls',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80',
    query: 'Roll',
  },
  {
    id: 'noodles',
    name: 'Noodles',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&auto=format&fit=crop&q=80',
    query: 'Noodles',
  },
  {
    id: 'dosa',
    name: 'Dosa',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&auto=format&fit=crop&q=80',
    query: 'Dosa',
  },
  {
    id: 'burger',
    name: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80',
    query: 'Burger',
  },
  {
    id: 'friedrice',
    name: 'Fried Rice',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&auto=format&fit=crop&q=80',
    query: 'Fried Rice',
  },
  {
    id: 'coffee',
    name: 'Chai & Coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
    query: 'Coffee',
  },
  {
    id: 'paratha',
    name: 'Paratha',
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&auto=format&fit=crop&q=80',
    query: 'Paratha',
  },
];

export default function StudentHome() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { unreadCount } = useNotification();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<string>('Tezpur University Campus');

  const fetchDeliveryLocation = useCallback(async () => {
    try {
      // 1. Fetch latest order from backend if user is authenticated
      const uid = user?.userId || user?.id;
      if (uid) {
        try {
          const ordersRes = await api.get(`/orders/user/${uid}?size=1&sort=placedAt,desc`);
          const latestOrder = ordersRes.data?.data?.content?.[0];
          if (latestOrder?.deliveryAddress) {
            const cleanAddr = latestOrder.deliveryAddress.replace(/\s*\(Note:.*?\)$/i, '').trim();
            if (cleanAddr) {
              setDeliveryLocation(cleanAddr);
              await AsyncStorage.setItem('@tezu_kitchen_last_ordered_address', cleanAddr);
              return;
            }
          }
        } catch (orderErr) {
          // If network fetch fails, continue checking cached / saved addresses
        }
      }

      // 2. Check cached last ordered address
      const cachedLastOrderAddr = await AsyncStorage.getItem('@tezu_kitchen_last_ordered_address');
      if (cachedLastOrderAddr && cachedLastOrderAddr.trim()) {
        const cleanCached = cachedLastOrderAddr.replace(/\s*\(Note:.*?\)$/i, '').trim();
        if (cleanCached) {
          setDeliveryLocation(cleanCached);
          return;
        }
      }

      // 3. Fallback to user's saved address from profile
      if (user?.address && user.address.trim()) {
        setDeliveryLocation(user.address.trim());
        return;
      }
      if (user?.savedAddresses && user.savedAddresses.length > 0 && user.savedAddresses[0].trim()) {
        setDeliveryLocation(user.savedAddresses[0].trim());
        return;
      }

      // 4. Default fallback
      setDeliveryLocation('Tezpur University Campus');
    } catch (e) {
      console.warn('Error resolving delivery location:', e);
    }
  }, [user]);

  const fetchRestaurants = useCallback(async () => {
    try {
      const [restRes, favRes] = await Promise.all([
        api.get('/restaurants?size=100'),
        api.get('/favorites').catch(() => ({ data: { data: [] } }))
      ]);
      setRestaurants(restRes.data.data.content);
      setFavorites(favRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProfile?.();
      fetchDeliveryLocation();
      fetchRestaurants();
    }, [refreshProfile, fetchDeliveryLocation, fetchRestaurants])
  );

  useEffect(() => {
    fetchRestaurants();
    fetchDeliveryLocation();
  }, [fetchDeliveryLocation, fetchRestaurants]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
    fetchDeliveryLocation();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.locationContainer}
        onPress={() => router.push('/(student)/edit-profile' as any)}
        activeOpacity={0.7}
        accessibilityLabel="Change delivery address"
      >
        <MapPin size={20} color={colors.primary} />
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationLabel}>Delivering to</Text>
          <Text style={styles.locationValue} numberOfLines={1}>
            {deliveryLocation}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => router.push('/notifications' as any)}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Bell size={20} color={colors.text} />
          {unreadCount > 0 && <View style={styles.unreadBadgeDot} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push('/(student)/profile' as any)}
          activeOpacity={0.7}
        >
          {user?.avatarUrl ? (
            <Image
              source={{ uri: getTransformedUrl(user.avatarUrl, 'avatar-sm') }}
              style={styles.profileAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder]}>
              <User size={16} color={colors.textLight} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFavorites = () => {
    if (favorites.length === 0) return null;
    return (
      <View style={styles.favoritesSection}>
        <View style={styles.favoritesHeaderRow}>
          <Text style={styles.sectionTitle}>Your Favorites</Text>
          <TouchableOpacity
            onPress={() => router.push('/favourites' as any)}
            activeOpacity={0.7}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All ({favorites.length})
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={favorites}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `fav-${item.id || item.restaurantId}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.favoriteCard}
              onPress={() => router.push(`/restaurant/${item.restaurantId}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.favoriteName} numberOfLines={1}>{item.restaurantName}</Text>
              <Text style={styles.favoriteTags} numberOfLines={1}>
                {item.restaurantLocation || 'Tap to view menu'}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
        />
      </View>
    );
  };

  const renderDishCategories = () => (
    <View style={styles.categoriesSection}>
      <Text style={[styles.sectionTitle, { marginHorizontal: spacing.lg }]}>
        What's on your mind?
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScrollContent}
      >
        {DISH_CATEGORIES.map((dish) => (
          <TouchableOpacity
            key={dish.id}
            style={styles.categoryItem}
            activeOpacity={0.75}
            onPress={() => router.push({ pathname: '/(student)/search', params: { q: dish.query } } as any)}
          >
            <View style={[styles.dishCircle, { borderColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
              <Image
                source={{ uri: dish.image }}
                style={styles.dishImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.dishName} numberOfLines={1}>
              {dish.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListHeaderComponent={
            <>
              {renderDishCategories()}
              {renderFavorites()}
              <Text style={[styles.sectionTitle, { marginHorizontal: spacing.lg, marginTop: spacing.md }]}>All Restaurants</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No restaurants available right now.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <RestaurantCard
                id={item.id}
                name={item.name}
                description={item.description}
                location={item.location}
                isOpen={item.open}
                bannerUrl={item.bannerUrl}
                logoUrl={item.logoUrl}
                onPress={() => router.push(`/restaurant/${item.id}`)}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  locationTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  locationLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  locationValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  notificationBtn: {
    padding: spacing.sm,
    backgroundColor: colors.borderSubtle,
    borderRadius: 999,
    position: 'relative',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileBtn: {
    padding: 2,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileAvatarPlaceholder: {
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 100, // padding for bottom tab bar
  },
  sectionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritesSection: {
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  favoritesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  seeAllBtn: {
    paddingVertical: spacing.xs,
  },
  seeAllText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
  },
  favoriteCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...layout.shadows.sm,
  },
  favoriteName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  favoriteTags: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  categoriesSection: {
    marginBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  categoriesScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  dishCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1.5,
    marginBottom: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    ...layout.shadows.sm,
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  dishName: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.text,
    textAlign: 'center',
  },
});
