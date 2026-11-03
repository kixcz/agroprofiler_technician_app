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
  CheckCircle,
  Clock,
  CloudDownload,
  MapPin,
  Menu,
  Package,
  QrCode,
  RefreshCw,
  Search,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import * as React from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function HomeDashboard() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    indicator,
    isConnected,
    isSyncing,
    pendingCount,
    conflictCount,
    lastSyncedAt,
    syncNow,
    downloadOfflinePackage,
  } = useSyncEngine();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [summary, setSummary] = React.useState({
    totalFarmers: 6,
    totalFarms: 3,
    monitoringCount: 1,
    damageEntriesCount: 1,
    pendingDistributionsCount: 5,
    completedDistributionsCount: 1,
    pendingSyncCount: 0,
    failedSyncCount: 0,
    conflictSyncCount: 0,
    evidenceCapturedCount: 0,
  });
  const [recentFarmers, setRecentFarmers] = React.useState<LocalFarmer[]>([]);
  const [isDownloadingPkg, setIsDownloadingPkg] = React.useState(false);

  const loadDashboardData = React.useCallback(async () => {
    const [m, farmers] = await Promise.all([
      getDashboardSummaryMetrics(),
      getAllFarmers(),
    ]);
    setSummary(m);
    setRecentFarmers(farmers.slice(0, 4));
  }, []);

  React.useEffect(() => {
    loadDashboardData();
    return subscribeDatabaseChanges(loadDashboardData);
  }, [loadDashboardData]);

  const bg = isDark ? '#071A0E' : '#F0FDF4';
  const card = isDark ? '#0F2418' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#E7F5ED';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#0F2418' : '#FFFFFF';
  const searchBorder = isDark ? '#1F3A28' : '#BBF7D0';

  const metrics = [
    {
      icon: <Users size={20} color="#FFFFFF" />,
      label: 'Assigned Farmers',
      value: String(summary.totalFarmers),
      bg: '#16A34A',
      light: '#DCFCE7',
    },
    {
      icon: <MapPin size={20} color="#FFFFFF" />,
      label: 'Inspections & Farms',
      value: String(summary.totalFarms + summary.monitoringCount),
      bg: '#0891B2',
      light: '#CFFAFE',
    },
    {
      icon: <AlertTriangle size={20} color="#FFFFFF" />,
      label: 'Damage Assessments',
      value: String(summary.damageEntriesCount),
      bg: '#F59E0B',
      light: '#FFFBEB',
    },
    {
      icon: <Package size={20} color="#FFFFFF" />,
      label: 'Pending Releases',
      value: String(summary.pendingDistributionsCount),
      bg: '#8B5CF6',
      light: '#F5F3FF',
    },
  ];

  const quickActions = [
    {
      label: 'Register\nFarmer',
      icon: <Users size={26} color="#16A34A" />,
      bg: '#DCFCE7',
      border: '#BBF7D0',
      route: '/(dashboard)/register-farmer',
    },
    {
      label: 'Crop\nDamage',
      icon: <AlertTriangle size={26} color="#F59E0B" />,
      bg: '#FFFBEB',
      border: '#FDE68A',
      route: '/(dashboard)/record-damage',
    },
    {
      label: 'Distribute\nAllocation',
      icon: <Package size={26} color="#8B5CF6" />,
      bg: '#F5F3FF',
      border: '#DDD6FE',
      route: '/(dashboard)/distribute',
    },
    {
      label: 'Scan\nQR Code',
      icon: <QrCode size={26} color="#0891B2" />,
      bg: '#CFFAFE',
      border: '#A5F3FC',
      route: '/(dashboard)/scan',
    },
  ];

  const alerts = [
    ...(pendingCount > 0
      ? [
          {
            id: 'sync-pending',
            type: 'warning',
            message: `${pendingCount} offline field transaction(s) queued in SQLite (${summary.evidenceCapturedCount} geotagged photo evidence).`,
          },
        ]
      : []),
    ...(conflictCount > 0
      ? [
          {
            id: 'sync-conflict',
            type: 'warning',
            message: `${conflictCount} synchronization conflict(s) require technician review in Profile & Sync.`,
          },
        ]
      : []),
    {
      id: 'dmg-alert',
      type: 'warning',
      message: 'Active Flood Assessment in Barangay San Isidro',
    },
    {
      id: 'dist-info',
      type: 'info',
      message: 'RCEF Certified Rice Seeds & Urea Fertilizer batches open for QR distribution',
    },
  ];

  const todayTasks = [
    {
      id: 1,
      title: 'Inspect Juan Dela Cruz Riceland (Brgy. Poblacion)',
      status: 'pending',
      time: '9:00 AM',
      route: '/(dashboard)/crop-monitoring',
    },
    {
      id: 2,
      title: `${summary.pendingDistributionsCount} beneficiaries awaiting QR seed/fertilizer release`,
      status: 'warning',
      time: 'Scheduled Today',
      route: '/(dashboard)/distribute',
    },
    {
      id: 3,
      title: 'Verify Typhoon Aghon crop damage entries (Brgy. San Isidro)',
      status: 'warning',
      time: 'Field Audit',
      route: '/(dashboard)/record-damage',
    },
  ];

  const AVATAR_PALETTE = [
    '#16A34A',
    '#2563EB',
    '#9333EA',
    '#F59E0B',
    '#EF4444',
    '#0891B2',
    '#DB2777',
    '#EA580C',
  ];
  const avatarColor = (idx: number) => AVATAR_PALETTE[idx % AVATAR_PALETTE.length];

  const getFirstName = (n?: string | null) => (n ? n.split(' ')[0] : 'Technician');

  const handleDownloadOfflineData = async () => {
    setIsDownloadingPkg(true);
    try {
      const res = await downloadOfflinePackage();
      Alert.alert('Offline Field Package Cached', res.message);
    } finally {
      setIsDownloadingPkg(false);
    }
  };

  const handleManualSync = async () => {
    const res = await syncNow();
    Alert.alert('Synchronization Status', res.message);
  };

  const getIndicatorPill = () => {
    if (!isConnected) {
      return {
        label: 'Offline',
        color: '#EF4444',
        bg: 'rgba(239,68,68,0.2)',
        icon: <WifiOff size={12} color="#EF4444" />,
      };
    }
    if (indicator === 'syncing') {
      return {
        label: 'Syncing...',
        color: '#93C5FD',
        bg: 'rgba(59,130,246,0.25)',
        icon: <RefreshCw size={12} color="#93C5FD" />,
      };
    }
    if (indicator === 'sync_failed') {
      return {
        label: 'Sync Failed',
        color: '#FDE047',
        bg: 'rgba(234,179,8,0.25)',
        icon: <AlertTriangle size={12} color="#FDE047" />,
      };
    }
    if (pendingCount > 0) {
      return {
        label: `Pending Sync (${pendingCount})`,
        color: '#FDE047',
        bg: 'rgba(234,179,8,0.25)',
        icon: <Clock size={12} color="#FDE047" />,
      };
    }
    if (indicator === 'synced') {
      return {
        label: 'Synced',
        color: '#A7F3D0',
        bg: 'rgba(16,185,129,0.22)',
        icon: <CheckCircle size={12} color="#A7F3D0" />,
      };
    }
    return {
      label: 'Online',
      color: '#A7F3D0',
      bg: 'rgba(16,185,129,0.22)',
      icon: <Wifi size={12} color="#A7F3D0" />,
    };
  };

  const pill = getIndicatorPill();

  const filteredFarmers = searchQuery.trim()
    ? recentFarmers.filter((f) => {
        const q = searchQuery.toLowerCase();
        return (
          f.first_name.toLowerCase().includes(q) ||
          f.last_name.toLowerCase().includes(q) ||
          f.lfid.toLowerCase().includes(q) ||
          f.rsbsa_number.toLowerCase().includes(q) ||
          f.barangay.toLowerCase().includes(q)
        );
      })
    : recentFarmers;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* ── Custom Header ── */}
      <View style={[styles.header, { backgroundColor: '#16A34A' }]}>
        <TouchableOpacity
          onPress={openSidebar}
          style={styles.menuBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Menu size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerGreeting}>Field Operations Ready,</Text>
          <Text style={styles.headerName} numberOfLines={1}>
            {getFirstName(user?.name)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleManualSync}
            style={[styles.onlinePill, { backgroundColor: pill.bg }]}
          >
            {pill.icon}
            <Text style={[styles.onlinePillText, { color: pill.color }]}>{pill.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(dashboard)/profile' as any)}
            style={styles.bellBtn}
          >
            <Bell size={20} color="#FFFFFF" />
            {pendingCount > 0 && <View style={styles.bellDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ── Search bar ── */}
        <View style={[styles.searchWrapper, { backgroundColor: '#16A34A' }]}>
          <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor: searchBorder }]}>
            <Search size={18} color={textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search farmer by LFID, RSBSA, or QR code..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => router.push('/(dashboard)/scan' as any)}>
              <QrCode size={22} color="#16A34A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sync & Pre-Visit Offline Package Bar ── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: -10,
            marginBottom: 4,
            paddingHorizontal: 16,
          }}
        >
          <TouchableOpacity
            onPress={handleManualSync}
            disabled={isSyncing}
            style={[
              styles.syncBadge,
              {
                backgroundColor: isDark ? '#0F2418' : '#DCFCE7',
                borderColor: isDark ? '#1F3A28' : '#BBF7D0',
                marginTop: 0,
                marginBottom: 0,
              },
            ]}
          >
            <Clock size={13} color="#16A34A" />
            <Text style={styles.syncText}>
              {lastSyncedAt
                ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'SQLite Offline DB Active'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownloadOfflineData}
            disabled={isDownloadingPkg}
            style={[
              styles.syncBadge,
              {
                backgroundColor: isDark ? '#0F2418' : '#EFF6FF',
                borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                marginTop: 0,
                marginBottom: 0,
              },
            ]}
          >
            <CloudDownload size={13} color="#2563EB" />
            <Text style={[styles.syncText, { color: '#2563EB' }]}>
              {isDownloadingPkg ? 'Caching...' : 'Cache Barangay Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Metrics ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Overview</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((m) => (
              <View
                key={m.label}
                style={[
                  styles.metricCard,
                  { backgroundColor: card, borderColor: border, shadowColor: '#000' },
                ]}
              >
                <View style={[styles.metricIconBg, { backgroundColor: m.bg }]}>{m.icon}</View>
                <Text style={[styles.metricValue, { color: textPrimary }]}>{m.value}</Text>
                <Text style={[styles.metricLabel, { color: textMuted }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[styles.actionCard, { backgroundColor: a.bg, borderColor: a.border }]}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.75}
              >
                <View style={styles.actionIcon}>{a.icon}</View>
                <Text style={[styles.actionLabel, { color: textPrimary }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Field Status & Alerts</Text>
            <View style={{ gap: 8 }}>
              {alerts.map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.alertCard,
                    a.type === 'warning'
                      ? { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
                      : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
                  ]}
                >
                  {a.type === 'warning' ? (
                    <AlertTriangle size={16} color="#F59E0B" />
                  ) : (
                    <CheckCircle size={16} color="#2563EB" />
                  )}
                  <Text
                    style={[
                      styles.alertText,
                      { color: a.type === 'warning' ? '#92400E' : '#1E40AF' },
                    ]}
                  >
                    {a.message}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Today's Tasks ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Today's Field Assignments</Text>
            <TouchableOpacity onPress={() => router.push('/(dashboard)/activities' as any)}>
              <Text style={styles.viewAll}>View Log</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 8 }}>
            {todayTasks.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => router.push(t.route as any)}
                style={[
                  styles.taskCard,
                  { backgroundColor: card, borderColor: border, shadowColor: '#000' },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.taskDot,
                    { backgroundColor: t.status === 'warning' ? '#F59E0B' : '#2563EB' },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, { color: textPrimary }]}>{t.title}</Text>
                  <Text style={[styles.taskTime, { color: textMuted }]}>{t.time}</Text>
                </View>
                <View style={styles.taskChevron}>
                  <Text style={{ color: textMuted, fontSize: 18 }}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Assigned Offline Farmers ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Assigned Farmers (Offline Ready)
            </Text>
            <TouchableOpacity onPress={() => router.push('/(dashboard)/farmers' as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 8 }}>
            {filteredFarmers.map((f, idx) => {
              const initials = `${f.first_name[0] || ''}${f.last_name[0] || ''}`.toUpperCase();
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(dashboard)/farmer-profile' as any,
                      params: { id: f.id, lfid: f.lfid },
                    })
                  }
                  style={[
                    styles.farmerCard,
                    { backgroundColor: card, borderColor: border, shadowColor: '#000' },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.farmerAvatar, { backgroundColor: avatarColor(idx) }]}>
                    <Text style={styles.farmerAvatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.farmerName, { color: textPrimary }]}>
                      {f.first_name} {f.last_name}
                    </Text>
                    <Text style={[styles.farmerLocation, { color: textMuted }]}>
                      {f.lfid} • Brgy. {f.barangay} ({f.primary_commodity})
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 99,
                      backgroundColor:
                        f.sync_status === 'synced' ? '#DCFCE7' : '#FEF3C7',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: f.sync_status === 'synced' ? '#15803D' : '#D97706',
                      }}
                    >
                      {f.sync_status === 'synced' ? 'Synced' : 'Pending Sync'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGreeting: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  onlinePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  syncText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '47.5%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '47.5%',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  taskTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskChevron: {
    paddingLeft: 4,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  farmerName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  farmerLocation: {
    fontSize: 12,
    fontWeight: '400',
  },
});
