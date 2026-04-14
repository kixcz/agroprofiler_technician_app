import { useSidebar } from '@/lib/SidebarContext';
import { Stack } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Menu,
  Plus,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
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

/* ─── Types ─── */
type Status = 'completed' | 'pending' | 'incomplete';
type ActivityType = 'damage' | 'distribution' | 'visit' | 'registration';

type Activity = {
  id: number;
  type: ActivityType;
  title: string;
  farmer: string;
  date: string;
  status: Status;
};

/* ─── Mock data ─── */
const ACTIVITIES: Activity[] = [
  {
    id: 1,
    type: 'damage',
    title: 'Crop Damage Report — Rice Field',
    farmer: 'Juan Dela Cruz',
    date: 'Today, 10:30 AM',
    status: 'pending',
  },
  {
    id: 2,
    type: 'distribution',
    title: 'Fertilizer Distribution — Batch 2',
    farmer: 'Maria Santos',
    date: 'Today, 9:15 AM',
    status: 'completed',
  },
  {
    id: 3,
    type: 'visit',
    title: 'Farm Verification Visit',
    farmer: 'Pedro Reyes',
    date: 'Yesterday, 3:45 PM',
    status: 'incomplete',
  },
  {
    id: 4,
    type: 'damage',
    title: 'Crop Damage Assessment — Corn',
    farmer: 'Ana Garcia',
    date: 'Yesterday, 2:00 PM',
    status: 'pending',
  },
  {
    id: 5,
    type: 'registration',
    title: 'New Farmer Registration',
    farmer: 'Carlos Mendoza',
    date: 'Apr 12, 11:00 AM',
    status: 'completed',
  },
];

/* ─── Config maps ─── */
const TYPE_CONFIG: Record<
  ActivityType,
  { bg: string; icon: React.ReactNode; label: string }
> = {
  damage: {
    bg: '#FFF7ED',
    icon: <AlertTriangle size={20} color="#F59E0B" strokeWidth={2.2} />,
    label: 'Damage Report',
  },
  distribution: {
    bg: '#F0FDF4',
    icon: <CheckCircle2 size={20} color="#16A34A" strokeWidth={2.2} />,
    label: 'Distribution',
  },
  visit: {
    bg: '#F8FAFC',
    icon: <Clock size={20} color="#6B7280" strokeWidth={2.2} />,
    label: 'Field Visit',
  },
  registration: {
    bg: '#EFF6FF',
    icon: <Plus size={20} color="#2563EB" strokeWidth={2.2} />,
    label: 'Registration',
  },
};

const STATUS_CONFIG: Record<
  Status,
  { label: string; bg: string; text: string }
> = {
  completed:  { label: 'Completed',  bg: '#DCFCE7', text: '#15803D' },
  pending:    { label: 'Pending',    bg: '#FEF3C7', text: '#B45309' },
  incomplete: { label: 'Incomplete', bg: '#F1F5F9', text: '#475569' },
};

/* ─── Summary counts ─── */
const countBy = (status: Status) =>
  ACTIVITIES.filter((a) => a.status === status).length;

export default function ActivitiesScreen() {
  const { openSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  /* ─── Theme ─── */
  const bg          = isDark ? '#0A0F1A' : '#F8FAFF';
  const card        = isDark ? '#0F1A2E' : '#FFFFFF';
  const border      = isDark ? '#1A2A3A' : '#E2E8F0';
  const textPrimary = isDark ? '#E2E8F0' : '#1E293B';
  const textMuted   = isDark ? '#64748B' : '#64748B';
  const headerBg    = '#4F46E5'; // indigo — unique per page

  const pending    = countBy('pending');
  const completed  = countBy('completed');
  const incomplete = countBy('incomplete');

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
          <Text style={styles.headerTitle}>Activities</Text>
          <Text style={styles.headerSub}>Field tasks and operations log</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary stats ── */}
        <View style={styles.statsRow}>
          <StatCard label="Pending"    value={pending}    bg="#FEF3C7" text="#B45309" border="#FDE68A" />
          <StatCard label="Completed"  value={completed}  bg="#DCFCE7" text="#15803D" border="#BBF7D0" />
          <StatCard label="Incomplete" value={incomplete} bg="#F1F5F9" text="#475569" border="#CBD5E1" />
        </View>

        {/* ── Section heading ── */}
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>
          Recent Activities
        </Text>

        {/* ── Activity cards ── */}
        <View style={styles.cardList}>
          {ACTIVITIES.map((act) => {
            const typeCfg   = TYPE_CONFIG[act.type];
            const statusCfg = STATUS_CONFIG[act.status];

            return (
              <TouchableOpacity
                key={act.id}
                style={[styles.card, { backgroundColor: card, borderColor: border }]}
                activeOpacity={0.78}
              >
                {/* Left icon badge */}
                <View style={[styles.iconBadge, { backgroundColor: typeCfg.bg }]}>
                  {typeCfg.icon}
                </View>

                {/* Content */}
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.cardTopRow}>
                    <Text
                      style={[styles.cardTitle, { color: textPrimary }]}
                      numberOfLines={2}
                    >
                      {act.title}
                    </Text>
                    {/* Status pill */}
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusCfg.bg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusCfg.text }]}>
                        {statusCfg.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.farmerText, { color: '#16A34A' }]}>
                    {act.farmer}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.dateText, { color: textMuted }]}>
                      {act.date}
                    </Text>
                    <Text style={[styles.typeLabel, { color: textMuted }]}>
                      {typeCfg.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
    </>
  );
}

/* ─── Stat card sub-component ─── */
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

/* ─── Styles ─── */
const styles = StyleSheet.create({
  /* Header */
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

  /* Scroll */
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  /* Stats row */
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

  /* Section */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.1,
  },

  /* Card list */
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  /* Card content */
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
