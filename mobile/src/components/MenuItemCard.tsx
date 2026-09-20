import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { UtensilsCrossed } from 'lucide-react-native';
import { colors, typography, spacing, layout } from '../theme';
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
  return (
    <View style={[styles.card, !item.available && styles.cardUnavailable]}>
      <View style={styles.details}>
        {/* Vegetarian icon (Green dot in square) placeholder */}
        <View style={styles.vegIndicator}>
          <View style={styles.vegDot} />
        </View>
        
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      
      <View style={styles.actionContainer}>
        {item.primaryImageUrl ? (
          <Image
            source={{ uri: getTransformedUrl(item.primaryImageUrl, 'menu-card') }}
            style={styles.image}
            contentFit="cover"
            transition={200}
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
            >
              <Text style={styles.stepperButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => onUpdateQuantity && onUpdateQuantity(quantity + 1)}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={onAdd}
            disabled={!item.available}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
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
  },
  actionContainer: {
    alignItems: 'center',
    width: 110,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: layout.radius.md,
  },
  imagePlaceholder: {
    width: 110,
    height: 110,
    backgroundColor: colors.borderSubtle,
    borderRadius: layout.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: layout.radius.sm,
    position: 'absolute',
    bottom: -10,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: layout.radius.sm,
    position: 'absolute',
    bottom: -10,
    height: 36,
    ...layout.shadows.sm,
  },
  stepperButton: {
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.sm,
  },
});
