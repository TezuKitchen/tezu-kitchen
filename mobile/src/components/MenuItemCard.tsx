import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { UtensilsCrossed } from 'lucide-react-native';
import { typography, spacing, layout } from '../theme';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { getTransformedUrl } from '../services/imageService';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  primaryImageUrl?: string;
}

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: () => void;
  quantity?: number;
  onUpdateQuantity?: (quantity: number) => void;
}

export default function MenuItemCard({ item, onAdd, quantity = 0, onUpdateQuantity }: MenuItemCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, !item.available && styles.cardUnavailable]}>
      <View style={styles.details}>
        {/* Vegetarian icon (Green dot in square) placeholder */}
        <View style={styles.vegIndicator}>
          <View style={styles.vegDot} />
        </View>
        
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      
      <View style={styles.actionContainer}>
        {item.primaryImageUrl ? (
          <Image
            source={{ uri: getTransformedUrl(item.primaryImageUrl, 'menu-item') }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <UtensilsCrossed size={28} color={colors.textLight} />
          </View>
        )}
        {quantity > 0 ? (
          <View style={styles.stepperContainer}>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => onUpdateQuantity && onUpdateQuantity(quantity - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => onUpdateQuantity && onUpdateQuantity(quantity + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={onAdd}
            disabled={!item.available}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  cardUnavailable: {
    opacity: 0.5,
  },
  details: {
    flex: 1,
    paddingRight: spacing.md,
    justifyContent: 'center',
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: 4,
    flexShrink: 1,
  },
  price: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    flexShrink: 1,
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
    position: 'relative',
  },
  image: {
    width: 104,
    height: 104,
    borderRadius: layout.radius.md,
  },
  imagePlaceholder: {
    width: 104,
    height: 104,
    backgroundColor: colors.borderSubtle,
    borderRadius: layout.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: layout.radius.sm,
    position: 'absolute',
    bottom: -8,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    ...layout.shadows.sm,
  },
  addButtonText: {
    color: colors.primary,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: layout.radius.sm,
    position: 'absolute',
    bottom: -8,
    height: 32,
    minWidth: 84,
    ...layout.shadows.sm,
  },
  stepperButton: {
    paddingHorizontal: spacing.sm + 2,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: {
    color: colors.primary,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    lineHeight: 22,
  },
  quantityText: {
    color: colors.primary,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing.xs,
  },
});
