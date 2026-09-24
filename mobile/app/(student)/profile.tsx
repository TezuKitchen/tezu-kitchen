import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
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
  LogOut,
  Sun,
  Moon,
  Smartphone,
  Check,
  X
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme, ThemeMode } from '../../src/context/ThemeContext';
import { typography, spacing, layout } from '../../src/theme';
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
  subLabel?: string;
  onPress: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
  colors: any;
}

function MenuItem({ 
  icon, 
  label, 
  subLabel, 
  onPress, 
  isDestructive = false, 
  showChevron = true,
  colors 
}: MenuItemProps) {
  return (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress} 
      activeOpacity={0.6}
    >
      <View style={styles.menuItemLeft}>
        <View style={[
          styles.menuIconContainer, 
          { backgroundColor: colors.borderSubtle },
          isDestructive && { backgroundColor: '#FEE2E2' }
        ]}>
          {icon}
        </View>
        <View>
          <Text style={[
            styles.menuItemLabel, 
            { color: colors.text },
            isDestructive && { color: colors.error }
          ]}>
            {label}
          </Text>
          {subLabel && (
            <Text style={[styles.menuItemSubLabel, { color: colors.textMuted }]}>
              {subLabel}
            </Text>
          )}
        </View>
      </View>
      {showChevron && !isDestructive && (
        <ChevronRight size={20} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { themeMode, isDark, colors, setThemeMode } = useTheme();
  const router = useRouter();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleComingSoon = (feature: string) => {
    showAlert(feature, 'This feature is coming soon!');
  };

  const getThemeModeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.screenTitle, { color: colors.text }]}>Settings</Text>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: getTransformedUrl(user.avatarUrl, 'avatar-lg') }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.borderSubtle }]}>
                <User size={36} color={colors.textLight} />
              </View>
            )}
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || ''}</Text>
          <TouchableOpacity
            style={[styles.editProfileButton, { borderColor: colors.primary }]}
            onPress={() => router.push('/(student)/edit-profile' as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.editProfileText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>General</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <MenuItem
              colors={colors}
              icon={<User size={20} color={colors.primary} />}
              label="Account Information"
              onPress={() => router.push('/(student)/edit-profile' as any)}
            />
            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />
            <MenuItem
              colors={colors}
              icon={<MapPin size={20} color={colors.primary} />}
              label="Your Addresses"
              onPress={() => router.push('/(student)/edit-profile' as any)}
            />
            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />
            <MenuItem
              colors={colors}
              icon={<Palette size={20} color={colors.primary} />}
              label="Appearance"
              subLabel={`Theme: ${getThemeModeLabel(themeMode)}${themeMode === 'system' ? (isDark ? ' (Dark)' : ' (Light)') : ''}`}
              onPress={() => setShowThemeModal(true)}
            />
            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />
            <MenuItem
              colors={colors}
              icon={<CreditCard size={20} color={colors.primary} />}
              label="Payment Methods"
              onPress={() => handleComingSoon('Payment Methods')}
            />
            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />
            <MenuItem
              colors={colors}
              icon={<Heart size={20} color={colors.primary} />}
              label="Favourites"
              onPress={() => handleComingSoon('Favourites')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Support</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <MenuItem
              colors={colors}
              icon={<MessageCircle size={20} color={colors.primary} />}
              label="Report an Issue"
              onPress={() => handleComingSoon('Report an Issue')}
            />
            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />
            <MenuItem
              colors={colors}
              icon={<HelpCircle size={20} color={colors.primary} />}
              label="Help"
              onPress={() => handleComingSoon('Help')}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Account</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <MenuItem
              colors={colors}
              icon={<Lock size={20} color={colors.primary} />}
              label="Change Password"
              onPress={() => router.push('/(student)/change-password' as any)}
            />
            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />
            <MenuItem
              colors={colors}
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

      {/* Theme Appearance Modal */}
      <Modal visible={showThemeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Palette size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Appearance</Text>
              </View>
              <TouchableOpacity onPress={() => setShowThemeModal(false)} style={styles.modalCloseButton}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Choose how TezuKitchen looks to you.
            </Text>

            <View style={styles.themeOptionsList}>
              {/* Light Mode */}
              <TouchableOpacity 
                style={[
                  styles.themeOptionRow, 
                  { backgroundColor: colors.background },
                  themeMode === 'light' && { borderColor: colors.primary, borderWidth: 1.5 }
                ]}
                onPress={() => {
                  setThemeMode('light');
                  setShowThemeModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionLeft}>
                  <View style={[styles.themeOptionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <Sun size={20} color="#D97706" />
                  </View>
                  <View>
                    <Text style={[styles.themeOptionTitle, { color: colors.text }]}>Light Mode</Text>
                    <Text style={[styles.themeOptionDesc, { color: colors.textMuted }]}>Crisp and clear daytime view</Text>
                  </View>
                </View>
                {themeMode === 'light' && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>

              {/* Dark Mode */}
              <TouchableOpacity 
                style={[
                  styles.themeOptionRow, 
                  { backgroundColor: colors.background },
                  themeMode === 'dark' && { borderColor: colors.primary, borderWidth: 1.5 }
                ]}
                onPress={() => {
                  setThemeMode('dark');
                  setShowThemeModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionLeft}>
                  <View style={[styles.themeOptionIconWrap, { backgroundColor: '#312E81' }]}>
                    <Moon size={20} color="#818CF8" />
                  </View>
                  <View>
                    <Text style={[styles.themeOptionTitle, { color: colors.text }]}>Dark Mode</Text>
                    <Text style={[styles.themeOptionDesc, { color: colors.textMuted }]}>Easy on the eyes in low light</Text>
                  </View>
                </View>
                {themeMode === 'dark' && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>

              {/* System Mode */}
              <TouchableOpacity 
                style={[
                  styles.themeOptionRow, 
                  { backgroundColor: colors.background },
                  themeMode === 'system' && { borderColor: colors.primary, borderWidth: 1.5 }
                ]}
                onPress={() => {
                  setThemeMode('system');
                  setShowThemeModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionLeft}>
                  <View style={[styles.themeOptionIconWrap, { backgroundColor: colors.borderSubtle }]}>
                    <Smartphone size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.themeOptionTitle, { color: colors.text }]}>System Default</Text>
                    <Text style={[styles.themeOptionDesc, { color: colors.textMuted }]}>Matches your device settings</Text>
                  </View>
                </View>
                {themeMode === 'system' && <Check size={20} color={colors.primary} />}
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
  },
  scrollView: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  // Profile Card
  profileCard: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
  },
  userEmail: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  editProfileButton: {
    borderWidth: 1,
    borderRadius: layout.radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  editProfileText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
  },
  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionCard: {
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuItemLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
  },
  menuItemSubLabel: {
    fontFamily: typography.fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 36 + spacing.lg + spacing.md,
  },
  // Theme Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: layout.radius.lg,
    padding: spacing.xl,
    ...layout.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.lg,
  },
  themeOptionsList: {
    gap: spacing.md,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  themeOptionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
  },
  themeOptionDesc: {
    fontFamily: typography.fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
});
