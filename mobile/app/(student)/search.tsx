import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, SearchX } from 'lucide-react-native';
import { colors, typography, spacing, layout } from '../../src/theme';
import api from '../../src/services/api';
import RestaurantCard from '../../src/components/RestaurantCard';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  location?: string;
  open?: boolean;
  isOpen?: boolean;
}

export default function SearchScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants');
      const content = response.data?.data?.content ?? [];
      setRestaurants(content);
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

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  // Case-insensitive filtering by name, description, and location
  const filteredRestaurants = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) {
      return restaurants;
    }

    return restaurants.filter((restaurant) => {
      const nameMatch = restaurant.name?.toLowerCase().includes(query) ?? false;
      const descMatch = restaurant.description?.toLowerCase().includes(query) ?? false;
      const locMatch = restaurant.location?.toLowerCase().includes(query) ?? false;
      return nameMatch || descMatch || locMatch;
    });
  }, [restaurants, debouncedQuery]);

  const renderHeader = () => (
    <View style={styles.searchHeader}>
      <View style={styles.searchBar}>
        <Search size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search for your favorite restaurant..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
            accessibilityLabel="Clear search"
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    const hasQuery = debouncedQuery.trim().length > 0;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <SearchX size={40} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>
          {hasQuery ? 'No Restaurants Found' : 'No Restaurants Available'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {hasQuery
            ? `We couldn't find any restaurant matching "${debouncedQuery}". Try another keyword or location.`
            : 'There are currently no restaurants listed.'}
        </Text>
        {hasQuery && (
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => setSearchQuery('')}
            activeOpacity={0.8}
          >
            <Text style={styles.clearFilterText}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderListHeader = () => {
    if (restaurants.length === 0) return null;

    const hasQuery = debouncedQuery.trim().length > 0;
    return (
      <Text style={styles.resultsCount}>
        {hasQuery
          ? `Found ${filteredRestaurants.length} ${filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} for "${debouncedQuery}"`
          : `All Restaurants (${restaurants.length})`}
      </Text>
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
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            <RestaurantCard
              id={item.id}
              name={item.name}
              description={item.description || ''}
              location={item.location || ''}
              isOpen={item.open ?? item.isOpen ?? true}
              onPress={() => router.push(`/restaurant/${item.id}`)}
            />
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
  searchHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.radius.xl,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    ...layout.shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: spacing.xs,
    backgroundColor: colors.borderSubtle,
    borderRadius: layout.radius.pill,
    marginLeft: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100, // Padding for bottom tab navigation
    flexGrow: 1,
  },
  resultsCount: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.hero,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  clearFilterBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: layout.radius.pill,
  },
  clearFilterText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.surface,
  },
});
