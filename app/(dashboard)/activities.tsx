import { useSidebar } from '@/lib/SidebarContext';
import { Stack } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Menu,
  Plus,
  RefreshCw,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAllActivityLogs,
  subscribeDatabaseChanges,
  LocalActivityLog,
  SyncRecordStatus,
} from '@/lib/db/database';

const TYPE_CONFIG: Record<
  LocalActivityLog['activity_type'],
  { bg: string; icon: React.ReactNode; label: string }
> = {
  crop_damage: {
    bg: '#FFF7ED',
    icon: <AlertTriangle size={20} color="#F59E0B" strokeWidth={2.2} />,
    label: 'Damage Report',
  },
  distribution: {
    bg: '#F0FDF4',
    icon: <CheckCircle2 size={20} color="#16A34A" strokeWidth={2.2} />,
    label: 'Distribution',
  },
  crop_monitoring: {
    bg: '#F8FAFC',
    icon: <Clock size={20} color="#6B7280" strokeWidth={2.2} />,
    label: 'Crop Monitoring',
  },
  farmer_registration: {
    bg: '#EFF6FF',
    icon: <Plus size={20} color="#2563EB" strokeWidth={2.2} />,
    label: 'Farmer Registration',
  },
  farm_registration: {
    bg: '#ECFEFF',
    icon: <MapPin size={20} color="#0891B2" strokeWidth={2.2} />,
    label: 'Farm Registration',
  },
  sync: {
    bg: '#F3E8FF',
    icon: <RefreshCw size={20} color="#9333EA" strokeWidth={2.2} />,
    label: 'System Sync',
  },
};

const SYNC_STATUS_CONFIG: Record<
  SyncRecordStatus,
  { label: string; bg: string; text: string }
> = {
  synced: { label: 'Synced', bg: '#DCFCE7', text: '#15803D' },
  pending_sync: { label: 'Pending Sync', bg: '#FEF3C7', text: '#B45309' },
  syncing: { label: 'Syncing', bg: '#DBEAFE', text: '#1D4ED8' },
  sync_failed: { label: 'Sync Failed', bg: '#FEE2E2', text: '#DC2626' },
  conflict: { label: 'Conflict Flagged', bg: '#FCE7F3', text: '#BE185D' },
};

export default function ActivitiesScreen() {
  const { openSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [logs, setLogs] = useState<LocalActivityLog[]>([]);

  const loadLogs = async () => {
    const items = await getAllActivityLogs();
    setLogs(items);
  };

  useEffect(() => {
    loadLogs();
    const unsub = subscribeDatabaseChanges(() => {
      loadLogs();
    });
    return unsub;
  }, []);

  const bg = isDark ? '#0A0F1A' : '#F8FAFF';
  const card = isDark ? '#0F1A2E' : '#FFFFFF';
  const border = isDark ? '#1A2A3A' : '#E2E8F0';
  const textPrimary = isDark ? '#E2E8F0' : '#1E293B';
  const textMuted = isDark ? '#64748B' : '#64748B';
  const headerBg = '#4F46E5';

  const pending = logs.filter((a) => a.sync_status === 'pending_sync' || a.sync_status === 'sync_failed').length;
  const completed = logs.filter((a) => a.sync_status === 'synced').length;
  const conflicts = logs.filter((a) => a.sync_status === 'conflict').length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: bg }}>
        <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />

        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: headerBg,
              paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8),
            },
          ]}
        >
          <TouchableOpacity
            onPress={openSidebar}
            style={styles.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Activities & Audit Log</Text>
            <Text style={styles.headerSub}>Persistent SQLite field operations & transaction timestamps</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Summary stats ── */}
          <View style={styles.statsRow}>
            <StatCard label="Pending Sync" value={pending} bg="#FEF3C7" text="#B45309" border="#FDE68A" />
            <StatCard label="Synced" value={completed} bg="#DCFCE7" text="#15803D" border="#BBF7D0" />
            <StatCard label="Conflicts" value={conflicts} bg="#FCE7F3" text="#BE185D" border="#FBCFE8" />
          </View>

          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Field Operations Log ({logs.length})
          </Text>

          <View style={styles.cardList}>
            {logs.map((act) => {
              const typeCfg = TYPE_CONFIG[act.activity_type] || TYPE_CONFIG.crop_monitoring;
              const statusCfg = SYNC_STATUS_CONFIG[act.sync_status] || SYNC_STATUS_CONFIG.pending_sync;

              return (
                <View
                  key={act.id}
                  style={[styles.card, { backgroundColor: card, borderColor: border }]}
                >
                  <View style={[styles.iconBadge, { backgroundColor: typeCfg.bg }]}>
                    {typeCfg.icon}
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.cardTopRow}>
                      <Text
                        style={[styles.cardTitle, { color: textPrimary }]}
                        numberOfLines={2}
                      >
                        {act.title}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[styles.statusText, { color: statusCfg.text }]}>
                          {statusCfg.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 12, color: textMuted }}>{act.subtitle}</Text>

                    <Text style={[styles.farmerText, { color: '#16A34A' }]}>
                      {act.farmer_name} ({act.farmer_lfid}) {act.barangay ? `• Brgy. ${act.barangay}` : ''}
                    </Text>

                    {act.latitude !== null && act.longitude !== null && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color={textMuted} />
                        <Text style={{ fontSize: 11, color: textMuted }}>
                          {act.latitude.toFixed(5)}°N, {act.longitude.toFixed(5)}°E{' '}
                          {act.accuracy ? `(±${Math.round(act.accuracy)}m)` : ''} • Evidence: {act.evidence_count}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <Text style={[styles.dateText, { color: textMuted }]}>
                        {new Date(act.created_at).toLocaleString()}
                      </Text>
                      <Text style={[styles.typeLabel, { color: textMuted }]}>
                        {typeCfg.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

function StatCard({
  label,
  value,
  bg,
  text,
  border,
}: {
  label: string;
  value: number;
  bg: string;
  text: string;
  border: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.statValue, { color: text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  cardList: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  farmerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
