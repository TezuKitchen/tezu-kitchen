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
import { colors, typography, spacing } from '../../src/theme';
import api from '../../src/services/api';
import RestaurantCard from '../../src/components/RestaurantCard';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  open: boolean;
}

export default function StudentHome() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants');
      // The backend uses Spring Data pageable, so data is in content
      setRestaurants(response.data.data.content);
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
            <Text style={styles.sectionTitle}>All Dhabas</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No restaurants available right now.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <RestaurantCard
              id={item.id}
              name={item.name}
              description={item.description}
              location={item.location}
              isOpen={item.open}
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
    padding: spacing.lg,
    paddingBottom: 100, // padding for bottom tab bar
  },
  sectionTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
