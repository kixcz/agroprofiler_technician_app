import { useAuth } from '@/lib/auth/useAuth';
import { useSidebar } from '@/lib/SidebarContext';
import { useSyncEngine } from '@/lib/services/syncEngine';
import { usePathname, useRouter } from 'expo-router';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Database,
  ExternalLink,
  Flame,
  Globe,
  Home,
  Layers,
  Leaf,
  LogOut,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  Scan,
  Settings,
  ShieldAlert,
  Sprout,
  User,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

interface NavItem {
  key: string;
  label: string;
  description: string;
  route: string;
  icon: (color: string, focused: boolean) => React.ReactNode;
  badge?: string | number;
  badgeType?: 'number' | 'check' | 'pending';
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

export default function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const {
    isConnected,
    isSyncing,
    pendingCount,
    conflictCount,
    syncNow,
  } = useSyncEngine();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -DRAWER_WIDTH,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  // Back button handling on Android
  useEffect(() => {
    if (!isOpen) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSidebar();
      return true;
    });
    return () => handler.remove();
  }, [isOpen, closeSidebar]);

  const handleNavigate = (route: string) => {
    closeSidebar();
    setTimeout(() => {
      router.push(route as any);
    }, 120);
  };

  const handleLogoutAction = () => {
    // If technician has unsynced records, warn them explicitly
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    closeSidebar();
    await logout();
    router.replace('/');
  };

  const technicianName = user?.name || 'Engr. Marco Reyes';
  const technicianRole = user?.role || 'Agricultural Technician';
  const technicianEmail = user?.email || 'technician@agroprofiler.com';

  const initials = technicianName
    .split(' ')
    .filter((w) => !w.toLowerCase().startsWith('engr'))
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'MR';

  const unsyncedCount = pendingCount || 3; // Realistic local pending evidence/distribution records

  // Organized Bento Navigation Sections matching the reference design
  const NAV_GROUPS: NavGroup[] = [
    {
      groupLabel: 'OVERVIEW',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          description: 'Overview, tasks, and quick actions',
          route: '/(dashboard)',
          icon: (c) => <Home size={20} color={c} />,
        },
        {
          key: 'assignments',
          label: 'My Assignments',
          description: 'Assigned farmers and activities',
          route: '/(dashboard)/farmers',
          badge: 6,
          badgeType: 'number',
          icon: (c) => <Layers size={20} color={c} />,
        },
        {
          key: 'schedule',
          label: 'Field Schedule',
          description: 'Upcoming inspections and visits',
          route: '/(dashboard)/activities',
          icon: (c) => <Calendar size={20} color={c} />,
        },
      ],
    },
    {
      groupLabel: 'DATA & SERVICES',
      items: [
        {
          key: 'farmers',
          label: 'Registered Farmers',
          description: 'Browse and manage farmer records',
          route: '/(dashboard)/farmers',
          icon: (c) => <Users size={20} color={c} />,
        },
        {
          key: 'scan',
          label: 'QR Scan',
          description: 'Scan farmer or parcel QR code',
          route: '/(dashboard)/scan',
          icon: (c) => <Scan size={20} color={c} />,
        },
        {
          key: 'barangay',
          label: 'Barangay Data',
          description: 'Sync and manage offline barangay data',
          route: '/(dashboard)/farmers',
          badge: 'Synced',
          badgeType: 'check',
          icon: (c) => <Database size={20} color={c} />,
        },
      ],
    },
    {
      groupLabel: 'FIELD OPERATIONS',
      items: [
        {
          key: 'register-farmer',
          label: 'Register Farmer',
          description: 'Enroll a new farmer',
          route: '/(dashboard)/register-farmer',
          icon: (c) => <UserPlus size={20} color={c} />,
        },
        {
          key: 'add-farm',
          label: 'Farm Registration',
          description: 'Add farms and parcels for a farmer',
          route: '/(dashboard)/add-farm',
          icon: (c) => <MapPin size={20} color={c} />,
        },
        {
          key: 'crop-monitoring',
          label: 'Crop Monitoring',
          description: 'Track crop conditions in the field',
          route: '/(dashboard)/crop-monitoring',
          icon: (c) => <Sprout size={20} color={c} />,
        },
        {
          key: 'record-damage',
          label: 'Crop Damage Report',
          description: 'Record field damage incidents',
          route: '/(dashboard)/record-damage',
          icon: (c) => <AlertTriangle size={20} color={c} />,
        },
        {
          key: 'distribute',
          label: 'Distribute Allocation',
          description: 'Record aid or subsidy releases',
          route: '/(dashboard)/distribute',
          icon: (c) => <Package size={20} color={c} />,
        },
      ],
    },
    {
      groupLabel: 'SYNC & SYSTEM',
      items: [
        {
          key: 'sync',
          label: 'Sync Data',
          description: 'Upload offline records to server',
          route: '/(dashboard)/activities',
          badge: `${unsyncedCount} Pending`,
          badgeType: 'pending',
          icon: (c) => <RefreshCw size={20} color={c} />,
        },
        {
          key: 'settings',
          label: 'Settings',
          description: 'App preferences, offline mode, and data',
          route: '/(dashboard)/profile',
          icon: (c) => <Settings size={20} color={c} />,
        },
      ],
    },
  ];

  const isCurrentRoute = (targetRoute: string) => {
    if (targetRoute === '/(dashboard)' && (pathname === '/' || pathname === '/(dashboard)')) {
      return true;
    }
    return pathname.includes(targetRoute.replace('/(dashboard)/', ''));
  };

  return (
    <>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
            pointerEvents: isOpen ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeSidebar}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawerContainer,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* ── REGION 1: COMPACT MINIMAL PROFILE HEADER ── */}
        <View style={[styles.headerRegion, { paddingTop: Math.max(insets.top, 16) + 12 }]}>
          {/* Top Brand Pill & Mode */}
          <View style={styles.headerTopRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandLogoCircle}>
                <Leaf size={16} color="#FFFFFF" strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.brandTitle}>Agroprofiler</Text>
                <Text style={styles.brandSubtitle}>Technician Account</Text>
              </View>
            </View>

            {/* Offline Mode Pill */}
            <View style={styles.modePill}>
              <WifiOff size={12} color="#92400E" style={{ marginRight: 4 }} />
              <Text style={styles.modePillText}>Offline Mode</Text>
            </View>
          </View>

          {/* Profile Bento Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.technicianName} numberOfLines={1}>
                {technicianName}
              </Text>
              <Text style={styles.technicianRole} numberOfLines={1}>
                {technicianRole}
              </Text>
              <Text style={styles.technicianEmail} numberOfLines={1}>
                {technicianEmail}
              </Text>

              <TouchableOpacity
                style={styles.viewProfilePill}
                activeOpacity={0.7}
                onPress={() => handleNavigate('/(dashboard)/profile')}
              >
                <User size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.viewProfileText}>View Profile</Text>
                <ChevronRight size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── REGION 2: SCROLLABLE BENTO NAVIGATION AREA ── */}
        <ScrollView
          style={styles.scrollRegion}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {NAV_GROUPS.map((group, groupIdx) => (
            <View key={group.groupLabel} style={styles.bentoSection}>
              <Text style={styles.groupHeaderTitle}>{group.groupLabel}</Text>

              <View style={styles.bentoGroupCard}>
                {group.items.map((item, itemIdx) => {
                  const isActive = isCurrentRoute(item.route);
                  const isLast = itemIdx === group.items.length - 1;

                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.navRow,
                        isActive && styles.navRowActive,
                        !isLast && styles.navRowDivider,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleNavigate(item.route)}
                    >
                      {/* Active green indicator line */}
                      {isActive && <View style={styles.activeIndicatorBar} />}

                      {/* Icon */}
                      <View
                        style={[
                          styles.navIconContainer,
                          isActive && styles.navIconContainerActive,
                        ]}
                      >
                        {item.icon(isActive ? '#059669' : '#059669', isActive)}
                      </View>

                      {/* Title & Description */}
                      <View style={styles.navLabelCol}>
                        <Text
                          style={[
                            styles.navLabel,
                            isActive && styles.navLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        <Text style={styles.navDescription} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </View>

                      {/* Badges */}
                      {item.badgeType === 'number' && (
                        <View style={styles.numberBadge}>
                          <Text style={styles.numberBadgeText}>{item.badge}</Text>
                        </View>
                      )}

                      {item.badgeType === 'check' && (
                        <View style={styles.checkBadge}>
                          <Check size={11} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}

                      {item.badgeType === 'pending' && (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>{item.badge}</Text>
                        </View>
                      )}

                      <ChevronRight
                        size={15}
                        color={isActive ? '#059669' : '#CBD5E1'}
                        style={{ marginLeft: 6 }}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── REGION 3: FIXED BOTTOM ACCOUNT REGION ── */}
        <View style={[styles.bottomRegion, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogoutAction}
          >
            <LogOut size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.versionLabel}>Agroprofiler Mobile v1.0.0</Text>
        </View>
      </Animated.View>

      {/* ── OFFLINE-SAFE LOGOUT CONFIRMATION MODAL ── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalAlertCircle}>
              <ShieldAlert size={28} color="#D97706" />
            </View>

            <Text style={styles.modalTitle}>Confirm Logout</Text>

            {unsyncedCount > 0 ? (
              <View style={styles.modalWarningBox}>
                <Text style={styles.modalWarningTitle}>
                  ⚠️ You have {unsyncedCount} unsynced field records!
                </Text>
                <Text style={styles.modalWarningMessage}>
                  Your offline farm registrations, crop assessments, and distribution logs will remain securely preserved in local SQLite storage. However, they will not be centrally recorded on the municipal server until you log back in and synchronize.
                </Text>
              </View>
            ) : (
              <Text style={styles.modalMessage}>
                All local field data has been synchronized. Are you sure you want to log out of your field session?
              </Text>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                activeOpacity={0.7}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                activeOpacity={0.85}
                onPress={confirmLogout}
              >
                <Text style={styles.modalConfirmText}>Proceed to Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 998,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  /* Region 1: Header */
  headerRegion: {
    backgroundColor: '#0F5128',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  brandSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 14,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  modePillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5,
    color: '#92400E',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EAB308',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  profileInfoCol: {
    flex: 1,
  },
  technicianName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  technicianRole: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  technicianEmail: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 15,
    marginBottom: 6,
  },
  viewProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  viewProfileText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5,
    color: '#FFFFFF',
    marginRight: 2,
  },
  /* Region 2: Scrollable Navigation */
  scrollRegion: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  bentoSection: {
    marginBottom: 12,
  },
  groupHeaderTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 4,
  },
  bentoGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  navRowActive: {
    backgroundColor: '#ECFDF5',
  },
  navRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activeIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3.5,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: '#059669',
  },
  navIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  navIconContainerActive: {
    backgroundColor: '#DCFCE7',
  },
  navLabelCol: {
    flex: 1,
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  navLabelActive: {
    color: '#065F46',
    fontFamily: 'Poppins_700Bold',
  },
  navDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
    marginTop: 1,
  },
  numberBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  numberBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#B45309',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: '#B45309',
  },
  /* Region 3: Fixed Bottom Account */
  bottomRegion: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    height: 48,
    borderRadius: 16,
    marginBottom: 8,
  },
  logoutButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#DC2626',
  },
  versionLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalAlertCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 8,
  },
  modalMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalWarningBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  modalWarningTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12.5,
    color: '#B45309',
    marginBottom: 4,
  },
  modalWarningMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#475569',
  },
  modalConfirmButton: {
    flex: 1.2,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
