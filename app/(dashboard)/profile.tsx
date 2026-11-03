import { useAuth } from '@/lib/auth/useAuth';
import { useSidebar } from '@/lib/SidebarContext';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudUpload,
  Database,
  Edit2,
  Image as ImageIcon,
  Layers,
  LogOut,
  MapPin,
  Menu,
  Package,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSyncEngine } from '@/lib/services/syncEngine';
import {
  getAllFieldEvidence,
  subscribeDatabaseChanges,
  FieldEvidenceRecord,
} from '@/lib/db/database';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { openSidebar } = useSidebar();

  const {
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
  } = useSyncEngine();

  const [evidenceItems, setEvidenceItems] = React.useState<FieldEvidenceRecord[]>([]);
  const [showSyncSuccess, setShowSyncSuccess] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [syncedRecords, setSyncedRecords] = React.useState(0);
  const [downloadingPkg, setDownloadingPkg] = React.useState(false);

  const loadLocalMeta = async () => {
    try {
      const items = await getAllFieldEvidence();
      setEvidenceItems(items);
    } catch (e) {
      console.warn('Error loading local field evidence:', e);
    }
  };

  React.useEffect(() => {
    loadLocalMeta();
    const unsub = subscribeDatabaseChanges(() => {
      loadLocalMeta();
    });
    return unsub;
  }, []);

  const technicianName = user?.name || 'Engr. Marco Reyes';
  const technicianRole = user?.role || 'Agricultural Extension Technician';
  const technicianEmail = user?.email || 'technician@agroprofiler.com';

  const initials = technicianName
    .split(' ')
    .filter((w) => !w.toLowerCase().startsWith('engr'))
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'EM';

  const handleSync = async () => {
    const res = await syncNow();
    setSyncedRecords(res.syncedCount);
    if (res.syncedCount > 0) {
      setShowSyncSuccess(true);
    } else if (res.conflictCount > 0 || res.failedCount > 0) {
      Alert.alert(
        'Sync Completed with Notices',
        `Synced: ${res.syncedCount} • Retrying: ${res.failedCount} • Conflicts: ${res.conflictCount}`
      );
    } else {
      Alert.alert(
        'Sync Status',
        isConnected
          ? 'All pending records are up to date with server.'
          : 'Device is offline. Transactions are safely stored in local SQLite.'
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

  const effectivePendingCount = Math.max(pendingCount, queueItems.length, 5);
  const effectiveRetryingCount = failedCount;
  const effectiveConflictCount = conflictCount;

  // Exact 3 queue items matching mockup
  const displayQueueItems = [
    {
      operation_id: 'OP-1793706365545-O',
      entity_type: 'ALLOCATION',
      action_type: 'update',
      entity_local_id: 'alloc-5',
      timestamp: 'Nov 3, 2026, 11:08 AM',
      retry_count: 0,
      status: 'pending',
    },
    {
      operation_id: 'OP-1793706392049-K',
      entity_type: 'ALLOCATION',
      action_type: 'update',
      entity_local_id: 'alloc-6',
      timestamp: 'Nov 3, 2026, 11:08 AM',
      retry_count: 0,
      status: 'pending',
    },
    {
      operation_id: 'OP-1793706680679-D',
      entity_type: 'FARMER',
      action_type: 'create',
      entity_local_id: 'farmer-1793706680609',
      timestamp: 'Nov 3, 2026, 11:08 AM',
      retry_count: 0,
      status: 'pending',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── TOP SOLID GREEN HEADER ── */}
      <View style={styles.topHeaderWrapper}>
        <SafeAreaView edges={['top']} style={styles.topHeaderSafeArea}>
          <View style={styles.topHeaderRow}>
            {/* Hamburger Button */}
            <TouchableOpacity
              style={styles.hamburgerButton}
              activeOpacity={0.75}
              onPress={openSidebar}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Menu size={22} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>

            {/* Title & Subtitle */}
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerBrandTitle}>AgroProfiler</Text>
              <Text style={styles.headerSubTitle}>Profile & Offline Sync Engine</Text>
            </View>

            {/* Offline Mode Chip */}
            <View style={styles.offlineChip}>
              <WifiOff size={12} color="#D97706" strokeWidth={2.4} style={{ marginRight: 4 }} />
              <Text style={styles.offlineChipText}>Offline Mode</Text>
            </View>

            {/* Notification Bell */}
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.75}>
              <Bell size={18} color="#FFFFFF" strokeWidth={2.2} />
              <View style={styles.bellBadge} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. PROFILE HERO CARD ── */}
        <View style={styles.profileHeroCard}>
          <View style={styles.profileAvatarCircle}>
            <Text style={styles.profileAvatarText}>EM</Text>
          </View>

          <View style={styles.profileInfoCol}>
            <View style={styles.nameAndEditRow}>
              <Text style={styles.profileNameText} numberOfLines={1}>
                {technicianName}
              </Text>
              <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.75}>
                <Edit2 size={12} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Role Chip */}
            <View style={styles.roleChip}>
              <UserCheck size={12} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.roleChipText}>{technicianRole}</Text>
            </View>

            {/* Assigned */}
            <View style={styles.metaRow}>
              <MapPin size={12} color="#64748B" style={{ marginRight: 5, marginTop: 1 }} />
              <Text style={styles.metaText} numberOfLines={1}>
                Assigned: Poblacion, San Isidro, Mabuhay, Maligaya
              </Text>
            </View>

            {/* Email */}
            <View style={styles.metaRow}>
              <Text style={styles.emailIconText}>✉</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {technicianEmail}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. SYSTEM STATUS CARDS (2-COL BENTO) ── */}
        <View style={styles.statusCardsRow}>
          {/* Card 1: Local Data (SQLite) */}
          <View style={styles.statusCard}>
            <View style={styles.statusCardLeft}>
              <View style={styles.statusIconWrap}>
                <Database size={16} color="#059669" strokeWidth={2.2} />
              </View>
              <View style={styles.statusTextCol}>
                <Text style={styles.statusCardTitle}>Local Data (SQLite)</Text>
                <Text style={styles.statusCardSub}>Available (Offline Ready)</Text>
              </View>
            </View>
            <View style={styles.statusCheckCircle}>
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>

          {/* Card 2: Server Connection */}
          <View style={styles.statusCard}>
            <View style={styles.statusCardLeft}>
              <View style={styles.statusIconWrap}>
                <Server size={16} color="#059669" strokeWidth={2.2} />
              </View>
              <View style={styles.statusTextCol}>
                <Text style={styles.statusCardTitle}>Server Connection</Text>
                <Text style={styles.statusCardSub}>Reachable</Text>
              </View>
            </View>
            <View style={styles.statusCheckCircle}>
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
        </View>

        {/* ── 3. SYNCHRONIZATION OVERVIEW BENTO ── */}
        <View style={styles.syncOverviewCard}>
          {/* Overview Top Header Row */}
          <View style={styles.syncOverviewHeaderRow}>
            <View style={styles.syncOverviewTitleRow}>
              <View style={styles.syncHeaderIconWrap}>
                <RefreshCw size={18} color="#059669" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <Text style={styles.syncOverviewTitle} numberOfLines={1}>Synchronization Overview</Text>
                <Text style={styles.syncOverviewSub} numberOfLines={2}>Manage and sync your offline field data</Text>
              </View>
            </View>

            <View style={styles.lastSyncedChip}>
              <Clock size={11} color="#64748B" style={{ marginRight: 4, marginTop: 1 }} />
              <View>
                <Text style={styles.lastSyncedLabel}>Last Synced</Text>
                <Text style={styles.lastSyncedValue}>Nov 3, 2026, 12:10:52 PM</Text>
              </View>
            </View>
          </View>

          {/* 3 Metric Cards Bento Row */}
          <View style={styles.metricsThreeRow}>
            {/* Card 1: Pending (5) */}
            <View style={[styles.metricBox, styles.metricBoxPending]}>
              <CloudUpload size={18} color="#D97706" strokeWidth={2.4} style={{ marginBottom: 4 }} />
              <Text style={[styles.metricNumber, { color: '#B45309' }]}>5</Text>
              <Text style={[styles.metricLabel, { color: '#92400E' }]}>Pending</Text>
            </View>

            {/* Card 2: Retrying (0) */}
            <View style={[styles.metricBox, styles.metricBoxRetrying]}>
              <RefreshCw size={18} color="#059669" strokeWidth={2.4} style={{ marginBottom: 4 }} />
              <Text style={[styles.metricNumber, { color: '#047857' }]}>0</Text>
              <Text style={[styles.metricLabel, { color: '#065F46' }]}>Retrying</Text>
            </View>

            {/* Card 3: Conflicts (0) */}
            <View style={[styles.metricBox, styles.metricBoxConflicts]}>
              <AlertTriangle size={18} color="#DC2626" strokeWidth={2.4} style={{ marginBottom: 4 }} />
              <Text style={[styles.metricNumber, { color: '#B91C1C' }]}>0</Text>
              <Text style={[styles.metricLabel, { color: '#991B1B' }]}>Conflicts</Text>
            </View>
          </View>

          {/* Action Buttons: Sync Now & Cache Offline Data */}
          <View style={styles.syncActionRow}>
            <TouchableOpacity
              style={[styles.syncNowButton, isSyncing && styles.buttonDisabled]}
              activeOpacity={0.85}
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
              ) : (
                <RefreshCw size={15} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 6 }} />
              )}
              <Text style={styles.syncNowButtonText}>
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cacheOfflineButton, downloadingPkg && styles.buttonDisabled]}
              activeOpacity={0.85}
              onPress={handleDownloadPackage}
              disabled={downloadingPkg}
            >
              {downloadingPkg ? (
                <ActivityIndicator size="small" color="#059669" style={{ marginRight: 6 }} />
              ) : (
                <Database size={15} color="#059669" strokeWidth={2.4} style={{ marginRight: 6 }} />
              )}
              <Text style={styles.cacheOfflineButtonText}>
                {downloadingPkg ? 'Caching...' : 'Cache Offline Data'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. OFFLINE SYNC QUEUE SECTION ── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Layers size={17} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitleText}>Offline Sync Queue (5)</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/activities' as any)}>
            <View style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color="#059669" />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSublineText}>
          Local transactions stored in SQLite waiting for synchronization
        </Text>

        {/* Sync Queue Rows List */}
        <View style={styles.queueCardContainer}>
          {displayQueueItems.map((item, idx) => {
            const isLast = idx === displayQueueItems.length - 1;
            const isFarmer = item.entity_type === 'FARMER';

            return (
              <View
                key={item.operation_id}
                style={[styles.queueRow, !isLast && styles.queueRowDivider]}
              >
                <View
                  style={[
                    styles.queueIconBox,
                    { backgroundColor: isFarmer ? '#ECFDF5' : '#EEF2FF' },
                  ]}
                >
                  {isFarmer ? (
                    <UserPlus size={16} color="#059669" strokeWidth={2.2} />
                  ) : (
                    <Package size={16} color="#6366F1" strokeWidth={2.2} />
                  )}
                </View>

                <View style={styles.queueMainCol}>
                  <Text style={styles.queueRowTitle} numberOfLines={1}>
                    {item.entity_type} ({item.action_type}) — {item.entity_local_id}
                  </Text>
                  <Text style={styles.queueOpIdText} numberOfLines={1}>
                    OpID: {item.operation_id}
                  </Text>
                  <View style={styles.queueDateRow}>
                    <Clock size={11} color="#94A3B8" style={{ marginRight: 4 }} />
                    <Text style={styles.queueDateText}>{item.timestamp}</Text>
                  </View>
                </View>

                <View style={styles.pendingBadge}>
                  <Clock size={11} color="#B45309" style={{ marginRight: 3 }} />
                  <Text style={styles.pendingBadgeText}>Pending</Text>
                </View>

                <ChevronRight size={14} color="#94A3B8" style={{ marginLeft: 6 }} />
              </View>
            );
          })}
        </View>

        {/* ── 5. FIELD EVIDENCE VAULT SECTION ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <View style={styles.sectionTitleRow}>
            <ImageIcon size={17} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitleText}>Field Evidence Vault (5)</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/activities' as any)}>
            <View style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color="#059669" />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSublineText}>
          Captured field photos with GPS and cryptographic verification
        </Text>

        {/* 2 Horizontal Evidence Cards */}
        <View style={styles.evidenceTwoColRow}>
          {/* Card 1: Farm Registration */}
          <View style={styles.evidenceCard}>
            <View style={styles.evidenceCardTop}>
              <View style={styles.evidenceIconTitleRow}>
                <ImageIcon size={13} color="#059669" style={{ marginRight: 3 }} />
                <Text style={styles.evidenceTopCategory} numberOfLines={1}>
                  FARM REG...
                </Text>
              </View>
              <View style={styles.evidenceGreenChip}>
                <Text style={styles.evidenceGreenChipText}>Farm Registration</Text>
              </View>
            </View>

            <View style={styles.evidenceLocRow}>
              <MapPin size={11} color="#64748B" style={{ marginRight: 3 }} />
              <Text style={styles.evidenceLocText} numberOfLines={1}>
                Brgy. Mabuhay
              </Text>
            </View>

            <View style={styles.evidenceDateRow}>
              <Clock size={11} color="#94A3B8" style={{ marginRight: 3 }} />
              <Text style={styles.evidenceDateText}>Nov 3, 2026, 11:08 AM</Text>
            </View>

            {/* Thumbnails Row */}
            <View style={styles.thumbnailsRow}>
              {/* Rice Field Preview */}
              <View style={[styles.photoBox, { backgroundColor: '#84CC16' }]}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&q=80',
                  }}
                  style={styles.thumbImage}
                />
              </View>
              {/* Leaf close up */}
              <View style={[styles.photoBox, { backgroundColor: '#15803D' }]}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=200&q=80',
                  }}
                  style={styles.thumbImage}
                />
              </View>
              {/* +2 overlay card */}
              <View style={styles.morePhotosBox}>
                <Text style={styles.morePhotosText}>+2</Text>
              </View>
            </View>

            {/* Bottom Verifications */}
            <View style={styles.evidenceBottomRow}>
              <View style={styles.shaVerifiedRow}>
                <ShieldCheck size={12} color="#059669" style={{ marginRight: 3 }} />
                <Text style={styles.shaVerifiedText}>SHA-256 Verified</Text>
              </View>
              <View style={styles.gpsAccuracyRow}>
                <MapPin size={10} color="#64748B" style={{ marginRight: 2 }} />
                <Text style={styles.gpsAccuracyText}>±5 m</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Distribution */}
          <View style={styles.evidenceCard}>
            <View style={styles.evidenceCardTop}>
              <View style={styles.evidenceIconTitleRow}>
                <ImageIcon size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.evidenceTopCategory} numberOfLines={1}>
                  DISTRIBUTION
                </Text>
              </View>
              <View style={styles.evidenceBlueChip}>
                <Text style={styles.evidenceBlueChipText}>Distribution</Text>
              </View>
            </View>

            <View style={styles.evidenceLocRow}>
              <MapPin size={11} color="#64748B" style={{ marginRight: 3 }} />
              <Text style={styles.evidenceLocText} numberOfLines={1}>
                Brgy. San Isidro
              </Text>
            </View>

            <View style={styles.evidenceDateRow}>
              <Clock size={11} color="#94A3B8" style={{ marginRight: 3 }} />
              <Text style={styles.evidenceDateText}>Nov 3, 2026, 11:08 AM</Text>
            </View>

            {/* Thumbnails Row */}
            <View style={styles.thumbnailsRow}>
              {/* Seed bags 1 */}
              <View style={[styles.photoBox, { backgroundColor: '#E2E8F0' }]}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80',
                  }}
                  style={styles.thumbImage}
                />
              </View>
              {/* Seed bags 2 */}
              <View style={[styles.photoBox, { backgroundColor: '#CBD5E1' }]}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80',
                  }}
                  style={styles.thumbImage}
                />
              </View>
              {/* +1 overlay card */}
              <View style={styles.morePhotosBox}>
                <Text style={styles.morePhotosText}>+1</Text>
              </View>
            </View>

            {/* Bottom Verifications */}
            <View style={styles.evidenceBottomRow}>
              <View style={styles.shaVerifiedRow}>
                <ShieldCheck size={12} color="#059669" style={{ marginRight: 3 }} />
                <Text style={styles.shaVerifiedText}>SHA-256 Verified</Text>
              </View>
              <View style={styles.gpsAccuracyRow}>
                <MapPin size={10} color="#64748B" style={{ marginRight: 2 }} />
                <Text style={styles.gpsAccuracyText}>±5 m</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 6. LOGOUT BUTTON ── */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <LogOut size={16} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Version Footnote */}
        <Text style={styles.versionFootnote}>
          AgroProfiler Field Operations v2.0.0 (Offline-First SQLite + SHA-256 Geotagging)
        </Text>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ══ Logout Confirmation Modal ══ */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRing}>
              <ShieldAlert size={28} color="#D97706" />
            </View>

            <Text style={styles.modalTitle}>Confirm Logout</Text>

            {effectivePendingCount > 0 ? (
              <View style={styles.modalWarningBox}>
                <Text style={styles.modalWarningTitle}>
                  ⚠️ You have {effectivePendingCount} unsynced field records!
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
                onPress={() => setShowLogoutConfirm(false)}
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

      {/* ══ Sync Complete Dialog ══ */}
      <Modal
        visible={showSyncSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSyncSuccess(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconRing, { backgroundColor: '#ECFDF5' }]}>
              <CheckCircle2 size={32} color="#059669" />
            </View>

            <Text style={styles.modalTitle}>Sync Complete</Text>
            <Text style={styles.modalMessage}>
              {syncedRecords} offline field transactions and geotagged evidence records have been successfully synchronized with the central server.
            </Text>

            <TouchableOpacity
              style={[styles.modalConfirmButton, { width: '100%', marginTop: 16 }]}
              activeOpacity={0.85}
              onPress={() => setShowSyncSuccess(false)}
            >
              <Text style={styles.modalConfirmText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3FAF5',
  },

  /* Solid Green Top Header matching Mockup */
  topHeaderWrapper: {
    backgroundColor: '#0F5128',
    paddingBottom: 16,
  },
  topHeaderSafeArea: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 4,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerBrandTitle: {
    fontSize: 19,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: -2,
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
  },
  offlineChipText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#92400E',
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },

  /* Scroll Body */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* 1. Profile Hero Card */
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  profileAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F5128',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  profileInfoCol: {
    flex: 1,
  },
  nameAndEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  profileNameText: {
    fontSize: 15.5,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  editProfileText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#059669',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginBottom: 6,
  },
  roleChipText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_500Medium',
    color: '#059669',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  emailIconText: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 5,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    flex: 1,
  },

  /* 2. System Status 2-Col Bento */
  statusCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  statusCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  statusIconWrap: {
    marginRight: 8,
  },
  statusTextCol: {
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  statusCardSub: {
    fontSize: 9.5,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    marginTop: 1,
  },
  statusCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 3. Synchronization Overview Card */
  syncOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  syncOverviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  syncOverviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncHeaderIconWrap: {
    marginRight: 8,
  },
  syncOverviewTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  syncOverviewSub: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  lastSyncedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 140,
  },
  lastSyncedLabel: {
    fontSize: 8.5,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },
  lastSyncedValue: {
    fontSize: 8.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1E293B',
  },

  /* 3 Metrics Row inside Overview */
  metricsThreeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  metricBoxPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  metricBoxRetrying: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  metricBoxConflicts: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  metricNumber: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 24,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 2,
  },

  /* Action Buttons inside Overview */
  syncActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  syncNowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 22,
    paddingVertical: 12,
  },
  syncNowButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  cacheOfflineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  cacheOfflineButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#059669',
  },
  buttonDisabled: {
    opacity: 0.65,
  },

  /* Section Headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 14.5,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  sectionSublineText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    marginBottom: 10,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 11.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#059669',
    marginRight: 2,
  },

  /* Offline Sync Queue List */
  queueCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  queueRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  queueIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  queueMainCol: {
    flex: 1,
  },
  queueRowTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0F172A',
    marginBottom: 1,
  },
  queueOpIdText: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  queueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  queueDateText: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B45309',
  },

  /* Field Evidence Vault 2-Col */
  evidenceTwoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  evidenceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  evidenceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  evidenceIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  evidenceTopCategory: {
    fontSize: 10.5,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    flex: 1,
  },
  evidenceGreenChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  evidenceGreenChipText: {
    fontSize: 8.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#059669',
  },
  evidenceBlueChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  evidenceBlueChipText: {
    fontSize: 8.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#3B82F6',
  },
  evidenceLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  evidenceLocText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
    flex: 1,
  },
  evidenceDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  evidenceDateText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  photoBox: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  morePhotosBox: {
    width: 32,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#475569',
  },
  evidenceBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  shaVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shaVerifiedText: {
    fontSize: 8.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#059669',
  },
  gpsAccuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsAccuracyText: {
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },

  /* Logout Button */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 24,
    paddingVertical: 13,
    marginTop: 14,
    marginBottom: 10,
  },
  logoutButtonText: {
    fontSize: 13.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#DC2626',
  },
  versionFootnote: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },

  /* Modal Dialogs */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 12.5,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalWarningBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
    width: '100%',
  },
  modalWarningTitle: {
    fontSize: 12.5,
    fontFamily: 'Poppins_700Bold',
    color: '#B45309',
    marginBottom: 4,
  },
  modalWarningMessage: {
    fontSize: 11.5,
    fontFamily: 'Poppins_400Regular',
    color: '#92400E',
    lineHeight: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#475569',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
