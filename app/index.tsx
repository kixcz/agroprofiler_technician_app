import { useAuth } from '@/lib/auth/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Stack, useRouter } from 'expo-router';
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  Mail,
  UserPlus,
} from 'lucide-react-native';
import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HAS_ONBOARDED_KEY } from './onboarding';

const REMEMBER_EMAIL_KEY = 'agro_remembered_email';
const REMEMBER_ME_KEY = 'agro_remember_me';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Check onboarding and auto-redirect if already authenticated
  useEffect(() => {
    const initApp = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem(HAS_ONBOARDED_KEY);
        if (!hasCompletedOnboarding) {
          router.replace('/onboarding' as any);
          return;
        }

        if (!isLoading && isAuthenticated) {
          router.replace('/(dashboard)' as any);
          return;
        }

        const savedRemember = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
        if (savedRemember === 'true') {
          const savedEmail = await SecureStore.getItemAsync(REMEMBER_EMAIL_KEY);
          if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
          }
        }
      } catch (err) {
        console.warn('Initialization check error:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    initApp();
  }, [isAuthenticated, isLoading]);

  const handleLogin = async () => {
    setSessionError(null);
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    if (rememberMe) {
      await SecureStore.setItemAsync(REMEMBER_EMAIL_KEY, email.trim());
      await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(REMEMBER_EMAIL_KEY);
      await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'false');
    }

    const result = await login({ email: email.trim(), password });
    if (result.success) {
      router.replace('/(dashboard)' as any);
    } else {
      setSessionError(result.error || 'Invalid credentials. Please verify your login details.');
    }
  };

  if (isCheckingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Banner Landscape */}
      <View style={styles.topLandscapeContainer}>
        <Image
          source={require('@/assets/images/agro_field_header.png')}
          style={styles.topLandscapeImage}
          resizeMode="cover"
        />

        <SafeAreaView edges={['top']} style={styles.brandingContainer}>
          <View style={styles.logoCircleOuter}>
            <View style={styles.logoCircleInner}>
              <Image
                source={require('@/assets/images/app_logo_transparent.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.appTitle}>Agro Mobile</Text>
          <Text style={styles.appSubtitle}>Technician Field Operations</Text>
        </SafeAreaView>
      </View>

      {/* Main Curved Form Sheet */}
      <View style={styles.bottomSheet}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header titles */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Welcome back</Text>
              <Text style={styles.sheetSubtitle}>
                Sign in to continue your field operations
              </Text>
            </View>

            {/* Illustration Graphic */}
            <View style={styles.illustrationWrapper}>
              <Image
                source={require('@/assets/images/illus_secure_login.jpg')}
                style={styles.illustrationImage}
                resizeMode="cover"
              />
            </View>

            {/* Error Banner (matching attached mockup) */}
            {sessionError && (
              <View style={styles.errorBanner}>
                <View style={styles.errorIconWrapper}>
                  <AlertTriangle size={20} color="#DC2626" />
                </View>
                <View style={styles.errorTextWrapper}>
                  <Text style={styles.errorTitle}>Failed to sign in</Text>
                  <Text style={styles.errorMessage}>{sessionError}</Text>
                </View>
              </View>
            )}

            {/* Form Inputs */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputBox}>
                <Mail size={18} color="#059669" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputBox}>
                <Lock size={18} color="#059669" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me and Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                activeOpacity={0.7}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    'Forgot Password',
                    'Please contact your agricultural municipal office administrator to reset your credentials.'
                  )
                }
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Primary Action Button */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.signInButtonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider 'or' */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Secondary Registration Link */}
            <TouchableOpacity
              style={styles.signUpButton}
              activeOpacity={0.7}
              onPress={() => router.push('/register' as any)}
            >
              <View style={styles.signUpContent}>
                <UserPlus size={18} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.signUpText}>
                  Don't have an account?{' '}
                  <Text style={styles.signUpBoldText}>Sign Up</Text>
                </Text>
              </View>
            </TouchableOpacity>

            {/* Onboarding preview link */}
            <TouchableOpacity
              style={styles.onboardingReviewLink}
              onPress={() => router.push('/onboarding' as any)}
            >
              <Text style={styles.onboardingReviewText}>
                View App Guide & Onboarding
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E6F38',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLandscapeContainer: {
    height: 280,
    width: '100%',
    position: 'relative',
    backgroundColor: '#2F855A',
  },
  topLandscapeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  brandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 24 : 10,
  },
  logoCircleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoCircleInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 40,
  },
  sheetHeader: {
    marginBottom: 14,
  },
  illustrationWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F3F9F5',
    borderWidth: 1,
    borderColor: '#E2F0E8',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#132A1C',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#4B6354',
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  errorIconWrapper: {
    marginRight: 10,
    marginTop: 1,
  },
  errorTextWrapper: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorMessage: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F9F5',
    borderWidth: 1,
    borderColor: '#C7E5D3',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  rememberMeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  signInButton: {
    backgroundColor: '#059669',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  signUpButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  signUpBoldText: {
    color: '#059669',
    fontWeight: '800',
  },
  onboardingReviewLink: {
    alignItems: 'center',
    marginTop: 18,
  },
  onboardingReviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});
