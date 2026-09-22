import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Bell } from 'lucide-react-native';
import { colors, typography, spacing, layout } from '../../src/theme';
import api from '../../src/services/api';
import RestaurantCard from '../../src/components/RestaurantCard';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
  bannerUrl?: string;
  logoUrl?: string;
}

export default function StudentHome() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const [restRes, favRes] = await Promise.all([
        api.get('/restaurants'),
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
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.locationContainer}>
        <MapPin size={20} color={colors.primary} />
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationLabel}>Delivering to</Text>
          <Text style={styles.locationValue} numberOfLines={1}>Tezpur University Campus</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.notificationBtn}>
        <Bell size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderFavorites = () => {
    if (favorites.length === 0) return null;
    return (
      <View style={styles.favoritesSection}>
        <Text style={[styles.sectionTitle, { marginHorizontal: spacing.lg }]}>Your Favorites</Text>
        <FlatList
          data={favorites}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `fav-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.favoriteCard}
              onPress={() => router.push(`/restaurant/${item.restaurantId}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.favoriteName} numberOfLines={1}>{item.restaurantName}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
        />
      </View>
    );
  };

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

const styles = StyleSheet.create({
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
  },
  locationTextContainer: {
    marginLeft: spacing.sm,
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
});
