import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { colors, typography, spacing, layout } from '../../src/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
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
  },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  email: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: layout.radius.md,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error,
    fontFamily: typography.fonts.heading,
  },
});
