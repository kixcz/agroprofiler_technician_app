import { useAuth } from '@/lib/auth/useAuth';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Leaf, Loader2, Lock, Mail, User } from 'lucide-react-native';
import * as React from 'react';
import { useState } from 'react';
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

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    const result = await register(email.trim(), password, name.trim());
    if (result.success) {
      Alert.alert('Account Created!', 'Your account has been created successfully.', [
        { text: 'Sign In', onPress: () => router.replace('/') },
      ]);
    } else {
      Alert.alert('Registration Failed', result.error || 'Unable to create account.');
    }
  };

  // Theme colors
  const bg = isDark ? '#071A0E' : '#F0FDF4';
  const card = isDark ? '#0F2418' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#BBF7D0';
  const placeholder = isDark ? '#64748B' : '#94A3B8';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#0F1810' : '#F0FDF4';

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
          {/* Compact Hero */}
          <View style={[styles.hero, { backgroundColor: '#16A34A' }]}>
            {/* Back button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Leaf size={32} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSubtitle}>Join the Agro Mobile platform</Text>
          </View>

          {/* Card Form */}
          <View style={[styles.card, { backgroundColor: card, shadowColor: '#000' }]}>
            {/* Error banner */}
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: textPrimary }]}>Full Name</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: border }]}>
                <User size={18} color={placeholder} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="Your full name"
                  placeholderTextColor={placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                />
              </View>
            </View>

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
                  placeholder="Create a password (min 6 chars)"
                  placeholderTextColor={placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  returnKeyType="next"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? <EyeOff size={18} color={placeholder} /> : <Eye size={18} color={placeholder} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: textPrimary }]}>Confirm Password</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: border }]}>
                <Lock size={18} color={placeholder} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoComplete="password-new"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showConfirm ? <EyeOff size={18} color={placeholder} /> : <Eye size={18} color={placeholder} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={20} color="#FFFFFF" />
                  <Text style={styles.registerBtnText}>Creating account...</Text>
                </View>
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={[styles.loginLabel, { color: textMuted }]}>Already have an account? </Text>
              <Pressable onPress={() => router.replace('/')}>
                <Text style={styles.loginLink}>Sign In</Text>
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
    paddingTop: 20,
    paddingBottom: 50,
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
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
  registerBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLabel: {
    fontSize: 13,
  },
  loginLink: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },
});
