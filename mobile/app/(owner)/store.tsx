import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, layout } from '../../src/theme';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import { pickImage, uploadImage, getTransformedUrl } from '../../src/services/imageService';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  ownerId: string;
  isOpen: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  logoUrl?: string;
}

export default function OwnerStoreScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  // Form states for Create/Edit
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const response = await api.get(`/restaurants/owner/${user.userId}`);
      const restaurants = response.data.data;
      if (restaurants && restaurants.length > 0) {
        const myRestaurant = restaurants[0];
        setRestaurant(myRestaurant);
        setName(myRestaurant.name);
        setDescription(myRestaurant.description || '');
        setLocation(myRestaurant.location || '');
      } else {
        setRestaurant(null);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      Alert.alert('Error', 'Failed to load store details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRestaurant();
  }, [fetchRestaurant]);

  const handleCreateOrUpdate = async () => {
    if (!name.trim() || !location.trim()) {
      Alert.alert('Validation', 'Name and Location are required.');
      return;
    }

    setSaving(true);
    try {
      if (restaurant) {
        // Update existing
        await api.put(`/restaurants/${restaurant.id}`, {
          name,
          description,
          location,
          isOpen: restaurant.isOpen,
        });
        Alert.alert('Success', 'Store details updated!');
        setIsEditing(false);
      } else {
        // Create new
        await api.post('/restaurants', {
          name,
          description,
          location,
        });
        Alert.alert('Success', 'Store created successfully!');
      }
      fetchRestaurant();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      Alert.alert('Error', 'Failed to save store details.');
    } finally {
      setSaving(false);
    }
  };

  const toggleOpenStatus = async (newValue: boolean) => {
    if (!restaurant) return;
    
    // Optimistic update
    setRestaurant({ ...restaurant, isOpen: newValue });
    try {
      await api.put(`/restaurants/${restaurant.id}`, {
        name: restaurant.name,
        description: restaurant.description,
        location: restaurant.location,
        isOpen: newValue,
      });
    } catch (error) {
      console.error('Error toggling open status:', error);
      // Revert on failure
      setRestaurant({ ...restaurant, isOpen: !newValue });
      Alert.alert('Error', 'Failed to update store status.');
    }
  };

  const handleUpdateImage = async (type: 'BANNER' | 'LOGO') => {
    const uri = await pickImage({ aspect: type === 'BANNER' ? [16, 9] : [1, 1] });
    if (!uri || !restaurant) return;
    setUploadingImage(true);
    try {
      const result = await uploadImage(uri, 'restaurants');
      await api.post(`/restaurants/${restaurant.id}/images`, { 
        imageUrl: result.url, 
        cloudinaryPublicId: result.publicId, 
        imageType: type, 
        displayOrder: 0 
      });
      await fetchRestaurant();
      Alert.alert('Success', `${type} updated successfully`);
    } catch (error) {
      console.error('Error uploading image', error);
      Alert.alert('Error', 'Failed to update image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderForm = (isNew: boolean) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{isNew ? 'Create Your Store' : 'Edit Store Details'}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Restaurant Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Campus Bites"
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What kind of food do you serve?"
          placeholderTextColor={colors.textLight}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Near Main Gate"
          placeholderTextColor={colors.textLight}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.actionButtons}>
        {!isNew && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setIsEditing(false);
              setName(restaurant!.name);
              setDescription(restaurant!.description || '');
              setLocation(restaurant!.location || '');
            }}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleCreateOrUpdate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>{isNew ? 'Create Store' : 'Save Changes'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Store</Text>
          <Text style={styles.headerSubtitle}>Manage your restaurant profile</Text>
        </View>

        {!restaurant ? (
          renderForm(true)
        ) : (
          <>
            {!isEditing ? (
              <View style={styles.card}>
                <View style={styles.storeHeader}>
                  <View>
                    <Text style={styles.storeName}>{restaurant.name}</Text>
                    <Text style={styles.storeLocation}>
                      <MaterialIcons name="location-on" size={14} color={colors.textMuted} /> {restaurant.location}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.editIcon} onPress={() => setIsEditing(true)}>
                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {!!restaurant.description && (
                  <Text style={styles.storeDescription}>{restaurant.description}</Text>
                )}

                <View style={styles.divider} />

                <View style={styles.imagesSection}>
                  <Text style={styles.imagesTitle}>Store Images</Text>
                  
                  <View style={styles.imageRow}>
                    <View style={styles.imageBox}>
                      <Text style={styles.imageLabel}>Banner</Text>
                      <View style={styles.imageContainer}>
                        {restaurant.bannerUrl ? (
                          <Image
                            source={{ uri: getTransformedUrl(restaurant.bannerUrl, 'restaurant-card') }}
                            style={styles.storeImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <MaterialIcons name="image" size={24} color={colors.textMuted} />
                          </View>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.imageUploadBtn} 
                        onPress={() => handleUpdateImage('BANNER')}
                        disabled={uploadingImage}
                      >
                        <Camera size={16} color={colors.primary} />
                        <Text style={styles.imageUploadText}>Change Banner</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.imageBox}>
                      <Text style={styles.imageLabel}>Logo</Text>
                      <View style={[styles.imageContainer, styles.logoContainer]}>
                        {restaurant.logoUrl ? (
                          <Image
                            source={{ uri: getTransformedUrl(restaurant.logoUrl, 'avatar-lg') }}
                            style={styles.storeLogo}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.imagePlaceholder, styles.storeLogo]}>
                            <MaterialIcons name="store" size={24} color={colors.textMuted} />
                          </View>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.imageUploadBtn} 
                        onPress={() => handleUpdateImage('LOGO')}
                        disabled={uploadingImage}
                      >
                        <Camera size={16} color={colors.primary} />
                        <Text style={styles.imageUploadText}>Change Logo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {uploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.statusRow}>
                  <View>
                    <Text style={styles.statusLabel}>Store Status</Text>
                    <Text style={restaurant.isOpen ? styles.statusOpen : styles.statusClosed}>
                      {restaurant.isOpen ? 'Accepting Orders' : 'Currently Closed'}
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: colors.border, true: colors.primaryHover }}
                    thumbColor={restaurant.isOpen ? colors.primary : colors.surface}
                    ios_backgroundColor={colors.border}
                    onValueChange={toggleOpenStatus}
                    value={restaurant.isOpen}
                  />
                </View>
              </View>
            ) : (
              renderForm(false)
            )}
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  headerTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xxxl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.lg,
    padding: spacing.xl,
    ...layout.shadows.md,
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  storeName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  storeLocation: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  editIcon: {
    padding: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: layout.radius.pill,
  },
  storeDescription: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.lg,
  },
  imagesSection: {
    marginBottom: spacing.sm,
    position: 'relative',
  },
  imagesTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  imageBox: {
    flex: 1,
  },
  imageLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  imageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: colors.background,
    borderRadius: layout.radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  imageUploadText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.primary,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  uploadingText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: 4,
  },
  statusOpen: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.success,
  },
  statusClosed: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: layout.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  buttonText: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
    color: colors.surface,
  },
  cancelButtonText: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  logoutText: {
    fontFamily: typography.fonts.bodyBold,
    fontSize: typography.sizes.md,
    color: colors.error,
    marginLeft: spacing.xs,
  },
});
