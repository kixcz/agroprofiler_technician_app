import { useSidebar } from '@/lib/SidebarContext';
import { Stack } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Crosshair,
  FileText,
  Filter,
  Flame,
  MapPin,
  Menu,
  Search,
  Send,
  SkipForward,
  Thermometer,
  User,
  WifiOff,
  X,
  Zap,
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
type ReportStatus  = 'draft' | 'submitted' | 'verified';
type SeverityLevel = 'low' | 'medium' | 'high' | 'severe';
type DamageType    = 'pest' | 'flood' | 'drought' | 'disease' | 'typhoon' | 'other';

interface DamageReportFile {
  id: number; name: string; barangay: string; date: string;
  status: ReportStatus; totalEntries: number; submittedEntries: number;
  technician: string; synced: boolean; isMine: boolean;
}
interface DamageEntry {
  id: number; farmerName: string; lfid: string; farm: string; parcel: string;
  commodity: string; damageType: DamageType; severity: SeverityLevel;
  affectedArea: string; affectedPct: string; estimatedLoss: string;
  hasPhoto: boolean; photoCount: number; notes: string;
  gps: string; status: ReportStatus; synced: boolean; timestamp: string;
}

/* ─── Config maps ─── */
const REPORT_CFG: Record<ReportStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft:     { label: 'Draft',     bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  submitted: { label: 'Submitted', bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  verified:  { label: 'Verified',  bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
};
const SEV_CFG: Record<SeverityLevel, { label: string; bg: string; text: string; border: string }> = {
  low:    { label: 'Low',    bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  medium: { label: 'Medium', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  high:   { label: 'High',   bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
  severe: { label: 'Severe', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
};
const DMG_CFG: Record<DamageType, { label: string; icon: React.ReactNode; color: string }> = {
  pest:    { label: 'Pest',     icon: <Zap size={12} color="#92400E" />,     color: '#FEF3C7' },
  flood:   { label: 'Flood',    icon: <CloudRain size={12} color="#1D4ED8" />, color: '#DBEAFE' },
  drought: { label: 'Drought',  icon: <Thermometer size={12} color="#C2410C" />, color: '#FFF7ED' },
  disease: { label: 'Disease',  icon: <AlertCircle size={12} color="#7C3AED" />, color: '#EDE9FE' },
  typhoon: { label: 'Typhoon',  icon: <Flame size={12} color="#0E7490" />,    color: '#CFFAFE' },
  other:   { label: 'Other',    icon: <FileText size={12} color="#6B7280" />,  color: '#F1F5F9' },
};
const AVATAR_PALETTE = ['#16A34A','#2563EB','#9333EA','#F59E0B','#EF4444','#0891B2','#DB2777','#EA580C'];
const avatarColor = (id: number) => AVATAR_PALETTE[(id - 1) % AVATAR_PALETTE.length];
const initials    = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const HEADER_BG = '#B45309';

/* ─── Mock data ─── */
const MOCK_REPORTS: DamageReportFile[] = [
  { id: 1, name: 'Flood Damage Report – Apr 2026', barangay: 'Brgy. Aplaya',      date: 'Apr 12, 2026', status: 'submitted', totalEntries: 8,  submittedEntries: 8,  technician: 'You', synced: true,  isMine: true  },
  { id: 2, name: 'Pest Infestation Report – Q1',   barangay: 'Brgy. San Isidro',  date: 'Mar 28, 2026', status: 'verified',  totalEntries: 12, submittedEntries: 12, technician: 'You', synced: true,  isMine: true  },
  { id: 3, name: 'Drought Survey – Barangay Visit', barangay: 'Brgy. Maligaya',   date: 'Apr 5, 2026',  status: 'draft',     totalEntries: 5,  submittedEntries: 2,  technician: 'You', synced: false, isMine: true  },
  { id: 4, name: 'Disease Monitoring – Mar 2026',  barangay: 'Brgy. Masagana',    date: 'Mar 15, 2026', status: 'verified',  totalEntries: 6,  submittedEntries: 6,  technician: 'R. Cruz', synced: true, isMine: false },
];
const MOCK_ENTRIES: Record<number, DamageEntry[]> = {
  1: [
    { id: 1, farmerName: 'Juan Dela Cruz',   lfid: 'LFID-001', farm: 'Dela Cruz Farm', parcel: 'Parcel A', commodity: 'Rice',       damageType: 'flood',   severity: 'high',   affectedArea: '1.5 ha', affectedPct: '70%', estimatedLoss: '₱42,000', hasPhoto: true,  photoCount: 3, notes: 'Riverbank overflow. Crop submerged for 48hrs.', gps: '14.0783° N, 121.4853° E', status: 'submitted', synced: true,  timestamp: 'Apr 12, 9:15 AM' },
    { id: 2, farmerName: 'Maria Santos',     lfid: 'LFID-002', farm: 'Santos Farm',    parcel: 'Parcel B', commodity: 'Corn',       damageType: 'flood',   severity: 'medium', affectedArea: '0.8 ha', affectedPct: '45%', estimatedLoss: '₱18,500', hasPhoto: true,  photoCount: 2, notes: 'Partial damage. Crop recovery possible.',     gps: '14.0801° N, 121.4870° E', status: 'submitted', synced: true,  timestamp: 'Apr 12, 10:00 AM' },
    { id: 3, farmerName: 'Pedro Reyes',      lfid: 'LFID-003', farm: 'Reyes Farm',     parcel: 'Parcel A', commodity: 'Vegetables', damageType: 'flood',   severity: 'severe', affectedArea: '0.3 ha', affectedPct: '90%', estimatedLoss: '₱25,200', hasPhoto: true,  photoCount: 4, notes: 'Total loss. No recovery possible.',           gps: '14.0756° N, 121.4831° E', status: 'submitted', synced: true,  timestamp: 'Apr 12, 10:45 AM' },
  ],
  2: [
    { id: 1, farmerName: 'Lourdes Bautista', lfid: 'LFID-006', farm: 'Bautista Farm',  parcel: 'Lot 3',    commodity: 'Rice',       damageType: 'pest',    severity: 'medium', affectedArea: '2.0 ha', affectedPct: '35%', estimatedLoss: '₱22,000', hasPhoto: true,  photoCount: 2, notes: 'Brown planthopper infestation.',              gps: '14.0915° N, 121.4780° E', status: 'verified',  synced: true,  timestamp: 'Mar 28, 8:30 AM' },
    { id: 2, farmerName: 'Rolando Villanueva', lfid: 'LFID-007', farm: 'V Farm', parcel: 'Parcel C', commodity: 'Rice', damageType: 'pest', severity: 'low', affectedArea: '0.5 ha', affectedPct: '15%', estimatedLoss: '₱8,000', hasPhoto: false, photoCount: 0, notes: '', gps: '14.0920° N, 121.4795° E', status: 'verified', synced: true, timestamp: 'Mar 28, 9:00 AM' },
  ],
  3: [
    { id: 1, farmerName: 'Elena Reyes',  lfid: 'LFID-008', farm: 'Reyes Highland',  parcel: 'Parcel 1', commodity: 'Corn',  damageType: 'drought', severity: 'high',   affectedArea: '1.2 ha', affectedPct: '60%', estimatedLoss: '₱30,000', hasPhoto: true,  photoCount: 1, notes: 'Stunted growth. Soil cracking visible.', gps: '14.1001° N, 121.4700° E', status: 'submitted', synced: false, timestamp: 'Apr 5, 2:15 PM' },
    { id: 2, farmerName: 'Bong Perez',   lfid: 'LFID-009', farm: 'Perez Farm',      parcel: 'Parcel A', commodity: 'Rice',  damageType: 'drought', severity: 'medium', affectedArea: '0.7 ha', affectedPct: '40%', estimatedLoss: '₱16,000', hasPhoto: false, photoCount: 0, notes: '', gps: '', status: 'draft', synced: false, timestamp: 'Apr 5, 3:00 PM' },
    { id: 3, farmerName: 'Rosa Cruz',    lfid: 'LFID-010', farm: 'Cruz Farm',        parcel: 'Lot 2',    commodity: 'Vegetables', damageType: 'drought', severity: 'low', affectedArea: '0.2 ha', affectedPct: '20%', estimatedLoss: '₱5,000', hasPhoto: false, photoCount: 0, notes: '', gps: '', status: 'draft', synced: false, timestamp: 'Apr 5, 3:45 PM' },
  ],
  4: [
    { id: 1, farmerName: 'Noel Santos',  lfid: 'LFID-011', farm: 'Santos Ranch', parcel: 'Parcel A', commodity: 'Rice', damageType: 'disease', severity: 'medium', affectedArea: '1.0 ha', affectedPct: '30%', estimatedLoss: '₱20,000', hasPhoto: true, photoCount: 2, notes: 'Blast disease confirmed.', gps: '14.0633° N, 121.4920° E', status: 'verified', synced: true, timestamp: 'Mar 15, 10:00 AM' },
  ],
};

const DAMAGE_TYPES_LIST: DamageType[]    = ['pest', 'flood', 'drought', 'disease', 'typhoon', 'other'];
const SEVERITY_LIST: SeverityLevel[]     = ['low', 'medium', 'high', 'severe'];
const COMMODITIES = ['Rice', 'Corn', 'Vegetables', 'Coconut', 'Banana', 'Sugarcane'];
const FARMERS_LIST = [
  { id: 1, name: 'Juan Dela Cruz',   lfid: 'LFID-001', farms: ['Dela Cruz Farm'] },
  { id: 2, name: 'Maria Santos',     lfid: 'LFID-002', farms: ['Santos Farm'] },
  { id: 3, name: 'Pedro Reyes',      lfid: 'LFID-003', farms: ['Reyes Farm'] },
  { id: 4, name: 'Ana Garcia',       lfid: 'LFID-004', farms: ['Garcia Farm'] },
  { id: 5, name: 'Carlos Mendoza',   lfid: 'LFID-005', farms: ['Mendoza Farm'] },
];

/* ═══════════════════════════════════════════════════════ */
export default function RecordDamageScreen() {
  const { openSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg          = isDark ? '#1C0A00' : '#FFFBEB';
  const card        = isDark ? '#2D1600' : '#FFFFFF';
  const border      = isDark ? '#4A2500' : '#FDE68A';
  const textPrimary = isDark ? '#FEF3C7' : '#78350F';
  const textMuted   = isDark ? '#D97706' : '#92400E';

  /* Navigation state */
  const [selReport, setSelReport]   = useState<DamageReportFile | null>(null);
  const [selEntry,  setSelEntry]    = useState<DamageEntry | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);

  /* Filters */
  const [myReportsOnly, setMyReportsOnly] = useState(false);
  const [statusFilter,  setStatusFilter]  = useState<'all' | ReportStatus>('all');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [entrySearch,   setEntrySearch]   = useState('');

  /* New-entry form state */
  const [step,          setStep]          = useState(1);
  const [selFarmer,     setSelFarmer]     = useState<typeof FARMERS_LIST[0] | null>(null);
  const [selFarm,       setSelFarm]       = useState('');
  const [selParcel,     setSelParcel]     = useState('');
  const [commodity,     setCommodity]     = useState('');
  const [damageType,    setDamageType]    = useState<DamageType | ''>('');
  const [severity,      setSeverity]      = useState<SeverityLevel | ''>('');
  const [affectedArea,  setAffectedArea]  = useState('');
  const [affectedPct,   setAffectedPct]   = useState('');
  const [estimatedLoss, setEstimatedLoss] = useState('');
  const [notes,         setNotes]         = useState('');
  const [gpsCapturing,  setGpsCapturing]  = useState(false);
  const [gpsValue,      setGpsValue]      = useState('');
  const [photoAdded,    setPhotoAdded]    = useState(false);
  const [farmerSearch,  setFarmerSearch]  = useState('');

  const resetForm = () => {
    setStep(1); setSelFarmer(null); setSelFarm(''); setSelParcel('');
    setCommodity(''); setDamageType(''); setSeverity('');
    setAffectedArea(''); setAffectedPct(''); setEstimatedLoss('');
    setNotes(''); setGpsValue(''); setPhotoAdded(false); setFarmerSearch('');
  };

  const captureGps = () => {
    setGpsCapturing(true);
    setTimeout(() => { setGpsValue('14.0783° N, 121.4853° E'); setGpsCapturing(false); }, 1400);
  };

  const canAdvance = () => {
    if (step === 1) return selFarmer !== null && selFarm !== '' && selParcel !== '';
    if (step === 2) return commodity !== '' && damageType !== '' && severity !== '';
    if (step === 3) return affectedArea !== '' && estimatedLoss !== '';
    if (step === 4) return photoAdded;
    return false;
  };

  /* Filtered reports */
  const filteredReports = MOCK_REPORTS.filter((r) => {
    if (myReportsOnly && !r.isMine) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.barangay.toLowerCase().includes(q);
  });

  /* Per-report entries */
  const reportEntries = selReport ? (MOCK_ENTRIES[selReport.id] ?? []) : [];
  const filteredEntries = reportEntries.filter((e) => {
    const q = entrySearch.toLowerCase();
    return !q || e.farmerName.toLowerCase().includes(q) || e.commodity.toLowerCase().includes(q) ||
           e.severity.toLowerCase().includes(q) || e.lfid.toLowerCase().includes(q);
  });

  const filteredFarmers = FARMERS_LIST.filter((f) =>
    f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.lfid.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  /* Stats */
  const totalDraft     = MOCK_REPORTS.filter((r) => r.status === 'draft').length;
  const totalSubmitted = MOCK_REPORTS.filter((r) => r.status === 'submitted').length;
  const totalVerified  = MOCK_REPORTS.filter((r) => r.status === 'verified').length;

  /* ─── RENDER ─── */
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: bg }}>
        <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: HEADER_BG, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
          <TouchableOpacity onPress={openSidebar} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Crop Damage Reports</Text>
            <Text style={styles.headerSub}>Track, capture & submit damage records</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => { resetForm(); setShowNewEntry(true); }}>
            <FileText size={15} color="#FFFFFF" />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <StatChip label="Draft"     value={totalDraft}     color="#94A3B8" bg={isDark ? '#2D1600' : '#F1F5F9'} />
          <StatChip label="Submitted" value={totalSubmitted} color="#F59E0B" bg={isDark ? '#2D1600' : '#FEF3C7'} />
          <StatChip label="Verified"  value={totalVerified}  color="#16A34A" bg={isDark ? '#2D1600' : '#DCFCE7'} />
        </View>

        {/* ── My Reports toggle + search ── */}
        <View style={[styles.toolbarRow, { backgroundColor: card, borderBottomColor: border }]}>
          <TouchableOpacity
            style={[styles.myReportsToggle, { backgroundColor: myReportsOnly ? HEADER_BG : (isDark ? '#2D1600' : '#FEF3C7'), borderColor: myReportsOnly ? HEADER_BG : border }]}
            onPress={() => setMyReportsOnly((v) => !v)}
          >
            <User size={14} color={myReportsOnly ? '#FFFFFF' : textMuted} />
            <Text style={[styles.myReportsText, { color: myReportsOnly ? '#FFFFFF' : textMuted }]}>My Reports</Text>
          </TouchableOpacity>

          <View style={[styles.searchBar, { flex: 1, backgroundColor: isDark ? '#2D1600' : '#FFFBEB', borderColor: border }]}>
            <Search size={15} color="#9CA3AF" />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search by name or barangay…"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Status filter tabs ── */}
        <View style={[styles.tabsBar, { backgroundColor: isDark ? '#2D1600' : '#FEF3C7', borderBottomColor: border }]}>
          {(['all', 'draft', 'submitted', 'verified'] as const).map((f) => {
            const active = statusFilter === f;
            const label = f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1);
            return (
              <TouchableOpacity key={f} style={styles.tabItem} onPress={() => setStatusFilter(f)}>
                <Text style={[styles.tabLabel, { color: active ? HEADER_BG : textMuted, fontWeight: active ? '700' : '500' }]}>{label}</Text>
                {active && <View style={[styles.tabUnderline, { backgroundColor: HEADER_BG }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Report list ── */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filteredReports.map((report) => {
            const cfg = REPORT_CFG[report.status];
            const pct = Math.round((report.submittedEntries / report.totalEntries) * 100);
            return (
              <TouchableOpacity
                key={report.id}
                style={[styles.reportCard, { backgroundColor: card, borderColor: border }]}
                onPress={() => { setSelReport(report); setEntrySearch(''); }}
                activeOpacity={0.78}
              >
                <View style={styles.reportTopRow}>
                  <View style={[styles.reportIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <AlertTriangle size={22} color={HEADER_BG} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.reportName, { color: textPrimary }]} numberOfLines={1}>{report.name}</Text>
                    <Text style={[styles.reportBrgy, { color: '#6D28D9' }]}>{report.barangay}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                      <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                    {!report.synced && (
                      <View style={styles.unsyncedBadge}>
                        <WifiOff size={10} color="#EF4444" />
                        <Text style={styles.unsyncedText}>Unsynced</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.reportMetaRow}>
                  <Clock size={12} color={textMuted} />
                  <Text style={[styles.reportMeta, { color: textMuted }]}>{report.date}  ·  By {report.technician}</Text>
                </View>

                <View style={styles.reportProgressRow}>
                  <Text style={[styles.reportProgressLabel, { color: textMuted }]}>{report.submittedEntries}/{report.totalEntries} entries</Text>
                  <Text style={[styles.reportProgressPct, { color: HEADER_BG }]}>{pct}%</Text>
                </View>
                <View style={[styles.reportBar, { backgroundColor: isDark ? '#4A2500' : '#FDE68A' }]}>
                  <View style={[styles.reportBarFill, { width: `${pct}%` as any, backgroundColor: report.status === 'verified' ? '#16A34A' : HEADER_BG }]} />
                </View>

                <View style={styles.reportFooter}>
                  <Text style={[styles.reportFooterText, { color: textMuted }]}>Tap to view entries</Text>
                  <ChevronRight size={15} color={textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ═══════════════════════════════════════════════════
            MODAL 1 – Entry List (per report)
            ═══════════════════════════════════════════════════ */}
        <Modal visible={selReport !== null && selEntry === null && !showNewEntry} animationType="slide" onRequestClose={() => setSelReport(null)}>
          {selReport && (
            <View style={[styles.modalContainer, { backgroundColor: bg }]}>
              <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />
              <View style={[styles.header, { backgroundColor: HEADER_BG, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
                <TouchableOpacity onPress={() => setSelReport(null)} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle} numberOfLines={1}>{selReport.name}</Text>
                  <Text style={styles.headerSub}>{selReport.barangay}  ·  {selReport.date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.newBtn}
                  onPress={() => { resetForm(); setShowNewEntry(true); }}
                >
                  <FileText size={15} color="#FFFFFF" />
                  <Text style={styles.newBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={[styles.toolbarRow, { backgroundColor: card, borderBottomColor: border }]}>
                <View style={[styles.searchBar, { flex: 1, backgroundColor: isDark ? '#2D1600' : '#FFFBEB', borderColor: border }]}>
                  <Search size={15} color="#9CA3AF" />
                  <TextInput style={[styles.searchInput, { color: textPrimary }]} placeholder="Filter by farmer, commodity, severity…" placeholderTextColor="#9CA3AF" value={entrySearch} onChangeText={setEntrySearch} />
                  {entrySearch.length > 0 && <TouchableOpacity onPress={() => setEntrySearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}><X size={14} color="#9CA3AF" /></TouchableOpacity>}
                </View>
                <TouchableOpacity style={[styles.filterIconBtn, { backgroundColor: isDark ? '#2D1600' : '#FEF3C7', borderColor: border }]}>
                  <Filter size={16} color={textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.entryListContent} showsVerticalScrollIndicator={false}>
                {filteredEntries.map((entry) => {
                  const sev  = SEV_CFG[entry.severity];
                  const dmg  = DMG_CFG[entry.damageType];
                  const rcfg = REPORT_CFG[entry.status];
                  const canEdit = entry.status === 'draft';
                  return (
                    <View key={entry.id} style={[styles.entryCard, { backgroundColor: card, borderColor: border }]}>
                      {/* Top */}
                      <View style={styles.entryTopRow}>
                        <View style={[styles.entryAvatar, { backgroundColor: avatarColor(entry.id) }]}>
                          <Text style={styles.entryAvatarText}>{initials(entry.farmerName)}</Text>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={styles.entryNameRow}>
                            <Text style={[styles.entryFarmerName, { color: textPrimary }]} numberOfLines={1}>{entry.farmerName}</Text>
                            {!entry.synced && <WifiOff size={12} color="#EF4444" />}
                          </View>
                          <Text style={[styles.entryLfid, { color: '#6D28D9' }]}>{entry.lfid}  ·  {entry.farm} / {entry.parcel}</Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: rcfg.bg }]}>
                          <View style={[styles.statusDot, { backgroundColor: rcfg.dot }]} />
                          <Text style={[styles.statusText, { color: rcfg.text }]}>{rcfg.label}</Text>
                        </View>
                      </View>

                      {/* Chips row */}
                      <View style={styles.entryChipsRow}>
                        <View style={styles.commodityChip}>
                          <Text style={styles.commodityChipText}>{entry.commodity}</Text>
                        </View>
                        <View style={[styles.dmgChip, { backgroundColor: dmg.color }]}>
                          {dmg.icon}
                          <Text style={styles.dmgChipText}>{dmg.label}</Text>
                        </View>
                        <View style={[styles.sevChip, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                          <Text style={[styles.sevChipText, { color: sev.text }]}>{sev.label}</Text>
                        </View>
                      </View>

                      {/* Numbers row */}
                      <View style={styles.entryNumsRow}>
                        <NumPill label="Area"   value={entry.affectedArea} />
                        <NumPill label="Affect" value={entry.affectedPct} />
                        <NumPill label="Loss"   value={entry.estimatedLoss} />
                        {entry.hasPhoto && (
                          <View style={[styles.photoBadge]}>
                            <Camera size={11} color="#16A34A" />
                            <Text style={styles.photoBadgeText}>{entry.photoCount} photo{entry.photoCount !== 1 ? 's' : ''}</Text>
                          </View>
                        )}
                      </View>

                      {/* GPS */}
                      {entry.gps !== '' && (
                        <View style={styles.gpsRow}>
                          <MapPin size={11} color={textMuted} />
                          <Text style={[styles.gpsText, { color: textMuted }]}>{entry.gps}</Text>
                        </View>
                      )}

                      {/* Inline actions */}
                      <View style={[styles.entryActions, { borderTopColor: border }]}>
                        <TouchableOpacity style={styles.inlineAction} onPress={() => setSelEntry(entry)}>
                          <FileText size={13} color="#6D28D9" />
                          <Text style={[styles.inlineActionText, { color: '#6D28D9' }]}>View</Text>
                        </TouchableOpacity>
                        {!entry.hasPhoto && (
                          <TouchableOpacity style={styles.inlineAction}>
                            <Camera size={13} color="#0891B2" />
                            <Text style={[styles.inlineActionText, { color: '#0891B2' }]}>Add Photo</Text>
                          </TouchableOpacity>
                        )}
                        {canEdit && (
                          <TouchableOpacity style={styles.inlineAction}>
                            <AlertTriangle size={13} color={HEADER_BG} />
                            <Text style={[styles.inlineActionText, { color: HEADER_BG }]}>Update Severity</Text>
                          </TouchableOpacity>
                        )}
                        {entry.status === 'draft' && (
                          <TouchableOpacity style={[styles.inlineAction, styles.submitAction]}>
                            <Send size={13} color="#FFFFFF" />
                            <Text style={[styles.inlineActionText, { color: '#FFFFFF' }]}>Submit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Footer – submit report */}
              {selReport.status === 'draft' && (
                <View style={[styles.reportFooterBar, { backgroundColor: card, borderTopColor: border, paddingBottom: insets.bottom || 16 }]}>
                  <TouchableOpacity style={styles.submitReportBtn}>
                    <Send size={18} color="#FFFFFF" />
                    <Text style={styles.submitReportText}>Submit Entire Report</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Modal>

        {/* ═══════════════════════════════════════════════════
            MODAL 2 – View Entry Detail
            ═══════════════════════════════════════════════════ */}
        <Modal visible={selEntry !== null} animationType="slide" onRequestClose={() => setSelEntry(null)}>
          {selEntry && (
            <View style={[styles.modalContainer, { backgroundColor: bg }]}>
              <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />
              <View style={[styles.header, { backgroundColor: HEADER_BG, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
                <TouchableOpacity onPress={() => setSelEntry(null)} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>{selEntry.farmerName}</Text>
                  <Text style={styles.headerSub}>{selEntry.status === 'draft' ? 'Draft – editable' : 'Read-only'}</Text>
                </View>
                {selEntry.status === 'draft' && (
                  <TouchableOpacity style={styles.newBtn}>
                    <Send size={15} color="#FFFFFF" />
                    <Text style={styles.newBtnText}>Submit</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
                {/* Farmer + farm */}
                <SectionCard title="Farmer & Location" color="#FEF3C7" border={border} card={card}>
                  <View style={[styles.detailFarmerRow]}>
                    <View style={[styles.entryAvatar, { backgroundColor: avatarColor(selEntry.id), width: 52, height: 52, borderRadius: 15 }]}>
                      <Text style={[styles.entryAvatarText, { fontSize: 18 }]}>{initials(selEntry.farmerName)}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[styles.detailFarmerName, { color: textPrimary }]}>{selEntry.farmerName}</Text>
                      <Text style={[styles.detailLfid, { color: '#6D28D9' }]}>{selEntry.lfid}</Text>
                      <Text style={[styles.detailSub, { color: textMuted }]}>{selEntry.farm}  /  {selEntry.parcel}</Text>
                    </View>
                  </View>
                  {selEntry.gps !== '' && (
                    <View style={styles.detailGpsRow}>
                      <MapPin size={14} color={HEADER_BG} />
                      <Text style={[styles.detailGpsText, { color: textMuted }]}>{selEntry.gps}</Text>
                    </View>
                  )}
                </SectionCard>

                {/* Damage info */}
                <SectionCard title="Damage Information" color="#FFF7ED" border={border} card={card}>
                  <DetailRow label="Commodity"   value={selEntry.commodity}   textPrimary={textPrimary} textMuted={textMuted} />
                  <DetailRow label="Damage Type" value={DMG_CFG[selEntry.damageType].label} textPrimary={textPrimary} textMuted={textMuted} />
                  <DetailRow label="Severity"    value={SEV_CFG[selEntry.severity].label}   textPrimary={textPrimary} textMuted={textMuted} />
                  <DetailRow label="Affected Area" value={selEntry.affectedArea} textPrimary={textPrimary} textMuted={textMuted} />
                  <DetailRow label="Affected %"  value={selEntry.affectedPct}  textPrimary={textPrimary} textMuted={textMuted} />
                  <DetailRow label="Est. Loss"   value={selEntry.estimatedLoss} textPrimary={textPrimary} textMuted={textMuted} last />
                </SectionCard>

                {/* Notes */}
                {selEntry.notes !== '' && (
                  <SectionCard title="Technician Notes" color="#F0FDF4" border={border} card={card}>
                    <Text style={[styles.detailNotes, { color: textPrimary }]}>{selEntry.notes}</Text>
                  </SectionCard>
                )}

                {/* Evidence */}
                <SectionCard title="Photo Evidence" color="#EFF6FF" border={border} card={card}>
                  {selEntry.hasPhoto ? (
                    <View style={styles.evidenceGrid}>
                      {Array.from({ length: selEntry.photoCount }).map((_, i) => (
                        <View key={i} style={[styles.evidenceThumb, { backgroundColor: isDark ? '#2D1600' : '#FEF3C7' }]}>
                          <Camera size={20} color={HEADER_BG} />
                          <Text style={[styles.evidenceThumbText, { color: textMuted }]}>Photo {i + 1}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noPhotoWrap}>
                      <Camera size={24} color="#D1D5DB" />
                      <Text style={styles.noPhotoText}>No photos attached</Text>
                    </View>
                  )}
                </SectionCard>

                {/* Timestamp */}
                <View style={styles.timestampStamp}>
                  <Clock size={13} color={textMuted} />
                  <Text style={[styles.timestampStampText, { color: textMuted }]}>Recorded: {selEntry.timestamp}</Text>
                </View>
              </ScrollView>
            </View>
          )}
        </Modal>

        {/* ═══════════════════════════════════════════════════
            MODAL 3 – New Entry (multi-step)
            ═══════════════════════════════════════════════════ */}
        <Modal visible={showNewEntry} animationType="slide" onRequestClose={() => { setShowNewEntry(false); resetForm(); }}>
          <View style={[styles.modalContainer, { backgroundColor: bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />
            <View style={[styles.header, { backgroundColor: HEADER_BG, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
              <TouchableOpacity onPress={() => { setShowNewEntry(false); resetForm(); }} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>New Damage Entry</Text>
                <Text style={styles.headerSub}>Step {step} of 4</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.stepProgressWrap}>
              {[1, 2, 3, 4].map((s) => (
                <View key={s} style={[styles.stepSeg, { backgroundColor: s <= step ? HEADER_BG : (isDark ? '#4A2500' : '#FDE68A'), flex: 1, marginRight: s < 4 ? 4 : 0 }]} />
              ))}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Step 1 – Farmer & Location */}
                {step === 1 && (
                  <View style={{ gap: 14 }}>
                    <FormLabel text="Select Farmer" color={textPrimary} />
                    <View style={[styles.searchBar, { backgroundColor: isDark ? '#2D1600' : '#FFFBEB', borderColor: border }]}>
                      <Search size={15} color="#9CA3AF" />
                      <TextInput style={[styles.searchInput, { color: textPrimary }]} placeholder="Search farmer or LFID…" placeholderTextColor="#9CA3AF" value={farmerSearch} onChangeText={setFarmerSearch} />
                    </View>
                    {filteredFarmers.map((f) => (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.farmerRadioRow, { backgroundColor: selFarmer?.id === f.id ? '#FEF3C7' : card, borderColor: selFarmer?.id === f.id ? HEADER_BG : border }]}
                        onPress={() => { setSelFarmer(f); setSelFarm(''); setSelParcel(''); }}
                      >
                        <View style={[styles.radioCircle, { borderColor: selFarmer?.id === f.id ? HEADER_BG : border, backgroundColor: selFarmer?.id === f.id ? HEADER_BG : 'transparent' }]}>
                          {selFarmer?.id === f.id && <View style={styles.radioDot} />}
                        </View>
                        <View style={[styles.entryAvatar, { backgroundColor: avatarColor(f.id), width: 36, height: 36, borderRadius: 10 }]}>
                          <Text style={[styles.entryAvatarText, { fontSize: 12 }]}>{initials(f.name)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.farmerRadioName, { color: textPrimary }]}>{f.name}</Text>
                          <Text style={[styles.farmerRadioLfid, { color: '#6D28D9' }]}>{f.lfid}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {selFarmer && (
                      <>
                        <FormLabel text="Select Farm" color={textPrimary} />
                        {selFarmer.farms.map((fm) => (
                          <TouchableOpacity key={fm} style={[styles.optionChip, { backgroundColor: selFarm === fm ? HEADER_BG : card, borderColor: selFarm === fm ? HEADER_BG : border }]} onPress={() => { setSelFarm(fm); setSelParcel(''); }}>
                            <Text style={[styles.optionChipText, { color: selFarm === fm ? '#FFFFFF' : textMuted }]}>{fm}</Text>
                          </TouchableOpacity>
                        ))}
                        {selFarm !== '' && (
                          <>
                            <FormLabel text="Select Parcel" color={textPrimary} />
                            {['Parcel A', 'Parcel B', 'Parcel C'].map((p) => (
                              <TouchableOpacity key={p} style={[styles.optionChip, { backgroundColor: selParcel === p ? HEADER_BG : card, borderColor: selParcel === p ? HEADER_BG : border }]} onPress={() => setSelParcel(p)}>
                                <Text style={[styles.optionChipText, { color: selParcel === p ? '#FFFFFF' : textMuted }]}>{p}</Text>
                              </TouchableOpacity>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </View>
                )}

                {/* Step 2 – Commodity + Damage Type + Severity */}
                {step === 2 && (
                  <View style={{ gap: 16 }}>
                    <FormLabel text="Commodity" color={textPrimary} />
                    <View style={styles.chipGrid}>
                      {COMMODITIES.map((c) => (
                        <TouchableOpacity key={c} style={[styles.gridChip, { backgroundColor: commodity === c ? HEADER_BG : card, borderColor: commodity === c ? HEADER_BG : border }]} onPress={() => setCommodity(c)}>
                          <Text style={[styles.gridChipText, { color: commodity === c ? '#FFFFFF' : textMuted }]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <FormLabel text="Damage Type" color={textPrimary} />
                    <View style={styles.chipGrid}>
                      {DAMAGE_TYPES_LIST.map((d) => (
                        <TouchableOpacity key={d} style={[styles.gridChip, { backgroundColor: damageType === d ? HEADER_BG : card, borderColor: damageType === d ? HEADER_BG : border }]} onPress={() => setDamageType(d)}>
                          <Text style={[styles.gridChipText, { color: damageType === d ? '#FFFFFF' : textMuted }]}>{DMG_CFG[d].label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <FormLabel text="Severity Level" color={textPrimary} />
                    {SEVERITY_LIST.map((s) => {
                      const sc = SEV_CFG[s];
                      return (
                        <TouchableOpacity key={s} style={[styles.sevOption, { backgroundColor: severity === s ? sc.bg : card, borderColor: severity === s ? sc.border : border }]} onPress={() => setSeverity(s)}>
                          <View style={[styles.sevDot, { backgroundColor: sc.text }]} />
                          <Text style={[styles.sevOptionText, { color: severity === s ? sc.text : textMuted, fontWeight: severity === s ? '700' : '500' }]}>{sc.label}</Text>
                          {severity === s && <CheckCircle2 size={18} color={sc.text} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Step 3 – Quantitative data + notes */}
                {step === 3 && (
                  <View style={{ gap: 14 }}>
                    <FormLabel text="Affected Area (ha)" color={textPrimary} />
                    <TextInput style={[styles.formInput, { backgroundColor: card, borderColor: affectedArea ? HEADER_BG : border, color: textPrimary }]} placeholder="e.g. 1.5" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" value={affectedArea} onChangeText={setAffectedArea} />

                    <FormLabel text="Affected Percentage (%)" color={textPrimary} />
                    <TextInput style={[styles.formInput, { backgroundColor: card, borderColor: affectedPct ? HEADER_BG : border, color: textPrimary }]} placeholder="e.g. 70" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" value={affectedPct} onChangeText={setAffectedPct} />

                    <FormLabel text="Estimated Loss (₱) *" color={textPrimary} />
                    <TextInput style={[styles.formInput, { backgroundColor: card, borderColor: estimatedLoss ? HEADER_BG : border, color: textPrimary }]} placeholder="e.g. 42000" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" value={estimatedLoss} onChangeText={setEstimatedLoss} />

                    <FormLabel text="Technician Notes (optional)" color={textPrimary} />
                    <TextInput style={[styles.formTextarea, { backgroundColor: card, borderColor: notes ? HEADER_BG : border, color: textPrimary }]} placeholder="Describe damage conditions, observations, or context…" placeholderTextColor="#9CA3AF" multiline numberOfLines={4} value={notes} onChangeText={setNotes} textAlignVertical="top" />
                  </View>
                )}

                {/* Step 4 – GPS + Photo */}
                {step === 4 && (
                  <View style={{ gap: 16 }}>
                    <FormLabel text="GPS Location (auto-capture)" color={textPrimary} />
                    <View style={[styles.gpsCapturePad, { backgroundColor: card, borderColor: gpsValue ? '#16A34A' : border }]}>
                      {gpsValue ? (
                        <View style={styles.gpsCaptured}>
                          <MapPin size={20} color="#16A34A" />
                          <Text style={[styles.gpsCapturedText, { color: textPrimary }]}>{gpsValue}</Text>
                          <CheckCircle2 size={18} color="#16A34A" />
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.gpsCaptureBtn} onPress={captureGps} disabled={gpsCapturing}>
                          <Crosshair size={20} color={gpsCapturing ? '#9CA3AF' : HEADER_BG} />
                          <Text style={[styles.gpsCaptureBtnText, { color: gpsCapturing ? '#9CA3AF' : HEADER_BG }]}>
                            {gpsCapturing ? 'Acquiring GPS…' : 'Capture GPS Location'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <FormLabel text="Photo Evidence * (required)" color={textPrimary} />
                    <TouchableOpacity
                      style={[styles.photoPlaceholder, { backgroundColor: photoAdded ? '#F0FDF4' : card, borderColor: photoAdded ? '#16A34A' : border }]}
                      onPress={() => setPhotoAdded((v) => !v)}
                    >
                      {photoAdded ? (
                        <View style={styles.photoAdded}>
                          <CheckCircle2 size={28} color="#16A34A" />
                          <Text style={[styles.photoAddedText, { color: '#15803D' }]}>Photo captured</Text>
                          <Text style={[styles.photoAddedSub, { color: '#6B7280' }]}>Tap to retake</Text>
                        </View>
                      ) : (
                        <View style={styles.photoPrompt}>
                          <Camera size={32} color="#9CA3AF" />
                          <Text style={styles.photoPromptTitle}>Add Photo Evidence</Text>
                          <Text style={styles.photoPromptSub}>Capture damage photo for documentation</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {!photoAdded && (
                      <View style={styles.photoRequiredHint}>
                        <AlertCircle size={13} color="#EF4444" />
                        <Text style={styles.photoRequiredText}>Photo evidence is mandatory for damage reports.</Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer nav */}
            <View style={[styles.formFooter, { backgroundColor: card, borderTopColor: border, paddingBottom: insets.bottom || 16 }]}>
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={[styles.footerBtnBack, { borderColor: border }]}
                  onPress={() => { if (step === 1) { setShowNewEntry(false); resetForm(); } else setStep((s) => s - 1); }}
                >
                  <Text style={[styles.footerBtnBackText, { color: textPrimary }]}>{step === 1 ? 'Cancel' : 'Back'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerBtnNext, { opacity: canAdvance() ? 1 : 0.35 }]}
                  disabled={!canAdvance()}
                  onPress={() => { if (step < 4) { setStep((s) => s + 1); } else { setShowNewEntry(false); resetForm(); } }}
                >
                  {step < 4
                    ? <><SkipForward size={16} color="#FFFFFF" /><Text style={styles.footerBtnNextText}>Continue</Text></>
                    : <><Send size={16} color="#FFFFFF" /><Text style={styles.footerBtnNextText}>Submit Entry</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

/* ─── Sub-components ─── */
function StatChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.statChip, { backgroundColor: bg }]}>
      <Text style={[styles.statChipValue, { color }]}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}
function NumPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.numPill}>
      <Text style={styles.numPillLabel}>{label}</Text>
      <Text style={styles.numPillValue}>{value}</Text>
    </View>
  );
}
function FormLabel({ text, color }: { text: string; color: string }) {
  return <Text style={[styles.formLabel, { color }]}>{text}</Text>;
}
function SectionCard({ title, color, border, card, children }: {
  title: string; color: string; border: string; card: string; children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: card, borderColor: border }]}>
      <View style={[styles.sectionCardHead, { backgroundColor: color }]}>
        <Text style={styles.sectionCardTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCardBody}>{children}</View>
    </View>
  );
}
function DetailRow({ label, value, textPrimary, textMuted, last }: {
  label: string; value: string; textPrimary: string; textMuted: string; last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: '#FDE68A' }]}>
      <Text style={[styles.detailLabel, { color: textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: textPrimary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  statChip: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  statChipValue: { fontSize: 22, fontWeight: '800' },
  statChipLabel: { fontSize: 11, color: '#6B7280', marginTop: 1 },

  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  myReportsToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  myReportsText: { fontSize: 12, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  filterIconBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  tabsBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 6 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 9, position: 'relative' },
  tabLabel: { fontSize: 13 },
  tabUnderline: { position: 'absolute', bottom: 0, left: 10, right: 10, height: 2.5, borderRadius: 2 },

  scroll: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 32, gap: 12 },

  reportCard: { borderRadius: 20, borderWidth: 1, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  reportTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  reportIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reportName: { fontSize: 15, fontWeight: '700' },
  reportBrgy: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  unsyncedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  unsyncedText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  reportMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  reportMeta: { fontSize: 12 },
  reportProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  reportProgressLabel: { fontSize: 12 },
  reportProgressPct: { fontSize: 12, fontWeight: '700' },
  reportBar: { height: 5, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  reportBarFill: { height: 5, borderRadius: 3 },
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportFooterText: { fontSize: 12 },

  /* Modal */
  modalContainer: { flex: 1 },
  entryListContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 32, gap: 12 },

  entryCard: { borderRadius: 20, borderWidth: 1, padding: 13, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  entryTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  entryAvatar: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  entryAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  entryNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  entryFarmerName: { fontSize: 14, fontWeight: '700', flex: 1 },
  entryLfid: { fontSize: 12, fontWeight: '500' },

  entryChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  commodityChip: { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  commodityChipText: { fontSize: 12, fontWeight: '600', color: '#15803D' },
  dmgChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  dmgChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  sevChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  sevChipText: { fontSize: 12, fontWeight: '700' },

  entryNumsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  numPill: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  numPillLabel: { fontSize: 9, color: '#92400E', fontWeight: '500' },
  numPillValue: { fontSize: 12, color: '#78350F', fontWeight: '700' },
  photoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  photoBadgeText: { fontSize: 11, fontWeight: '600', color: '#15803D' },

  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  gpsText: { fontSize: 11 },

  entryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 10, marginTop: 4, borderTopWidth: 1 },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F3FF', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 },
  inlineActionText: { fontSize: 12, fontWeight: '600' },
  submitAction: { backgroundColor: '#16A34A' },

  reportFooterBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  submitReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: HEADER_BG, borderRadius: 14, paddingVertical: 14 },
  submitReportText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  /* Detail view */
  detailScroll: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24 },
  sectionCard: { borderRadius: 20, borderWidth: 1, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 1 },
  sectionCardHead: { paddingHorizontal: 16, paddingVertical: 10 },
  sectionCardTitle: { fontSize: 13, fontWeight: '700', color: '#78350F' },
  sectionCardBody: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4 },
  detailFarmerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, paddingBottom: 8 },
  detailFarmerName: { fontSize: 17, fontWeight: '800' },
  detailLfid: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  detailSub: { fontSize: 12, marginTop: 1 },
  detailGpsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 6 },
  detailGpsText: { fontSize: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  detailLabel: { fontSize: 12, fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  detailNotes: { fontSize: 13, lineHeight: 20, paddingVertical: 4 },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 4 },
  evidenceThumb: { width: 80, height: 80, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4 },
  evidenceThumbText: { fontSize: 10, fontWeight: '500' },
  noPhotoWrap: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  noPhotoText: { fontSize: 13, color: '#9CA3AF' },
  timestampStamp: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', paddingBottom: 4 },
  timestampStampText: { fontSize: 12 },

  /* New entry form */
  stepProgressWrap: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2, gap: 4 },
  stepSeg: { height: 5, borderRadius: 3 },
  formScroll: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 24 },
  formLabel: { fontSize: 14, fontWeight: '700', marginBottom: -4 },
  formInput: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  formTextarea: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingTop: 12, fontSize: 14, minHeight: 100 },

  farmerRadioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1.5, padding: 12 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  farmerRadioName: { fontSize: 14, fontWeight: '700' },
  farmerRadioLfid: { fontSize: 12, fontWeight: '500', marginTop: 1 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridChip: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9 },
  gridChipText: { fontSize: 13, fontWeight: '600' },
  optionChip: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 11 },
  optionChipText: { fontSize: 14, fontWeight: '600' },

  sevOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12 },
  sevDot: { width: 10, height: 10, borderRadius: 5 },
  sevOptionText: { flex: 1, fontSize: 14 },

  gpsCapturePad: { borderRadius: 16, borderWidth: 1.5, padding: 16 },
  gpsCaptureBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6 },
  gpsCaptureBtnText: { fontSize: 15, fontWeight: '600' },
  gpsCaptured: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsCapturedText: { flex: 1, fontSize: 13, fontWeight: '500' },

  photoPlaceholder: { borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', minHeight: 130, alignItems: 'center', justifyContent: 'center' },
  photoPrompt: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  photoPromptTitle: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  photoPromptSub: { fontSize: 12, color: '#9CA3AF' },
  photoAdded: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  photoAddedText: { fontSize: 15, fontWeight: '700' },
  photoAddedSub: { fontSize: 12, color: '#6B7280' },
  photoRequiredHint: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10 },
  photoRequiredText: { fontSize: 12, color: '#B91C1C', flex: 1 },

  formFooter: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  footerRow: { flexDirection: 'row', gap: 10 },
  footerBtnBack: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  footerBtnBackText: { fontSize: 15, fontWeight: '600' },
  footerBtnNext: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: HEADER_BG, borderRadius: 14, paddingVertical: 14 },
  footerBtnNextText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
