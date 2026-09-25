import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Store,
  MapPin,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { typography, spacing, layout } from '../src/theme';
import { ThemeColors } from '../src/theme/colors';
import api from '../src/services/api';
import { getTransformedUrl } from '../src/services/imageService';
import { FavoriteRestaurant } from '../src/types';

export default function FavouritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      if (!user) return;
      const res = await api.get('/favorites');
      setFavorites(res.data.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleToggleFavorite = async (restaurantId: string, restaurantName: string) => {
    Alert.alert(
      'Remove from Favourites',
      `Are you sure you want to remove "${restaurantName}" from your favourites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const previousFavorites = [...favorites];
            // Optimistic update
            setFavorites((prev) => prev.filter((item) => item.restaurantId !== restaurantId));
            setTogglingId(restaurantId);

            try {
              await api.post(`/favorites/restaurant/${restaurantId}/toggle`);
            } catch (error) {
              console.error('Failed to remove favorite:', error);
              // Rollback on error
              setFavorites(previousFavorites);
              Alert.alert('Error', 'Failed to remove from favourites. Please try again.');
            } finally {
              setTogglingId(null);
            }
          },
        },
      ]
    );
  };

  const renderFavoriteCard = ({ item }: { item: FavoriteRestaurant }) => {
    const isClosed = item.restaurantIsOpen === false;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/restaurant/${item.restaurantId}` as any)}
      >
        <View style={styles.imageContainer}>
          {item.restaurantBannerUrl ? (
            <Image
              source={{ uri: getTransformedUrl(item.restaurantBannerUrl, 'restaurant-card') }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Store size={44} color={colors.textLight} />
            </View>
          )}

          {isClosed && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>CLOSED</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.heartButton}
            activeOpacity={0.8}
            disabled={togglingId === item.restaurantId}
            onPress={(e) => {
              e.stopPropagation?.();
              handleToggleFavorite(item.restaurantId, item.restaurantName);
            }}
            accessibilityLabel={`Remove ${item.restaurantName} from favourites`}
          >
            <Heart size={20} color={colors.primary} fill={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.restaurantName}
            </Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>4.5</Text>
              <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>

          {item.restaurantDescription ? (
            <Text style={styles.description} numberOfLines={2}>
              {item.restaurantDescription}
            </Text>
          ) : (
            <Text style={styles.description} numberOfLines={1}>
              Delicious hot meals & quick bites
            </Text>
          )}

          <View style={styles.footerRow}>
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.restaurantLocation || 'Tezpur University'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>25-30 min</Text>
            </View>
            <View style={styles.viewMenuRow}>
              <Text style={styles.viewMenuText}>Menu</Text>
              <ChevronRight size={14} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(student)/profile' as any);
            }
          }}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Favourites</Text>
          {favorites.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{favorites.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id || item.restaurantId}
          renderItem={renderFavoriteCard}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom, 24) + spacing.xl },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Heart size={44} color={colors.primary} fill={colors.borderSubtle} />
              </View>
              <Text style={styles.emptyTitle}>No Favourites Yet</Text>
              <Text style={styles.emptySub}>
                You haven't marked any kitchens as your favourite yet. Tap the heart on any dhaba or restaurant to save it here for quick access!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(student)' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreBtnText}>Explore Restaurants</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
      color: '#FFFFFF',
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.xs,
    },
    headerRightSpacer: {
      width: 32,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    listContainer: {
      padding: spacing.lg,
      flexGrow: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.lg,
      marginBottom: spacing.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...layout.shadows.md,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 150,
      backgroundColor: colors.borderSubtle,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closedBadge: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: layout.radius.sm,
    },
    closedText: {
      color: '#FFFFFF',
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xs,
      letterSpacing: 0.5,
    },
    heartButton: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      elevation: 5,
      ...layout.shadows.md,
    },
    cardContent: {
      padding: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.lg,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    ratingBadge: {
      backgroundColor: colors.success,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: layout.radius.sm,
      gap: 3,
    },
    ratingText: {
      color: '#FFFFFF',
      fontFamily: typography.fonts.heading,
      fontSize: 11,
    },
    description: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    metaText: {
      fontFamily: typography.fonts.bodyMedium,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    viewMenuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    viewMenuText: {
      fontFamily: typography.fonts.bodyBold,
      fontSize: typography.sizes.xs,
      color: colors.primary,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
      marginTop: spacing.xxl,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...layout.shadows.sm,
    },
    emptyTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xl,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptySub: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.xl,
    },
    exploreBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: layout.radius.pill,
      ...layout.shadows.brand,
    },
    exploreBtnText: {
      color: '#FFFFFF',
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.sm,
    },
  });
