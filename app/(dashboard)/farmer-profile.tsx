import { useSidebar } from '@/lib/SidebarContext';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplets,
  Leaf,
  MapPin,
  Menu,
  Package,
  Phone,
  Plus,
  QrCode,
  ShieldCheck,
  User,
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
  getAllFarmers,
  getFarmerByIdOrLfid,
  getAllFarms,
  getAllDistributionData,
  getAllCropMonitoringRecords,
  getAllDamageReportsAndEntries,
  subscribeDatabaseChanges,
  LocalFarmer,
  LocalFarm,
  LocalDistributionAllocation,
} from '@/lib/db/database';
import { parseAgroprofilerQrCode } from '@/lib/services/qrService';

const AVATAR_PALETTE = [
  '#16A34A', '#2563EB', '#9333EA', '#F59E0B',
  '#EF4444', '#0891B2', '#DB2777', '#EA580C',
];
const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function FarmerProfileScreen() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [farmer, setFarmer] = useState<LocalFarmer | null>(null);
  const [farms, setFarms] = useState<LocalFarm[]>([]);
  const [farmerAllocations, setFarmerAllocations] = useState<LocalDistributionAllocation[]>([]);
  const [activityItems, setActivityItems] = useState<
    Array<{ id: string; type: 'distribution' | 'damage' | 'visit'; title: string; date: string; status: string }>
  >([]);

  const loadData = async () => {
    const rawLookup = (params.code as string) || (params.id as string) || '';
    const parsed = rawLookup ? parseAgroprofilerQrCode(rawLookup) : null;
    const targetKey = parsed?.identifier || rawLookup;

    let found = targetKey ? await getFarmerByIdOrLfid(targetKey) : null;
    if (!found) {
      const all = await getAllFarmers();
      found = all[0] || null;
    }

    if (found) {
      setFarmer(found);
      const [allFarms, distData, monRecords, dmgData] = await Promise.all([
        getAllFarms(),
        getAllDistributionData(),
        getAllCropMonitoringRecords(),
        getAllDamageReportsAndEntries(),
      ]);

      const fList = allFarms.filter(
        (f) => f.farmer_id === found!.id || f.farmer_lfid === found!.lfid
      );
      setFarms(fList);

      const allocs = distData.allocations.filter(
        (a) => a.farmer_id === found!.id || a.lfid === found!.lfid
      );
      setFarmerAllocations(allocs);

      const monList = monRecords.filter(
        (m) => m.farmer_id === found!.id || m.farmer_lfid === found!.lfid
      );
      const dmgList = dmgData.entries.filter(
        (d) => d.farmer_id === found!.id || d.lfid === found!.lfid
      );

      const merged: Array<{ id: string; type: 'distribution' | 'damage' | 'visit'; title: string; date: string; status: string }> = [
        ...allocs.map((a) => ({
          id: `dist-${a.id}`,
          type: 'distribution' as const,
          title: `Assistance Allocation (${a.allocated_qty} ${a.unit})`,
          date: a.distributed_at ? new Date(a.distributed_at).toLocaleDateString() : 'Scheduled',
          status: a.status === 'distributed' ? 'completed' : 'pending',
        })),
        ...dmgList.map((d) => ({
          id: `dmg-${d.id}`,
          type: 'damage' as const,
          title: `Crop Damage (${d.commodity} — ${d.severity})`,
          date: new Date(d.created_at).toLocaleDateString(),
          status: d.sync_status === 'synced' ? 'completed' : 'pending',
        })),
        ...monList.map((m) => ({
          id: `mon-${m.id}`,
          type: 'visit' as const,
          title: `Crop Monitoring (${m.commodity} — ${m.growth_stage})`,
          date: new Date(m.created_at).toLocaleDateString(),
          status: m.sync_status === 'synced' ? 'completed' : 'pending',
        })),
      ];
      setActivityItems(merged);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeDatabaseChanges(() => {
      loadData();
    });
    return unsub;
  }, [params.id, params.code]);

  const bg = isDark ? '#0A1A0F' : '#F0FDF4';
  const card = isDark ? '#0F2A1A' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#DCFCE7';
  const textPrimary = isDark ? '#ECFDF5' : '#14532D';
  const textMuted = isDark ? '#6EE7B7' : '#6B7280';

  const activityIcon = (type: string) => {
    if (type === 'distribution') return <Package size={18} color="#8B5CF6" />;
    if (type === 'damage') return <AlertTriangle size={18} color="#F59E0B" />;
    return <Activity size={18} color="#2563EB" />;
  };

  if (!farmer) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: textPrimary }}>Loading Farmer Profile...</Text>
      </View>
    );
  }

  const fullName = `${farmer.first_name} ${farmer.last_name}`.trim();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: bg }}>
        <StatusBar barStyle="light-content" backgroundColor="#16A34A" translucent />

        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Farmer Profile
          </Text>

          <TouchableOpacity
            onPress={openSidebar}
            style={styles.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Menu size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={[styles.heroAvatar, { backgroundColor: AVATAR_PALETTE[0] }]}>
              <Text style={styles.heroAvatarText}>{getInitials(fullName)}</Text>
            </View>
            <Text style={[styles.heroName, { color: textPrimary }]}>{fullName}</Text>
            <View style={styles.heroLfidRow}>
              <Text style={styles.heroLfid}>{farmer.lfid}</Text>
              <View style={styles.heroStatusBadge}>
                <Text style={styles.heroStatusText}>{farmer.registration_status}</Text>
              </View>
              {farmer.sync_status === 'pending_sync' && (
                <View style={[styles.heroStatusBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.heroStatusText, { color: '#B45309' }]}>Pending Sync</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroCommodity}>
              {farmer.primary_commodity} · {farmer.farm_size} ha · Brgy. {farmer.barangay}
            </Text>

            {/* Signed QR Credential Pill */}
            <View style={styles.qrCredentialPill}>
              <QrCode size={14} color="#15803D" />
              <Text style={styles.qrCredentialText} numberOfLines={1}>
                {farmer.qr_code}
              </Text>
              <ShieldCheck size={14} color="#16A34A" />
            </View>
          </View>

          {/* ── Quick stats ── */}
          <View style={[styles.statsCard, { backgroundColor: card, borderColor: border }]}>
            <StatItem label="Farms" value={String(farms.length)} color="#16A34A" />
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <StatItem label="Activities" value={String(activityItems.length)} color="#2563EB" />
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <StatItem
              label="Allocations"
              value={String(farmerAllocations.length)}
              color="#F59E0B"
            />
          </View>

          {/* ── Personal Information ── */}
          <SectionHeader title="Personal Information" />
          <View style={[styles.infoCard, { backgroundColor: card, borderColor: border }]}>
            <InfoRow icon={<User size={16} color="#16A34A" />} label="Full Name" value={fullName} border={border} />
            <InfoRow icon={<Calendar size={16} color="#16A34A" />} label="Date of Birth" value={farmer.birthdate || 'N/A'} border={border} />
            <InfoRow icon={<User size={16} color="#16A34A" />} label="Gender" value={farmer.sex} border={border} />
            <InfoRow icon={<User size={16} color="#16A34A" />} label="Civil Status" value={farmer.civil_status} border={border} />
            <InfoRow icon={<Phone size={16} color="#16A34A" />} label="Mobile" value={farmer.mobile_number} border={border} />
            <InfoRow icon={<MapPin size={16} color="#16A34A" />} label="Address" value={`${farmer.purok}, Brgy. ${farmer.barangay}`} border={border} isLast />
          </View>

          {/* ── Farm Information ── */}
          <SectionHeader title="Agricultural Info" />
          <View style={[styles.infoCard, { backgroundColor: card, borderColor: border }]}>
            <InfoRow icon={<Leaf size={16} color="#16A34A" />} label="Primary Commodity" value={farmer.primary_commodity} border={border} />
            <InfoRow icon={<Droplets size={16} color="#0891B2" />} label="Total Area" value={`${farmer.farm_size} hectares`} border={border} />
            <InfoRow icon={<User size={16} color="#6B7280" />} label="RSBSA No." value={farmer.rsbsa_number} border={border} isLast />
          </View>

          {/* ── Farms ── */}
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Farms / Parcels ({farms.length})</Text>
            <TouchableOpacity
              onPress={() => router.push('/(dashboard)/add-farm' as any)}
              style={styles.addFarmBtn}
            >
              <Plus size={14} color="#16A34A" />
              <Text style={styles.addFarmText}>Add Farm</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10 }}>
            {farms.map((farm) => (
              <TouchableOpacity
                key={farm.id}
                style={[styles.farmCard, { backgroundColor: card, borderColor: border }]}
                onPress={() =>
                  router.push({ pathname: '/(dashboard)/farm-details' as any, params: { id: farm.id } })
                }
                activeOpacity={0.78}
              >
                <View style={styles.farmIcon}>
                  <MapPin size={20} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.farmName, { color: textPrimary }]}>{farm.name}</Text>
                  <Text style={[styles.farmMeta, { color: textMuted }]}>
                    {farm.tenure_type} · {farm.total_area} ha
                  </Text>
                  <Text style={[styles.farmLocation, { color: textMuted }]}>
                    Brgy. {farm.barangay}{' '}
                    {farm.latitude !== null && farm.longitude !== null
                      ? `(${farm.latitude.toFixed(4)}°N, ${farm.longitude.toFixed(4)}°E)`
                      : ''}
                  </Text>
                </View>
                <ChevronRight size={18} color={textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Activity History ── */}
          <View style={[styles.sectionTitleRow, { marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Field Activity & Distribution History</Text>
          </View>

          <View style={{ gap: 10, marginBottom: 20 }}>
            {activityItems.map((act) => {
              const done = act.status === 'completed';
              return (
                <View
                  key={act.id}
                  style={[styles.actCard, { backgroundColor: card, borderColor: border }]}
                >
                  <View style={styles.actIcon}>{activityIcon(act.type)}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actTitle, { color: textPrimary }]}>{act.title}</Text>
                    <Text style={[styles.actDate, { color: textMuted }]}>{act.date}</Text>
                  </View>
                  <View style={[styles.actBadge, { backgroundColor: done ? '#DCFCE7' : '#FEF3C7' }]}>
                    {done ? (
                      <CheckCircle2 size={14} color="#15803D" />
                    ) : (
                      <Clock size={14} color="#B45309" />
                    )}
                    <Text style={[styles.actBadgeText, { color: done ? '#15803D' : '#B45309' }]}>
                      {done ? 'Done' : 'Pending'}
                    </Text>
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

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle2}>{title}</Text>;
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon, label, value, border, isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  border: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: border }]}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#16A34A',
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroAvatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  heroName: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroLfidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  heroLfid: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  heroStatusBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  heroCommodity: {
    fontSize: 13,
    color: '#6B7280',
  },
  qrCredentialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '92%',
  },
  qrCredentialText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle2: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14532D',
    marginBottom: 10,
    marginTop: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14532D',
    marginTop: 1,
  },
  addFarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addFarmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  farmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  farmIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmName: {
    fontSize: 14,
    fontWeight: '700',
  },
  farmMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  farmLocation: {
    fontSize: 12,
    marginTop: 1,
  },
  actCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  actIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  actDate: {
    fontSize: 11,
    marginTop: 2,
  },
  actBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
