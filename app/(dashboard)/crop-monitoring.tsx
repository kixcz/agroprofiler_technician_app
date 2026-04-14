import { useSidebar } from '@/lib/SidebarContext';
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
  Thermometer,
  Wind,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import {
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
  id: number;
  date: string;
  farmerName: string;
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
  monitoringStatus: MonitoringStatus;
  entryStatus: EntryStatus;
}

/* ─── Constants ─── */
const STATUS_CFG: Record<MonitoringStatus, { label: string; bg: string; text: string; dot: string }> = {
  healthy:  { label: 'Healthy',  bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  at_risk:  { label: 'At Risk',  bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  damaged:  { label: 'Damaged',  bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
};
const ENTRY_STATUS_CFG: Record<EntryStatus, { label: string; bg: string; text: string }> = {
  draft:      { label: 'Draft',      bg: '#F1F5F9', text: '#475569' },
  submitted:  { label: 'Submitted',  bg: '#DBEAFE', text: '#1E40AF' },
  verified:   { label: 'Verified',   bg: '#DCFCE7', text: '#15803D' },
};
const GROWTH_STAGES: { key: GrowthStage; label: string }[] = [
  { key: 'germination', label: 'Germination' },
  { key: 'vegetative',  label: 'Vegetative'  },
  { key: 'flowering',   label: 'Flowering'   },
  { key: 'harvesting',  label: 'Harvesting'  },
];
const HEALTH_OPTIONS: { key: HealthStatus; label: string; color: string }[] = [
  { key: 'healthy',  label: 'Healthy',  color: '#16A34A' },
  { key: 'stressed', label: 'Stressed', color: '#F59E0B' },
  { key: 'damaged',  label: 'Damaged',  color: '#EF4444' },
];
const ISSUE_OPTIONS: { key: ObservedIssue; label: string }[] = [
  { key: 'pest',    label: 'Pest'    },
  { key: 'disease', label: 'Disease' },
  { key: 'drought', label: 'Drought' },
  { key: 'flood',   label: 'Flood'   },
];
const FARMERS_LIST = [
  { id: 1, name: 'Juan Dela Cruz', lfid: 'LFID-001', farms: ['San Isidro Rice Field', 'Hilltop Garden'] },
  { id: 2, name: 'Maria Santos',   lfid: 'LFID-002', farms: ['Maligaya Corn Farm'] },
  { id: 3, name: 'Pedro Reyes',    lfid: 'LFID-003', farms: ['Bagong Silang Farm', 'North Parcel'] },
];
const MOCK_ENTRIES: MonitoringEntry[] = [
  { id: 1, date: 'Apr 13, 2026', farmerName: 'Juan Dela Cruz', farmName: 'San Isidro Rice Field', parcel: 'Parcel A', commodity: 'Rice', variety: 'IR64', growthStage: 'vegetative', healthStatus: 'healthy', issues: [], severity: 0, affectedArea: '0', affectedPct: 0, notes: 'Crop appears healthy. No issues.', weather: 'Partly Cloudy', temperature: 28, humidity: 72, windSpeed: 12, gpsLat: '14.5995', gpsLng: '120.9842', monitoringStatus: 'healthy', entryStatus: 'verified' },
  { id: 2, date: 'Apr 12, 2026', farmerName: 'Maria Santos',   farmName: 'Maligaya Corn Farm',    parcel: 'Parcel B', commodity: 'Corn', variety: 'DK818', growthStage: 'flowering',   healthStatus: 'stressed', issues: ['pest', 'disease'], severity: 3, affectedArea: '0.5', affectedPct: 30, notes: 'Signs of leaf blight on lower leaves.', weather: 'Sunny', temperature: 32, humidity: 65, windSpeed: 8, gpsLat: '14.6012', gpsLng: '120.9901', monitoringStatus: 'at_risk', entryStatus: 'submitted' },
  { id: 3, date: 'Apr 11, 2026', farmerName: 'Pedro Reyes',    farmName: 'Bagong Silang Farm',    parcel: 'Parcel C', commodity: 'Vegetables', variety: 'Mixed', growthStage: 'harvesting', healthStatus: 'damaged', issues: ['flood'], severity: 5, affectedArea: '1.2', affectedPct: 75, notes: 'Significant flood damage after heavy rains.', weather: 'Rainy', temperature: 24, humidity: 90, windSpeed: 20, gpsLat: '14.5978', gpsLng: '120.9855', monitoringStatus: 'damaged', entryStatus: 'draft' },
  { id: 4, date: 'Apr 10, 2026', farmerName: 'Ana Garcia',     farmName: 'San Isidro Farm 2',     parcel: 'Parcel D', commodity: 'Rice', variety: 'NSIC Rc222', growthStage: 'vegetative', healthStatus: 'healthy', issues: [], severity: 0, affectedArea: '0', affectedPct: 0, notes: 'Good progress.', weather: 'Sunny', temperature: 30, humidity: 68, windSpeed: 10, gpsLat: '14.5990', gpsLng: '120.9850', monitoringStatus: 'healthy', entryStatus: 'verified' },
];

/* ─── Main component ─── */
export default function CropMonitoringScreen() {
  const { openSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  /* Theme */
  const bg          = isDark ? '#0A1A0F' : '#F0FDF4';
  const card        = isDark ? '#0F2A1A' : '#FFFFFF';
  const border      = isDark ? '#1F3A28' : '#DCFCE7';
  const textPrimary = isDark ? '#ECFDF5' : '#14532D';
  const textMuted   = isDark ? '#6EE7B7' : '#6B7280';
  const headerBg    = '#166534'; // deep green header for this module

  /* State */
  const [showForm, setShowForm] = useState(false);
  const [step, setStep]         = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewEntry, setViewEntry] = useState<MonitoringEntry | null>(null);

  /* Form state */
  const [selFarmer, setSelFarmer]     = useState<typeof FARMERS_LIST[0] | null>(null);
  const [selFarm,   setSelFarm]       = useState('');
  const [commodity, setCommodity]     = useState('');
  const [variety,   setVariety]       = useState('');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('vegetative');
  const [healthStat,  setHealthStat]  = useState<HealthStatus>('healthy');
  const [issues,   setIssues]         = useState<ObservedIssue[]>([]);
  const [severity, setSeverity]       = useState(1);
  const [affArea,  setAffArea]        = useState('');
  const [affPct,   setAffPct]         = useState('');
  const [notes,    setNotes]          = useState('');
  const [gpsLat,   setGpsLat]         = useState('');
  const [gpsLng,   setGpsLng]         = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity]       = useState('');
  const [windSpeed, setWindSpeed]     = useState('');
  const [weather,  setWeather]        = useState('');
  const [gpsLoading, setGpsLoading]   = useState(false);

  const resetForm = () => {
    setStep(1); setSelFarmer(null); setSelFarm(''); setCommodity('');
    setVariety(''); setGrowthStage('vegetative'); setHealthStat('healthy');
    setIssues([]); setSeverity(1); setAffArea(''); setAffPct('');
    setNotes(''); setGpsLat(''); setGpsLng('');
    setTemperature(''); setHumidity(''); setWindSpeed(''); setWeather('');
  };

  const toggleIssue = (key: ObservedIssue) =>
    setIssues((prev) => prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]);

  const mockCapture = () => {
    setGpsLoading(true);
    setTimeout(() => {
      setGpsLat('14.5995');
      setGpsLng('120.9842');
      setGpsLoading(false);
    }, 1200);
  };

  const filtered = MOCK_ENTRIES.filter(
    (e) =>
      e.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.farmName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const counts = {
    total:   MOCK_ENTRIES.length,
    healthy: MOCK_ENTRIES.filter((e) => e.monitoringStatus === 'healthy').length,
    atRisk:  MOCK_ENTRIES.filter((e) => e.monitoringStatus === 'at_risk').length,
    damaged: MOCK_ENTRIES.filter((e) => e.monitoringStatus === 'damaged').length,
  };

  const canAdvance = () => {
    if (step === 1) return selFarmer !== null && selFarm !== '';
    if (step === 2) return commodity.trim() !== '';
    return true;
  };

  /* ─── RENDER ─── */
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: bg }}>
        <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
          <TouchableOpacity onPress={openSidebar} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Crop Monitoring</Text>
            <Text style={styles.headerSub}>Field condition tracking</Text>
          </View>
          <TouchableOpacity onPress={() => { resetForm(); setShowForm(true); }} style={styles.newBtn}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.newBtnText}>New Entry</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={[styles.searchWrap, { backgroundColor: card, borderBottomColor: border }]}>
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A2E1A' : '#F0FDF4', borderColor: border }]}>
            <Search size={17} color="#6B7280" />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search farmer, farm, or commodity…"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={15} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── Summary stats ── */}
          <View style={styles.statsRow}>
            <StatCard label="Total"   value={counts.total}   bg="#F0FDF4" text="#14532D" bdColor="#DCFCE7" />
            <StatCard label="Healthy" value={counts.healthy} bg="#DCFCE7" text="#15803D" bdColor="#BBF7D0" />
            <StatCard label="At Risk" value={counts.atRisk}  bg="#FEF3C7" text="#B45309" bdColor="#FDE68A" />
            <StatCard label="Damaged" value={counts.damaged} bg="#FEE2E2" text="#B91C1C" bdColor="#FECACA" />
          </View>

          {/* ── Records ── */}
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Monitoring Records</Text>
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
                  {/* Status dot + date */}
                  <View style={styles.entryTopRow}>
                    <View style={[styles.statusDot, { backgroundColor: sCfg.dot }]} />
                    <Text style={[styles.entryDate, { color: textMuted }]}>{entry.date}</Text>
                    <View style={{ flex: 1 }} />
                    <View style={[styles.entryStatusPill, { backgroundColor: eCfg.bg }]}>
                      <Text style={[styles.entryStatusText, { color: eCfg.text }]}>{eCfg.label}</Text>
                    </View>
                  </View>

                  {/* Farmer + farm */}
                  <Text style={[styles.entryFarmer, { color: textPrimary }]}>{entry.farmerName}</Text>
                  <Text style={[styles.entryFarm, { color: '#16A34A' }]}>{entry.farmName} · {entry.parcel}</Text>

                  {/* Commodity row */}
                  <View style={styles.entryCommodityRow}>
                    <View style={styles.commodityChip}>
                      <Leaf size={12} color="#16A34A" />
                      <Text style={styles.commodityText}>{entry.commodity} — {entry.variety}</Text>
                    </View>
                    <View style={[styles.healthChip, { backgroundColor: sCfg.bg }]}>
                      <Text style={[styles.healthChipText, { color: sCfg.text }]}>{sCfg.label}</Text>
                    </View>
                  </View>

                  {/* Weather row */}
                  <View style={styles.entryWeatherRow}>
                    <WeatherPill icon={<Thermometer size={11} color="#EF4444" />} value={`${entry.temperature}°C`} />
                    <WeatherPill icon={<Droplets size={11} color="#0891B2" />} value={`${entry.humidity}%`} />
                    <WeatherPill icon={<Wind size={11} color="#6B7280" />} value={`${entry.windSpeed} km/h`} />
                    <WeatherPill icon={<Cloud size={11} color="#6B7280" />} value={entry.weather} />
                  </View>

                  {/* GPS */}
                  <View style={styles.entryGpsRow}>
                    <MapPin size={11} color="#6B7280" />
                    <Text style={[styles.entryGps, { color: textMuted }]}>{entry.gpsLat}, {entry.gpsLng}</Text>
                    <ChevronRight size={14} color={textMuted} style={{ marginLeft: 'auto' }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ═══════════════════════════════════════════════════════
            NEW ENTRY FORM MODAL (4 steps)
            ═══════════════════════════════════════════════════════ */}
        <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
          <View style={[styles.formContainer, { backgroundColor: bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />

            {/* Form header */}
            <View style={[styles.formHeader, { backgroundColor: headerBg, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>New Monitoring Entry</Text>
                <Text style={styles.headerSub}>Step {step} of 4</Text>
              </View>
            </View>

            {/* Step progress bar */}
            <View style={[styles.stepBarWrap, { backgroundColor: card, borderBottomColor: border }]}>
              {[1, 2, 3, 4].map((s) => (
                <View key={s} style={[styles.stepSegment, { backgroundColor: s <= step ? '#16A34A' : (isDark ? '#1F3A28' : '#E5E7EB') }]} />
              ))}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* ── Step 1: Farmer & Farm ── */}
                {step === 1 && (
                  <View>
                    <FormSection title="Select Farmer" icon={<Leaf size={16} color="#16A34A" />} color="#DCFCE7">
                      {FARMERS_LIST.map((f) => (
                        <TouchableOpacity
                          key={f.id}
                          style={[styles.selectItem, { backgroundColor: card, borderColor: selFarmer?.id === f.id ? '#16A34A' : border, borderWidth: selFarmer?.id === f.id ? 2 : 1 }]}
                          onPress={() => { setSelFarmer(f); setSelFarm(''); setCommodity(''); }}
                        >
                          <View style={[styles.farmerDot, { backgroundColor: selFarmer?.id === f.id ? '#16A34A' : border }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.selectItemLabel, { color: textPrimary }]}>{f.name}</Text>
                            <Text style={[styles.selectItemSub, { color: '#16A34A' }]}>{f.lfid}</Text>
                          </View>
                          {selFarmer?.id === f.id && <CheckCircle2 size={18} color="#16A34A" />}
                        </TouchableOpacity>
                      ))}
                    </FormSection>

                    {selFarmer && (
                      <FormSection title="Select Farm / Parcel" icon={<MapPin size={16} color="#2563EB" />} color="#EFF6FF">
                        {selFarmer.farms.map((farm) => (
                          <TouchableOpacity
                            key={farm}
                            style={[styles.selectItem, { backgroundColor: card, borderColor: selFarm === farm ? '#2563EB' : border, borderWidth: selFarm === farm ? 2 : 1 }]}
                            onPress={() => setSelFarm(farm)}
                          >
                            <View style={[styles.farmerDot, { backgroundColor: selFarm === farm ? '#2563EB' : border }]} />
                            <Text style={[styles.selectItemLabel, { flex: 1, color: textPrimary }]}>{farm}</Text>
                            {selFarm === farm && <CheckCircle2 size={18} color="#2563EB" />}
                          </TouchableOpacity>
                        ))}
                      </FormSection>
                    )}
                  </View>
                )}

                {/* ── Step 2: Crop Information ── */}
                {step === 2 && (
                  <View>
                    <FormSection title="Crop Details" icon={<Leaf size={16} color="#16A34A" />} color="#DCFCE7">
                      <FormInput label="Commodity *" placeholder="e.g. Rice, Corn, Vegetables" value={commodity} onChangeText={setCommodity} card={card} border={border} textPrimary={textPrimary} />
                      <FormInput label="Variety" placeholder="e.g. IR64, DK818 (optional)" value={variety} onChangeText={setVariety} card={card} border={border} textPrimary={textPrimary} />
                    </FormSection>

                    <FormSection title="Growth Stage" icon={<Leaf size={16} color="#9333EA" />} color="#F5F3FF">
                      <View style={styles.toggleRow}>
                        {GROWTH_STAGES.map((gs) => (
                          <TouchableOpacity
                            key={gs.key}
                            style={[styles.toggleChip, { backgroundColor: growthStage === gs.key ? '#16A34A' : (isDark ? '#1A2E1A' : '#F0FDF4'), borderColor: growthStage === gs.key ? '#16A34A' : border }]}
                            onPress={() => setGrowthStage(gs.key)}
                          >
                            <Text style={[styles.toggleChipText, { color: growthStage === gs.key ? '#FFFFFF' : textMuted }]}>{gs.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </FormSection>
                  </View>
                )}

                {/* ── Step 3: Crop Condition ── */}
                {step === 3 && (
                  <View>
                    <FormSection title="Health Status" icon={<AlertTriangle size={16} color="#F59E0B" />} color="#FFFBEB">
                      <View style={styles.toggleRow}>
                        {HEALTH_OPTIONS.map((ho) => (
                          <TouchableOpacity
                            key={ho.key}
                            style={[styles.toggleChip, { backgroundColor: healthStat === ho.key ? ho.color : (isDark ? '#1A2E1A' : '#F9FAFB'), borderColor: healthStat === ho.key ? ho.color : border }]}
                            onPress={() => setHealthStat(ho.key)}
                          >
                            <Text style={[styles.toggleChipText, { color: healthStat === ho.key ? '#FFFFFF' : textMuted }]}>{ho.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </FormSection>

                    <FormSection title="Observed Issues (select all that apply)" icon={<Eye size={16} color="#EF4444" />} color="#FEF2F2">
                      <View style={styles.toggleRow}>
                        {ISSUE_OPTIONS.map((io) => (
                          <TouchableOpacity
                            key={io.key}
                            style={[styles.toggleChip, { backgroundColor: issues.includes(io.key) ? '#EF4444' : (isDark ? '#1A2E1A' : '#F9FAFB'), borderColor: issues.includes(io.key) ? '#EF4444' : border }]}
                            onPress={() => toggleIssue(io.key)}
                          >
                            <Text style={[styles.toggleChipText, { color: issues.includes(io.key) ? '#FFFFFF' : textMuted }]}>{io.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </FormSection>

                    <FormSection title="Severity & Affected Area" icon={<AlertTriangle size={16} color="#F59E0B" />} color="#FFFBEB">
                      {/* Severity picker 1-5 */}
                      <Text style={[styles.fieldLabel, { color: textMuted }]}>Severity Level</Text>
                      <View style={styles.severityRow}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <TouchableOpacity
                            key={n}
                            style={[styles.severityBtn, { backgroundColor: severity >= n ? '#F59E0B' : (isDark ? '#1A2E1A' : '#F9FAFB'), borderColor: severity >= n ? '#F59E0B' : border }]}
                            onPress={() => setSeverity(n)}
                          >
                            <Text style={[styles.severityBtnText, { color: severity >= n ? '#FFFFFF' : textMuted }]}>{n}</Text>
                          </TouchableOpacity>
                        ))}
                        <Text style={[styles.severityDesc, { color: textMuted }]}>
                          {severity <= 1 ? 'Minimal' : severity <= 2 ? 'Low' : severity <= 3 ? 'Moderate' : severity <= 4 ? 'High' : 'Severe'}
                        </Text>
                      </View>

                      <FormInput label="Affected Area (hectares)" placeholder="e.g. 0.5" value={affArea} onChangeText={setAffArea} card={card} border={border} textPrimary={textPrimary} keyboardType="numeric" />
                      <FormInput label="Affected Percentage (%)" placeholder="e.g. 30" value={affPct} onChangeText={setAffPct} card={card} border={border} textPrimary={textPrimary} keyboardType="numeric" />
                    </FormSection>
                  </View>
                )}

                {/* ── Step 4: Evidence & Observations ── */}
                {step === 4 && (
                  <View>
                    {/* GPS */}
                    <FormSection title="GPS Location" icon={<MapPin size={16} color="#2563EB" />} color="#EFF6FF">
                      <View style={styles.gpsCapRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.gpsCoord, { color: gpsLat ? '#16A34A' : textMuted }]}>
                            {gpsLat ? `${gpsLat}° N,  ${gpsLng}° E` : 'GPS not captured yet'}
                          </Text>
                        </View>
                        <TouchableOpacity style={[styles.gpsBtn, { opacity: gpsLoading ? 0.6 : 1 }]} onPress={mockCapture} disabled={gpsLoading}>
                          <MapPin size={14} color="#FFFFFF" />
                          <Text style={styles.gpsBtnText}>{gpsLoading ? 'Capturing…' : 'Capture GPS'}</Text>
                        </TouchableOpacity>
                      </View>
                    </FormSection>

                    {/* Weather */}
                    <FormSection title="Weather Conditions" icon={<Cloud size={16} color="#0891B2" />} color="#ECFEFF">
                      <View style={styles.weatherGrid}>
                        <WeatherInput icon={<Thermometer size={15} color="#EF4444" />} label="Temp (°C)" value={temperature} onChangeText={setTemperature} card={card} border={border} textPrimary={textPrimary} />
                        <WeatherInput icon={<Droplets size={15} color="#0891B2" />} label="Humidity (%)" value={humidity} onChangeText={setHumidity} card={card} border={border} textPrimary={textPrimary} />
                        <WeatherInput icon={<Wind size={15} color="#6B7280" />} label="Wind (km/h)" value={windSpeed} onChangeText={setWindSpeed} card={card} border={border} textPrimary={textPrimary} />
                        <WeatherInput icon={<Cloud size={15} color="#6B7280" />} label="Condition" value={weather} onChangeText={setWeather} card={card} border={border} textPrimary={textPrimary} placeholder="e.g. Sunny" />
                      </View>
                    </FormSection>

                    {/* Photos placeholder */}
                    <FormSection title="Photo Evidence" icon={<Camera size={16} color="#8B5CF6" />} color="#F5F3FF">
                      <TouchableOpacity style={styles.photoPlaceholder}>
                        <Camera size={28} color="#8B5CF6" />
                        <Text style={[styles.photoPlaceholderText, { color: textMuted }]}>Tap to attach photos</Text>
                        <Text style={[styles.photoPlaceholderSub, { color: textMuted }]}>Max 5 photos per entry</Text>
                      </TouchableOpacity>
                    </FormSection>

                    {/* Notes */}
                    <FormSection title="Field Notes" icon={<Eye size={16} color="#6B7280" />} color="#F8FAFC">
                      <TextInput
                        style={[styles.notesInput, { backgroundColor: card, borderColor: border, color: textPrimary }]}
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
            <View style={[styles.formFooter, { backgroundColor: card, borderTopColor: border, paddingBottom: insets.bottom || 16 }]}>
              {step > 1 && (
                <TouchableOpacity style={[styles.footerBtn, styles.footerBtnBack, { borderColor: border }]} onPress={() => setStep((s) => s - 1)}>
                  <Text style={[styles.footerBtnBackText, { color: textPrimary }]}>Back</Text>
                </TouchableOpacity>
              )}
              {step < 4 ? (
                <TouchableOpacity
                  style={[styles.footerBtn, styles.footerBtnNext, { opacity: canAdvance() ? 1 : 0.45 }]}
                  onPress={() => { if (canAdvance()) setStep((s) => s + 1); }}
                  disabled={!canAdvance()}
                >
                  <Text style={styles.footerBtnNextText}>Continue</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.footerBtn, styles.footerBtnNext]}
                  onPress={() => { setShowForm(false); resetForm(); }}
                >
                  <Text style={styles.footerBtnNextText}>Submit Entry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* ═══════════════════════════════════════════
            ENTRY DETAIL MODAL
            ═══════════════════════════════════════════ */}
        <Modal visible={viewEntry !== null} animationType="slide" onRequestClose={() => setViewEntry(null)}>
          {viewEntry && (
            <View style={[styles.formContainer, { backgroundColor: bg }]}>
              <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />
              <View style={[styles.formHeader, { backgroundColor: headerBg, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
                <TouchableOpacity onPress={() => setViewEntry(null)} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>Monitoring Record</Text>
                  <Text style={styles.headerSub}>{viewEntry.date}</Text>
                </View>
                <View style={[styles.entryStatusPill, { backgroundColor: STATUS_CFG[viewEntry.monitoringStatus].bg, marginRight: 0 }]}>
                  <Text style={[styles.entryStatusText, { color: STATUS_CFG[viewEntry.monitoringStatus].text }]}>
                    {STATUS_CFG[viewEntry.monitoringStatus].label}
                  </Text>
                </View>
              </View>
              <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
                <DetailSection title="Farmer & Location">
                  <DetailRow label="Farmer"  value={viewEntry.farmerName} />
                  <DetailRow label="Farm"    value={viewEntry.farmName}   />
                  <DetailRow label="Parcel"  value={viewEntry.parcel}     />
                  <DetailRow label="GPS"     value={`${viewEntry.gpsLat}° N, ${viewEntry.gpsLng}° E`} />
                </DetailSection>
                <DetailSection title="Crop Information">
                  <DetailRow label="Commodity"    value={viewEntry.commodity}   />
                  <DetailRow label="Variety"      value={viewEntry.variety}     />
                  <DetailRow label="Growth Stage" value={viewEntry.growthStage.charAt(0).toUpperCase() + viewEntry.growthStage.slice(1)} />
                </DetailSection>
                <DetailSection title="Condition Assessment">
                  <DetailRow label="Health"       value={viewEntry.healthStatus.charAt(0).toUpperCase() + viewEntry.healthStatus.slice(1)} />
                  <DetailRow label="Issues"       value={viewEntry.issues.length > 0 ? viewEntry.issues.join(', ') : 'None'} />
                  <DetailRow label="Severity"     value={`${viewEntry.severity} / 5`} />
                  <DetailRow label="Affected Area" value={`${viewEntry.affectedArea} ha (${viewEntry.affectedPct}%)`} />
                </DetailSection>
                <DetailSection title="Weather Conditions">
                  <DetailRow label="Temperature" value={`${viewEntry.temperature}°C`} />
                  <DetailRow label="Humidity"    value={`${viewEntry.humidity}%`}     />
                  <DetailRow label="Wind Speed"  value={`${viewEntry.windSpeed} km/h`} />
                  <DetailRow label="Condition"   value={viewEntry.weather}            />
                </DetailSection>
                {viewEntry.notes !== '' && (
                  <DetailSection title="Field Notes">
                    <Text style={[styles.notesBody, { color: textPrimary }]}>{viewEntry.notes}</Text>
                  </DetailSection>
                )}
              </ScrollView>
            </View>
          )}
        </Modal>
      </View>
    </>
  );
}

/* ─── Sub-components ─── */
function StatCard({ label, value, bg, text, bdColor }: { label: string; value: number; bg: string; text: string; bdColor: string }) {
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
function FormSection({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
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
function FormInput({ label, placeholder, value, onChangeText, card, border, textPrimary, keyboardType, multiline }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { backgroundColor: card, borderColor: border, color: textPrimary }]}
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
function WeatherInput({ icon, label, value, onChangeText, card, border, textPrimary, placeholder }: any) {
  return (
    <View style={styles.weatherInputWrap}>
      <View style={styles.weatherInputLabel}>
        {icon}
        <Text style={styles.weatherInputLabelText}>{label}</Text>
      </View>
      <TextInput
        style={[styles.weatherInputField, { backgroundColor: card, borderColor: border, color: textPrimary }]}
        placeholder={placeholder || '—'}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType="default"
      />
    </View>
  );
}
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, gap: 12,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  searchWrap: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  scroll: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },

  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },

  entryCard: {
    borderRadius: 20, borderWidth: 1, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  entryTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  entryDate: { fontSize: 11 },
  entryStatusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  entryStatusText: { fontSize: 11, fontWeight: '700' },
  entryFarmer: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  entryFarm: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  entryCommodityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  commodityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  commodityText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
  healthChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  healthChipText: { fontSize: 11, fontWeight: '700' },
  entryWeatherRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F1F5F9', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  weatherPillText: { fontSize: 11, color: '#475569' },
  entryGpsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  entryGps: { fontSize: 11 },

  /* Form */
  formContainer: { flex: 1 },
  formHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  stepBarWrap: { flexDirection: 'row', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  stepSegment: { flex: 1, height: 4, borderRadius: 2 },
  formScroll: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 32 },

  formSection: { borderRadius: 18, marginBottom: 14, overflow: 'hidden' },
  formSectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  formSectionTitle: { fontSize: 13, fontWeight: '700', color: '#14532D' },
  formSectionBody: { paddingHorizontal: 14, paddingBottom: 14 },

  selectItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12, marginBottom: 8 },
  farmerDot:  { width: 10, height: 10, borderRadius: 5 },
  selectItemLabel: { fontSize: 14, fontWeight: '600' },
  selectItemSub:   { fontSize: 12, marginTop: 1 },

  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleChip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  toggleChipText: { fontSize: 13, fontWeight: '600' },

  severityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  severityBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  severityBtnText: { fontSize: 14, fontWeight: '700' },
  severityDesc: { fontSize: 12, marginLeft: 4 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  fieldInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },

  gpsCapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gpsCoord: { fontSize: 13, fontWeight: '600' },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  gpsBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  weatherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  weatherInputWrap: { width: '47%' },
  weatherInputLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  weatherInputLabelText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  weatherInputField: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },

  photoPlaceholder: { borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#C4B5FD', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 6 },
  photoPlaceholderText: { fontSize: 14, fontWeight: '600' },
  photoPlaceholderSub: { fontSize: 11 },

  notesInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 100 },
  notesBody: { fontSize: 14, lineHeight: 22 },

  formFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  footerBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  footerBtnBack: { borderWidth: 1 },
  footerBtnBackText: { fontSize: 15, fontWeight: '600' },
  footerBtnNext: { backgroundColor: '#16A34A' },
  footerBtnNextText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  /* Detail view */
  detailSection: { marginBottom: 14 },
  detailSectionTitle: { fontSize: 13, fontWeight: '700', color: '#16A34A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailBody: { backgroundColor: '#F0FDF4', borderRadius: 16, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  detailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#14532D', flex: 1, textAlign: 'right' },
});
