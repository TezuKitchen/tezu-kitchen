import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, layout } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { User, Store } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [role, setRole] = useState<'STUDENT' | 'OWNER'>('STUDENT');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!email || !password || (!isLoginMode && (!name || !phone))) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      if (isLoginMode) {
        // Login
        const response = await api.post('/auth/login', {
          email,
          password
        });
        
        // Backend wraps the AuthResponse in an ApiResponse (so the actual data is in response.data.data)
        const authData = response.data.data;
        const { accessToken, ...userData } = authData;
        await login(accessToken, userData);
        
        // Router will auto-redirect based on role in _layout/index
        if (userData.role === 'OWNER') {
          router.replace('/(owner)');
        } else {
          router.replace('/(student)');
        }
      } else {
        // Register
        const response = await api.post('/auth/register', {
          name,
          email,
          phone,
          password,
          role
        });
        console.log("REGISTER RESPONSE:", JSON.stringify(response.data));
        
        const authData = response.data.data;
        const { accessToken, ...userData } = authData;
        await login(accessToken, userData);
        
        if (userData.role === 'OWNER') {
          router.replace('/(owner)');
        } else {
          router.replace('/(student)');
        }
      }
    } catch (error: any) {
      console.error(error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          // Join validation errors with newlines
          errorMessage = data.details.join('\n');
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      
      Alert.alert('Authentication Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.brandName}>
              Tezu<Text style={{ color: colors.primary }}>Kitchen</Text>
            </Text>
            <Text style={styles.subtitle}>
              {role === 'STUDENT' ? 'Campus Dining & Delivery' : 'Partner Dashboard'}
            </Text>
          </View>

          {/* Role Selector */}
          <View style={styles.roleSelectorContainer}>
            <TouchableOpacity 
              style={[
                styles.roleCard, 
                role === 'STUDENT' && styles.roleCardActive
              ]}
              onPress={() => setRole('STUDENT')}
            >
              <User 
                size={24} 
                color={role === 'STUDENT' ? colors.primary : colors.textMuted} 
                style={styles.roleIcon}
              />
              <Text style={[
                styles.roleText, 
                role === 'STUDENT' && styles.roleTextActive
              ]}>
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.roleCard, 
                role === 'OWNER' && styles.roleCardActive
              ]}
              onPress={() => setRole('OWNER')}
            >
              <Store 
                size={24} 
                color={role === 'OWNER' ? colors.primary : colors.textMuted} 
                style={styles.roleIcon}
              />
              <Text style={[
                styles.roleText, 
                role === 'OWNER' && styles.roleTextActive
              ]}>
                Restaurant Owner
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mode Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, isLoginMode && styles.tabActive]}
              onPress={() => setIsLoginMode(true)}
            >
              <Text style={[styles.tabText, isLoginMode && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, !isLoginMode && styles.tabActive]}
              onPress={() => setIsLoginMode(false)}
            >
              <Text style={[styles.tabText, !isLoginMode && styles.tabTextActive]}>New Account</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {!isLoginMode && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder={role === 'STUDENT' ? "e.g. Ananya Sharma" : "e.g. Rahul Dev"}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765-01234"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <Text style={styles.label}>
              {role === 'STUDENT' ? 'University Email' : 'Email Address'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={role === 'STUDENT' ? "e.g. ananya.s@tezu.ac.in" : "e.g. owner@dhaba.com"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Password</Text>
              {isLoginMode && (
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter secure password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLoginMode ? 'Sign In to TezuKitchen' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
            
            {isLoginMode && role === 'STUDENT' && (
              <View style={styles.orContainer}>
                <View style={styles.divider} />
                <Text style={styles.orText}>OR FAST ACCESS</Text>
                <View style={styles.divider} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandName: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xxxl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  roleSelectorContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: layout.radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5F2', // Very light orange tint
  },
  roleIcon: {
    marginBottom: spacing.sm,
  },
  roleText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  roleTextActive: {
    color: colors.primary,
    fontFamily: typography.fonts.bodyBold,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.borderSubtle,
    borderRadius: layout.radius.sm,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: layout.radius.sm - 2,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...layout.shadows.sm,
  },
  tabText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
    fontFamily: typography.fonts.heading,
  },
  formContainer: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: layout.radius.lg,
    ...layout.shadows.sm,
  },
  label: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    marginBottom: spacing.lg,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  forgotText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: layout.radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...layout.shadows.brand,
  },
  submitButtonText: {
    color: colors.surface,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    marginHorizontal: spacing.md,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    letterSpacing: 1,
  },
});
