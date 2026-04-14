import { useAuth } from '@/lib/auth/useAuth';
import * as SecureStore from 'expo-secure-store';
import { Stack, useRouter } from 'expo-router';
import { Eye, EyeOff, Leaf, Loader2, Lock, Mail } from 'lucide-react-native';
import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

const REMEMBER_EMAIL_KEY = 'agro_remembered_email';
const REMEMBER_ME_KEY = 'agro_remember_me';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(dashboard)' as any);
    } else if (!isLoading) {
      setIsCheckingSession(false);
    }
  }, [isAuthenticated, isLoading]);

  // Restore remembered email
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const savedRemember = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
        if (savedRemember === 'true') {
          const savedEmail = await SecureStore.getItemAsync(REMEMBER_EMAIL_KEY);
          if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
          }
        }
      } catch {}
    };
    loadSaved();
  }, []);

  const handleLogin = async () => {
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
      Alert.alert('Login Failed', result.error || 'Invalid credentials. Please try again.');
    }
  };

  // Theme colors
  const bg = isDark ? '#071A0E' : '#F0FDF4';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#BBF7D0';
  const placeholder = isDark ? '#64748B' : '#94A3B8';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#0F1810' : '#F0FDF4';

  if (isCheckingSession) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#16A34A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={[styles.hero, { backgroundColor: '#16A34A' }]}>
            <View style={styles.logoCircle}>
              <Leaf size={38} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.appName}>Agro Mobile</Text>
            <Text style={styles.appTagline}>Technician Field Operations</Text>
          </View>

          {/* Card Form */}
          <View style={[styles.card, { backgroundColor: card, shadowColor: '#000' }]}>
            <Text style={[styles.welcomeTitle, { color: textPrimary }]}>Welcome back</Text>
            <Text style={[styles.welcomeSubtitle, { color: textMuted }]}>
              Sign in to continue your work
            </Text>

            {/* Error banner */}
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: textPrimary }]}>Email</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: border }]}>
                <Mail size={18} color={placeholder} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="Enter your email"
                  placeholderTextColor={placeholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: textPrimary }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: border }]}>
                <Lock size={18} color={placeholder} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="Enter your password"
                  placeholderTextColor={placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={placeholder} />
                  ) : (
                    <Eye size={18} color={placeholder} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((v) => !v)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: rememberMe ? '#16A34A' : 'transparent',
                    borderColor: rememberMe ? '#16A34A' : border,
                  },
                ]}
              >
                {rememberMe && <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={[styles.rememberText, { color: textMuted }]}>Remember my email</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={20} color="#FFFFFF" />
                  <Text style={styles.signInText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={[styles.registerLabel, { color: textMuted }]}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 52,
    paddingBottom: 60,
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appTagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '500',
  },
  signInBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLabel: {
    fontSize: 13,
  },
  registerLink: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },
});
