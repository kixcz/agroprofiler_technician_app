import { useSidebar } from '@/lib/SidebarContext';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Droplets,
  Leaf,
  MapPin,
  Menu,
  Mountain,
  Navigation,
  Ruler,
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

export default function FarmDetailsScreen() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  /* ─── Theme ─── */
  const bg          = isDark ? '#0A1A0F' : '#F0FDF4';
  const card        = isDark ? '#0F2A1A' : '#FFFFFF';
  const border      = isDark ? '#1F3A28' : '#DCFCE7';
  const textPrimary = isDark ? '#ECFDF5' : '#14532D';
  const textMuted   = isDark ? '#6EE7B7' : '#6B7280';

  /* ─── Mock data ─── */
  const farm = {
    id: params.id || '1',
    name: 'San Isidro Rice Field',
    type: 'Rice Field',
    size: '1.5 ha',
    soilType: 'Clay Loam',
    topography: 'Flat',
    irrigationType: 'National Irrigation System (NIS)',
    farmerName: 'Juan Dela Cruz',
    lfid: 'LFID-001',
    barangay: 'Barangay San Isidro',
    purok: 'Purok 3',
    landmark: 'Near the community chapel',
    latitude: '14.5995° N',
    longitude: '120.9842° E',
    dateRegistered: 'January 15, 2026',
    lastVisit: 'April 10, 2026',
    cropHistory: [
      { season: 'Dry Season 2026',  crop: 'Rice', variety: 'IR64',       status: 'Harvested', yieldVal: '4.5 t/ha' },
      { season: 'Wet Season 2025',  crop: 'Rice', variety: 'NSIC Rc222', status: 'Harvested', yieldVal: '5.2 t/ha' },
    ],
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
          <Text style={styles.headerTitle} numberOfLines={1}>Farm Details</Text>
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
          {/* ── Farm hero ── */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MapPin size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.heroName}>{farm.name}</Text>
            <View style={styles.heroTypeBadge}>
              <Leaf size={12} color="#16A34A" />
              <Text style={styles.heroTypeText}>{farm.type}</Text>
            </View>
            <Text style={styles.heroMeta}>Registered: {farm.dateRegistered}</Text>
          </View>

          {/* ── Quick stats ── */}
          <View style={[styles.statsCard, { backgroundColor: card, borderColor: border }]}>
            <QuickStat icon={<Ruler size={20} color="#2563EB" />} label="Size" value={farm.size} />
            <View style={[styles.statDiv, { backgroundColor: border }]} />
            <QuickStat icon={<Mountain size={20} color="#10B981" />} label="Topography" value={farm.topography} />
            <View style={[styles.statDiv, { backgroundColor: border }]} />
            <QuickStat icon={<Droplets size={20} color="#0891B2" />} label="Irrigation" value="NIS" />
          </View>

          {/* ── Farm Information ── */}
          <SectionTitle title="Farm Information" />
          <View style={[styles.infoCard, { backgroundColor: card, borderColor: border }]}>
            <InfoRow icon={<User size={15} color="#16A34A" />}      label="Farmer"      value={farm.farmerName}    border={border} />
            <InfoRow icon={<User size={15} color="#6B7280" />}      label="LFID"        value={farm.lfid}          border={border} />
            <InfoRow icon={<Mountain size={15} color="#16A34A" />}  label="Soil Type"   value={farm.soilType}      border={border} />
            <InfoRow icon={<Droplets size={15} color="#0891B2" />}  label="Irrigation"  value={farm.irrigationType} border={border} />
            <InfoRow icon={<MapPin size={15} color="#16A34A" />}    label="Location"    value={`${farm.barangay}, ${farm.purok}`} border={border} />
            <InfoRow icon={<MapPin size={15} color="#6B7280" />}    label="Landmark"    value={farm.landmark}      border={border} />
            <InfoRow icon={<User size={15} color="#6B7280" />}      label="Land Tenure" value="Owner"              border={border} />
            <InfoRow icon={<Leaf size={15} color="#16A34A" />}      label="Last Visit"  value={farm.lastVisit}     border={border} isLast />
          </View>

          {/* ── GPS Coordinates ── */}
          <SectionTitle title="GPS Coordinates" />
          <View style={[styles.gpsCard, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.gpsRow}>
              <View style={styles.gpsItem}>
                <Text style={[styles.gpsLabel, { color: textMuted }]}>Latitude</Text>
                <Text style={[styles.gpsValue, { color: textPrimary }]}>{farm.latitude}</Text>
              </View>
              <View style={[styles.gpsDiv, { backgroundColor: border }]} />
              <View style={styles.gpsItem}>
                <Text style={[styles.gpsLabel, { color: textMuted }]}>Longitude</Text>
                <Text style={[styles.gpsValue, { color: textPrimary }]}>{farm.longitude}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.mapBtn}>
              <Navigation size={16} color="#2563EB" />
              <Text style={styles.mapBtnText}>View on Map</Text>
            </TouchableOpacity>
          </View>

          {/* ── Crop History ── */}
          <SectionTitle title="Crop History" />
          <View style={{ gap: 10, marginBottom: 24 }}>
            {farm.cropHistory.map((crop, i) => (
              <View key={i} style={[styles.cropCard, { backgroundColor: card, borderColor: border }]}>
                <View style={styles.cropTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cropName, { color: textPrimary }]}>
                      {crop.crop} — {crop.variety}
                    </Text>
                    <Text style={[styles.cropSeason, { color: textMuted }]}>{crop.season}</Text>
                  </View>
                  <View style={styles.cropStatusBadge}>
                    <Text style={styles.cropStatusText}>{crop.status}</Text>
                  </View>
                </View>
                <View style={[styles.cropFooter, { borderTopColor: border }]}>
                  <Text style={[styles.cropYieldLabel, { color: textMuted }]}>Yield</Text>
                  <Text style={[styles.cropYieldValue, { color: '#16A34A' }]}>{crop.yieldVal}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

/* ─── Sub-components ─── */
function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon, label, value, border, isLast,
}: { icon: React.ReactNode; label: string; value: string; border: string; isLast?: boolean }) {
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

  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14532D',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  heroTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  heroMeta: {
    fontSize: 12,
    color: '#6B7280',
  },

  /* Quick stats */
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
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#14532D', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  statDiv: { width: 1, alignSelf: 'stretch' },

  /* Section title */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14532D',
    marginBottom: 10,
    marginTop: 20,
  },

  /* Info card */
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
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
    paddingVertical: 11,
    gap: 12,
  },
  infoIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#14532D', marginTop: 1 },

  /* GPS card */
  gpsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  gpsItem: { flex: 1, alignItems: 'center' },
  gpsDiv: { width: 1, height: 40 },
  gpsLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  gpsValue: { fontSize: 14, fontWeight: '700' },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 11,
  },
  mapBtnText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },

  /* Crop history */
  cropCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cropTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  cropName: { fontSize: 14, fontWeight: '700' },
  cropSeason: { fontSize: 12, marginTop: 2 },
  cropStatusBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cropStatusText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  cropFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  cropYieldLabel: { fontSize: 12 },
  cropYieldValue: { fontSize: 13, fontWeight: '700' },
});
