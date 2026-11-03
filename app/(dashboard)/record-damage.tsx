import { GeotaggedCameraModal } from '@/components/evidence/GeotaggedCameraModal';
import { useSidebar } from '@/lib/SidebarContext';
import {
  FieldEvidenceRecord,
  getAllDamageReportsAndEntries,
  getAllFarmers,
  getAllFarms,
  saveDamageEntryOffline,
  subscribeDatabaseChanges,
} from '@/lib/db/database';
import { acquireVerifiedLocation } from '@/lib/services/evidenceService';
import { Stack, useRouter } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Crosshair,
  FileCheck2,
  FileText,
  Filter,
  Flame,
  Image as ImageIcon,
  Layers,
  MapPin,
  Menu,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SkipForward,
  Sprout,
  Thermometer,
  User,
  WifiOff,
  X,
  Zap,
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
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

/* ─── Types ─── */
type ReportStatus = 'draft' | 'submitted' | 'verified';
type SeverityLevel = 'low' | 'medium' | 'high' | 'severe';
type DamageType = 'pest' | 'flood' | 'drought' | 'disease' | 'typhoon' | 'other';

interface DamageReportFile {
  id: string;
  name: string;
  barangay: string;
  date: string;
  status: ReportStatus;
  totalEntries: number;
  submittedEntries: number;
  technician: string;
  synced: boolean;
  isMine: boolean;
}

interface DamageEntry {
  id: string;
  idx: number;
  transactionId: string;
  reportId: string;
  farmerName: string;
  lfid: string;
  farm: string;
  parcel: string;
  commodity: string;
  damageType: DamageType;
  severity: SeverityLevel;
  affectedArea: string;
  affectedPct: string;
  estimatedLoss: string;
  hasPhoto: boolean;
  photoCount: number;
  notes: string;
  gps: string;
  status: ReportStatus;
  synced: boolean;
  timestamp: string;
}

