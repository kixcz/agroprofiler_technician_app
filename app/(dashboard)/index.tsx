import { useSidebar } from '@/lib/SidebarContext';
import { useAuth } from '@/lib/auth/useAuth';
import {
  getAllFarmers,
  getDashboardSummaryMetrics,
  LocalFarmer,
  subscribeDatabaseChanges,
} from '@/lib/db/database';
import { useSyncEngine } from '@/lib/services/syncEngine';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Layers,
  Leaf,
  MapPin,
  Menu,
  Package,
  QrCode,
  RefreshCw,
  Scan,
  Search,
  Sprout,
  UserPlus,
  Users,
  WifiOff,
} from 'lucide-react-native';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
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

export default function HomeDashboard() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const { user } = useAuth();

  const {
    isConnected,
    isSyncing,
    pendingCount,
    syncNow,
  } = useSyncEngine();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [summary, setSummary] = React.useState({
    totalFarmers: 7,
    totalFarms: 3,
    monitoringCount: 1,
    damageEntriesCount: 1,
    pendingDistributionsCount: 3,
    completedDistributionsCount: 1,
    pendingSyncCount: 3,
    failedSyncCount: 0,
    conflictSyncCount: 0,
    evidenceCapturedCount: 0,
  });
  const [recentFarmers, setRecentFarmers] = React.useState<LocalFarmer[]>([]);

  const loadDashboardData = React.useCallback(async () => {
    try {
      const [m, farmers] = await Promise.all([
        getDashboardSummaryMetrics(),
        getAllFarmers(),
      ]);
      setSummary(m);
      setRecentFarmers(farmers.slice(0, 5));
    } catch (err) {
      console.warn('Error loading dashboard data:', err);
    }
  }, []);

  React.useEffect(() => {
    loadDashboardData();
    return subscribeDatabaseChanges(loadDashboardData);
  }, [loadDashboardData]);

  // Format dynamic dates
  const todayDateFormatted = React.useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const technicianName = user?.name || 'Engr. Marco Reyes';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── TOP GREEN HEADER WITH BRAND & OFFLINE PILL ── */}
      <View style={styles.headerContainer}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerTopBar}>
            {/* Left: Hamburger Menu + Brand Icon + Title + Role */}
            <View style={styles.headerBrandCol}>
              <TouchableOpacity
                style={styles.menuIconButton}
                activeOpacity={0.75}
                onPress={openSidebar}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Menu size={22} color="#FFFFFF" strokeWidth={2.4} />
              </TouchableOpacity>

              <View style={styles.leafIconCircle}>
                <Leaf size={18} color="#FFFFFF" strokeWidth={2.4} />
              </View>

              <View>
                <Text style={styles.headerBrandTitle}>AgroProfiler</Text>
                <Text style={styles.headerRoleTitle}>Field Technician</Text>
              </View>
            </View>

            {/* Right: Offline Mode Pill + Notification Bell */}
            <View style={styles.headerRightGroup}>
              <View style={styles.offlineModePill}>
                <WifiOff size={13} color="#92400E" style={{ marginRight: 5 }} />
                <Text style={styles.offlineModePillText}>Offline Mode</Text>
              </View>

              <TouchableOpacity
                style={styles.bellButton}
                activeOpacity={0.75}
                onPress={() => router.push('/activities' as any)}
              >
                <Bell size={20} color="#FFFFFF" strokeWidth={2.2} />
                <View style={styles.bellBadge} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── MAIN SCROLLABLE BENTO BODY ── */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting + Today Date Row */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextCol}>
            <Text style={styles.greetingSubline}>Good morning,</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {technicianName}!
            </Text>
          </View>

          {/* Today Date Bento Pill Card */}
          <View style={styles.todayDateCard}>
            <Calendar size={18} color="#059669" strokeWidth={2.2} style={{ marginRight: 6 }} />
            <View>
              <Text style={styles.todayLabel}>Today</Text>
              <Text style={styles.todayValue}>{todayDateFormatted}</Text>
            </View>
          </View>
        </View>

        {/* Global Search Bar with QR Scanner Shortcut */}
        <View style={styles.searchBarContainer}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmer by LFID, RSBSA, or QR code..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                router.push({
                  pathname: '/farmers' as any,
                  params: { q: searchQuery.trim() },
                });
              }
            }}
          />
          <TouchableOpacity
            style={styles.searchQrButton}
            onPress={() => router.push('/scan' as any)}
            activeOpacity={0.7}
          >
            <Scan size={20} color="#059669" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Offline Notice Banner Card with Sync Now */}
        <View style={styles.offlineCard}>
          <View style={styles.offlineCardLeft}>
            <View style={styles.offlineIconWrapper}>
              <WifiOff size={20} color="#D97706" strokeWidth={2.3} />
            </View>
            <View style={styles.offlineTextWrapper}>
              <Text style={styles.offlineTitle}>You're working offline</Text>
              <Text style={styles.offlineSubtitle}>
                Using local data (SQLite). Changes will sync when internet is available.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            activeOpacity={0.8}
            onPress={syncNow}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#059669" style={{ marginRight: 4 }} />
            ) : (
              <RefreshCw size={15} color="#059669" strokeWidth={2.4} style={{ marginRight: 5 }} />
            )}
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 1: FIELD OVERVIEW (4 Bento Metric Cards) ── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Layers size={19} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Field Overview</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>This Field Cycle</Text>
            <ChevronDown size={14} color="#059669" style={{ marginLeft: 3 }} />
          </View>
        </View>

        <View style={styles.overviewGrid}>
          {/* Card 1: Assigned Farmers */}
          <TouchableOpacity
            style={[styles.overviewCard, { backgroundColor: '#F0FDF4' }]}
            activeOpacity={0.75}
            onPress={() => router.push('/farmers' as any)}
          >
            <View style={[styles.overviewIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Users size={18} color="#16A34A" strokeWidth={2.2} />
            </View>
            <View style={styles.overviewTextCol}>
              <Text style={styles.overviewNumber}>{summary.totalFarmers || 7}</Text>
              <Text style={styles.overviewLabel} numberOfLines={1}>Assigned Farmers</Text>
            </View>
            <ChevronRight size={15} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 2: Inspections & Farms */}
          <TouchableOpacity
            style={[styles.overviewCard, { backgroundColor: '#F0F9FF' }]}
            activeOpacity={0.75}
            onPress={() => router.push('/crop-monitoring' as any)}
          >
            <View style={[styles.overviewIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <MapPin size={18} color="#0284C7" strokeWidth={2.2} />
            </View>
            <View style={styles.overviewTextCol}>
              <Text style={styles.overviewNumber}>{summary.totalFarms || 3}</Text>
              <Text style={styles.overviewLabel} numberOfLines={1}>Inspections & Farms</Text>
            </View>
            <ChevronRight size={15} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 3: Damage Assessments */}
          <TouchableOpacity
            style={[styles.overviewCard, { backgroundColor: '#FFFBEB' }]}
            activeOpacity={0.75}
            onPress={() => router.push('/record-damage' as any)}
          >
            <View style={[styles.overviewIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <AlertTriangle size={18} color="#D97706" strokeWidth={2.2} />
            </View>
            <View style={styles.overviewTextCol}>
              <Text style={styles.overviewNumber}>{summary.damageEntriesCount || 1}</Text>
              <Text style={styles.overviewLabel} numberOfLines={1}>Damage Assessments</Text>
            </View>
            <ChevronRight size={15} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 4: Pending Releases */}
          <TouchableOpacity
            style={[styles.overviewCard, { backgroundColor: '#FAF5FF' }]}
            activeOpacity={0.75}
            onPress={() => router.push('/distribute' as any)}
          >
            <View style={[styles.overviewIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Package size={18} color="#7E22CE" strokeWidth={2.2} />
            </View>
            <View style={styles.overviewTextCol}>
              <Text style={styles.overviewNumber}>{summary.pendingDistributionsCount || 3}</Text>
              <Text style={styles.overviewLabel} numberOfLines={1}>Pending Releases</Text>
            </View>
            <ChevronRight size={15} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: QUICK ACTIONS (6 Bento Tiles) ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
          <View style={styles.sectionTitleWithIcon}>
            <Leaf size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          {/* Action 1: Register Farmer */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push('/register-farmer' as any)}
          >
            <UserPlus size={22} color="#059669" strokeWidth={2.2} />
            <Text style={styles.actionCardText}>Register{'\n'}Farmer</Text>
          </TouchableOpacity>

          {/* Action 2: Record Crop Monitoring */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push('/crop-monitoring' as any)}
          >
            <Sprout size={22} color="#059669" strokeWidth={2.2} />
            <Text style={styles.actionCardText}>Record{'\n'}Crop Monitoring</Text>
          </TouchableOpacity>

          {/* Action 3: Report Crop Damage */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push('/(dashboard)/record-damage' as any)}
          >
            <AlertTriangle size={22} color="#059669" strokeWidth={2.2} />
            <Text style={styles.actionCardText}>Report{'\n'}Crop Damage</Text>
          </TouchableOpacity>

          {/* Action 4: Distribute Inputs */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push('/distribute' as any)}
          >
            <Package size={22} color="#059669" strokeWidth={2.2} />
            <Text style={styles.actionCardText}>Distribute{'\n'}Inputs</Text>
          </TouchableOpacity>

          {/* Action 5: Scan QR Code */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push('/scan' as any)}
          >
            <Scan size={22} color="#059669" strokeWidth={2.2} />
            <Text style={styles.actionCardText}>Scan{'\n'}QR Code</Text>
          </TouchableOpacity>

          {/* Action 6: Sync Data */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={syncNow}
          >
            <RefreshCw size={22} color="#059669" strokeWidth={2.2} />
            <Text style={styles.actionCardText}>Sync Data{'\n'}(Online)</Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 3: BOTTOM BENTO CARDS (Today's Tasks & Assigned Farmers) ── */}
        <View style={styles.bottomBentoRow}>
          {/* Card Left: Today's Field Tasks */}
          <TouchableOpacity
            style={styles.bottomBentoCard}
            activeOpacity={0.78}
            onPress={() => router.push('/activities' as any)}
          >
            <View style={styles.bottomBentoHeader}>
              <View style={styles.bottomBentoIconRing}>
                <Calendar size={18} color="#059669" strokeWidth={2.2} />
              </View>
              <ChevronRight size={15} color="#94A3B8" />
            </View>

            <Text style={styles.bottomBentoTitle}>Today's Field Tasks</Text>
            <Text style={styles.bottomBentoSubtitle}>3 tasks scheduled</Text>

            {/* Subtle decorative graphic placeholder */}
            <View style={styles.bentoIllustrationWrap}>
              <ClipboardList size={38} color="#A7F3D0" strokeWidth={1.5} />
            </View>
          </TouchableOpacity>

          {/* Card Right: Assigned Farmers */}
          <TouchableOpacity
            style={styles.bottomBentoCard}
            activeOpacity={0.78}
            onPress={() => router.push('/farmers' as any)}
          >
            <View style={styles.bottomBentoHeader}>
              <View style={styles.bottomBentoIconRing}>
                <Users size={18} color="#059669" strokeWidth={2.2} />
              </View>
              <ChevronRight size={15} color="#94A3B8" />
            </View>

            <Text style={styles.bottomBentoTitle}>Assigned Farmers</Text>
            <Text style={styles.bottomBentoSubtitle}>
              {summary.totalFarmers || 7} farmers (offline ready)
            </Text>

            {/* Subtle decorative graphic placeholder */}
            <View style={styles.bentoIllustrationWrap}>
              <Users size={40} color="#A7F3D0" strokeWidth={1.5} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3FAF5',
  },
  headerContainer: {
    backgroundColor: '#0F5128',
    paddingBottom: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerSafeArea: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 4,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBrandCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  leafIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerBrandTitle: {
    fontSize: 19,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerRoleTitle: {
    fontSize: 11.5,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.82)',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineModePillText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#92400E',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* Scrollable Body */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Greeting + Today Date Row */
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingTextCol: {
    flex: 1,
    marginRight: 12,
  },
  greetingSubline: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
  },
  greetingName: {
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  todayDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  todayLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#059669',
  },
  todayValue: {
    fontSize: 11.5,
    fontFamily: 'Poppins_700Bold',
    color: '#047857',
  },

  /* Search Bar */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Poppins_400Regular',
    color: '#0F172A',
  },
  searchQrButton: {
    padding: 6,
  },

  /* Offline Banner Card */
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 18,
  },
  offlineCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  offlineIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  offlineTextWrapper: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#92400E',
  },
  offlineSubtitle: {
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
    color: '#B45309',
    marginTop: 2,
    lineHeight: 14,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#059669',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#059669',
  },

  /* Section Headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  filterPillText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#059669',
  },

  /* 4-Box Field Overview Grid */
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  overviewCard: {
    width: (Dimensions.get('window').width - 42) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  overviewIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  overviewTextCol: {
    flex: 1,
  },
  overviewNumber: {
    fontSize: 17,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },
  overviewLabel: {
    fontSize: 10.5,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
    marginTop: 1,
  },

  /* 6 Quick Action Grid */
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  actionCard: {
    width: (Dimensions.get('window').width - 52) / 3,
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionCardText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#065F46',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },

  /* Bottom Bento Cards */
  bottomBentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomBentoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 130,
  },
  bottomBentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bottomBentoIconRing: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBentoTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  bottomBentoSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  bentoIllustrationWrap: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    opacity: 0.5,
  },
});
