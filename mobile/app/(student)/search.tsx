import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Search,
  X,
  SearchX,
  Clock,
  ArrowUpLeft,
  TrendingUp,
  Store,
  Trash2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, layout } from '../../src/theme';
import { ThemeColors } from '../../src/theme/colors';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import RestaurantCard from '../../src/components/RestaurantCard';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  location?: string;
  open?: boolean;
  isOpen?: boolean;
  bannerUrl?: string;
  logoUrl?: string;
}

interface SuggestionItem {
  id: string;
  text: string;
  type: 'dish' | 'restaurant' | 'history';
  restaurantId?: string;
  subtitle?: string;
}

const SEARCH_HISTORY_KEY = '@tezu_kitchen_search_history';

const POPULAR_DISHES = [
  'noodles',
  'nuggets',
  'chicken',
  'cake',
  'sweets',
  'pizza',
  'biryani',
  'paneer',
];

export default function SearchScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState(q || '');
  const [debouncedQuery, setDebouncedQuery] = useState(q || '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const [dishIndex, setDishIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load search history from AsyncStorage
  const loadSearchHistory = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, []);

  const saveToHistory = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    try {
      const updated = [
        trimmed,
        ...searchHistory.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 10);
      setSearchHistory(updated);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  };

  const removeFromHistory = async (itemToRemove: string) => {
    try {
      const updated = searchHistory.filter((item) => item !== itemToRemove);
      setSearchHistory(updated);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove item from search history:', e);
    }
  };

  const clearHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear search history:', e);
    }
  };

  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  useEffect(() => {
    if (q) {
      setSearchQuery(q);
      setDebouncedQuery(q);
      saveToHistory(q);
      setIsSearching(false);
    }
  }, [q]);

  // Smooth slide-up animation for placeholder dish names
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -18,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setDishIndex((prev) => (prev + 1) % POPULAR_DISHES.length);
        slideAnim.setValue(18);

        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2800);

    return () => clearInterval(timer);
  }, [slideAnim, fadeAnim]);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants?size=100');
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

  // Debounce search query by 300ms when typing
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

  // Dynamic auto-suggestions based on history, popular dishes, and restaurant names
  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const list: SuggestionItem[] = [];

    // 1. History matches
    searchHistory.forEach((h) => {
      if (h.toLowerCase().includes(query) && !list.some((i) => i.text.toLowerCase() === h.toLowerCase())) {
        list.push({
          id: `hist-${h}`,
          text: h,
          type: 'history',
          subtitle: 'Recent Search',
        });
      }
    });

    // 2. Popular dishes matches
    POPULAR_DISHES.forEach((dish) => {
      if (dish.toLowerCase().includes(query) && !list.some((i) => i.text.toLowerCase() === dish.toLowerCase())) {
        list.push({
          id: `dish-${dish}`,
          text: dish,
          type: 'dish',
          subtitle: 'Popular Dish',
        });
      }
    });

    // 3. Restaurant matches
    restaurants.forEach((r) => {
      const nameMatch = r.name?.toLowerCase().includes(query);
      const descMatch = r.description?.toLowerCase().includes(query);
      if ((nameMatch || descMatch) && !list.some((i) => i.text.toLowerCase() === r.name.toLowerCase())) {
        list.push({
          id: `rest-${r.id}`,
          text: r.name,
          type: 'restaurant',
          restaurantId: r.id,
          subtitle: r.location || 'Restaurant',
        });
      }
    });

    return list.slice(0, 8);
  }, [searchQuery, searchHistory, restaurants]);

  const handleSelectQuery = (text: string) => {
    setSearchQuery(text);
    setDebouncedQuery(text);
    saveToHistory(text);
    setIsSearching(false);
    inputRef.current?.blur();
  };

  const handleExecuteSearch = (queryText: string) => {
    const trimmed = queryText.trim();
    if (trimmed) {
      saveToHistory(trimmed);
      setDebouncedQuery(trimmed);
    }
    setIsSearching(false);
    inputRef.current?.blur();
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    inputRef.current?.blur();
  };

  const handleSuggestionPress = (item: SuggestionItem) => {
    if (item.type === 'restaurant' && item.restaurantId) {
      saveToHistory(item.text);
      setIsSearching(false);
      inputRef.current?.blur();
      router.push(`/restaurant/${item.restaurantId}`);
    } else {
      handleSelectQuery(item.text);
    }
  };

  const renderSearchBar = (showCancel: boolean) => (
    <View style={styles.searchBarRow}>
      <View style={[styles.searchBar, isSearching && styles.searchBarActive]}>
        <Search size={18} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder=""
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (!isSearching) setIsSearching(true);
          }}
          onFocus={() => setIsSearching(true)}
          onSubmitEditing={() => handleExecuteSearch(searchQuery)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
        {searchQuery.length === 0 && (
          <View style={styles.animatedPlaceholderContainer} pointerEvents="none">
            <Text style={styles.staticPlaceholderText}>Search for </Text>
            <View style={styles.animatedDishClippingBox}>
              <Animated.View
                style={{
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim,
                }}
              >
                <Text style={styles.animatedDishText} numberOfLines={1}>
                  {POPULAR_DISHES[dishIndex]}
                </Text>
              </Animated.View>
            </View>
          </View>
        )}
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setDebouncedQuery('');
              inputRef.current?.focus();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
            accessibilityLabel="Clear search"
          >
            <X size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {showCancel && (
        <TouchableOpacity
          onPress={handleCancelSearch}
          style={styles.cancelBtn}
          activeOpacity={0.7}
          accessibilityLabel="Cancel search mode"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSuggestionsMode = () => (
    <ScrollView
      style={styles.suggestionsContainer}
      contentContainerStyle={styles.suggestionsContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {searchQuery.trim().length === 0 ? (
        <>
          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity
                  onPress={clearHistory}
                  style={styles.clearAllBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={13} color={colors.textMuted} />
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.historyList}>
                {searchHistory.map((item, idx) => (
                  <TouchableOpacity
                    key={`hist-${idx}`}
                    style={styles.suggestionRow}
                    onPress={() => handleSelectQuery(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionLeft}>
                      <Clock size={16} color={colors.textMuted} style={styles.suggestionIcon} />
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {item}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFromHistory(item)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.removeHistoryBtn}
                      accessibilityLabel={`Remove ${item} from search history`}
                    >
                      <X size={14} color={colors.textLight} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular Searches */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithIcon}>
                <TrendingUp size={15} color={colors.primary} />
                <Text style={[styles.sectionTitle, { marginLeft: spacing.xs }]}>
                  Popular Searches
                </Text>
              </View>
            </View>
            <View style={styles.chipsContainer}>
              {POPULAR_DISHES.map((dish) => (
                <TouchableOpacity
                  key={dish}
                  style={styles.chip}
                  onPress={() => handleSelectQuery(dish)}
                  activeOpacity={0.7}
                >
                  <Search size={13} color={colors.textMuted} style={styles.chipIcon} />
                  <Text style={styles.chipText}>{dish}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      ) : (
        /* Live Auto-Suggestions */
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          {suggestions.length > 0 ? (
            <View style={styles.suggestionsList}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionRow}
                  onPress={() => handleSuggestionPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionLeft}>
                    {item.type === 'restaurant' ? (
                      <Store size={16} color={colors.primary} style={styles.suggestionIcon} />
                    ) : item.type === 'history' ? (
                      <Clock size={16} color={colors.textMuted} style={styles.suggestionIcon} />
                    ) : (
                      <Search size={16} color={colors.textMuted} style={styles.suggestionIcon} />
                    )}
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {item.text}
                      </Text>
                      {item.subtitle && (
                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
                  </View>
                  <ArrowUpLeft size={16} color={colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.suggestionRow}
              onPress={() => handleExecuteSearch(searchQuery)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionLeft}>
                <Search size={16} color={colors.primary} style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>
                  Search for "{searchQuery.trim()}"
                </Text>
              </View>
              <ArrowUpLeft size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
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
            ? `We couldn't find any restaurant matching "${debouncedQuery}". Try another dish or campus keyword.`
            : 'There are currently no restaurants listed.'}
        </Text>
        {hasQuery && (
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => {
              setSearchQuery('');
              setDebouncedQuery('');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.clearFilterText}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderListHeader = () => {
    const hasQuery = debouncedQuery.trim().length > 0;
    return (
      <View style={styles.feedHeaderContainer}>
        {renderSearchBar(false)}
        {restaurants.length > 0 && (
          <Text style={styles.resultsCount}>
            {hasQuery
              ? `Found ${filteredRestaurants.length} ${filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} for "${debouncedQuery}"`
              : `All Restaurants (${restaurants.length})`}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isSearching ? (
        <View style={styles.searchModeContainer}>
          <View style={styles.pinnedSearchHeader}>
            {renderSearchBar(true)}
          </View>
          {renderSuggestionsMode()}
        </View>
      ) : loading ? (
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
              bannerUrl={item.bannerUrl}
              logoUrl={item.logoUrl}
              onPress={() => router.push(`/restaurant/${item.id}`)}
            />
          )}
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
    feedHeaderContainer: {
      marginBottom: spacing.md,
    },
    pinnedSearchHeader: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background,
    },
    searchModeContainer: {
      flex: 1,
    },
    searchBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchBar: {
      flex: 1,
      position: 'relative',
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
    searchBarActive: {
      borderColor: colors.primary,
    },
    cancelBtn: {
      paddingLeft: spacing.md,
      paddingVertical: spacing.xs,
    },
    cancelBtnText: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.sm,
      color: colors.primary,
    },
    animatedPlaceholderContainer: {
      position: 'absolute',
      left: spacing.md + 20 + spacing.sm,
      right: spacing.md + 30,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
    },
    staticPlaceholderText: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.md,
      color: colors.textLight,
    },
    animatedDishClippingBox: {
      flex: 1,
      height: 24,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    animatedDishText: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.md,
      color: colors.textLight,
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
    // Suggestions & History Styles
    suggestionsContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    suggestionsContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: 100,
    },
    sectionContainer: {
      marginBottom: spacing.xl,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sectionTitleWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    clearAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    clearAllText: {
      fontFamily: typography.fonts.bodyMedium,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    historyList: {
      marginTop: spacing.xs,
    },
    suggestionsList: {
      marginTop: spacing.xs,
    },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    suggestionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: spacing.sm,
    },
    suggestionIcon: {
      marginRight: spacing.md,
    },
    suggestionTextContainer: {
      flex: 1,
    },
    suggestionText: {
      fontFamily: typography.fonts.bodyMedium,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    suggestionSubtitle: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 2,
    },
    removeHistoryBtn: {
      padding: spacing.xs,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: layout.radius.pill,
      ...layout.shadows.sm,
    },
    chipIcon: {
      marginRight: spacing.xs,
    },
    chipText: {
      fontFamily: typography.fonts.body,
      fontSize: typography.sizes.sm,
      color: colors.text,
      textTransform: 'capitalize',
    },
    // Results List Styles
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
