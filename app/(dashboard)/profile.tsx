import { useAuth } from '@/lib/auth/useAuth';
import { useSidebar } from '@/lib/SidebarContext';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Info,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  User,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react-native';
import * as React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openSidebar } = useSidebar();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isSyncing, setIsSyncing]           = React.useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [syncedRecords, setSyncedRecords]     = React.useState(0);
  const isOnline = true;
  const lastSynced = '10 mins ago';
  const pendingSyncs = 5;

  const bg = isDark ? '#071A0E' : '#F0FDF4';
  const card = isDark ? '#0F2418' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#E7F5ED';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';

  const getInitials = (name?: string | null) => {
    if (!name) return 'AG';
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncedRecords(17);
      setShowSyncSuccess(true);
    }, 2000);
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace('/');
  };

  const syncHistory = [
    { time: '10 mins ago', status: 'success', records: 12 },
    { time: '1 hour ago', status: 'success', records: 8 },
    { time: '3 hours ago', status: 'success', records: 15 },
    { time: 'Yesterday, 4:30 PM', status: 'partial', records: 5 },
  ];

  const settingsItems = [
    { icon: <User size={20} color="#16A34A" />, label: 'Edit Profile', bg: '#DCFCE7' },
    { icon: <Settings size={20} color="#8B5CF6" />, label: 'App Settings', bg: '#F5F3FF' },
    { icon: <Info size={20} color="#10B981" />, label: 'About', bg: '#ECFDF5' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>

      {/* ══ Sync Success Dialog ══ */}
      <Modal visible={showSyncSuccess} transparent animationType="fade" onRequestClose={() => setShowSyncSuccess(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={[styles.dialogCard, { backgroundColor: card }]}>
            {/* Icon */}
            <View style={styles.dialogIconWrap}>
              <View style={styles.dialogIconRing}>
                <CheckCircle2 size={40} color="#16A34A" strokeWidth={1.8} />
              </View>
            </View>
            {/* Text */}
            <Text style={[styles.dialogTitle, { color: textPrimary }]}>Sync Complete</Text>
            <Text style={[styles.dialogMessage, { color: textMuted }]}>
              All data has been successfully synced to the server.
            </Text>
            {/* Stat */}
            <View style={styles.syncStatRow}>
              <View style={[styles.syncStatChip, { backgroundColor: '#F0FDF4' }]}>
                <RefreshCw size={14} color="#16A34A" />
                <Text style={[styles.syncStatText, { color: '#15803D' }]}>{syncedRecords} records synced</Text>
              </View>
              <View style={[styles.syncStatChip, { backgroundColor: '#EFF6FF' }]}>
                <Wifi size={14} color="#2563EB" />
                <Text style={[styles.syncStatText, { color: '#1D4ED8' }]}>Online</Text>
              </View>
            </View>
            {/* Button */}
            <TouchableOpacity style={styles.dialogPrimaryBtn} onPress={() => setShowSyncSuccess(false)} activeOpacity={0.85}>
              <Text style={styles.dialogPrimaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ Logout Confirm Dialog ══ */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={[styles.dialogCard, { backgroundColor: card }]}>
            {/* Close */}
            <TouchableOpacity style={styles.dialogCloseBtn} onPress={() => setShowLogoutConfirm(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={textMuted} />
            </TouchableOpacity>
            {/* Icon */}
            <View style={styles.dialogIconWrap}>
              <View style={[styles.dialogIconRing, { backgroundColor: '#FEF2F2' }]}>
                <AlertTriangle size={38} color="#EF4444" strokeWidth={1.8} />
              </View>
            </View>
            {/* Text */}
            <Text style={[styles.dialogTitle, { color: textPrimary }]}>Logout?</Text>
            <Text style={[styles.dialogMessage, { color: textMuted }]}>
              You will be signed out of your account. Any unsynced data will remain on this device.
            </Text>
            {/* Buttons */}
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity style={[styles.dialogSecondaryBtn, { borderColor: border }]} onPress={() => setShowLogoutConfirm(false)} activeOpacity={0.8}>
                <Text style={[styles.dialogSecondaryBtnText, { color: textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogDangerBtn} onPress={confirmLogout} activeOpacity={0.85}>
                <LogOut size={16} color="#FFFFFF" />
                <Text style={styles.dialogDangerBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: '#16A34A' }]}>
        <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Menu size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* ── Profile Hero ── */}
        <View style={[styles.profileHero, { backgroundColor: '#16A34A' }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.heroName}>{user?.name || 'Technician'}</Text>
          <Text style={styles.heroRole}>Agricultural Technician</Text>
          <Text style={styles.heroEmail}>{user?.email || ''}</Text>
        </View>

        {/* ── Sync Status Card ── */}
        <View style={styles.cardWrapper}>
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Sync Status</Text>
              <View style={[
                styles.statusPill,
                { backgroundColor: isOnline ? '#ECFDF5' : '#FEF2F2' },
              ]}>
                {isOnline ? (
                  <Wifi size={13} color="#10B981" />
                ) : (
                  <WifiOff size={13} color="#EF4444" />
                )}
                <Text style={[styles.statusPillText, { color: isOnline ? '#10B981' : '#EF4444' }]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>

            <Text style={[styles.syncedText, { color: textMuted }]}>
              Last synced: {lastSynced}
            </Text>

            {pendingSyncs > 0 && (
              <View style={styles.pendingBanner}>
                <AlertCircle size={15} color="#F59E0B" />
                <Text style={styles.pendingText}>{pendingSyncs} pending sync(s) waiting</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.syncBtn, (!isOnline || isSyncing) && { opacity: 0.6 }]}
              onPress={handleSync}
              disabled={!isOnline || isSyncing}
              activeOpacity={0.85}
            >
              <RefreshCw size={18} color="#FFFFFF" style={isSyncing ? { opacity: 0.7 } : {}} />
              <Text style={styles.syncBtnText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sync History ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Recent Sync History</Text>
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            {syncHistory.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.syncRow,
                  { borderBottomColor: border },
                  i === syncHistory.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.syncTime, { color: textPrimary }]}>{s.time}</Text>
                  <Text style={[styles.syncRecords, { color: textMuted }]}>{s.records} records synced</Text>
                </View>
                <View
                  style={[
                    styles.syncStatusPill,
                    { backgroundColor: s.status === 'success' ? '#ECFDF5' : '#FFFBEB' },
                  ]}
                >
                  {s.status === 'success' ? (
                    <CheckCircle size={12} color="#10B981" />
                  ) : (
                    <AlertCircle size={12} color="#F59E0B" />
                  )}
                  <Text
                    style={[
                      styles.syncStatusText,
                      { color: s.status === 'success' ? '#10B981' : '#F59E0B' },
                    ]}
                  >
                    {s.status === 'success' ? 'Complete' : 'Partial'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Account Settings ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Account Settings</Text>
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            {settingsItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.settingsRow,
                  { borderBottomColor: border },
                  i === settingsItems.length - 1 && { borderBottomWidth: 0 },
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.settingsIconBg, { backgroundColor: item.bg }]}>
                  {item.icon}
                </View>
                <Text style={[styles.settingsLabel, { color: textPrimary }]}>{item.label}</Text>
                <Text style={{ color: textMuted, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Logout ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: textMuted }]}>Agro Mobile App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileHero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 40,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroRole: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  syncedText: {
    fontSize: 13,
    marginBottom: 12,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  pendingText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '500',
  },
  syncBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  syncTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  syncRecords: {
    fontSize: 12,
  },
  syncStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 15,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 20,
  },

  /* ─── Custom Dialogs ─── */
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  dialogCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogIconWrap: {
    marginBottom: 18,
    marginTop: 4,
  },
  dialogIconRing: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  syncStatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  syncStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  syncStatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dialogPrimaryBtn: {
    width: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dialogPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dialogBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  dialogSecondaryBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dialogSecondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dialogDangerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 13,
  },
  dialogDangerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
