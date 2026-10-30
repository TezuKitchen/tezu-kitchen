import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Star, Clock, Store } from 'lucide-react-native';
import { typography, spacing, layout } from '../theme';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { getTransformedUrl } from '../services/imageService';

interface RestaurantCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  isOpen: boolean;
  bannerUrl?: string;
  logoUrl?: string;
  onPress: () => void;
}

export default function RestaurantCard({
  id,
  name,
  description,
  location,
  isOpen,
  bannerUrl,
  logoUrl,
  onPress
}: RestaurantCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={{ position: 'relative' }}>
        {bannerUrl ? (
          <Image
            source={{ uri: getTransformedUrl(bannerUrl, 'restaurant-card') }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Store size={40} color={colors.textLight} />
          </View>
        )}
        {!isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>CLOSED</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>4.5</Text>
            <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {description || 'Delicious food, fast delivery'}
        </Text>
        
        <View style={styles.footerRow}>
          <View style={styles.metaItem}>
            <MapPin size={14} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>25-30 min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...layout.shadows.md,
  },
  image: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: layout.radius.md,
    borderTopRightRadius: layout.radius.md
  },
  imagePlaceholder: {
    height: 140,
    backgroundColor: colors.borderSubtle,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: layout.radius.sm,
  },
  closedText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    letterSpacing: 1,
  },
  content: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
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
    gap: 4,
  },
  ratingText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
  },
  description: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
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
});
