import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { colors, typography, spacing, layout } from '../../src/theme';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { pickImage, uploadImage, getTransformedUrl } from '../../src/services/imageService';

interface Restaurant {
  id: string;
  name: string;
  ownerId: string;
}

interface MenuItemResponse {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  primaryImageUrl?: string;
}

export default function OwnerMenuScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemImageUri, setItemImageUri] = useState<string | null>(null);
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.userId) return;
    try {
      // 1. Fetch Restaurant
      const restResponse = await api.get(`/restaurants/owner/${user.userId}`);
      const restaurants = restResponse.data.data;
      if (restaurants && restaurants.length > 0) {
        const myRestaurant = restaurants[0];
        setRestaurant(myRestaurant);

        // 2. Fetch Menu Items
        const menuResponse = await api.get(`/menu/restaurant/${myRestaurant.id}`);
        setMenuItems(menuResponse.data.data || []);
      } else {
        setRestaurant(null);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load menu data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const groupedMenuItems = useMemo(() => {
    const groups: { [key: string]: MenuItemResponse[] } = {};
    menuItems.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menuItems]);

  const toggleAvailability = async (item: MenuItemResponse, newValue: boolean) => {
    // Optimistic update
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, available: newValue } : i))
    );
    try {
      await api.put(`/menu/${item.id}`, {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: newValue, // BE expects isAvailable based on instructions
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert on failure
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, available: !newValue } : i))
      );
      Alert.alert('Error', 'Failed to update item availability.');
    }
  };

  const handleLongPress = (item: MenuItemResponse) => {
    Alert.alert(
      'Manage Item',
      `What would you like to do with ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => openModal(item),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(item.id),
        },
      ]
    );
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this menu item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/menu/${id}`);
            setMenuItems((prev) => prev.filter((i) => i.id !== id));
          } catch (error) {
            console.error('Error deleting item:', error);
            Alert.alert('Error', 'Failed to delete item.');
          }
        },
      },
    ]);
  };

  const openModal = (item?: MenuItemResponse) => {
    if (item) {
      setEditingId(item.id);
      setItemName(item.name);
      setItemDescription(item.description || '');
      setItemPrice(item.price.toString());
      setItemCategory(item.category || '');
      setItemImageUrl(item.primaryImageUrl || null);
      setItemImageUri(null);
    } else {
      setEditingId(null);
      setItemName('');
      setItemDescription('');
      setItemPrice('');
      setItemCategory('');
      setItemImageUrl(null);
      setItemImageUri(null);
    }
    setModalVisible(true);
  };

  const saveItem = async () => {
    if (!itemName.trim() || !itemPrice.trim() || !itemCategory.trim()) {
      Alert.alert('Validation Error', 'Name, Price, and Category are required.');
      return;
    }
    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return;
    }
    if (!restaurant) return;

    setSavingItem(true);
    try {
      let targetId = editingId;
      if (editingId) {
        // Edit existing
        await api.put(`/menu/${editingId}`, {
          name: itemName,
          description: itemDescription,
          price: priceNum,
          category: itemCategory,
          isAvailable: menuItems.find((i) => i.id === editingId)?.available ?? true,
        });
      } else {
        // Create new
        const response = await api.post('/menu', {
          restaurantId: restaurant.id,
          name: itemName,
          description: itemDescription,
          price: priceNum,
          category: itemCategory,
        });
        targetId = response.data.data.id;
      }
      
      // Upload image if selected
      if (itemImageUri) {
        const result = await uploadImage(itemImageUri, 'menu-items');
        await api.post(`/menu/${targetId}/images`, {
          imageUrl: result.url,
          cloudinaryPublicId: result.publicId,
          isPrimary: true,
          displayOrder: 0
        });
      }

      setModalVisible(false);
      fetchData(); // Refresh list to get new IDs etc.
    } catch (error) {
      console.error('Error saving menu item:', error);
      Alert.alert('Error', 'Failed to save menu item.');
    } finally {
      setSavingItem(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="store" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>No Store Found</Text>
          <Text style={styles.emptyText}>
            Please create your store first in the Store tab before managing your menu.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <Text style={styles.headerSubtitle}>Long press an item to edit or delete</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {Object.keys(groupedMenuItems).length === 0 ? (
          <View style={styles.noItemsContainer}>
            <Text style={styles.noItemsText}>No items on your menu yet.</Text>
            <Text style={styles.noItemsSubtext}>Tap the + button to add one.</Text>
          </View>
        ) : (
          Object.entries(groupedMenuItems).map(([category, items]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onLongPress={() => handleLongPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemRow}>
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                      </View>
                      {!!item.description && (
                        <Text style={styles.itemDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                      <View style={styles.itemFooter}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.category}</Text>
                        </View>
                        <View style={styles.availabilityRow}>
                          <Text style={[styles.availabilityText, !item.available && styles.unavailableText]}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </Text>
                          <Switch
                            trackColor={{ false: colors.border, true: colors.primaryHover }}
                            thumbColor={item.available ? colors.primary : colors.surface}
                            ios_backgroundColor={colors.border}
                            onValueChange={(val) => toggleAvailability(item, val)}
                            value={item.available}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                          />
                        </View>
                      </View>
                    </View>
                    {item.primaryImageUrl && (
                      <Image
                        source={{ uri: getTransformedUrl(item.primaryImageUrl, 'menu-item') }}
                        style={styles.itemImage}
                        contentFit="cover"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openModal()} activeOpacity={0.9}>
        <MaterialIcons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Item' : 'Add New Item'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.imagePickerContainer}>
                <Text style={styles.label}>Item Photo</Text>
                <TouchableOpacity 
                  style={styles.imagePicker} 
                  onPress={async () => {
                    const uri = await pickImage({ aspect: [1, 1] });
                    if (uri) setItemImageUri(uri);
                  }}
                >
                  {itemImageUri || itemImageUrl ? (
                    <Image
                      source={{ uri: itemImageUri || getTransformedUrl(itemImageUrl!, 'menu-item') }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Camera size={24} color={colors.textMuted} />
                      <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Masala Dosa"
                  placeholderTextColor={colors.textLight}
                  value={itemName}
                  onChangeText={setItemName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 120"
                  placeholderTextColor={colors.textLight}
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. South Indian"
                  placeholderTextColor={colors.textLight}
                  value={itemCategory}
                  onChangeText={setItemCategory}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Brief description of the item"
                  placeholderTextColor={colors.textLight}
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={savingItem}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={saveItem}
                disabled={savingItem}
              >
                {savingItem ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.buttonText}>{editingId ? 'Save Changes' : 'Add Item'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xxxl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  noItemsContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  noItemsText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  noItemsSubtext: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.lg,
    padding: spacing.lg,
    ...layout.shadows.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  itemName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  itemPrice: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.primary,
  },
  itemDescription: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: layout.radius.md,
  },
  badge: {
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.pill,
  },
  badgeText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.success,
    marginRight: spacing.xs,
  },
  unavailableText: {
    color: colors.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...layout.shadows.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: layout.radius.xl,
    borderTopRightRadius: layout.radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  imagePickerContainer: {
    marginBottom: spacing.lg,
  },
  imagePicker: {
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imagePlaceholderText: {
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    paddingBottom: spacing.xxl,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: layout.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flex: 2,
    marginLeft: spacing.md,
  },
  cancelButton: {
    backgroundColor: colors.surface,
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
});
