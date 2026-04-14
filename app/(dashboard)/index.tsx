import { useSidebar } from '@/lib/SidebarContext';
import { useAuth } from '@/lib/auth/useAuth';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  MapPin,
  Menu,
  Package,
  QrCode,
  Search,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import * as React from 'react';
import {
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
import { useColorScheme } from 'nativewind';

export default function HomeDashboard() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = React.useState('');
  const isOnline = true;
  const lastSynced = '10 mins ago';

  const bg = isDark ? '#071A0E' : '#F0FDF4';
  const card = isDark ? '#0F2418' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#E7F5ED';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#0F2418' : '#FFFFFF';
  const searchBorder = isDark ? '#1F3A28' : '#BBF7D0';

  const metrics = [
    { icon: <Users size={20} color="#FFFFFF" />, label: 'Total Farmers', value: '156', bg: '#16A34A', light: '#DCFCE7' },
    { icon: <MapPin size={20} color="#FFFFFF" />, label: 'Visited Today', value: '8', bg: '#0891B2', light: '#CFFAFE' },
    { icon: <AlertTriangle size={20} color="#FFFFFF" />, label: 'Crop Damage', value: '12', bg: '#F59E0B', light: '#FFFBEB' },
    { icon: <Package size={20} color="#FFFFFF" />, label: 'Pending Releases', value: '23', bg: '#8B5CF6', light: '#F5F3FF' },
  ];

  const quickActions = [
    { label: 'Register\nFarmer', icon: <Users size={26} color="#16A34A" />, bg: '#DCFCE7', border: '#BBF7D0', route: '/(dashboard)/register-farmer' },
    { label: 'Crop\nDamage', icon: <AlertTriangle size={26} color="#F59E0B" />, bg: '#FFFBEB', border: '#FDE68A', route: '/(dashboard)/record-damage' },
    { label: 'Distribute\nAllocation', icon: <Package size={26} color="#8B5CF6" />, bg: '#F5F3FF', border: '#DDD6FE', route: '/(dashboard)/distribute' },
    { label: 'Scan\nQR Code', icon: <QrCode size={26} color="#0891B2" />, bg: '#CFFAFE', border: '#A5F3FC', route: '/(dashboard)/scan' },
  ];

  const alerts = [
    { id: 1, type: 'warning', message: 'High crop damage in Barangay San Isidro' },
    { id: 2, type: 'info', message: 'Low stock: Fertilizer Program – Batch 3' },
  ];

  const todayTasks = [
    { id: 1, title: 'Visit Juan Dela Cruz Farm', status: 'pending', time: '9:00 AM' },
    { id: 2, title: '3 farmers pending verification', status: 'warning', time: 'Overdue' },
    { id: 3, title: '2 releases awaiting acknowledgement', status: 'warning', time: 'Overdue' },
    { id: 4, title: 'Check Maria Santos rice field', status: 'pending', time: '2:00 PM' },
  ];

  const AVATAR_PALETTE = [
  '#16A34A', '#2563EB', '#9333EA', '#F59E0B',
  '#EF4444', '#0891B2', '#DB2777', '#EA580C',
];
const avatarColor = (id: number) => AVATAR_PALETTE[(id - 1) % AVATAR_PALETTE.length];

const recentFarmers = [
    { id: 1, name: 'Juan Dela Cruz', location: 'Brgy. San Isidro', initial: 'JD' },
    { id: 2, name: 'Maria Santos', location: 'Brgy. Maligaya', initial: 'MS' },
    { id: 3, name: 'Pedro Reyes', location: 'Brgy. Bagong Silang', initial: 'PR' },
  ];

  const getFirstName = (n?: string | null) => (n ? n.split(' ')[0] : 'Technician');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* ── Custom Header ── */}
      <View style={[styles.header, { backgroundColor: '#16A34A' }]}>
        <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Menu size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerGreeting}>Good morning,</Text>
          <Text style={styles.headerName} numberOfLines={1}>{getFirstName(user?.name)}</Text>
        </View>
        <View style={styles.headerRight}>
          {isOnline ? (
            <View style={styles.onlinePill}>
              <Wifi size={12} color="#10B981" />
              <Text style={styles.onlinePillText}>Online</Text>
            </View>
          ) : (
            <View style={[styles.onlinePill, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <WifiOff size={12} color="#EF4444" />
              <Text style={[styles.onlinePillText, { color: '#EF4444' }]}>Offline</Text>
            </View>
          )}
          <TouchableOpacity style={styles.bellBtn}>
            <Bell size={20} color="#FFFFFF" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* ── Search bar ── */}
        <View style={[styles.searchWrapper, { backgroundColor: '#16A34A' }]}>
          <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor: searchBorder }]}>
            <Search size={18} color={textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search farmer by LFID / QR code..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => router.push('/(dashboard)/scan' as any)}>
              <QrCode size={22} color="#16A34A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sync badge ── */}
        <View style={[styles.syncBadge, { backgroundColor: isDark ? '#0F2418' : '#DCFCE7', borderColor: isDark ? '#1F3A28' : '#BBF7D0' }]}>
          <Clock size={13} color="#16A34A" />
          <Text style={styles.syncText}>Last synced: {lastSynced}</Text>
        </View>

        {/* ── Metrics ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Overview</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((m) => (
              <View key={m.label} style={[styles.metricCard, { backgroundColor: card, borderColor: border, shadowColor: '#000' }]}>
                <View style={[styles.metricIconBg, { backgroundColor: m.bg }]}>
                  {m.icon}
                </View>
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
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Alerts</Text>
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
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/(dashboard)/activities' as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 8 }}>
            {todayTasks.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.taskCard, { backgroundColor: card, borderColor: border, shadowColor: '#000' }]}
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
                  <Text style={[styles.taskTime, { color: t.time === 'Overdue' ? '#EF4444' : textMuted }]}>
                    {t.time}
                  </Text>
                </View>
                <View style={styles.taskChevron}>
                  <Text style={{ color: textMuted, fontSize: 18 }}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Recent Farmers ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Recent Farmers</Text>
            <TouchableOpacity onPress={() => router.push('/(dashboard)/farmers' as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 8 }}>
            {recentFarmers.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.farmerCard, { backgroundColor: card, borderColor: border, shadowColor: '#000' }]}
                activeOpacity={0.8}
              >
                <View style={[styles.farmerAvatar, { backgroundColor: avatarColor(f.id) }]}>
                  <Text style={styles.farmerAvatarText}>{f.initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.farmerName, { color: textPrimary }]}>{f.name}</Text>
                  <Text style={[styles.farmerLocation, { color: textMuted }]}>{f.location}</Text>
                </View>
                <View style={styles.taskChevron}>
                  <Text style={{ color: textMuted, fontSize: 18 }}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
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
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onlinePillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
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
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: -10,
    marginBottom: 4,
  },
  syncText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
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