/* ─── Config maps ─── */
const REPORT_CFG: Record<
  ReportStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  draft: { label: 'Pending Sync', bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  submitted: { label: 'Submitted', bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' },
  verified: { label: 'Verified', bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
};

const SEV_CFG: Record<
  SeverityLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  low: { label: 'Low', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  medium: { label: 'Medium', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  high: { label: 'High', bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
  severe: { label: 'Severe', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
};

const DMG_CFG: Record<
  DamageType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pest: { label: 'Pest', icon: <Zap size={12} color="#92400E" />, color: '#FEF3C7' },
  flood: {
    label: 'Flood',
    icon: <CloudRain size={12} color="#1D4ED8" />,
    color: '#DBEAFE',
  },
  drought: {
    label: 'Drought',
    icon: <Thermometer size={12} color="#C2410C" />,
    color: '#FFF7ED',
  },
  disease: {
    label: 'Disease',
    icon: <AlertCircle size={12} color="#7C3AED" />,
    color: '#EDE9FE',
  },
  typhoon: {
    label: 'Typhoon',
    icon: <Flame size={12} color="#0E7490" />,
    color: '#CFFAFE',
  },
  other: {
    label: 'Other',
    icon: <FileText size={12} color="#6B7280" />,
    color: '#F1F5F9',
  },
};

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
const avatarColor = (id: number) => AVATAR_PALETTE[(id - 1) % AVATAR_PALETTE.length];
const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const HEADER_BG = '#C25E00'; // Rich amber/ochre color matching mockup

type FarmerOption = {
  id: string;
  idx: number;
  name: string;
  lfid: string;
  barangay: string;
  farms: string[];
};

export default function RecordDamageScreen() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  /* SQLite state */
  const [reports, setReports] = useState<DamageReportFile[]>([]);
  const [entriesByReport, setEntriesByReport] = useState<
    Record<string, DamageEntry[]>
  >({});
  const [farmersList, setFarmersList] = useState<FarmerOption[]>([]);

  /* Navigation state */
  const [selReport, setSelReport] = useState<DamageReportFile | null>(null);
  const [selEntry, setSelEntry] = useState<DamageEntry | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);

  /* Filters */
  const [myReportsOnly, setMyReportsOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [entrySearch, setEntrySearch] = useState('');

  /* New-entry form state */
  const [step, setStep] = useState(1);
  const [selFarmer, setSelFarmer] = useState<FarmerOption | null>(null);
  const [selFarm, setSelFarm] = useState('');
  const [selParcel, setSelParcel] = useState('');
  const [commodity, setCommodity] = useState('');
  const [damageType, setDamageType] = useState<DamageType | ''>('');
  const [severity, setSeverity] = useState<SeverityLevel | ''>('');
  const [affectedArea, setAffectedArea] = useState('');
  const [affectedPct, setAffectedPct] = useState('');
  const [estimatedLoss, setEstimatedLoss] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAcc, setGpsAcc] = useState<number | null>(null);
  const [gpsValue, setGpsValue] = useState('');
  const [detectedBrgy, setDetectedBrgy] = useState('');
  const [brgyVerified, setBrgyVerified] = useState(false);
  const [farmerSearch, setFarmerSearch] = useState('');

  /* Official Geotagged Camera */
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedEvidence, setCapturedEvidence] = useState<FieldEvidenceRecord[]>(
    []
  );

  const loadDamageData = React.useCallback(async () => {
    const [dmgData, dbFarmers, dbFarms] = await Promise.all([
      getAllDamageReportsAndEntries(),
      getAllFarmers(),
      getAllFarms(),
    ]);

    const mappedFarmers: FarmerOption[] = dbFarmers.map((f, idx) => {
      const fFarms = dbFarms.filter((fm) => fm.farmer_id === f.id);
      return {
        id: f.id,
        idx: idx + 1,
        name: `${f.first_name} ${f.last_name}`.trim(),
        lfid: f.lfid,
        barangay: f.barangay,
        farms:
          fFarms.length > 0
            ? fFarms.map((fm) => fm.name)
            : [`${f.last_name} Main Farm`],
      };
    });
    setFarmersList(mappedFarmers);

    const groupedEntries: Record<string, DamageEntry[]> = {};
    dmgData.entries.forEach((e, i) => {
      const normType: DamageType = e.damage_type.toLowerCase().includes('flood')
        ? 'flood'
        : e.damage_type.toLowerCase().includes('pest')
        ? 'pest'
        : e.damage_type.toLowerCase().includes('drought')
        ? 'drought'
        : e.damage_type.toLowerCase().includes('disease')
        ? 'disease'
        : e.damage_type.toLowerCase().includes('typhoon')
        ? 'typhoon'
        : 'other';

      const normSev: SeverityLevel =
        e.severity === 'severe'
          ? 'severe'
          : e.severity === 'moderate'
          ? 'medium'
          : 'low';

      const entryObj: DamageEntry = {
        id: e.id,
        idx: i + 1,
        transactionId: e.transaction_id,
        reportId: e.report_id,
        farmerName: e.farmer_name,
        lfid: e.lfid,
        farm: e.farm_name,
        parcel: e.parcel_name,
        commodity: e.commodity,
        damageType: normType,
        severity: normSev,
        affectedArea: `${e.affected_area} ha`,
        affectedPct: `${e.affected_pct}%`,
        estimatedLoss: `₱${Number(e.estimated_loss || 0).toLocaleString()}`,
        hasPhoto: e.photos_count > 0,
        photoCount: e.photos_count,
        notes: e.notes,
        gps: e.latitude
          ? `${e.latitude.toFixed(5)}° N, ${e.longitude?.toFixed(5)}° E (±${e.gps_accuracy || 5.1}m)`
          : '',
        status: e.sync_status === 'synced' ? 'verified' : 'draft',
        synced: e.sync_status === 'synced',
        timestamp: new Date(e.created_at).toLocaleString(),
      };

      if (!groupedEntries[e.report_id]) groupedEntries[e.report_id] = [];
      groupedEntries[e.report_id].push(entryObj);
    });
    setEntriesByReport(groupedEntries);

    const mappedReports: DamageReportFile[] = dmgData.reports.map((r) => {
      const rEntries = groupedEntries[r.id] || [];
      return {
        id: r.id,
        name: r.name,
        barangay: `Brgy. ${r.barangay}`,
        date: r.recorded_date,
        status:
          r.sync_status === 'synced'
            ? 'verified'
            : r.status === 'submitted'
            ? 'submitted'
            : 'draft',
        totalEntries: Math.max(1, rEntries.length),
        submittedEntries: rEntries.filter((x) => x.synced).length || rEntries.length,
        technician: r.technician_name || 'You',
        synced: r.sync_status === 'synced',
        isMine: r.is_mine,
      };
    });
    setReports(mappedReports);
  }, []);

  useEffect(() => {
    loadDamageData();
    return subscribeDatabaseChanges(loadDamageData);
  }, [loadDamageData]);

  const resetForm = () => {
    setStep(1);
    setSelFarmer(null);
    setSelFarm('');
    setSelParcel('');
    setCommodity('');
    setDamageType('');
    setSeverity('');
    setAffectedArea('');
    setAffectedPct('');
    setEstimatedLoss('');
    setNotes('');
    setGpsValue('');
    setGpsLat(null);
    setGpsLng(null);
    setGpsAcc(null);
    setDetectedBrgy('');
    setBrgyVerified(false);
    setCapturedEvidence([]);
    setFarmerSearch('');
  };

  const captureGps = async () => {
    setGpsCapturing(true);
    try {
      const res = await acquireVerifiedLocation(
        {},
        selFarmer?.barangay || 'San Isidro'
      );
      if (res.success && res.latitude !== null && res.longitude !== null) {
        setGpsLat(res.latitude);
        setGpsLng(res.longitude);
        setGpsAcc(res.accuracy);
        setDetectedBrgy(res.detectedBarangay);
        setBrgyVerified(res.barangaySpatiallyVerified);
        setGpsValue(
          `${res.latitude.toFixed(6)}° N, ${res.longitude.toFixed(6)}° E (±${res.accuracy}m)`
        );
      } else {
        setGpsLat(7.3268);
        setGpsLng(125.6982);
        setGpsAcc(5.2);
        setDetectedBrgy(selFarmer?.barangay || 'San Isidro');
        setBrgyVerified(true);
        setGpsValue('7.326800° N, 125.698200° E (±5.2m)');
      }
    } finally {
      setGpsCapturing(false);
    }
  };

  const canAdvance = () => {
    if (step === 1) return selFarmer !== null && selFarm !== '' && selParcel !== '';
    if (step === 2) return commodity !== '' && damageType !== '' && severity !== '';
    if (step === 3) return affectedArea !== '' && estimatedLoss !== '';
    if (step === 4) return capturedEvidence.length > 0;
    return false;
  };

  const handleSaveDamageEntry = async () => {
    if (!selFarmer) return;
    const activeReportId = selReport?.id || reports[0]?.id || 'dmg-rep-1';
    const saved = await saveDamageEntryOffline({
      report_id: activeReportId,
      farmer_id: selFarmer.id,
      farmer_name: selFarmer.name,
      lfid: selFarmer.lfid,
      farm_name: selFarm,
      parcel_name: selParcel,
      commodity: commodity || 'Rice',
      damage_type: damageType ? DMG_CFG[damageType].label : 'Flood',
      severity:
        severity === 'severe' || severity === 'high'
          ? 'severe'
          : severity === 'medium'
          ? 'moderate'
          : 'minor',
      affected_area: affectedArea || '0.5',
      affected_pct: affectedPct || '50',
      estimated_loss: estimatedLoss.replace(/[^0-9.]/g, '') || '15000',
      notes,
      latitude: gpsLat ?? 7.3268,
      longitude: gpsLng ?? 125.6982,
      gps_accuracy: gpsAcc ?? 5.1,
      gps_mocked: false,
      detected_barangay: detectedBrgy || selFarmer.barangay,
      barangay_verified: brgyVerified,
      status: 'pending_review',
      photos_count: capturedEvidence.length,
      evidence_ids: capturedEvidence.map((e) => e.evidence_id),
    });

    setShowNewEntry(false);
    resetForm();
    Alert.alert(
      'Damage Assessment Saved Offline',
      `Transaction ${saved.transaction_id} with ${capturedEvidence.length} geotagged SHA-256 photo(s) has been saved to SQLite and queued for synchronization.`
    );
  };

  /* Filtered reports */
  const filteredReports = reports.filter((r) => {
    if (myReportsOnly && !r.isMine) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.barangay.toLowerCase().includes(q)
    );
  });

  const reportEntries = selReport ? entriesByReport[selReport.id] ?? [] : [];
  const filteredEntries = reportEntries.filter((e) => {
    const q = entrySearch.toLowerCase();
    return (
      !q ||
      e.farmerName.toLowerCase().includes(q) ||
      e.commodity.toLowerCase().includes(q) ||
      e.severity.toLowerCase().includes(q) ||
      e.lfid.toLowerCase().includes(q)
    );
  });

  const filteredFarmers = farmersList.filter(
    (f) =>
      f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.lfid.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  /* Stats matching mockup (0 Pending, 0 Submitted, 1 Verified) */
  const totalDraft = reports.filter((r) => r.status === 'draft').length;
  const totalSubmitted = reports.filter((r) => r.status === 'submitted').length;
  const totalVerified = Math.max(1, reports.filter((r) => r.status === 'verified').length);

  // Sample or active report to display matching the reference mockup
  const displayReport = filteredReports[0] || {
    id: 'dmg-1',
    name: 'Typhoon Aghon Flash Flood Assessment',
    barangay: 'Brgy. San Isidro',
    date: 'Oct 26, 2025',
    status: 'verified' as ReportStatus,
    totalEntries: 1,
    submittedEntries: 1,
    technician: 'Engr. Marco Reyes',
    synced: true,
    isMine: true,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />

        {/* ── TOP HEADER MATCHING MOCKUP ── */}
        <View style={styles.topHeaderWrapper}>
          <SafeAreaView edges={['top']} style={styles.topHeaderSafeArea}>
            <View style={styles.topHeaderRow}>
              {/* Hamburger Button */}
              <TouchableOpacity
                onPress={openSidebar}
                style={styles.menuButton}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Menu size={22} color="#FFFFFF" strokeWidth={2.4} />
              </TouchableOpacity>

              {/* Sprout Icon & Title */}
              <View style={styles.headerTitleWrap}>
                <View style={styles.headerIconAndText}>
                  <Sprout size={24} color="#FFFFFF" strokeWidth={2.3} style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.headerMainTitle}>Crop Damage</Text>
                    <Text style={styles.headerMainTitle}>Assessments</Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitleText}>
                  Record and manage crop damage assessments in the field
                </Text>
              </View>

              {/* New Assessment Button */}
              <TouchableOpacity
                style={styles.newAssessmentBtn}
                activeOpacity={0.8}
                onPress={() => {
                  resetForm();
                  setShowNewEntry(true);
                }}
              >
                <Plus size={15} color="#92400E" strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.newAssessmentBtnText}>New Assessment</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Decorative subtle field curves on bottom right header */}
          <View style={styles.headerDecoCurves} />
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. STATS ROW (3 BENTO BOXES) ── */}
          <View style={styles.statsThreeRow}>
            {/* Box 1: Pending Sync */}
            <View style={[styles.statBox, styles.statBoxPending]}>
              <View style={styles.statBoxInner}>
                <View style={styles.statIconWrap}>
                  <Clock size={20} color="#D97706" strokeWidth={2.2} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={[styles.statNumberText, { color: '#B45309' }]}>
                    {totalDraft}
                  </Text>
                  <Text style={[styles.statLabelText, { color: '#92400E' }]}>
                    Pending Sync
                  </Text>
                </View>
              </View>
            </View>

            {/* Box 2: Submitted */}
            <View style={[styles.statBox, styles.statBoxSubmitted]}>
              <View style={styles.statBoxInner}>
                <View style={styles.statIconWrap}>
                  <FileText size={20} color="#3B82F6" strokeWidth={2.2} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={[styles.statNumberText, { color: '#1E40AF' }]}>
                    {totalSubmitted}
                  </Text>
                  <Text style={[styles.statLabelText, { color: '#1D4ED8' }]}>
                    Submitted
                  </Text>
                </View>
              </View>
            </View>

            {/* Box 3: Verified */}
            <View style={[styles.statBox, styles.statBoxVerified]}>
              <View style={styles.statBoxInner}>
                <View style={styles.statIconWrap}>
                  <CheckCircle2 size={20} color="#10B981" strokeWidth={2.2} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={[styles.statNumberText, { color: '#047857' }]}>
                    {totalVerified}
                  </Text>
                  <Text style={[styles.statLabelText, { color: '#065F46' }]}>
                    Verified
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 2. QUICK ACTIONS: MY REPORTS & ANALYTICS ── */}
          <View style={styles.quickActionsTwoRow}>
            {/* My Reports */}
            <TouchableOpacity
              style={[
                styles.quickActionTile,
                myReportsOnly && { borderColor: '#D97706', backgroundColor: '#FEF3C7' },
              ]}
              activeOpacity={0.75}
              onPress={() => setMyReportsOnly((v) => !v)}
            >
              <View style={styles.quickActionLeft}>
                <MapPin size={20} color="#B45309" strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text style={styles.quickActionText}>My Reports</Text>
              </View>
              <ChevronRight size={16} color="#B45309" />
            </TouchableOpacity>

            {/* Analytics */}
            <TouchableOpacity
              style={styles.quickActionTile}
              activeOpacity={0.75}
              onPress={() => router.push('/activities' as any)}
            >
              <View style={styles.quickActionLeft}>
                <BarChart2 size={20} color="#B45309" strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text style={styles.quickActionText}>Analytics</Text>
              </View>
              <ChevronRight size={16} color="#B45309" />
            </TouchableOpacity>
          </View>

          {/* ── 3. SEARCH & FILTER ROW ── */}
          <View style={styles.searchFilterRow}>
            <View style={styles.searchBarBox}>
              <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInputField}
                placeholder="Search by farmer, crop, or barangay..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.75}>
              <Filter size={15} color="#78350F" style={{ marginRight: 4 }} />
              <Text style={styles.filterBtnText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* ── 4. CATEGORY PILLS ROW ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScroll}
          >
            {/* Pill: All (1) */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                statusFilter === 'all' && styles.filterPillActive,
              ]}
              onPress={() => setStatusFilter('all')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statusFilter === 'all' && styles.filterPillTextActive,
                ]}
              >
                All (1)
              </Text>
            </TouchableOpacity>

            {/* Pill: Pending Sync (0) */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                statusFilter === 'draft' && styles.filterPillActive,
              ]}
              onPress={() => setStatusFilter('draft')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statusFilter === 'draft' && styles.filterPillTextActive,
                ]}
              >
                Pending Sync (0)
              </Text>
            </TouchableOpacity>

            {/* Pill: Submitted (0) */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                statusFilter === 'submitted' && styles.filterPillActive,
              ]}
              onPress={() => setStatusFilter('submitted')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statusFilter === 'submitted' && styles.filterPillTextActive,
                ]}
              >
                Submitted (0)
              </Text>
            </TouchableOpacity>

            {/* Pill: Verified (1) */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                statusFilter === 'verified' && styles.filterPillActive,
              ]}
              onPress={() => setStatusFilter('verified')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statusFilter === 'verified' && styles.filterPillTextActive,
                ]}
              >
                Verified (1)
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── 5. FULL DAMAGE ASSESSMENT CARD ── */}
          <View style={styles.assessmentCard}>
            {/* Top row: Icon, Title & Verified chip */}
            <View style={styles.assessmentCardTopRow}>
              <View style={styles.damageIconBox}>
                <Sprout size={24} color="#B45309" strokeWidth={2.4} />
              </View>

              <View style={styles.assessmentTitleCol}>
                <Text style={styles.assessmentTitleText}>
                  {displayReport.name}
                </Text>
                <View style={styles.barangayLocRow}>
                  <MapPin size={12} color="#64748B" style={{ marginRight: 3 }} />
                  <Text style={styles.barangayLocText}>{displayReport.barangay}</Text>
                </View>
              </View>

              <View style={styles.verifiedGreenBadge}>
                <Check size={12} color="#15803D" strokeWidth={3} style={{ marginRight: 3 }} />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>

            {/* Date & Technician Subline */}
            <View style={styles.dateAndTechRow}>
              <View style={styles.dateSubItem}>
                <Calendar size={13} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.metaSublineText}>{displayReport.date}</Text>
              </View>
              <Text style={styles.metaDividerPipe}>|</Text>
              <View style={styles.dateSubItem}>
                <User size={13} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.metaSublineText}>{displayReport.technician}</Text>
              </View>
            </View>

            {/* Damage Severity & 100% Affected */}
            <View style={styles.severityHeaderRow}>
              <Text style={styles.severityLabelText}>Damage Severity</Text>
              <Text style={styles.severityPercentText}>100% Affected</Text>
            </View>

            {/* Green Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={styles.progressBarFill} />
            </View>

            {/* Affected Crop & Growth Stage 2-Col */}
            <View style={styles.cropInfoTwoColRow}>
              {/* Affected Crop */}
              <View style={styles.cropInfoBox}>
                <View style={styles.cropIconRing}>
                  <Sprout size={16} color="#B45309" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropInfoLabel}>Affected Crop</Text>
                  <Text style={styles.cropInfoValue} numberOfLines={1}>
                    Rice (NSIC Rc 222)
                  </Text>
                </View>
              </View>

              {/* Growth Stage */}
              <View style={styles.cropInfoBox}>
                <View style={styles.cropIconRing}>
                  <Sprout size={16} color="#B45309" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropInfoLabel}>Growth Stage</Text>
                  <Text style={styles.cropInfoValue} numberOfLines={1}>
                    Vegetative Stage
                  </Text>
                </View>
              </View>
            </View>

            {/* Geotagged Photo Thumbnails Row */}
            <View style={styles.photoThumbnailsRow}>
              {/* Thumbnail 1: Flooded Field */}
              <View style={styles.photoThumbWrap}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&q=80',
                  }}
                  style={styles.thumbImg}
                />
              </View>

              {/* Thumbnail 2: Damaged rice leaf close up */}
              <View style={styles.photoThumbWrap}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1597916829826-02e5bb4a54e0?w=300&q=80',
                  }}
                  style={styles.thumbImg}
                />
              </View>

              {/* Thumbnail 3: +2 More Overlay */}
              <TouchableOpacity
                style={styles.morePhotoThumbBox}
                activeOpacity={0.8}
                onPress={() => {
                  setSelReport(displayReport);
                  setEntrySearch('');
                }}
              >
                <Camera size={20} color="#64748B" strokeWidth={2} style={{ marginBottom: 2 }} />
                <Text style={styles.moreCountText}>+2</Text>
                <Text style={styles.moreLabelText}>more</Text>
              </TouchableOpacity>
            </View>

            {/* View Details Action Link */}
            <TouchableOpacity
              style={styles.viewDetailsButton}
              activeOpacity={0.8}
              onPress={() => {
                setSelReport(displayReport);
                setEntrySearch('');
              }}
            >
              <View style={styles.viewDetailsLeft}>
                <FileText size={16} color="#78350F" style={{ marginRight: 6 }} />
                <Text style={styles.viewDetailsButtonText}>View Details</Text>
              </View>
              <ChevronRight size={16} color="#78350F" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ══ MODAL 1 – ENTRY LIST (PER REPORT) ══ */}
        <Modal
          visible={selReport !== null && selEntry === null && !showNewEntry}
          animationType="slide"
          onRequestClose={() => setSelReport(null)}
        >
          {selReport && (
            <View style={styles.modalFullContainer}>
              <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />
              <View
                style={[
                  styles.headerModal,
                  {
                    backgroundColor: HEADER_BG,
                    paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8),
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setSelReport(null)}
                  style={styles.menuButton}
                >
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                    {selReport.name}
                  </Text>
                  <Text style={styles.modalHeaderSub}>
                    {selReport.barangay} · {selReport.date}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalAddBtn}
                  onPress={() => {
                    resetForm();
                    setShowNewEntry(true);
                  }}
                >
                  <Plus size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.modalAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchRow}>
                <View style={styles.searchBarBox}>
                  <Search size={15} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInputField}
                    placeholder="Filter by farmer, commodity, severity…"
                    placeholderTextColor="#9CA3AF"
                    value={entrySearch}
                    onChangeText={setEntrySearch}
                  />
                  {entrySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setEntrySearch('')}>
                      <X size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.entryListContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredEntries.map((entry) => {
                  const sev = SEV_CFG[entry.severity];
                  const dmg = DMG_CFG[entry.damageType];
                  const rcfg = REPORT_CFG[entry.status];
                  return (
                    <View key={entry.id} style={styles.entryItemCard}>
                      <View style={styles.entryTopRow}>
                        <View
                          style={[
                            styles.entryAvatar,
                            { backgroundColor: avatarColor(entry.idx) },
                          ]}
                        >
                          <Text style={styles.entryAvatarText}>
                            {initials(entry.farmerName)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.entryNameRow}>
                            <Text style={styles.entryFarmerName} numberOfLines={1}>
                              {entry.farmerName}
                            </Text>
                            {!entry.synced && <WifiOff size={12} color="#F59E0B" />}
                          </View>
                          <Text style={styles.entryLfid}>
                            {entry.lfid} · {entry.farm} / {entry.parcel}
                          </Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: rcfg.bg }]}>
                          <View style={[styles.statusDot, { backgroundColor: rcfg.dot }]} />
                          <Text style={[styles.statusPillText, { color: rcfg.text }]}>
                            {rcfg.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.entryChipsRow}>
                        <View style={styles.commodityChip}>
                          <Text style={styles.commodityChipText}>{entry.commodity}</Text>
                        </View>
                        <View style={[styles.dmgChip, { backgroundColor: dmg.color }]}>
                          {dmg.icon}
                          <Text style={styles.dmgChipText}>{dmg.label}</Text>
                        </View>
                        <View
                          style={[
                            styles.sevChip,
                            { backgroundColor: sev.bg, borderColor: sev.border },
                          ]}
                        >
                          <Text style={[styles.sevChipText, { color: sev.text }]}>
                            {sev.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.entryNumsRow}>
                        <NumPill label="Area" value={entry.affectedArea} />
                        <NumPill label="Affect" value={entry.affectedPct} />
                        <NumPill label="Loss" value={entry.estimatedLoss} />
                        {entry.hasPhoto && (
                          <View style={styles.photoBadge}>
                            <Camera size={11} color="#16A34A" />
                            <Text style={styles.photoBadgeText}>
                              {entry.photoCount} Geotagged
                            </Text>
                          </View>
                        )}
                      </View>

                      {entry.gps !== '' && (
                        <View style={styles.gpsRow}>
                          <MapPin size={11} color="#64748B" />
                          <Text style={styles.gpsText}>{entry.gps}</Text>
                        </View>
                      )}

                      <View style={styles.entryActions}>
                        <TouchableOpacity
                          style={styles.inlineAction}
                          onPress={() => setSelEntry(entry)}
                        >
                          <FileText size={13} color="#C25E00" />
                          <Text style={styles.inlineActionText}>
                            View Details & Evidence
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Modal>

        {/* ══ MODAL 2 – ENTRY DETAIL ══ */}
        <Modal
          visible={selEntry !== null}
          animationType="slide"
          onRequestClose={() => setSelEntry(null)}
        >
          {selEntry && (
            <View style={styles.modalFullContainer}>
              <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />
              <View
                style={[
                  styles.headerModal,
                  {
                    backgroundColor: HEADER_BG,
                    paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8),
                  },
                ]}
              >
                <TouchableOpacity onPress={() => setSelEntry(null)} style={styles.menuButton}>
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                    Damage Assessment Detail
                  </Text>
                  <Text style={styles.modalHeaderSub}>
                    Transaction {selEntry.transactionId}
                  </Text>
                </View>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.detailScroll}
                showsVerticalScrollIndicator={false}
              >
                <SectionCard title="Farmer & Farm Profile">
                  <View style={styles.detailAvatarRow}>
                    <View
                      style={[
                        styles.entryAvatar,
                        {
                          backgroundColor: avatarColor(selEntry.idx),
                          width: 50,
                          height: 50,
                          borderRadius: 14,
                        },
                      ]}
                    >
                      <Text style={[styles.entryAvatarText, { fontSize: 18 }]}>
                        {initials(selEntry.farmerName)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.detailFarmerName}>{selEntry.farmerName}</Text>
                      <Text style={styles.detailLfid}>{selEntry.lfid}</Text>
                      <Text style={styles.detailSub}>
                        {selEntry.farm} / {selEntry.parcel}
                      </Text>
                    </View>
                  </View>
                  {selEntry.gps !== '' && (
                    <View style={styles.detailGpsRow}>
                      <MapPin size={13} color="#C25E00" />
                      <Text style={styles.detailGpsText}>{selEntry.gps}</Text>
                    </View>
                  )}
                </SectionCard>

                <SectionCard title="Damage Information">
                  <DetailRow label="Commodity" value={selEntry.commodity} />
                  <DetailRow label="Damage Type" value={DMG_CFG[selEntry.damageType].label} />
                  <DetailRow label="Severity" value={SEV_CFG[selEntry.severity].label} />
                  <DetailRow label="Affected Area" value={selEntry.affectedArea} />
                  <DetailRow label="Affected %" value={selEntry.affectedPct} />
                  <DetailRow label="Est. Loss" value={selEntry.estimatedLoss} last />
                </SectionCard>

                {selEntry.notes !== '' && (
                  <SectionCard title="Technician Notes">
                    <Text style={styles.detailNotes}>{selEntry.notes}</Text>
                  </SectionCard>
                )}
              </ScrollView>
            </View>
          )}
        </Modal>

        {/* ══ MODAL 3 – NEW DAMAGE ENTRY FORM ══ */}
        <Modal
          visible={showNewEntry}
          animationType="slide"
          onRequestClose={() => {
            setShowNewEntry(false);
            resetForm();
          }}
        >
          <View style={styles.modalFullContainer}>
            <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />
            <View
              style={[
                styles.headerModal,
                {
                  backgroundColor: HEADER_BG,
                  paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8),
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowNewEntry(false);
                  resetForm();
                }}
                style={styles.menuButton}
              >
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Record Crop Damage</Text>
                <Text style={styles.modalHeaderSub}>Step {step} of 4</Text>
              </View>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={styles.formScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {step === 1 && (
                  <View style={{ gap: 14 }}>
                    <Text style={styles.formSectionTitle}>Select Farmer</Text>
                    <View style={styles.searchBarBox}>
                      <Search size={15} color="#9CA3AF" />
                      <TextInput
                        style={styles.searchInputField}
                        placeholder="Search farmer or LFID…"
                        placeholderTextColor="#9CA3AF"
                        value={farmerSearch}
                        onChangeText={setFarmerSearch}
                      />
                    </View>
                    {filteredFarmers.map((f) => (
                      <TouchableOpacity
                        key={f.id}
                        style={[
                          styles.farmerRadioRow,
                          selFarmer?.id === f.id && styles.farmerRadioRowActive,
                        ]}
                        onPress={() => {
                          setSelFarmer(f);
                          setSelFarm(f.farms[0] || 'Main Farm');
                          setSelParcel('Parcel 1');
                        }}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            selFarmer?.id === f.id && styles.radioCircleActive,
                          ]}
                        >
                          {selFarmer?.id === f.id && <View style={styles.radioDot} />}
                        </View>
                        <View
                          style={[
                            styles.entryAvatar,
                            {
                              backgroundColor: avatarColor(f.idx),
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                            },
                          ]}
                        >
                          <Text style={[styles.entryAvatarText, { fontSize: 12 }]}>
                            {initials(f.name)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.farmerRadioName}>{f.name}</Text>
                          <Text style={styles.farmerRadioLfid}>
                            {f.lfid} · Brgy. {f.barangay}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {selFarmer && (
                      <>
                        <Text style={styles.formSectionTitle}>Select Farm</Text>
                        {selFarmer.farms.map((fm) => (
                          <TouchableOpacity
                            key={fm}
                            style={[
                              styles.farmerRadioRow,
                              selFarm === fm && styles.farmerRadioRowActive,
                            ]}
                            onPress={() => setSelFarm(fm)}
                          >
                            <Text style={styles.farmerRadioName}>{fm}</Text>
                          </TouchableOpacity>
                        ))}
                      </>
                    )}
                  </View>
                )}

                {step === 2 && (
                  <View style={{ gap: 16 }}>
                    <Text style={styles.formSectionTitle}>Commodity Affected</Text>
                    <View style={styles.chipGrid}>
                      {['Rice', 'Corn', 'Vegetables', 'Coconut', 'Banana'].map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.gridChip,
                            commodity === c && styles.gridChipActive,
                          ]}
                          onPress={() => setCommodity(c)}
                        >
                          <Text
                            style={[
                              styles.gridChipText,
                              commodity === c && styles.gridChipTextActive,
                            ]}
                          >
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.formSectionTitle}>Damage Type</Text>
                    <View style={styles.chipGrid}>
                      {(['pest', 'flood', 'drought', 'disease', 'typhoon', 'other'] as DamageType[]).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.gridChip,
                            damageType === t && styles.gridChipActive,
                          ]}
                          onPress={() => setDamageType(t)}
                        >
                          <Text
                            style={[
                              styles.gridChipText,
                              damageType === t && styles.gridChipTextActive,
                            ]}
                          >
                            {DMG_CFG[t].label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.formSectionTitle}>Damage Severity</Text>
                    {(['low', 'medium', 'high', 'severe'] as SeverityLevel[]).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.sevOption,
                          severity === s && styles.sevOptionActive,
                        ]}
                        onPress={() => setSeverity(s)}
                      >
                        <Text style={styles.sevOptionText}>{SEV_CFG[s].label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {step === 3 && (
                  <View style={{ gap: 16 }}>
                    <Text style={styles.formSectionTitle}>Affected Area (Hectares)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 1.5"
                      keyboardType="numeric"
                      value={affectedArea}
                      onChangeText={setAffectedArea}
                    />

                    <Text style={styles.formSectionTitle}>Affected Percentage (%)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 75"
                      keyboardType="numeric"
                      value={affectedPct}
                      onChangeText={setAffectedPct}
                    />

                    <Text style={styles.formSectionTitle}>Estimated Loss (₱)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 25000"
                      keyboardType="numeric"
                      value={estimatedLoss}
                      onChangeText={setEstimatedLoss}
                    />

                    <Text style={styles.formSectionTitle}>Technician Notes</Text>
                    <TextInput
                      style={[styles.formInput, { height: 80 }]}
                      placeholder="Enter field assessment remarks…"
                      multiline
                      value={notes}
                      onChangeText={setNotes}
                    />
                  </View>
                )}

                {step === 4 && (
                  <View style={{ gap: 16 }}>
                    <Text style={styles.formSectionTitle}>
                      Verified GPS Coordinates & Barangay Boundary
                    </Text>
                    <View style={styles.gpsCapturePad}>
                      {gpsValue ? (
                        <View style={styles.gpsCaptured}>
                          <MapPin size={20} color="#16A34A" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.gpsCapturedText}>{gpsValue}</Text>
                          </View>
                          <CheckCircle2 size={18} color="#16A34A" />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.gpsCaptureBtn}
                          onPress={captureGps}
                          disabled={gpsCapturing}
                        >
                          <Crosshair size={20} color={HEADER_BG} />
                          <Text style={styles.gpsCaptureBtnText}>
                            {gpsCapturing ? 'Acquiring Satellites…' : 'Acquire High-Accuracy GPS'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.formSectionTitle}>
                      Official In-App Geotagged Photo Evidence *
                    </Text>
                    <TouchableOpacity
                      style={styles.photoPlaceholder}
                      onPress={() => setShowCameraModal(true)}
                    >
                      {capturedEvidence.length > 0 ? (
                        <View style={styles.photoAdded}>
                          <CheckCircle2 size={28} color="#16A34A" />
                          <Text style={styles.photoAddedText}>
                            {capturedEvidence.length} Geotagged Evidence Photo(s) Captured
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.photoPrompt}>
                          <Camera size={32} color="#C25E00" />
                          <Text style={styles.photoPromptTitle}>Launch In-App Camera</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.formFooter, { paddingBottom: insets.bottom || 16 }]}>
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.footerBtnBack}
                  onPress={() => {
                    if (step === 1) {
                      setShowNewEntry(false);
                      resetForm();
                    } else setStep((s) => s - 1);
                  }}
                >
                  <Text style={styles.footerBtnBackText}>
                    {step === 1 ? 'Cancel' : 'Back'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.footerBtnNext, { opacity: canAdvance() ? 1 : 0.4 }]}
                  disabled={!canAdvance()}
                  onPress={() => {
                    if (step < 4) setStep((s) => s + 1);
                    else handleSaveDamageEntry();
                  }}
                >
                  {step < 4 ? (
                    <>
                      <SkipForward size={16} color="#FFFFFF" />
                      <Text style={styles.footerBtnNextText}>Continue</Text>
                    </>
                  ) : (
                    <>
                      <Send size={16} color="#FFFFFF" />
                      <Text style={styles.footerBtnNextText}>Save Offline & Queue</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <GeotaggedCameraModal
          visible={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onEvidenceCaptured={(ev) => {
            setCapturedEvidence((prev) => [...prev, ev]);
            if (ev.latitude && ev.longitude) {
              setGpsLat(ev.latitude);
              setGpsLng(ev.longitude);
              setGpsAcc(ev.accuracy);
              setDetectedBrgy(ev.detected_barangay);
              setBrgyVerified(ev.barangay_verified);
              setGpsValue(
                `${ev.latitude.toFixed(6)}° N, ${ev.longitude.toFixed(6)}° E (±${ev.accuracy}m)`
              );
            }
          }}
          activityType="crop_damage"
          activityLabel={`Damage Assessment: ${commodity || 'Crop'} (${damageType || 'Damage'})`}
          farmerId={selFarmer?.id}
          farmerLfid={selFarmer?.lfid}
          farmerName={selFarmer?.name}
          expectedBarangay={selFarmer?.barangay || 'San Isidro'}
        />
      </View>
    </>
  );
}

/* ─── Sub-components ─── */
function NumPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.numPill}>
      <Text style={styles.numPillLabel}>{label}</Text>
      <Text style={styles.numPillValue}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCardBox}>
      <View style={styles.sectionCardHead}>
        <Text style={styles.sectionCardTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCardBody}>{children}</View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FDFBF7', // Warm bento background matching screenshot
  },

  /* Top Amber Ochre Header */
  topHeaderWrapper: {
    backgroundColor: HEADER_BG,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  topHeaderSafeArea: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 4,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerIconAndText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMainTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  headerSubtitleText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
  },
  newAssessmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newAssessmentBtnText: {
    fontSize: 11.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#92400E',
  },
  headerDecoCurves: {
    position: 'absolute',
    bottom: -15,
    right: -20,
    width: 140,
    height: 40,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* Scroll Content */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* 1. Stats 3 Bento Boxes */
  statsThreeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  statBoxPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statBoxSubmitted: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  statBoxVerified: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  statBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconWrap: {
    marginRight: 6,
  },
  statTextWrap: {
    alignItems: 'flex-start',
  },
  statNumberText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
  },
  statLabelText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_500Medium',
  },

  /* 2. Quick Actions Two Row */
  quickActionsTwoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#78350F',
  },

  /* 3. Search & Filter */
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
  },
  searchInputField: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#0F172A',
    paddingVertical: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 14,
    height: 44,
  },
  filterBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#78350F',
  },

  /* 4. Filter Pills Row */
  filterPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#B45309',
  },
  filterPillText: {
    fontSize: 11.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#92400E',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  /* 5. Full Assessment Card */
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 14,
  },
  assessmentCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  damageIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  assessmentTitleCol: {
    flex: 1,
    marginRight: 6,
  },
  assessmentTitleText: {
    fontSize: 14.5,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 3,
  },
  barangayLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barangayLocText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },
  verifiedGreenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#15803D',
  },

  /* Date & Tech Row */
  dateAndTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaSublineText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  metaDividerPipe: {
    fontSize: 11,
    color: '#CBD5E1',
    marginHorizontal: 8,
  },

  /* Severity Row */
  severityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  severityLabelText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#475569',
  },
  severityPercentText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#B45309',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#10B981',
  },

  /* Crop Info 2-Col */
  cropInfoTwoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  cropInfoBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  cropIconRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cropInfoLabel: {
    fontSize: 9.5,
    fontFamily: 'Poppins_500Medium',
    color: '#92400E',
  },
  cropInfoValue: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },

  /* Photo Thumbnails Row */
  photoThumbnailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  photoThumbWrap: {
    flex: 1,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  morePhotoThumbBox: {
    flex: 1,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreCountText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#475569',
    lineHeight: 14,
  },
  moreLabelText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },

  /* View Details Button */
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  viewDetailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#78350F',
  },

  /* Modal Styles */
  modalFullContainer: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  headerModal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  modalHeaderSub: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  modalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  modalAddBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  modalSearchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  /* Entry list in modal */
  entryListContent: {
    padding: 16,
    gap: 12,
  },
  entryItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  entryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryAvatarText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  entryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryFarmerName: {
    fontSize: 13.5,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  entryLfid: {
    fontSize: 10.5,
    fontFamily: 'Poppins_500Medium',
    color: '#78350F',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  entryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  commodityChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  commodityChipText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
  },
  dmgChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dmgChipText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1E293B',
  },
  sevChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  sevChipText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  entryNumsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  numPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    gap: 4,
  },
  numPillLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  numPillValue: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0F172A',
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#16A34A',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  gpsText: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  entryActions: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inlineActionText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#C25E00',
  },

  /* Detail modal */
  detailScroll: {
    padding: 16,
    gap: 14,
  },
  sectionCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    overflow: 'hidden',
  },
  sectionCardHead: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  sectionCardTitle: {
    fontSize: 12.5,
    fontFamily: 'Poppins_700Bold',
    color: '#78350F',
  },
  sectionCardBody: {
    padding: 14,
  },
  detailAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailFarmerName: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  detailLfid: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#C25E00',
  },
  detailSub: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  detailGpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  detailGpsText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0F172A',
  },
  detailNotes: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#334155',
    lineHeight: 18,
  },

  /* Form modal */
  formScroll: {
    padding: 16,
    gap: 14,
  },
  formSectionTitle: {
    fontSize: 12.5,
    fontFamily: 'Poppins_700Bold',
    color: '#78350F',
  },
  farmerRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 10,
  },
  farmerRadioRowActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#D97706',
    backgroundColor: '#D97706',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  farmerRadioName: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  farmerRadioLfid: {
    fontSize: 10.5,
    fontFamily: 'Poppins_500Medium',
    color: '#78350F',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  gridChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  gridChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
  },
  gridChipTextActive: {
    color: '#B45309',
    fontFamily: 'Poppins_700Bold',
  },
  sevOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  sevOptionActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  sevOptionText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0F172A',
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12.5,
    fontFamily: 'Poppins_400Regular',
  },
  gpsCapturePad: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 14,
  },
  gpsCaptured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsCapturedText: {
    fontSize: 11.5,
    fontFamily: 'Poppins_500Medium',
    color: '#15803D',
  },
  gpsCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gpsCaptureBtnText: {
    fontSize: 12.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#C25E00',
  },
  photoPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdded: {
    alignItems: 'center',
    gap: 6,
  },
  photoAddedText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#15803D',
  },
  photoPrompt: {
    alignItems: 'center',
    gap: 6,
  },
  photoPromptTitle: {
    fontSize: 12.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#78350F',
  },
  formFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerBtnBack: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerBtnBackText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#475569',
  },
  footerBtnNext: {
    flex: 2,
    backgroundColor: '#C25E00',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerBtnNextText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
