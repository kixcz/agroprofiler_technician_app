import { useSidebar } from '@/lib/SidebarContext';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  Plus,
  User,
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

/* ─── Avatar palette (same as farmers list) ─── */
const AVATAR_PALETTE = [
  '#16A34A', '#2563EB', '#9333EA', '#F59E0B',
  '#EF4444', '#0891B2', '#DB2777', '#EA580C',
];
const avatarColor = (id: number) => AVATAR_PALETTE[(id - 1) % AVATAR_PALETTE.length];
const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function FarmerProfileScreen() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const farmerId = parseInt((params.id as string) || '1', 10);

  /* ─── Theme ─── */
  const bg          = isDark ? '#0A1A0F' : '#F0FDF4';
  const card        = isDark ? '#0F2A1A' : '#FFFFFF';
  const border      = isDark ? '#1F3A28' : '#DCFCE7';
  const textPrimary = isDark ? '#ECFDF5' : '#14532D';
  const textMuted   = isDark ? '#6EE7B7' : '#6B7280';

  /* ─── Mock data ─── */
  const farmer = {
    id: farmerId,
    name: 'Juan Dela Cruz',
    lfid: 'LFID-001',
    rsbsa: 'RSBSA-12345',
    mobile: '0917-123-4567',
    email: 'juan@example.com',
    birthDate: 'March 15, 1985',
    gender: 'Male',
    civilStatus: 'Married',
    barangay: 'Barangay San Isidro',
    purok: 'Purok 3',
    commodity: 'Rice',
    farmSize: '2.5 hectares',
    irrigationType: 'National Irrigation System',
    landTenure: 'Owner',
  };

  const farms = [
    { id: '1', name: 'San Isidro Rice Field', type: 'Rice Field', size: '1.5 ha', location: 'Brgy. San Isidro' },
    { id: '2', name: 'Hilltop Vegetable Garden', type: 'Vegetable', size: '1.0 ha', location: 'Brgy. Maligaya' },
  ];

  const activities = [
    { id: '1', type: 'distribution', title: 'Fertilizer Distribution — Batch 2', date: 'Apr 10, 2026', status: 'completed' },
    { id: '2', type: 'damage',       title: 'Crop Damage Report — Flood',        date: 'Apr 5, 2026',  status: 'pending'   },
    { id: '3', type: 'visit',        title: 'Farm Verification Visit',            date: 'Mar 28, 2026', status: 'completed' },
  ];

  const activityIcon = (type: string) => {
    if (type === 'distribution') return <Package  size={18} color="#8B5CF6" />;
    if (type === 'damage')       return <AlertTriangle size={18} color="#F59E0B" />;
    return                              <Activity size={18} color="#2563EB" />;
  };

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
            <View style={[styles.heroAvatar, { backgroundColor: avatarColor(farmer.id) }]}>
              <Text style={styles.heroAvatarText}>{getInitials(farmer.name)}</Text>
            </View>
            <Text style={styles.heroName}>{farmer.name}</Text>
            <View style={styles.heroLfidRow}>
              <Text style={styles.heroLfid}>{farmer.lfid}</Text>
              <View style={styles.heroStatusBadge}>
                <Text style={styles.heroStatusText}>Active</Text>
              </View>
            </View>
            <Text style={styles.heroCommodity}>{farmer.commodity} · {farmer.farmSize}</Text>
          </View>

          {/* ── Quick stats ── */}
          <View style={[styles.statsCard, { backgroundColor: card, borderColor: border }]}>
            <StatItem label="Farms" value="2" color="#16A34A" />
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <StatItem label="Activities" value="3" color="#2563EB" />
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <StatItem label="Pending" value="1" color="#F59E0B" />
          </View>

          {/* ── Personal Information ── */}
          <SectionHeader title="Personal Information" />
          <View style={[styles.infoCard, { backgroundColor: card, borderColor: border }]}>
            <InfoRow icon={<User size={16} color="#16A34A" />}    label="Full Name"    value={farmer.name}         border={border} />
            <InfoRow icon={<Calendar size={16} color="#16A34A" />} label="Date of Birth" value={farmer.birthDate}  border={border} />
            <InfoRow icon={<User size={16} color="#16A34A" />}    label="Gender"       value={farmer.gender}       border={border} />
            <InfoRow icon={<User size={16} color="#16A34A" />}    label="Civil Status" value={farmer.civilStatus}  border={border} />
            <InfoRow icon={<Phone size={16} color="#16A34A" />}   label="Mobile"       value={farmer.mobile}       border={border} />
            <InfoRow icon={<Mail size={16} color="#16A34A" />}    label="Email"        value={farmer.email}        border={border} />
            <InfoRow icon={<MapPin size={16} color="#16A34A" />}  label="Barangay"     value={farmer.barangay}     border={border} isLast />
          </View>

          {/* ── Farm Information ── */}
          <SectionHeader title="Agricultural Info" />
          <View style={[styles.infoCard, { backgroundColor: card, borderColor: border }]}>
            <InfoRow icon={<Leaf size={16} color="#16A34A" />}     label="Commodity"    value={farmer.commodity}     border={border} />
            <InfoRow icon={<Droplets size={16} color="#0891B2" />}  label="Irrigation"   value={farmer.irrigationType} border={border} />
            <InfoRow icon={<MapPin size={16} color="#16A34A" />}   label="Land Tenure"  value={farmer.landTenure}    border={border} />
            <InfoRow icon={<User size={16} color="#6B7280" />}     label="RSBSA No."    value={farmer.rsbsa}         border={border} isLast />
          </View>

          {/* ── Farms ── */}
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Farms / Parcels</Text>
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
                    {farm.type} · {farm.size}
                  </Text>
                  <Text style={[styles.farmLocation, { color: textMuted }]}>{farm.location}</Text>
                </View>
                <ChevronRight size={18} color={textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Activity History ── */}
          <View style={[styles.sectionTitleRow, { marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Activity History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10, marginBottom: 20 }}>
            {activities.map((act) => {
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
                    {done
                      ? <CheckCircle2 size={14} color="#15803D" />
                      : <AlertTriangle size={14} color="#B45309" />
                    }
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

/* ─── Sub-components ─── */
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

/* ─── Styles ─── */
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

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14532D',
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

  /* Stats card */
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  /* Section titles */
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
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },

  /* Info card */
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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

  /* Add farm */
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

  /* Farm card */
  farmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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

  /* Activity card */
  actCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
