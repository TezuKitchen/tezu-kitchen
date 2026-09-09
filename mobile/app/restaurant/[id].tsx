import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Clock, ShoppingBag } from 'lucide-react-native';
import { colors, typography, spacing, layout } from '../../src/theme';
import api from '../../src/services/api';
import MenuItemCard, { MenuItem } from '../../src/components/MenuItemCard';
import { useCart } from '../../src/context/CartContext';

interface RestaurantDetails {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
}

export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const cart = useCart();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, restRes] = await Promise.all([
          api.get(`/menu/restaurant/${id}/available`),
          api.get(`/restaurants/${id}`)
        ]);
        setMenuItems(menuRes.data.data);
        setRestaurant(restRes.data.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  const renderHeader = () => (
    <View>
      <View style={styles.heroPlaceholder}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{restaurant?.name || 'Loading...'}</Text>
        <Text style={styles.restaurantTags}>{restaurant?.description || ''}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Star size={12} color={colors.surface} fill={colors.surface} />
            <Text style={styles.ratingText}>4.5 (1.2k ratings)</Text>
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

  const getQuantity = (itemId: string) => {
    const cartItem = cart.items.find(i => i.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={menuItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderHeader}
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
            <View style={styles.floatingCartContainer}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  heroPlaceholder: {
    height: 200,
    backgroundColor: colors.borderSubtle,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...layout.shadows.sm,
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
    borderRadius: layout.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...layout.shadows.brand,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cartItemsText: {
    color: colors.surface,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    opacity: 0.9,
  },
  cartTotalText: {
    color: colors.surface,
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.md,
  },
  viewCartText: {
    color: colors.surface,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
  },
});
