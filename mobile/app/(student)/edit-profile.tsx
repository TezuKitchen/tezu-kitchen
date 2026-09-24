import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, MapPin, Plus, Trash2, Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import { typography, spacing, layout } from '../../src/theme';
import { ThemeColors } from '../../src/theme/colors';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { pickImage, uploadImage, getTransformedUrl } from '../../src/services/imageService';

const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}: ${message}`);
    }
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState('');
  
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const data = response.data.data;
        setName(data.name || '');
        setPhone(data.phone || '');
        setAvatarUrl(data.avatarUrl || '');
        setAddresses(data.savedAddresses || []);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      setAddresses([...addresses, newAddress.trim()]);
      setNewAddress('');
    }
  };

  const handleRemoveAddress = (index: number) => {
    const updated = [...addresses];
    updated.splice(index, 1);
    setAddresses(updated);
  };

  const handleChangeAvatar = async () => {
    const uri = await pickImage({ aspect: [1, 1] });
    if (uri) {
      setAvatarUri(uri);
      setUploading(true);
      try {
        const result = await uploadImage(uri, 'avatars');
        setAvatarUrl(result.url);
      } catch (e) {
        showAlert('Error', 'Failed to upload image');
        setAvatarUri(null); // Reset if upload failed
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Name cannot be empty');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await api.put('/users/profile', {
        name,
        phone,
        avatarUrl,
        savedAddresses: addresses
      });
      
      // Update local user context if possible, skipping here since login requires token
      
      showAlert('Success', 'Profile updated successfully!', () => {
        router.back();
      });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to update profile';
      showAlert('Error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            {avatarUri || avatarUrl ? (
               <Image
                 source={{ uri: avatarUri || getTransformedUrl(avatarUrl, 'avatar-lg') }}
                 style={styles.avatarImage}
                 contentFit="cover"
               />
            ) : (
              <User size={48} color={colors.textMuted} />
            )}
            <TouchableOpacity 
              style={styles.changeAvatarBtn} 
              onPress={handleChangeAvatar}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Camera size={16} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={colors.textMuted}
          />
          
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          
          {addresses.map((address, index) => (
            <View key={index} style={styles.addressRow}>
              <MapPin size={20} color={colors.primary} style={styles.addressIcon} />
              <Text style={styles.addressText}>{address}</Text>
              <TouchableOpacity onPress={() => handleRemoveAddress(index)}>
                <Trash2 size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={styles.addAddressContainer}>
            <TextInput
              style={styles.addAddressInput}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="E.g. Patkai Hostel, Room 101"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.addAddressBtn} onPress={handleAddAddress}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.borderSubtle,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  changeAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: layout.radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  addressIcon: {
    marginRight: spacing.sm,
  },
  addressText: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  addAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addAddressInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  addAddressBtn: {
    marginLeft: spacing.sm,
    padding: spacing.sm,
  },
  footer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: layout.radius.pill,
    alignItems: 'center',
    ...layout.shadows.brand,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.surface,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
  },
});
