import { useAuth } from '@/lib/auth/useAuth';
import { useSidebar } from '@/lib/SidebarContext';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  DownloadCloud,
  FileCheck2,
  LogOut,
  Menu,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react-native';
import * as React from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useSyncEngine } from '@/lib/services/syncEngine';
import {
  getAllFieldEvidence,
  subscribeDatabaseChanges,
  FieldEvidenceRecord,
} from '@/lib/db/database';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openSidebar } = useSidebar();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    indicator,
    isConnected,
    isServerReachable,
    pendingCount,
    failedCount,
    conflictCount,
    lastSyncedAt,
    isSyncing,
    queueItems,
    syncNow,
    downloadOfflinePackage,
    retryQueueItem,
    acceptServerVersion,
  } = useSyncEngine();

  const [evidenceItems, setEvidenceItems] = React.useState<FieldEvidenceRecord[]>([]);
  const [showSyncSuccess, setShowSyncSuccess] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [syncedRecords, setSyncedRecords] = React.useState(0);
  const [downloadingPkg, setDownloadingPkg] = React.useState(false);

  const loadLocalMeta = async () => {
    const items = await getAllFieldEvidence();
    setEvidenceItems(items);
  };

  React.useEffect(() => {
    loadLocalMeta();
    const unsub = subscribeDatabaseChanges(() => {
      loadLocalMeta();
    });
    return unsub;
  }, []);

  const bg = isDark ? '#071A0E' : '#F0FDF4';
  const card = isDark ? '#0F2418' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#E7F5ED';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';

  const getInitials = (name?: string | null) => {
    if (!name) return 'AG';
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleSync = async () => {
    const res = await syncNow();
    setSyncedRecords(res.syncedCount);
    if (res.syncedCount > 0) {
      setShowSyncSuccess(true);
    } else if (res.conflictCount > 0 || res.failedCount > 0) {
      Alert.alert(
        'Sync Completed with Notices',
        `Synced: ${res.syncedCount} • Failed (Queued for Backoff Retry): ${res.failedCount} • Conflicts Flagged: ${res.conflictCount}`
      );
    } else {
      Alert.alert(
        'Sync Status',
        isConnected
          ? 'All pending records were processed.'
          : 'Device is offline. Transactions are safely stored in SQLite.'
      );
    }
  };

  const handleDownloadPackage = async () => {
    setDownloadingPkg(true);
    const res = await downloadOfflinePackage();
    setDownloadingPkg(false);
    Alert.alert('Pre-Visit Offline Cache', res.message);
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      {/* ══ Sync Success Dialog ══ */}
      <Modal visible={showSyncSuccess} transparent animationType="fade" onRequestClose={() => setShowSyncSuccess(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={[styles.dialogCard, { backgroundColor: card }]}>
            <View style={styles.dialogIconWrap}>
              <View style={styles.dialogIconRing}>
                <CheckCircle2 size={40} color="#16A34A" strokeWidth={1.8} />
              </View>
            </View>
            <Text style={[styles.dialogTitle, { color: textPrimary }]}>Sync Complete</Text>
            <Text style={[styles.dialogMessage, { color: textMuted }]}>
              Pending transactions and geotagged SHA-256 field evidence have been reconciled with the central server.
            </Text>
            <View style={styles.syncStatRow}>
              <View style={[styles.syncStatChip, { backgroundColor: '#F0FDF4' }]}>
                <RefreshCw size={14} color="#16A34A" />
                <Text style={[styles.syncStatText, { color: '#15803D' }]}>{syncedRecords} records synced</Text>
              </View>
              <View style={[styles.syncStatChip, { backgroundColor: '#EFF6FF' }]}>
                <Wifi size={14} color="#2563EB" />
                <Text style={[styles.syncStatText, { color: '#1D4ED8' }]}>{indicator}</Text>
              </View>
            </View>
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
            <TouchableOpacity style={styles.dialogCloseBtn} onPress={() => setShowLogoutConfirm(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={textMuted} />
            </TouchableOpacity>
            <View style={styles.dialogIconWrap}>
              <View style={[styles.dialogIconRing, { backgroundColor: '#FEF2F2' }]}>
                <AlertTriangle size={38} color="#EF4444" strokeWidth={1.8} />
              </View>
            </View>
            <Text style={[styles.dialogTitle, { color: textPrimary }]}>Logout?</Text>
            <Text style={[styles.dialogMessage, { color: textMuted }]}>
              You will be signed out of your account. Any unsynced SQLite transactions will remain safely persisted on this device.
            </Text>
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
        <Text style={styles.headerTitle}>Profile & Offline Sync Engine</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* ── Profile Hero ── */}
        <View style={[styles.profileHero, { backgroundColor: '#16A34A' }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.heroName}>{user?.name || 'Juan Dela Cruz'}</Text>
          <Text style={styles.heroRole}>
            Role: {user?.role || 'technician'} • Assigned: {(user?.assigned_barangays || ['Poblacion', 'San Isidro']).join(', ')}
          </Text>
          <Text style={styles.heroEmail}>{user?.email || 'technician@agroprofiler.gov.ph'}</Text>
        </View>

        {/* ── Sync Status Card ── */}
        <View style={styles.cardWrapper}>
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Synchronization Engine</Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: isConnected ? '#ECFDF5' : '#FEF2F2' },
                ]}
              >
                {isConnected ? (
                  <Wifi size={13} color="#10B981" />
                ) : (
                  <WifiOff size={13} color="#EF4444" />
                )}
                <Text style={[styles.statusPillText, { color: isConnected ? '#10B981' : '#EF4444' }]}>
                  {indicator}
                </Text>
              </View>
            </View>

            <Text style={[styles.syncedText, { color: textMuted }]}>
              Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Not yet synced'} • Server Reachable: {isServerReachable ? 'Yes' : 'Offline Mode'}
            </Text>

            {(pendingCount > 0 || failedCount > 0 || conflictCount > 0) && (
              <View style={styles.pendingBanner}>
                <AlertCircle size={15} color="#F59E0B" />
                <Text style={styles.pendingText}>
                  {pendingCount} Pending • {failedCount} Retrying (Backoff) • {conflictCount} Conflicts
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.syncBtn, { flex: 1 }, isSyncing && { opacity: 0.6 }]}
                onPress={handleSync}
                disabled={isSyncing}
                activeOpacity={0.85}
              >
                <RefreshCw size={17} color="#FFFFFF" />
                <Text style={styles.syncBtnText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.syncBtn, { flex: 1, backgroundColor: '#2563EB' }, downloadingPkg && { opacity: 0.6 }]}
                onPress={handleDownloadPackage}
                disabled={downloadingPkg}
                activeOpacity={0.85}
              >
                <DownloadCloud size={17} color="#FFFFFF" />
                <Text style={styles.syncBtnText}>{downloadingPkg ? 'Caching...' : 'Cache Offline'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Sync Queue & Conflict Resolution ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Offline Sync Queue ({queueItems.length})
          </Text>
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            {queueItems.length === 0 ? (
              <Text style={{ color: textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                All field transactions are synchronized or no offline changes queued yet.
              </Text>
            ) : (
              queueItems.slice(0, 12).map((item, i) => (
                <View
                  key={item.operation_id}
                  style={[
                    styles.syncRow,
                    { borderBottomColor: border },
                    i === Math.min(queueItems.length, 12) - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.syncTime, { color: textPrimary }]}>
                      {item.entity_type.toUpperCase()} ({item.action_type}) — {item.entity_local_id}
                    </Text>
                    <Text style={[styles.syncRecords, { color: textMuted }]}>
                      OpID: {item.operation_id.slice(0, 18)}... • Retries: {item.retry_count}
                    </Text>
                    {item.last_error && (
                      <Text style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>
                        {item.last_error}
                      </Text>
                    )}
                    {item.status === 'conflict' && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                          onPress={() => retryQueueItem(item.operation_id)}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>Retry Upload</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                          onPress={() => acceptServerVersion(item.operation_id)}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>Keep Server Version</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.syncStatusPill,
                      {
                        backgroundColor:
                          item.status === 'synced'
                            ? '#ECFDF5'
                            : item.status === 'conflict'
                            ? '#FCE7F3'
                            : '#FFFBEB',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.syncStatusText,
                        {
                          color:
                            item.status === 'synced'
                              ? '#10B981'
                              : item.status === 'conflict'
                              ? '#BE185D'
                              : '#F59E0B',
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── Geotagged Field Evidence Vault ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Cryptographic Field Evidence Vault ({evidenceItems.length})
          </Text>
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            {evidenceItems.length === 0 ? (
              <Text style={{ color: textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                No in-app geotagged photos captured yet in this session.
              </Text>
            ) : (
              evidenceItems.slice(0, 8).map((ev, i) => (
                <View
                  key={ev.evidence_id}
                  style={[
                    styles.syncRow,
                    { borderBottomColor: border },
                    i === Math.min(evidenceItems.length, 8) - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <FileCheck2 size={20} color="#16A34A" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.syncTime, { color: textPrimary }]}>
                      {ev.activity_type.replace(/_/g, ' ').toUpperCase()} • Brgy. {ev.detected_barangay}
                    </Text>
                    <Text style={[styles.syncRecords, { color: textMuted }]}>
                      GPS: {ev.latitude !== null ? `${ev.latitude.toFixed(5)}°N, ${ev.longitude?.toFixed(5)}°E` : 'Exception Logged'}{' '}
                      {ev.accuracy !== null ? `(±${Math.round(ev.accuracy)}m)` : ''} • {ev.barangay_verified ? 'Spatial Verified' : 'Unverified Boundary'}
                    </Text>
                    <Text style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>
                      SHA-256: {ev.file_hash_sha256.slice(0, 28)}...
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── Logout ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: textMuted }]}>
          AgroProfiler Field Operations v2.0 (Offline-First SQLite + SHA-256 Geotagging)
        </Text>
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.65)',
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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 14,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  syncTime: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  syncRecords: {
    fontSize: 11,
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
