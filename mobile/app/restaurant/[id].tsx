import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Clock, ShoppingBag, Heart } from 'lucide-react-native';
import { Image } from 'expo-image';
import { colors, typography, spacing, layout } from '../../src/theme';
import api from '../../src/services/api';
import { getTransformedUrl } from '../../src/services/imageService';
import MenuItemCard, { MenuItem } from '../../src/components/MenuItemCard';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';

interface RestaurantDetails {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
  averageRating?: number;
  reviewCount?: number;
  bannerUrl?: string;
  logoUrl?: string;
  images?: any[];
}

export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const { user } = useAuth();
  
  const heroHeight = Math.max(220, 180 + insets.top);
  const topButtonInset = Math.max(insets.top, 16) + 8;
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toggleFavLoading, setToggleFavLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, restRes, reviewsRes] = await Promise.all([
          api.get(`/menu/restaurant/${id}/available`),
          api.get(`/restaurants/${id}`),
          api.get(`/reviews/restaurant/${id}`).catch(() => ({ data: { data: { content: [] } } }))
        ]);
        setMenuItems(menuRes.data.data);
        setRestaurant(restRes.data.data);
        setReviews(reviewsRes.data.data || []);


        if (user) {
          try {
            const favRes = await api.get('/favorites');
            const favs = favRes.data.data || [];
            setIsFavorite(favs.some((fav: any) => fav.restaurantId === id));
          } catch (e) {
            console.error('Failed to fetch favorites', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      return;
    }
    setToggleFavLoading(true);
    try {
      await api.post(`/favorites/restaurant/${id}/toggle`);
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    } finally {
      setToggleFavLoading(false);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.heroPlaceholder, { height: heroHeight }]}>
        {restaurant?.bannerUrl ? (
          <Image
            source={{ uri: getTransformedUrl(restaurant.bannerUrl, 'restaurant-hero') }}
            style={[styles.heroImage, { height: heroHeight }]}
            contentFit="cover"
            transition={300}
          />
        ) : null}
        <TouchableOpacity 
          style={[styles.backButton, { top: topButtonInset }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.favoriteButton, { top: topButtonInset }]}
          onPress={toggleFavorite}
          disabled={toggleFavLoading}
          activeOpacity={0.8}
        >
          <Heart size={22} color={isFavorite ? colors.primary : colors.text} fill={isFavorite ? colors.primary : 'transparent'} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{restaurant?.name || 'Loading...'}</Text>
        <Text style={styles.restaurantTags}>{restaurant?.description || ''}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Star size={12} color={colors.surface} fill={colors.surface} />
            <Text style={styles.ratingText}>
              {restaurant?.averageRating ? restaurant.averageRating.toFixed(1) : 'New'} 
              {restaurant?.reviewCount ? ` (${restaurant.reviewCount})` : ''}
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.timeBadge}>
            <Clock size={12} color={colors.text} />
            <Text style={styles.timeText}>25-30 mins</Text>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.menuTitle}>Recommended</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.reviewsSection}>
      <View style={styles.divider} />
      <View style={styles.reviewsHeader}>
        <Text style={styles.menuTitle}>Reviews</Text>
        {user && (
          <TouchableOpacity onPress={() => router.push(`/review?restaurantId=${id}` as any)}>
            <Text style={styles.leaveReviewText}>Leave a Review</Text>
          </TouchableOpacity>
        )}
      </View>
      {reviews.length === 0 ? (
        <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to review!</Text>
      ) : (
        reviews.map((review, index) => (
          <View key={review.id || index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewRating}>
                <Star size={14} color={colors.primary} fill={colors.primary} />
                <Text style={styles.reviewRatingText}>{review.rating}</Text>
              </View>
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {review.comment && (
              <Text style={styles.reviewComment}>{review.comment}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const getQuantity = (itemId: string) => {
    const cartItem = cart.items.find(i => i.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={menuItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: 110 + Math.max(insets.bottom, 16) }
            ]}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            renderItem={({ item }) => (
              <MenuItemCard 
                item={item} 
                quantity={getQuantity(item.id)}
                onAdd={() => {
                  if (restaurant) {
                    cart.addItem(item, restaurant.id, restaurant.name);
                  }
                }}
                onUpdateQuantity={(quantity) => {
                  if (quantity === 0) {
                    cart.removeItem(item.id);
                  } else {
                    cart.updateQuantity(item.id, quantity);
                  }
                }}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No items available right now.</Text>
            }
          />
          {cart.totalItems > 0 && (
            <View style={[
              styles.floatingCartContainer,
              { bottom: Math.max(insets.bottom, 12) + spacing.md }
            ]}>
              <TouchableOpacity 
                style={styles.floatingCartButton}
                onPress={() => router.push('/cart')}
                activeOpacity={0.9}
              >
                <View style={styles.cartInfo}>
                  <ShoppingBag size={20} color={colors.surface} />
                  <View>
                    <Text style={styles.cartItemsText}>
                      {cart.totalItems} ITEM{cart.totalItems > 1 ? 'S' : ''}
                    </Text>
                    <Text style={styles.cartTotalText}>₹{cart.totalAmount}</Text>
                  </View>
                </View>
                <Text style={styles.viewCartText}>View Cart →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  heroPlaceholder: {
    backgroundColor: colors.borderSubtle,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...layout.shadows.md,
  },
  favoriteButton: {
    position: 'absolute',
    right: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...layout.shadows.md,
  },
  restaurantInfo: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  restaurantName: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  restaurantTags: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: layout.radius.sm,
    gap: 4,
  },
  ratingText: {
    color: colors.surface,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: colors.text,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
  },
  divider: {
    height: 8,
    backgroundColor: colors.background,
  },
  menuTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xl,
    color: colors.text,
    padding: spacing.xl,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: 100, // Make room for floating cart
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
  floatingCartButton: {
    backgroundColor: colors.primary,
    borderRadius: layout.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...layout.shadows.brand,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cartItemsText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.surface,
    opacity: 0.9,
  },
  cartTotalText: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.md,
    color: colors.surface,
  },
  viewCartText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.surface,
  },
  reviewsSection: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  leaveReviewText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', // Amber-100
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: layout.radius.sm,
    gap: 4,
  },
  reviewRatingText: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xs,
    color: '#D97706', // Amber-600
  },
  reviewDate: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  reviewComment: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptyReviewsText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
