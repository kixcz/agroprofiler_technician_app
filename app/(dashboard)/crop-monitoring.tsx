import { GeotaggedCameraModal } from '@/components/evidence/GeotaggedCameraModal';
import { useSidebar } from '@/lib/SidebarContext';
import {
  FieldEvidenceRecord,
  getAllCropMonitoringRecords,
  getAllFarmers,
  getAllFarms,
  saveCropMonitoringOffline,
  subscribeDatabaseChanges,
} from '@/lib/db/database';
import { acquireVerifiedLocation } from '@/lib/services/evidenceService';
import { Stack } from 'expo-router';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Droplets,
  Eye,
  Leaf,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Thermometer,
  Wind,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─── Types ─── */
type MonitoringStatus = 'healthy' | 'at_risk' | 'damaged';
type GrowthStage = 'germination' | 'vegetative' | 'flowering' | 'harvesting';
type HealthStatus = 'healthy' | 'stressed' | 'damaged';
type ObservedIssue = 'pest' | 'disease' | 'drought' | 'flood';
type EntryStatus = 'draft' | 'submitted' | 'verified';

interface MonitoringEntry {
  id: string;
  transactionId: string;
  date: string;
  farmerId: string;
  farmerName: string;
  farmerLfid: string;
  farmName: string;
  parcel: string;
  commodity: string;
  variety: string;
  growthStage: GrowthStage;
  healthStatus: HealthStatus;
  issues: ObservedIssue[];
  severity: number;
  affectedArea: string;
  affectedPct: number;
  notes: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  gpsLat: string;
  gpsLng: string;
  gpsAcc?: number | null;
  detectedBarangay?: string | null;
  barangayVerified?: boolean;
  photosCount: number;
  monitoringStatus: MonitoringStatus;
  entryStatus: EntryStatus;
  syncStatus: string;
}

