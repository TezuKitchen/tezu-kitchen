import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, typography, spacing, layout } from '../../src/theme';
import { getTransformedUrl } from '../../src/services/imageService';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: getTransformedUrl(user.avatarUrl, 'avatar-lg') }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User size={40} color={colors.textLight} />
            </View>
          )}
        </View>

        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(student)/edit-profile' as any)}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: layout.radius.lg,
    ...layout.shadows.sm,
    alignItems: 'center',
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
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
    textAlign: 'center',
  },
  email: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: layout.radius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    width: '100%',
  },
  editText: {
    color: colors.primary,
    fontFamily: typography.fonts.heading,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: layout.radius.md,
    alignItems: 'center',
    width: '100%',
  },
  logoutText: {
    color: colors.error,
    fontFamily: typography.fonts.heading,
  },
});
