import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { 
  User, 
  ChevronRight, 
  MapPin, 
  CreditCard, 
  Palette, 
  Heart,
  MessageCircle, 
  HelpCircle, 
  Lock,
  LogOut 
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, typography, spacing, layout } from '../../src/theme';
import { getTransformedUrl } from '../../src/services/imageService';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
}

function MenuItem({ icon, label, onPress, isDestructive = false, showChevron = true }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, isDestructive && styles.menuIconDestructive]}>
          {icon}
        </View>
        <Text style={[styles.menuItemLabel, isDestructive && styles.menuItemLabelDestructive]}>
          {label}
        </Text>
      </View>
      {showChevron && !isDestructive && (
        <ChevronRight size={20} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleComingSoon = (feature: string) => {
    showAlert(feature, 'This feature is coming soon!');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: getTransformedUrl(user.avatarUrl, 'avatar-lg') }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={36} color={colors.textLight} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/(student)/edit-profile' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon={<User size={20} color={colors.primary} />}
              label="Account Information"
              onPress={() => router.push('/(student)/edit-profile' as any)}
            />
            <View style={styles.separator} />
            <MenuItem
              icon={<MapPin size={20} color={colors.primary} />}
              label="Your Addresses"
              onPress={() => router.push('/(student)/edit-profile' as any)}
            />
            <View style={styles.separator} />
            <MenuItem
              icon={<CreditCard size={20} color={colors.primary} />}
              label="Payment Methods"
              onPress={() => handleComingSoon('Payment Methods')}
            />
            <View style={styles.separator} />
            <MenuItem
              icon={<Heart size={20} color={colors.primary} />}
              label="Favourites"
              onPress={() => handleComingSoon('Favourites')}
            />
            <View style={styles.separator} />
            <MenuItem
              icon={<Palette size={20} color={colors.primary} />}
              label="Appearance"
              onPress={() => handleComingSoon('Appearance')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon={<MessageCircle size={20} color={colors.primary} />}
              label="Report an Issue"
              onPress={() => handleComingSoon('Report an Issue')}
            />
            <View style={styles.separator} />
            <MenuItem
              icon={<HelpCircle size={20} color={colors.primary} />}
              label="Help"
              onPress={() => handleComingSoon('Help')}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon={<Lock size={20} color={colors.primary} />}
              label="Change Password"
              onPress={() => router.push('/(student)/change-password' as any)}
            />
            <View style={styles.separator} />
            <MenuItem
              icon={<LogOut size={20} color={colors.error} />}
              label="Log Out"
              onPress={logout}
              isDestructive
              showChevron={false}
            />
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  // Profile Card
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: layout.radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...layout.shadows.sm,
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  userEmail: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  editProfileButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: layout.radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  editProfileText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: layout.radius.lg,
    ...layout.shadows.sm,
    overflow: 'hidden',
  },
  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: layout.radius.sm,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuIconDestructive: {
    backgroundColor: '#FEE2E2',
  },
  menuItemLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  menuItemLabelDestructive: {
    color: colors.error,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: 36 + spacing.lg + spacing.md,
  },
});