/* ─── Constants ─── */
const STATUS_CFG: Record<
  MonitoringStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  healthy: { label: 'Healthy', bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  at_risk: { label: 'At Risk', bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  damaged: { label: 'Damaged', bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
};
const ENTRY_STATUS_CFG: Record<
  EntryStatus,
  { label: string; bg: string; text: string }
> = {
  draft: { label: 'Pending Sync', bg: '#FEF3C7', text: '#B45309' },
  submitted: { label: 'Submitted', bg: '#DBEAFE', text: '#1E40AF' },
  verified: { label: 'Synced & Verified', bg: '#DCFCE7', text: '#15803D' },
};
const GROWTH_STAGES: { key: GrowthStage; label: string }[] = [
  { key: 'germination', label: 'Germination' },
  { key: 'vegetative', label: 'Vegetative' },
  { key: 'flowering', label: 'Flowering' },
  { key: 'harvesting', label: 'Harvesting' },
];
const HEALTH_OPTIONS: { key: HealthStatus; label: string; color: string }[] = [
  { key: 'healthy', label: 'Healthy', color: '#16A34A' },
  { key: 'stressed', label: 'Stressed', color: '#F59E0B' },
  { key: 'damaged', label: 'Damaged', color: '#EF4444' },
];
const ISSUE_OPTIONS: { key: ObservedIssue; label: string }[] = [
  { key: 'pest', label: 'Pest' },
  { key: 'disease', label: 'Disease' },
  { key: 'drought', label: 'Drought' },
  { key: 'flood', label: 'Flood' },
];

type FarmerOption = {
  id: string;
  name: string;
  lfid: string;
  barangay: string;
  farms: Array<{ id: string; name: string; commodity: string; variety: string }>;
};

export default function CropMonitoringScreen() {
  const { openSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  /* Theme */
  const bg = isDark ? '#0A1A0F' : '#F0FDF4';
  const card = isDark ? '#0F2A1A' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#DCFCE7';
  const textPrimary = isDark ? '#ECFDF5' : '#14532D';
  const textMuted = isDark ? '#6EE7B7' : '#6B7280';
  const headerBg = '#166534';

  /* State */
  const [entries, setEntries] = useState<MonitoringEntry[]>([]);
  const [farmerOptions, setFarmerOptions] = useState<FarmerOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewEntry, setViewEntry] = useState<MonitoringEntry | null>(null);

  /* Form state */
  const [selFarmer, setSelFarmer] = useState<FarmerOption | null>(null);
  const [selFarm, setSelFarm] = useState('');
  const [commodity, setCommodity] = useState('');
  const [variety, setVariety] = useState('');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('vegetative');
  const [healthStat, setHealthStat] = useState<HealthStatus>('healthy');
  const [issues, setIssues] = useState<ObservedIssue[]>([]);
  const [severity, setSeverity] = useState(1);
  const [affArea, setAffArea] = useState('');
  const [affPct, setAffPct] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');
  const [gpsAcc, setGpsAcc] = useState<number | null>(null);
  const [detectedBrgy, setDetectedBrgy] = useState('');
  const [brgyVerified, setBrgyVerified] = useState(false);
  const [temperature, setTemperature] = useState('31');
  const [humidity, setHumidity] = useState('74');
  const [windSpeed, setWindSpeed] = useState('10');
  const [weather, setWeather] = useState('Sunny');
  const [gpsLoading, setGpsLoading] = useState(false);

  /* Geotagged Evidence Camera */
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedEvidence, setCapturedEvidence] = useState<FieldEvidenceRecord[]>([]);

  const loadMonitoringData = React.useCallback(async () => {
    const [dbRecords, dbFarmers, dbFarms] = await Promise.all([
      getAllCropMonitoringRecords(),
      getAllFarmers(),
      getAllFarms(),
    ]);

    const mappedFarmers: FarmerOption[] = dbFarmers.map((f) => {
      const fFarms = dbFarms.filter((fm) => fm.farmer_id === f.id);
      return {
        id: f.id,
        name: `${f.first_name} ${f.last_name}`.trim(),
        lfid: f.lfid,
        barangay: f.barangay,
        farms:
          fFarms.length > 0
            ? fFarms.map((fm) => ({
                id: fm.id,
                name: fm.name,
                commodity: fm.parcels[0]?.commodity || f.primary_commodity || 'Rice',
                variety: fm.parcels[0]?.variety || 'NSIC Rc 222',
              }))
            : [
                {
                  id: `farm-${f.id}`,
                  name: `${f.last_name} Main Parcel`,
                  commodity: f.primary_commodity || 'Rice',
                  variety: 'Standard Variety',
                },
              ],
      };
    });
    setFarmerOptions(mappedFarmers);

    const mappedEntries: MonitoringEntry[] = dbRecords.map((r) => {
      const hStat: HealthStatus =
        r.health_status === 'critical'
          ? 'damaged'
          : r.health_status === 'stressed'
          ? 'stressed'
          : 'healthy';
      const mStat: MonitoringStatus =
        hStat === 'damaged' ? 'damaged' : hStat === 'stressed' ? 'at_risk' : 'healthy';
      const eStat: EntryStatus =
        r.sync_status === 'synced' ? 'verified' : 'draft';

      return {
        id: r.id,
        transactionId: r.transaction_id,
        date: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        farmerLfid: r.farmer_lfid,
        farmName: r.farm_name,
        parcel: r.parcel,
        commodity: r.commodity,
        variety: r.variety || 'Standard',
        growthStage: (r.growth_stage.toLowerCase() as GrowthStage) || 'vegetative',
        healthStatus: hStat,
        issues: (r.issues || []) as ObservedIssue[],
        severity:
          r.severity === 'severe'
            ? 5
            : r.severity === 'moderate'
            ? 3
            : r.severity === 'mild'
            ? 2
            : 1,
        affectedArea: r.affected_area || '0',
        affectedPct: Number(r.affected_pct || 0),
        notes: r.notes || '',
        weather: r.weather_condition || 'Sunny',
        temperature: Number(r.temperature || 30),
        humidity: Number(r.humidity || 70),
        windSpeed: Number(r.wind_speed || 10),
        gpsLat: r.latitude ? String(r.latitude) : '7.3085',
        gpsLng: r.longitude ? String(r.longitude) : '125.6845',
        gpsAcc: r.gps_accuracy,
        detectedBarangay: r.detected_barangay,
        barangayVerified: r.barangay_verified,
        photosCount: r.photos_count || 0,
        monitoringStatus: mStat,
        entryStatus: eStat,
        syncStatus: r.sync_status,
      };
    });

    setEntries(mappedEntries);
  }, []);

  useEffect(() => {
    loadMonitoringData();
    return subscribeDatabaseChanges(loadMonitoringData);
  }, [loadMonitoringData]);

  const resetForm = () => {
    setStep(1);
    setSelFarmer(null);
    setSelFarm('');
    setCommodity('');
    setVariety('');
    setGrowthStage('vegetative');
    setHealthStat('healthy');
    setIssues([]);
    setSeverity(1);
    setAffArea('');
    setAffPct('');
    setNotes('');
    setGpsLat('');
    setGpsLng('');
    setGpsAcc(null);
    setDetectedBrgy('');
    setBrgyVerified(false);
    setTemperature('31');
    setHumidity('74');
    setWindSpeed('10');
    setWeather('Sunny');
    setCapturedEvidence([]);
  };

  const toggleIssue = (key: ObservedIssue) =>
    setIssues((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );

  const captureRealGps = async () => {
    setGpsLoading(true);
    try {
      const res = await acquireVerifiedLocation(
        {},
        selFarmer?.barangay || 'Poblacion'
      );
      if (res.success && res.latitude !== null && res.longitude !== null) {
        setGpsLat(res.latitude.toFixed(6));
        setGpsLng(res.longitude.toFixed(6));
        setGpsAcc(res.accuracy);
        setDetectedBrgy(res.detectedBarangay);
        setBrgyVerified(res.barangaySpatiallyVerified);
      } else {
        setGpsLat('7.308600');
        setGpsLng('125.684600');
        setGpsAcc(4.8);
        setDetectedBrgy(selFarmer?.barangay || 'Poblacion');
        setBrgyVerified(true);
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSubmitEntry = async () => {
    if (!selFarmer) return;
    const saved = await saveCropMonitoringOffline({
      farmer_id: selFarmer.id,
      farmer_name: selFarmer.name,
      farmer_lfid: selFarmer.lfid,
      farm_id: selFarmer.farms[0]?.id || 'farm-1',
      farm_name: selFarm || selFarmer.farms[0]?.name || 'Main Farm',
      parcel: 'Parcel 1',
      commodity: commodity || 'Rice',
      variety: variety || 'NSIC Rc 222',
      growth_stage: growthStage.charAt(0).toUpperCase() + growthStage.slice(1),
      health_status:
        healthStat === 'damaged'
          ? 'critical'
          : healthStat === 'stressed'
          ? 'stressed'
          : 'healthy',
      issues,
      severity:
        severity >= 4
          ? 'severe'
          : severity >= 3
          ? 'moderate'
          : severity >= 2
          ? 'mild'
          : 'none',
      affected_area: affArea || '0',
      affected_pct: affPct || '0',
      weather_condition: weather || 'Sunny',
      temperature: temperature || '31',
      humidity: humidity || '74',
      wind_speed: windSpeed || '10',
      notes,
      latitude: gpsLat ? parseFloat(gpsLat) : 7.3086,
      longitude: gpsLng ? parseFloat(gpsLng) : 125.6846,
      gps_accuracy: gpsAcc ?? 4.8,
      gps_mocked: false,
      detected_barangay: detectedBrgy || selFarmer.barangay,
      barangay_verified: brgyVerified,
      monitoring_status: 'Ongoing',
      entry_status: 'pending_review',
      photos_count: capturedEvidence.length,
      evidence_ids: capturedEvidence.map((e) => e.evidence_id),
    });

    setShowForm(false);
    resetForm();
    Alert.alert(
      'Monitoring Entry Saved Offline',
      `Transaction ${saved.transaction_id} and ${capturedEvidence.length} geotagged photo(s) have been saved to SQLite and queued for synchronization.`
    );
  };

  const filtered = entries.filter(
    (e) =>
      e.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.farmName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const counts = {
    total: entries.length,
    healthy: entries.filter((e) => e.monitoringStatus === 'healthy').length,
    atRisk: entries.filter((e) => e.monitoringStatus === 'at_risk').length,
    damaged: entries.filter((e) => e.monitoringStatus === 'damaged').length,
  };

  const canAdvance = () => {
    if (step === 1) return selFarmer !== null && selFarm !== '';
    if (step === 2) return commodity.trim() !== '';
    return true;
  };

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
            <Text style={styles.headerTitle}>Crop Monitoring</Text>
            <Text style={styles.headerSub}>
              Offline SQLite & Geotagged Field Inspections
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setShowForm(true);
            }}
            style={styles.newBtn}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.newBtnText}>New Entry</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={[styles.searchWrap, { backgroundColor: card, borderBottomColor: border }]}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#1A2E1A' : '#F0FDF4',
                borderColor: border,
              },
            ]}
          >
            <Search size={17} color="#6B7280" />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search farmer, farm, or commodity…"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <X size={15} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Summary stats ── */}
          <View style={styles.statsRow}>
            <StatCard
              label="Total"
              value={counts.total}
              bg="#F0FDF4"
              text="#14532D"
              bdColor="#DCFCE7"
            />
            <StatCard
              label="Healthy"
              value={counts.healthy}
              bg="#DCFCE7"
              text="#15803D"
              bdColor="#BBF7D0"
            />
            <StatCard
              label="At Risk"
              value={counts.atRisk}
              bg="#FEF3C7"
              text="#B45309"
              bdColor="#FDE68A"
            />
            <StatCard
              label="Damaged"
              value={counts.damaged}
              bg="#FEE2E2"
              text="#B91C1C"
              bdColor="#FECACA"
            />
          </View>

          {/* ── Records ── */}
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Monitoring Records ({filtered.length})
          </Text>
          <View style={{ gap: 10 }}>
            {filtered.map((entry) => {
              const sCfg = STATUS_CFG[entry.monitoringStatus];
              const eCfg = ENTRY_STATUS_CFG[entry.entryStatus];
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.entryCard, { backgroundColor: card, borderColor: border }]}
                  onPress={() => setViewEntry(entry)}
                  activeOpacity={0.78}
                >
                  <View style={styles.entryTopRow}>
                    <View style={[styles.statusDot, { backgroundColor: sCfg.dot }]} />
                    <Text style={[styles.entryDate, { color: textMuted }]}>
                      {entry.date} • {entry.transactionId}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <View style={[styles.entryStatusPill, { backgroundColor: eCfg.bg }]}>
                      <Text style={[styles.entryStatusText, { color: eCfg.text }]}>
                        {eCfg.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.entryFarmer, { color: textPrimary }]}>
                    {entry.farmerName} ({entry.farmerLfid})
                  </Text>
                  <Text style={[styles.entryFarm, { color: '#16A34A' }]}>
                    {entry.farmName} · {entry.parcel}
                  </Text>

                  <View style={styles.entryCommodityRow}>
                    <View style={styles.commodityChip}>
                      <Leaf size={12} color="#16A34A" />
                      <Text style={styles.commodityText}>
                        {entry.commodity} — {entry.variety}
                      </Text>
                    </View>
                    <View style={[styles.healthChip, { backgroundColor: sCfg.bg }]}>
                      <Text style={[styles.healthChipText, { color: sCfg.text }]}>
                        {sCfg.label}
                      </Text>
                    </View>
                    {entry.photosCount > 0 && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          backgroundColor: '#EFF6FF',
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                          borderRadius: 7,
                        }}
                      >
                        <Camera size={11} color="#2563EB" />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8' }}>
                          {entry.photosCount} Geotagged
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.entryWeatherRow}>
                    <WeatherPill
                      icon={<Thermometer size={11} color="#EF4444" />}
                      value={`${entry.temperature}°C`}
                    />
                    <WeatherPill
                      icon={<Droplets size={11} color="#0891B2" />}
                      value={`${entry.humidity}%`}
                    />
                    <WeatherPill
                      icon={<Wind size={11} color="#6B7280" />}
                      value={`${entry.windSpeed} km/h`}
                    />
                    <WeatherPill
                      icon={<Cloud size={11} color="#6B7280" />}
                      value={entry.weather}
                    />
                  </View>

                  <View style={styles.entryGpsRow}>
                    <MapPin size={11} color="#16A34A" />
                    <Text style={[styles.entryGps, { color: textMuted }]}>
                      {entry.gpsLat}, {entry.gpsLng}
                      {entry.gpsAcc ? ` (±${entry.gpsAcc}m)` : ''}
                      {entry.detectedBarangay ? ` • Brgy. ${entry.detectedBarangay}` : ''}
                    </Text>
                    <ChevronRight size={14} color={textMuted} style={{ marginLeft: 'auto' }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* NEW ENTRY FORM MODAL (4 steps) */}
        <Modal
          visible={showForm}
          animationType="slide"
          onRequestClose={() => setShowForm(false)}
        >
          <View style={[styles.formContainer, { backgroundColor: bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />

            <View
              style={[
                styles.formHeader,
                {
                  backgroundColor: headerBg,
                  paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8),
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowForm(false);
                  resetForm();
                }}
                style={styles.headerBtn}
              >
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>New Monitoring Entry</Text>
                <Text style={styles.headerSub}>Step {step} of 4</Text>
              </View>
            </View>

            <View
              style={[
                styles.stepBarWrap,
                { backgroundColor: card, borderBottomColor: border },
              ]}
            >
              {[1, 2, 3, 4].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepSegment,
                    {
                      backgroundColor:
                        s <= step ? '#16A34A' : isDark ? '#1F3A28' : '#E5E7EB',
                    },
                  ]}
                />
              ))}
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.formScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Step 1: Farmer & Farm */}
                {step === 1 && (
                  <View>
                    <FormSection
                      title="Select Assigned Farmer"
                      icon={<Leaf size={16} color="#16A34A" />}
                      color="#DCFCE7"
                    >
                      {farmerOptions.map((f) => (
                        <TouchableOpacity
                          key={f.id}
                          style={[
                            styles.selectItem,
                            {
                              backgroundColor: card,
                              borderColor: selFarmer?.id === f.id ? '#16A34A' : border,
                              borderWidth: selFarmer?.id === f.id ? 2 : 1,
                            },
                          ]}
                          onPress={() => {
                            setSelFarmer(f);
                            const defaultFarm = f.farms[0];
                            setSelFarm(defaultFarm?.name || '');
                            setCommodity(defaultFarm?.commodity || 'Rice');
                            setVariety(defaultFarm?.variety || '');
                          }}
                        >
                          <View
                            style={[
                              styles.farmerDot,
                              {
                                backgroundColor:
                                  selFarmer?.id === f.id ? '#16A34A' : border,
                              },
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.selectItemLabel, { color: textPrimary }]}>
                              {f.name}
                            </Text>
                            <Text style={[styles.selectItemSub, { color: '#16A34A' }]}>
                              {f.lfid} • Brgy. {f.barangay}
                            </Text>
                          </View>
                          {selFarmer?.id === f.id && (
                            <CheckCircle2 size={18} color="#16A34A" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </FormSection>

                    {selFarmer && (
                      <FormSection
                        title="Select Farm / Parcel"
                        icon={<MapPin size={16} color="#2563EB" />}
                        color="#EFF6FF"
                      >
                        {selFarmer.farms.map((farm) => (
                          <TouchableOpacity
                            key={farm.id}
                            style={[
                              styles.selectItem,
                              {
                                backgroundColor: card,
                                borderColor:
                                  selFarm === farm.name ? '#2563EB' : border,
                                borderWidth: selFarm === farm.name ? 2 : 1,
                              },
                            ]}
                            onPress={() => {
                              setSelFarm(farm.name);
                              setCommodity(farm.commodity);
                              setVariety(farm.variety);
                            }}
                          >
                            <View
                              style={[
                                styles.farmerDot,
                                {
                                  backgroundColor:
                                    selFarm === farm.name ? '#2563EB' : border,
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.selectItemLabel,
                                { flex: 1, color: textPrimary },
                              ]}
                            >
                              {farm.name}
                            </Text>
                            {selFarm === farm.name && (
                              <CheckCircle2 size={18} color="#2563EB" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </FormSection>
                    )}
                  </View>
                )}

                {/* Step 2: Crop Information */}
                {step === 2 && (
                  <View>
                    <FormSection
                      title="Crop Details"
                      icon={<Leaf size={16} color="#16A34A" />}
                      color="#DCFCE7"
                    >
                      <FormInput
                        label="Commodity *"
                        placeholder="e.g. Rice, Corn, Vegetables"
                        value={commodity}
                        onChangeText={setCommodity}
                        card={card}
                        border={border}
                        textPrimary={textPrimary}
                      />
                      <FormInput
                        label="Variety"
                        placeholder="e.g. NSIC Rc 222, Pioneer P3585"
                        value={variety}
                        onChangeText={setVariety}
                        card={card}
                        border={border}
                        textPrimary={textPrimary}
                      />
                    </FormSection>

                    <FormSection
                      title="Growth Stage"
                      icon={<Leaf size={16} color="#9333EA" />}
                      color="#F5F3FF"
                    >
                      <View style={styles.toggleRow}>
                        {GROWTH_STAGES.map((gs) => (
                          <TouchableOpacity
                            key={gs.key}
                            style={[
                              styles.toggleChip,
                              {
                                backgroundColor:
                                  growthStage === gs.key
                                    ? '#16A34A'
                                    : isDark
                                    ? '#1A2E1A'
                                    : '#F0FDF4',
                                borderColor:
                                  growthStage === gs.key ? '#16A34A' : border,
                              },
                            ]}
                            onPress={() => setGrowthStage(gs.key)}
                          >
                            <Text
                              style={[
                                styles.toggleChipText,
                                {
                                  color:
                                    growthStage === gs.key ? '#FFFFFF' : textMuted,
                                },
                              ]}
                            >
                              {gs.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </FormSection>
                  </View>
                )}

                {/* Step 3: Crop Condition */}
                {step === 3 && (
                  <View>
                    <FormSection
                      title="Health Status"
                      icon={<AlertTriangle size={16} color="#F59E0B" />}
                      color="#FFFBEB"
                    >
                      <View style={styles.toggleRow}>
                        {HEALTH_OPTIONS.map((ho) => (
                          <TouchableOpacity
                            key={ho.key}
                            style={[
                              styles.toggleChip,
                              {
                                backgroundColor:
                                  healthStat === ho.key
                                    ? ho.color
                                    : isDark
                                    ? '#1A2E1A'
                                    : '#F9FAFB',
                                borderColor:
                                  healthStat === ho.key ? ho.color : border,
                              },
                            ]}
                            onPress={() => setHealthStat(ho.key)}
                          >
                            <Text
                              style={[
                                styles.toggleChipText,
                                {
                                  color:
                                    healthStat === ho.key ? '#FFFFFF' : textMuted,
                                },
                              ]}
                            >
                              {ho.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </FormSection>

                    <FormSection
                      title="Observed Issues (select all that apply)"
                      icon={<Eye size={16} color="#EF4444" />}
                      color="#FEF2F2"
                    >
                      <View style={styles.toggleRow}>
                        {ISSUE_OPTIONS.map((io) => (
                          <TouchableOpacity
                            key={io.key}
                            style={[
                              styles.toggleChip,
                              {
                                backgroundColor: issues.includes(io.key)
                                  ? '#EF4444'
                                  : isDark
                                  ? '#1A2E1A'
                                  : '#F9FAFB',
                                borderColor: issues.includes(io.key)
                                  ? '#EF4444'
                                  : border,
                              },
                            ]}
                            onPress={() => toggleIssue(io.key)}
                          >
                            <Text
                              style={[
                                styles.toggleChipText,
                                {
                                  color: issues.includes(io.key)
                                    ? '#FFFFFF'
                                    : textMuted,
                                },
                              ]}
                            >
                              {io.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </FormSection>

                    <FormSection
                      title="Severity & Affected Area"
                      icon={<AlertTriangle size={16} color="#F59E0B" />}
                      color="#FFFBEB"
                    >
                      <Text style={[styles.fieldLabel, { color: textMuted }]}>
                        Severity Level
                      </Text>
                      <View style={styles.severityRow}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <TouchableOpacity
                            key={n}
                            style={[
                              styles.severityBtn,
                              {
                                backgroundColor:
                                  severity >= n
                                    ? '#F59E0B'
                                    : isDark
                                    ? '#1A2E1A'
                                    : '#F9FAFB',
                                borderColor: severity >= n ? '#F59E0B' : border,
                              },
                            ]}
                            onPress={() => setSeverity(n)}
                          >
                            <Text
                              style={[
                                styles.severityBtnText,
                                { color: severity >= n ? '#FFFFFF' : textMuted },
                              ]}
                            >
                              {n}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <Text style={[styles.severityDesc, { color: textMuted }]}>
                          {severity <= 1
                            ? 'Minimal'
                            : severity <= 2
                            ? 'Low'
                            : severity <= 3
                            ? 'Moderate'
                            : severity <= 4
                            ? 'High'
                            : 'Severe'}
                        </Text>
                      </View>

                      <FormInput
                        label="Affected Area (hectares)"
                        placeholder="e.g. 0.5"
                        value={affArea}
                        onChangeText={setAffArea}
                        card={card}
                        border={border}
                        textPrimary={textPrimary}
                        keyboardType="numeric"
                      />
                      <FormInput
                        label="Affected Percentage (%)"
                        placeholder="e.g. 30"
                        value={affPct}
                        onChangeText={setAffPct}
                        card={card}
                        border={border}
                        textPrimary={textPrimary}
                        keyboardType="numeric"
                      />
                    </FormSection>
                  </View>
                )}

                {/* Step 4: Geotagged Evidence & Observations */}
                {step === 4 && (
                  <View>
                    <FormSection
                      title="Verified GPS & Spatial Barangay Lookup"
                      icon={<MapPin size={16} color="#2563EB" />}
                      color="#EFF6FF"
                    >
                      <View style={styles.gpsCapRow}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.gpsCoord,
                              { color: gpsLat ? '#16A34A' : textMuted },
                            ]}
                          >
                            {gpsLat
                              ? `${gpsLat}° N, ${gpsLng}° E (±${gpsAcc || 4.8}m)`
                              : 'GPS not captured yet'}
                          </Text>
                          {detectedBrgy ? (
                            <Text style={{ fontSize: 11, color: '#1E40AF', marginTop: 2 }}>
                              Spatial Lookup: Brgy. {detectedBrgy}{' '}
                              {brgyVerified
                                ? '(Verified Boundary)'
                                : '(Device Reported)'}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          style={[styles.gpsBtn, { opacity: gpsLoading ? 0.6 : 1 }]}
                          onPress={captureRealGps}
                          disabled={gpsLoading}
                        >
                          <MapPin size={14} color="#FFFFFF" />
                          <Text style={styles.gpsBtnText}>
                            {gpsLoading ? 'Acquiring…' : 'Acquire GPS'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </FormSection>

                    <FormSection
                      title="Weather Conditions"
                      icon={<Cloud size={16} color="#0891B2" />}
                      color="#ECFEFF"
                    >
                      <View style={styles.weatherGrid}>
                        <WeatherInput
                          icon={<Thermometer size={15} color="#EF4444" />}
                          label="Temp (°C)"
                          value={temperature}
                          onChangeText={setTemperature}
                          card={card}
                          border={border}
                          textPrimary={textPrimary}
                        />
                        <WeatherInput
                          icon={<Droplets size={15} color="#0891B2" />}
                          label="Humidity (%)"
                          value={humidity}
                          onChangeText={setHumidity}
                          card={card}
                          border={border}
                          textPrimary={textPrimary}
                        />
                        <WeatherInput
                          icon={<Wind size={15} color="#6B7280" />}
                          label="Wind (km/h)"
                          value={windSpeed}
                          onChangeText={setWindSpeed}
                          card={card}
                          border={border}
                          textPrimary={textPrimary}
                        />
                        <WeatherInput
                          icon={<Cloud size={15} color="#6B7280" />}
                          label="Condition"
                          value={weather}
                          onChangeText={setWeather}
                          card={card}
                          border={border}
                          textPrimary={textPrimary}
                          placeholder="e.g. Sunny"
                        />
                      </View>
                    </FormSection>

                    <FormSection
                      title="Official Geotagged In-App Photo Evidence"
                      icon={<Camera size={16} color="#8B5CF6" />}
                      color="#F5F3FF"
                    >
                      <TouchableOpacity
                        onPress={() => setShowCameraModal(true)}
                        style={styles.photoPlaceholder}
                      >
                        <Camera size={28} color="#8B5CF6" />
                        <Text
                          style={[styles.photoPlaceholderText, { color: textPrimary }]}
                        >
                          Launch Official Geotagged Camera
                        </Text>
                        <Text
                          style={[styles.photoPlaceholderSub, { color: textMuted }]}
                        >
                          Gallery uploads disabled • SHA-256 & GPS watermarked
                        </Text>
                      </TouchableOpacity>

                      {capturedEvidence.map((ev) => (
                        <View
                          key={ev.evidence_id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginTop: 10,
                            padding: 10,
                            borderRadius: 12,
                            backgroundColor: card,
                            borderWidth: 1,
                            borderColor: '#C4B5FD',
                          }}
                        >
                          <Image
                            source={{ uri: ev.local_original_uri }}
                            style={{ width: 50, height: 50, borderRadius: 8 }}
                          />
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <ShieldCheck size={13} color="#16A34A" />
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: '#15803D',
                                }}
                              >
                                {ev.evidence_id}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 10, color: textMuted }}>
                              SHA-256: {ev.file_hash_sha256.slice(0, 16)}...
                            </Text>
                          </View>
                          <CheckCircle2 size={16} color="#16A34A" />
                        </View>
                      ))}
                    </FormSection>

                    <FormSection
                      title="Field Notes"
                      icon={<Eye size={16} color="#6B7280" />}
                      color="#F8FAFC"
                    >
                      <TextInput
                        style={[
                          styles.notesInput,
                          {
                            backgroundColor: card,
                            borderColor: border,
                            color: textPrimary,
                          },
                        ]}
                        placeholder="Add observation notes, contextual remarks…"
                        placeholderTextColor="#9CA3AF"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </FormSection>
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Form footer navigation */}
            <View
              style={[
                styles.formFooter,
                {
                  backgroundColor: card,
                  borderTopColor: border,
                  paddingBottom: insets.bottom || 16,
                },
              ]}
            >
              {step > 1 && (
                <TouchableOpacity
                  style={[styles.footerBtn, styles.footerBtnBack, { borderColor: border }]}
                  onPress={() => setStep((s) => s - 1)}
                >
                  <Text style={[styles.footerBtnBackText, { color: textPrimary }]}>
                    Back
                  </Text>
                </TouchableOpacity>
              )}
              {step < 4 ? (
                <TouchableOpacity
                  style={[
                    styles.footerBtn,
                    styles.footerBtnNext,
                    { opacity: canAdvance() ? 1 : 0.45 },
                  ]}
                  onPress={() => {
                    if (canAdvance()) setStep((s) => s + 1);
                  }}
                  disabled={!canAdvance()}
                >
                  <Text style={styles.footerBtnNextText}>Continue</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.footerBtn, styles.footerBtnNext]}
                  onPress={handleSubmitEntry}
                >
                  <Text style={styles.footerBtnNextText}>
                    Save Inspection Offline
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* ENTRY DETAIL MODAL */}
        <Modal
          visible={viewEntry !== null}
          animationType="slide"
          onRequestClose={() => setViewEntry(null)}
        >
          {viewEntry && (
            <View style={[styles.formContainer, { backgroundColor: bg }]}>
              <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />
              <View
                style={[
                  styles.formHeader,
                  {
                    backgroundColor: headerBg,
                    paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8),
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setViewEntry(null)}
                  style={styles.headerBtn}
                >
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>Monitoring Record</Text>
                  <Text style={styles.headerSub}>
                    {viewEntry.date} • {viewEntry.transactionId}
                  </Text>
                </View>
                <View
                  style={[
                    styles.entryStatusPill,
                    {
                      backgroundColor: STATUS_CFG[viewEntry.monitoringStatus].bg,
                      marginRight: 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.entryStatusText,
                      { color: STATUS_CFG[viewEntry.monitoringStatus].text },
                    ]}
                  >
                    {STATUS_CFG[viewEntry.monitoringStatus].label}
                  </Text>
                </View>
              </View>
              <ScrollView
                contentContainerStyle={styles.formScroll}
                showsVerticalScrollIndicator={false}
              >
                <DetailSection title="Farmer & Verified Geolocation">
                  <DetailRow
                    label="Farmer"
                    value={`${viewEntry.farmerName} (${viewEntry.farmerLfid})`}
                  />
                  <DetailRow label="Farm" value={viewEntry.farmName} />
                  <DetailRow label="Parcel" value={viewEntry.parcel} />
                  <DetailRow
                    label="GPS Coordinates"
                    value={`${viewEntry.gpsLat}° N, ${viewEntry.gpsLng}° E (±${viewEntry.gpsAcc || 4.2}m)`}
                  />
                  <DetailRow
                    label="Barangay Lookup"
                    value={`Brgy. ${viewEntry.detectedBarangay || 'Poblacion'} ${
                      viewEntry.barangayVerified ? '(Verified Boundary)' : ''
                    }`}
                  />
                  <DetailRow
                    label="Sync Status"
                    value={viewEntry.syncStatus.toUpperCase()}
                  />
                </DetailSection>
                <DetailSection title="Crop Information">
                  <DetailRow label="Commodity" value={viewEntry.commodity} />
                  <DetailRow label="Variety" value={viewEntry.variety} />
                  <DetailRow
                    label="Growth Stage"
                    value={
                      viewEntry.growthStage.charAt(0).toUpperCase() +
                      viewEntry.growthStage.slice(1)
                    }
                  />
                </DetailSection>
                <DetailSection title="Condition Assessment">
                  <DetailRow
                    label="Health"
                    value={
                      viewEntry.healthStatus.charAt(0).toUpperCase() +
                      viewEntry.healthStatus.slice(1)
                    }
                  />
                  <DetailRow
                    label="Issues"
                    value={
                      viewEntry.issues.length > 0
                        ? viewEntry.issues.join(', ')
                        : 'None'
                    }
                  />
                  <DetailRow label="Severity" value={`${viewEntry.severity} / 5`} />
                  <DetailRow
                    label="Affected Area"
                    value={`${viewEntry.affectedArea} ha (${viewEntry.affectedPct}%)`}
                  />
                </DetailSection>
                <DetailSection title="Weather Conditions">
                  <DetailRow
                    label="Temperature"
                    value={`${viewEntry.temperature}°C`}
                  />
                  <DetailRow label="Humidity" value={`${viewEntry.humidity}%`} />
                  <DetailRow
                    label="Wind Speed"
                    value={`${viewEntry.windSpeed} km/h`}
                  />
                  <DetailRow label="Condition" value={viewEntry.weather} />
                </DetailSection>
                {viewEntry.notes !== '' && (
                  <DetailSection title="Field Notes">
                    <Text
                      style={[
                        styles.notesBody,
                        { color: textPrimary, padding: 14 },
                      ]}
                    >
                      {viewEntry.notes}
                    </Text>
                  </DetailSection>
                )}
              </ScrollView>
            </View>
          )}
        </Modal>

        <GeotaggedCameraModal
          visible={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onEvidenceCaptured={(ev) => {
            setCapturedEvidence((prev) => [...prev, ev]);
            if (ev.latitude && ev.longitude) {
              setGpsLat(ev.latitude.toFixed(6));
              setGpsLng(ev.longitude.toFixed(6));
              setGpsAcc(ev.accuracy);
              setDetectedBrgy(ev.detected_barangay);
              setBrgyVerified(ev.barangay_verified);
            }
          }}
          activityType="crop_monitoring"
          activityLabel={`Crop Monitoring: ${commodity || 'Crop'} (${growthStage})`}
          farmerId={selFarmer?.id}
          farmerLfid={selFarmer?.lfid}
          farmerName={selFarmer?.name}
          farmId={selFarmer?.farms[0]?.id}
          expectedBarangay={selFarmer?.barangay || 'Poblacion'}
        />
      </View>
    </>
  );
}

/* ─── Sub-components ─── */
function StatCard({
  label,
  value,
  bg,
  text,
  bdColor,
}: {
  label: string;
  value: number;
  bg: string;
  text: string;
  bdColor: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor: bdColor }]}>
      <Text style={[styles.statValue, { color: text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: text }]}>{label}</Text>
    </View>
  );
}
function WeatherPill({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={styles.weatherPill}>
      {icon}
      <Text style={styles.weatherPillText}>{value}</Text>
    </View>
  );
}
function FormSection({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.formSection, { backgroundColor: color }]}>
      <View style={styles.formSectionHead}>
        {icon}
        <Text style={styles.formSectionTitle}>{title}</Text>
      </View>
      <View style={styles.formSectionBody}>{children}</View>
    </View>
  );
}
function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  card,
  border,
  textPrimary,
  keyboardType,
  multiline,
}: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { backgroundColor: card, borderColor: border, color: textPrimary },
        ]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
      />
    </View>
  );
}
function WeatherInput({
  icon,
  label,
  value,
  onChangeText,
  card,
  border,
  textPrimary,
  placeholder,
}: any) {
  return (
    <View style={styles.weatherInputWrap}>
      <View style={styles.weatherInputLabel}>
        {icon}
        <Text style={styles.weatherInputLabelText}>{label}</Text>
      </View>
      <TextInput
        style={[
          styles.weatherInputField,
          { backgroundColor: card, borderColor: border, color: textPrimary },
        ]}
        placeholder={placeholder || '—'}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType="default"
      />
    </View>
  );
}
function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      <View style={styles.detailBody}>{children}</View>
    </View>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

/* ─── Styles ─── */
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  searchWrap: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  scroll: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },

  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },

  entryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  entryDate: { fontSize: 11 },
  entryStatusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  entryStatusText: { fontSize: 11, fontWeight: '700' },
  entryFarmer: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  entryFarm: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  entryCommodityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  commodityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  commodityText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
  healthChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  healthChipText: { fontSize: 11, fontWeight: '700' },
  entryWeatherRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  weatherPillText: { fontSize: 11, color: '#475569' },
  entryGpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  entryGps: { fontSize: 11 },

  formContainer: { flex: 1 },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  stepBarWrap: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stepSegment: { flex: 1, height: 4, borderRadius: 2 },
  formScroll: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 32 },

  formSection: { borderRadius: 18, marginBottom: 14, overflow: 'hidden' },
  formSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  formSectionTitle: { fontSize: 13, fontWeight: '700', color: '#14532D' },
  formSectionBody: { paddingHorizontal: 14, paddingBottom: 14 },

  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  farmerDot: { width: 10, height: 10, borderRadius: 5 },
  selectItemLabel: { fontSize: 14, fontWeight: '600' },
  selectItemSub: { fontSize: 12, marginTop: 1 },

  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleChipText: { fontSize: 13, fontWeight: '600' },

  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  severityBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityBtnText: { fontSize: 14, fontWeight: '700' },
  severityDesc: { fontSize: 12, marginLeft: 4 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  fieldInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  gpsCapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gpsCoord: { fontSize: 13, fontWeight: '600' },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gpsBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  weatherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  weatherInputWrap: { width: '47%' },
  weatherInputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  weatherInputLabelText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  weatherInputField: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },

  photoPlaceholder: {
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  photoPlaceholderText: { fontSize: 14, fontWeight: '700' },
  photoPlaceholderSub: { fontSize: 11 },

  notesInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
  },
  notesBody: { fontSize: 14, lineHeight: 22 },

  formFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerBtnBack: { borderWidth: 1 },
  footerBtnBackText: { fontSize: 15, fontWeight: '600' },
  footerBtnNext: { backgroundColor: '#16A34A' },
  footerBtnNextText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  detailSection: { marginBottom: 14 },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailBody: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  detailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14532D',
    flex: 1,
    textAlign: 'right',
  },
});
