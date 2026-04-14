import { useAuth } from '@/lib/auth/useAuth';
import { useSidebar } from '@/lib/SidebarContext';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ChevronRight,
  Home,
  Leaf,
  LogOut,
  MapPin,
  Package,
  QrCode,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.82;

const AVATAR_PALETTE = ['#16A34A', '#2563EB', '#9333EA', '#F59E0B', '#EF4444', '#0891B2'];
const getAvatarColor = (name?: string | null) => {
  if (!name) return '#16A34A';
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
};
const getInitials = (name?: string | null) => {
  if (!name) return 'AG';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
};

interface NavItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
  iconBg: string;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

export default function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const translateX      = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity  = useRef(new Animated.Value(0)).current;

  /* ── Animation ── */
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 68, friction: 12 }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, { toValue: -SIDEBAR_WIDTH, useNativeDriver: true, tension: 68, friction: 12 }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  /* ── Android back ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSidebar();
      return true;
    });
    return () => handler.remove();
  }, [isOpen, closeSidebar]);

  /* ── Theme ── */
  const panelBg     = isDark ? '#0D1F13' : '#FFFFFF';
  const cardBg      = isDark ? '#152A1C' : '#F8FAFC';
  const borderColor = isDark ? '#1F3A28' : '#E2E8F0';
  const textPrimary = isDark ? '#F9FAFB' : '#0F172A';
  const textMuted   = isDark ? '#9CA3AF' : '#6B7280';
  const overlayBg   = isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.52)';

  /* ── Nav groups ── */
  const navGroups: NavGroup[] = [
    {
      groupLabel: 'MAIN',
      items: [
        { icon: <Home size={20} color="#16A34A" />,        label: 'Dashboard',           description: 'Overview and quick actions',       route: '/(dashboard)',                 iconBg: '#DCFCE7' },
        { icon: <Users size={20} color="#2563EB" />,       label: 'Registered Farmers',  description: 'Browse and manage farmers',         route: '/(dashboard)/farmers',         iconBg: '#EFF6FF' },
        { icon: <QrCode size={20} color="#0891B2" />,      label: 'QR Scan',             description: 'Scan farmer or parcel QR code',     route: '/(dashboard)/scan',            iconBg: '#CFFAFE' },
      ],
    },
    {
      groupLabel: 'FIELD OPERATIONS',
      items: [
        { icon: <UserPlus size={20} color="#16A34A" />,      label: 'Register Farmer',      description: 'Enroll a new farmer',               route: '/(dashboard)/register-farmer', iconBg: '#DCFCE7' },
        { icon: <MapPin size={20} color="#0891B2" />,        label: 'Farm Registration',    description: 'Add farms and parcels for a farmer', route: '/(dashboard)/add-farm',        iconBg: '#CFFAFE' },
        { icon: <Leaf size={20} color="#166534" />,          label: 'Crop Monitoring',      description: 'Track crop conditions in the field', route: '/(dashboard)/crop-monitoring', iconBg: '#F0FDF4' },
        { icon: <AlertTriangle size={20} color="#F59E0B" />, label: 'Crop Damage Report',   description: 'Record field damage incidents',      route: '/(dashboard)/record-damage',   iconBg: '#FFFBEB' },
        { icon: <Package size={20} color="#8B5CF6" />,       label: 'Distribute Allocation', description: 'Record aid or subsidy releases',   route: '/(dashboard)/distribute',      iconBg: '#F5F3FF' },
      ],
    },
  ];

  /* ── Handlers ── */
  const handleNav = (route: string) => {
    closeSidebar();
    setTimeout(() => router.push(route as any), 180);
  };

  const handleGoProfile = () => {
    closeSidebar();
    setTimeout(() => router.push('/(dashboard)/profile' as any), 180);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    closeSidebar();
    await logout();
    router.replace('/');
  };

  if (!isOpen) return null;

  const avatarColor = getAvatarColor(user?.name);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* ── Dim overlay ── */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: overlayOpacity }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayBg }]}
          onPress={closeSidebar}
          activeOpacity={1}
        />
      </Animated.View>

      {/* ── Sidebar panel ── */}
      <Animated.View
        style={[
          styles.panel,
          {
            width: SIDEBAR_WIDTH,
            backgroundColor: panelBg,
            transform: [{ translateX }],
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        {/* ════════════════════════════════════════
            PROFILE HEADER  (tappable → profile)
            ════════════════════════════════════════ */}
        <TouchableOpacity
          style={[styles.profileHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 10) }]}
          onPress={handleGoProfile}
          activeOpacity={0.88}
        >
          {/* Close button top-right */}
          <TouchableOpacity
            style={[styles.closeBtn, { top: insets.top + (Platform.OS === 'android' ? 12 : 10) }]}
            onPress={closeSidebar}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* App label */}
          <Text style={styles.appLabel}>AgroProfiler</Text>

          {/* Avatar */}
          <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.4)' }]}>
            <View style={[styles.avatarInner, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
          </View>

          {/* Name + role */}
          <Text style={styles.profileName} numberOfLines={1}>
            {user?.name || 'Technician'}
          </Text>
          <Text style={styles.profileRole}>Agricultural Technician</Text>
          {user?.email && (
            <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
          )}

          {/* View Profile row */}
          <View style={styles.viewProfileRow}>
            <User size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.viewProfileText}>View Profile</Text>
            <ChevronRight size={13} color="rgba(255,255,255,0.85)" />
          </View>
        </TouchableOpacity>

        {/* ════════════════════════════════════════
            NAV GROUPS
            ════════════════════════════════════════ */}
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.navContent}
          showsVerticalScrollIndicator={false}
        >
          {navGroups.map((group) => (
            <View key={group.groupLabel} style={styles.navGroup}>
              <Text style={[styles.groupLabel, { color: textMuted }]}>{group.groupLabel}</Text>
              <View style={[styles.groupCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                {group.items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.route}
                    style={[
                      styles.navItem,
                      { borderBottomColor: borderColor },
                      idx === group.items.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => handleNav(item.route)}
                    activeOpacity={0.72}
                  >
                    <View style={[styles.navIconBg, { backgroundColor: item.iconBg }]}>
                      {item.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.navLabel, { color: textPrimary }]}>{item.label}</Text>
                      <Text style={[styles.navDesc, { color: textMuted }]}>{item.description}</Text>
                    </View>
                    <ChevronRight size={14} color={textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* ── Logout button ── */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setShowLogoutConfirm(true)}
              activeOpacity={0.82}
            >
              <LogOut size={18} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Version */}
          <Text style={[styles.version, { color: textMuted }]}>Agro Mobile v1.0.0</Text>
        </Animated.ScrollView>
      </Animated.View>

      {/* ════════════════════════════════════════
          LOGOUT CONFIRM MODAL
          ════════════════════════════════════════ */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={[styles.dialogCard, { backgroundColor: panelBg }]}>
            {/* Icon */}
            <View style={styles.dialogIconRing}>
              <AlertTriangle size={36} color="#EF4444" />
            </View>

            {/* Text */}
            <Text style={[styles.dialogTitle, { color: textPrimary }]}>Logout</Text>
            <Text style={[styles.dialogMessage, { color: textMuted }]}>
              Are you sure you want to log out of your account?
            </Text>

            {/* Buttons */}
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity
                style={[styles.dialogSecondaryBtn, { borderColor: borderColor }]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={[styles.dialogSecondaryBtnText, { color: textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogDangerBtn} onPress={confirmLogout}>
                <LogOut size={15} color="#FFFFFF" />
                <Text style={styles.dialogDangerBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    shadowColor: '#000', shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 20,
    overflow: 'hidden',
  },

  /* ── Profile header ── */
  profileHeader: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 20,
    paddingBottom: 18,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  profileRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
    fontWeight: '500',
  },
  profileEmail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  viewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },

  /* ── Nav ── */
  navContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  navGroup: { gap: 8 },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  navIconBg: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  navDesc: {
    fontSize: 11,
  },

  /* ── Logout ── */
  logoutSection: { marginTop: 4 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  version: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 14,
    marginBottom: 4,
  },

  /* ── Logout confirm dialog ── */
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  dialogIconRing: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  dialogSecondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dialogSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dialogDangerBtn: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogDangerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
