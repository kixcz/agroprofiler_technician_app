import { useSidebar } from '@/lib/SidebarContext';
import { Stack } from 'expo-router';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Menu,
  Package,
  PenLine,
  QrCode,
  RotateCcw,
  Search,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
type BatchStatus = 'pending' | 'in_progress' | 'completed';
type FarmerStatus = 'pending' | 'partially_received' | 'received';

interface DistributionBatch {
  id: number;
  title: string;
  commodity: string;
  barangay: string;
  batchNo: string;
  totalFarmers: number;
  servedFarmers: number;
  status: BatchStatus;
  date: string;
  synced: boolean;
}
interface FarmerAllocation {
  id: number;
  farmerName: string;
  lfid: string;
  barangay: string;
  allocatedQty: string;
  unit: string;
  actualQty: string;
  status: FarmerStatus;
  hasPhoto: boolean;
  hasSignature: boolean;
  synced: boolean;
  timestamp?: string;
}

/* ─── Constants ─── */
const BATCH_CFG: Record<BatchStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:     { label: 'Pending',     bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  in_progress: { label: 'In Progress', bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  completed:   { label: 'Completed',   bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
};
const FARMER_CFG: Record<FarmerStatus, { label: string; bg: string; text: string }> = {
  pending:            { label: 'Pending',            bg: '#F1F5F9', text: '#475569' },
  partially_received: { label: 'Partial',            bg: '#FEF3C7', text: '#B45309' },
  received:           { label: 'Received',           bg: '#DCFCE7', text: '#15803D' },
};
const AVATAR_PALETTE = ['#16A34A','#2563EB','#9333EA','#F59E0B','#EF4444','#0891B2','#DB2777','#EA580C'];
const avatarColor = (id: number) => AVATAR_PALETTE[(id - 1) % AVATAR_PALETTE.length];
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/* ─── Mock data ─── */
const MOCK_BATCHES: DistributionBatch[] = [
  { id: 1, title: 'Rice Seeds Distribution', commodity: 'Rice Seeds (50 kg)', barangay: 'Brgy. Aplaya', batchNo: 'Batch 1', totalFarmers: 50, servedFarmers: 32, status: 'in_progress', date: 'Apr 13, 2026', synced: true },
  { id: 2, title: 'Fertilizer Distribution',  commodity: 'Urea (50 kg bags)',  barangay: 'Brgy. San Isidro', batchNo: 'Batch 2', totalFarmers: 25, servedFarmers: 25, status: 'completed',   date: 'Apr 10, 2026', synced: true },
  { id: 3, title: 'Pesticide Distribution',   commodity: 'Herbicide (1 L)',    barangay: 'Brgy. Maligaya',   batchNo: 'Batch 1', totalFarmers: 18, servedFarmers:  0, status: 'pending',     date: 'Apr 15, 2026', synced: false },
  { id: 4, title: 'Farm Tools Release',        commodity: 'Hand Sprayer (unit)',barangay: 'Brgy. Masagana',   batchNo: 'Batch 3', totalFarmers: 12, servedFarmers:  6, status: 'in_progress', date: 'Apr 12, 2026', synced: false },
];
const MOCK_ALLOCATIONS: Record<number, FarmerAllocation[]> = {
  1: [
    { id: 1, farmerName: 'Juan Dela Cruz',     lfid: 'LFID-001', barangay: 'Brgy. Aplaya', allocatedQty: '50', unit: 'kg', actualQty: '50', status: 'received',            hasPhoto: true,  hasSignature: true,  synced: true,  timestamp: 'Apr 13, 10:30 AM' },
    { id: 2, farmerName: 'Maria Santos',        lfid: 'LFID-002', barangay: 'Brgy. Aplaya', allocatedQty: '50', unit: 'kg', actualQty: '25', status: 'partially_received',  hasPhoto: true,  hasSignature: false, synced: false, timestamp: 'Apr 13, 11:00 AM' },
    { id: 3, farmerName: 'Pedro Reyes',         lfid: 'LFID-003', barangay: 'Brgy. Aplaya', allocatedQty: '50', unit: 'kg', actualQty: '',   status: 'pending',             hasPhoto: false, hasSignature: false, synced: false, timestamp: undefined },
    { id: 4, farmerName: 'Ana Garcia',          lfid: 'LFID-004', barangay: 'Brgy. Aplaya', allocatedQty: '25', unit: 'kg', actualQty: '25', status: 'received',            hasPhoto: false, hasSignature: true,  synced: true,  timestamp: 'Apr 13, 11:30 AM' },
    { id: 5, farmerName: 'Carlos Mendoza',      lfid: 'LFID-005', barangay: 'Brgy. Aplaya', allocatedQty: '50', unit: 'kg', actualQty: '',   status: 'pending',             hasPhoto: false, hasSignature: false, synced: false, timestamp: undefined },
  ],
  2: [
    { id: 1, farmerName: 'Lourdes Bautista',   lfid: 'LFID-006', barangay: 'Brgy. San Isidro', allocatedQty: '2', unit: 'bags', actualQty: '2', status: 'received', hasPhoto: true, hasSignature: true, synced: true, timestamp: 'Apr 10, 9:00 AM' },
    { id: 2, farmerName: 'Rolando Villanueva', lfid: 'LFID-007', barangay: 'Brgy. San Isidro', allocatedQty: '3', unit: 'bags', actualQty: '3', status: 'received', hasPhoto: false, hasSignature: true, synced: true, timestamp: 'Apr 10, 9:45 AM' },
  ],
  3: [
    { id: 1, farmerName: 'Elena Reyes',  lfid: 'LFID-008', barangay: 'Brgy. Maligaya', allocatedQty: '2', unit: 'L', actualQty: '', status: 'pending', hasPhoto: false, hasSignature: false, synced: false, timestamp: undefined },
    { id: 2, farmerName: 'Bong Perez',   lfid: 'LFID-009', barangay: 'Brgy. Maligaya', allocatedQty: '2', unit: 'L', actualQty: '', status: 'pending', hasPhoto: false, hasSignature: false, synced: false, timestamp: undefined },
  ],
  4: [
    { id: 1, farmerName: 'Rosa Cruz',    lfid: 'LFID-010', barangay: 'Brgy. Masagana', allocatedQty: '1', unit: 'unit', actualQty: '1', status: 'received', hasPhoto: true, hasSignature: false, synced: false, timestamp: 'Apr 12, 2:00 PM' },
    { id: 2, farmerName: 'Noel Santos',  lfid: 'LFID-011', barangay: 'Brgy. Masagana', allocatedQty: '1', unit: 'unit', actualQty: '',  status: 'pending',  hasPhoto: false, hasSignature: false, synced: false, timestamp: undefined },
  ],
};

/* ═══════════════════════════════════════════════════════ */
export default function DistributionScreen() {
  const { openSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  /* Theme */
  const bg          = isDark ? '#10071A' : '#FAF5FF';
  const card        = isDark ? '#1A0F2E' : '#FFFFFF';
  const border      = isDark ? '#2D1F45' : '#EDE9FE';
  const textPrimary = isDark ? '#F3E8FF' : '#3B0764';
  const textMuted   = isDark ? '#A78BFA' : '#6B7280';
  const headerBg    = '#6D28D9'; // vivid purple

  /* State */
  const [batchFilter, setBatchFilter] = useState<'all' | BatchStatus>('all');
  const [batchSearch, setBatchSearch] = useState('');
  const [selBatch,    setSelBatch]    = useState<DistributionBatch | null>(null);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [selFarmer,   setSelFarmer]   = useState<FarmerAllocation | null>(null);

  /* Confirm-form state */
  const [actualQty,  setActualQty]   = useState('');
  const [hasPhoto,   setHasPhoto]    = useState(false);
  const [hasSigned,  setHasSigned]   = useState(false);
  const [sigTick,    setSigTick]     = useState(0);
  const sigPaths = useRef<Array<{x: number; y: number}[]>>([]);

  /* Signature PanResponder */
  const sigPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      sigPaths.current.push([{ x: locationX, y: locationY }]);
      setHasSigned(true);
      setSigTick((t) => t + 1);
    },
    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      const last = sigPaths.current[sigPaths.current.length - 1];
      if (last) { last.push({ x: locationX, y: locationY }); setSigTick((t) => t + 1); }
    },
  });

  const clearSignature = () => { sigPaths.current = []; setHasSigned(false); setSigTick((t) => t + 1); };

  const openConfirm = (f: FarmerAllocation) => {
    setSelFarmer(f);
    setActualQty(f.actualQty);
    setHasPhoto(f.hasPhoto);
    setHasSigned(f.hasSignature);
    clearSignature();
  };

  const closeConfirm = () => { setSelFarmer(null); setActualQty(''); setHasPhoto(false); clearSignature(); };

  const canSubmit = (hasPhoto || hasSigned) && actualQty.trim() !== '';
  const proofCount = (hasPhoto ? 1 : 0) + (hasSigned ? 1 : 0);

  /* Batch totals */
  const globalTotal   = MOCK_BATCHES.reduce((s, b) => s + b.totalFarmers, 0);
  const globalServed  = MOCK_BATCHES.reduce((s, b) => s + b.servedFarmers, 0);
  const globalPct     = Math.round((globalServed / globalTotal) * 100);

  /* Filtered batches */
  const filteredBatches = MOCK_BATCHES.filter((b) => {
    const matchesFilter = batchFilter === 'all' || b.status === batchFilter;
    const q = batchSearch.toLowerCase();
    const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.barangay.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  /* Per-batch allocations */
  const batchAllocations = selBatch ? (MOCK_ALLOCATIONS[selBatch.id] ?? []) : [];
  const filteredAllocations = batchAllocations.filter((f) => {
    const q = farmerSearch.toLowerCase();
    return !q || f.farmerName.toLowerCase().includes(q) || f.lfid.toLowerCase().includes(q) || f.barangay.toLowerCase().includes(q);
  });

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
            <Text style={styles.headerTitle}>Distribution Records</Text>
            <Text style={styles.headerSub}>Field execution & verification</Text>
          </View>
        </View>

        {/* ── Progress banner ── */}
        <View style={[styles.progressBanner, { backgroundColor: card, borderColor: border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.progressLabel, { color: textMuted }]}>Overall Progress</Text>
            <Text style={[styles.progressCount, { color: textPrimary }]}>
              {globalServed} <Text style={[styles.progressTotal, { color: textMuted }]}>/ {globalTotal} farmers served</Text>
            </Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPct}>{globalPct}%</Text>
          </View>
          <View style={[styles.progressBarWrap, { position: 'absolute', bottom: 0, left: 16, right: 16, height: 4 }]}>
            <View style={[styles.progressBarFill, { width: `${globalPct}%` as any }]} />
          </View>
        </View>

        {/* ── Search + Filter ── */}
        <View style={[styles.searchWrap, { backgroundColor: card, borderBottomColor: border }]}>
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#1F1040' : '#F5F3FF', borderColor: border }]}>
            <Search size={16} color="#6B7280" />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search by title or barangay…"
              placeholderTextColor="#9CA3AF"
              value={batchSearch}
              onChangeText={setBatchSearch}
            />
            {batchSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBatchSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Filter tabs ── */}
        <View style={[styles.tabsBar, { backgroundColor: isDark ? '#1A0F2E' : '#F5F3FF', borderBottomColor: border }]}>
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((f) => {
            const isActive = batchFilter === f;
            const label = f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1);
            return (
              <TouchableOpacity key={f} style={styles.tabItem} onPress={() => setBatchFilter(f)}>
                <Text style={[styles.tabLabel, { color: isActive ? '#6D28D9' : textMuted, fontWeight: isActive ? '700' : '500' }]}>{label}</Text>
                {isActive && <View style={[styles.tabUnderline, { backgroundColor: '#6D28D9' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Batch list ── */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filteredBatches.map((batch) => {
            const cfg = BATCH_CFG[batch.status];
            const pct = Math.round((batch.servedFarmers / batch.totalFarmers) * 100);
            return (
              <TouchableOpacity
                key={batch.id}
                style={[styles.batchCard, { backgroundColor: card, borderColor: border }]}
                onPress={() => { setSelBatch(batch); setFarmerSearch(''); }}
                activeOpacity={0.78}
              >
                {/* Top row */}
                <View style={styles.batchTopRow}>
                  <View style={[styles.batchIconWrap, { backgroundColor: '#F5F3FF' }]}>
                    <Package size={22} color="#6D28D9" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.batchTitle, { color: textPrimary }]} numberOfLines={1}>{batch.title}</Text>
                    <Text style={[styles.batchMeta, { color: '#6D28D9' }]}>{batch.commodity}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                      <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                    {!batch.synced && (
                      <View style={styles.unsyncedBadge}>
                        <WifiOff size={10} color="#EF4444" />
                        <Text style={styles.unsyncedText}>Unsynced</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Barangay + date row */}
                <View style={styles.batchInfoRow}>
                  <Text style={[styles.batchInfoText, { color: textMuted }]}>{batch.barangay}  ·  {batch.batchNo}  ·  {batch.date}</Text>
                </View>

                {/* Progress */}
                <View style={styles.batchProgressRow}>
                  <Text style={[styles.batchProgressLabel, { color: textMuted }]}>
                    {batch.servedFarmers}/{batch.totalFarmers} farmers served
                  </Text>
                  <Text style={[styles.batchProgressPct, { color: '#6D28D9' }]}>{pct}%</Text>
                </View>
                <View style={[styles.batchBar, { backgroundColor: isDark ? '#2D1F45' : '#EDE9FE' }]}>
                  <View style={[styles.batchBarFill, { width: `${pct}%` as any, backgroundColor: batch.status === 'completed' ? '#16A34A' : '#6D28D9' }]} />
                </View>

                <View style={styles.batchFooter}>
                  <Text style={[styles.batchFooterText, { color: textMuted }]}>Tap to manage distribution</Text>
                  <ChevronRight size={16} color={textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ═══════════════════════════════════════════════════
            MODAL 1 – Per-Farmer Allocation List
            ═══════════════════════════════════════════════════ */}
        <Modal visible={selBatch !== null && selFarmer === null} animationType="slide" onRequestClose={() => setSelBatch(null)}>
          {selBatch && (
            <View style={[styles.modalContainer, { backgroundColor: bg }]}>
              <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />
              {/* Header */}
              <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
                <TouchableOpacity onPress={() => setSelBatch(null)} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle} numberOfLines={1}>{selBatch.title}</Text>
                  <Text style={styles.headerSub}>{selBatch.barangay}  ·  {selBatch.batchNo}</Text>
                </View>
                {!selBatch.synced && (
                  <View style={styles.unsyncedBadge}>
                    <WifiOff size={10} color="#EF4444" />
                    <Text style={styles.unsyncedText}>Offline</Text>
                  </View>
                )}
              </View>

              {/* Progress strip */}
              <View style={[styles.farmerProgressStrip, { backgroundColor: card, borderBottomColor: border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.farmerProgressLabel, { color: textPrimary }]}>
                    {selBatch.servedFarmers}
                    <Text style={[styles.farmerProgressTotal, { color: textMuted }]}> / {selBatch.totalFarmers} farmers served</Text>
                  </Text>
                </View>
                <View style={styles.filterIconBtn}>
                  <Filter size={16} color={textMuted} />
                </View>
              </View>

              {/* Farmer search */}
              <View style={[styles.searchWrap, { backgroundColor: card, borderBottomColor: border }]}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1F1040' : '#F5F3FF', borderColor: border }]}>
                  <Search size={15} color="#6B7280" />
                  <TextInput
                    style={[styles.searchInput, { color: textPrimary }]}
                    placeholder="Search by name, LFID, or barangay…"
                    placeholderTextColor="#9CA3AF"
                    value={farmerSearch}
                    onChangeText={setFarmerSearch}
                  />
                  {farmerSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setFarmerSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <X size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Farmer rows */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.farmerListContent} showsVerticalScrollIndicator={false}>
                {filteredAllocations.map((farmer) => {
                  const fc  = FARMER_CFG[farmer.status];
                  const done = farmer.status === 'received';
                  const partial = farmer.status === 'partially_received';
                  return (
                    <View key={farmer.id} style={[styles.farmerRow, { backgroundColor: card, borderColor: border }]}>
                      {/* Avatar */}
                      <View style={[styles.farmerAvatar, { backgroundColor: avatarColor(farmer.id) }]}>
                        <Text style={styles.farmerAvatarText}>{initials(farmer.farmerName)}</Text>
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={styles.farmerNameRow}>
                          <Text style={[styles.farmerName, { color: textPrimary }]} numberOfLines={1}>{farmer.farmerName}</Text>
                          {!farmer.synced && farmer.status !== 'pending' && (
                            <WifiOff size={12} color="#EF4444" />
                          )}
                        </View>
                        <Text style={[styles.farmerLfid, { color: '#6D28D9' }]}>{farmer.lfid}</Text>
                        <View style={styles.farmerAllocRow}>
                          <Text style={[styles.farmerAlloc, { color: textMuted }]}>
                            Alloc: <Text style={{ fontWeight: '700', color: textPrimary }}>{farmer.allocatedQty} {farmer.unit}</Text>
                            {farmer.actualQty ? `  ·  Given: ${farmer.actualQty} ${farmer.unit}` : ''}
                          </Text>
                        </View>
                        {farmer.timestamp && (
                          <View style={styles.timestampRow}>
                            <Clock size={10} color={textMuted} />
                            <Text style={[styles.timestampText, { color: textMuted }]}>{farmer.timestamp}</Text>
                          </View>
                        )}
                      </View>

                      {/* Right side */}
                      <View style={styles.farmerRight}>
                        <View style={[styles.statusPill, { backgroundColor: fc.bg }]}>
                          <Text style={[styles.statusText, { color: fc.text }]}>{fc.label}</Text>
                        </View>

                        {/* Proof icons */}
                        <View style={styles.proofIcons}>
                          <View style={[styles.proofIcon, { backgroundColor: farmer.hasPhoto ? '#DCFCE7' : (isDark ? '#2D1F45' : '#F1F5F9') }]}>
                            <Camera size={13} color={farmer.hasPhoto ? '#16A34A' : '#9CA3AF'} />
                          </View>
                          <View style={[styles.proofIcon, { backgroundColor: farmer.hasSignature ? '#DBEAFE' : (isDark ? '#2D1F45' : '#F1F5F9') }]}>
                            <PenLine size={13} color={farmer.hasSignature ? '#2563EB' : '#9CA3AF'} />
                          </View>
                        </View>

                        {/* Distribute button */}
                        {!done && (
                          <TouchableOpacity
                            style={[styles.distributeBtn, { backgroundColor: partial ? '#FEF3C7' : '#6D28D9' }]}
                            onPress={() => openConfirm(farmer)}
                          >
                            <Text style={[styles.distributeBtnText, { color: partial ? '#B45309' : '#FFFFFF' }]}>
                              {partial ? 'Update' : 'Distribute'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {done && <CheckCircle2 size={22} color="#16A34A" />}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Mark batch complete */}
              <View style={[styles.batchFooterBar, { backgroundColor: card, borderTopColor: border, paddingBottom: insets.bottom || 16 }]}>
                <TouchableOpacity
                  style={[styles.markCompleteBtn, { opacity: selBatch.status === 'completed' ? 0.5 : 1 }]}
                  disabled={selBatch.status === 'completed'}
                >
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.markCompleteText}>
                    {selBatch.status === 'completed' ? 'Batch Completed' : 'Mark Batch as Complete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>

        {/* ═══════════════════════════════════════════════════
            MODAL 2 – Distribution Confirmation
            ═══════════════════════════════════════════════════ */}
        <Modal visible={selFarmer !== null} animationType="slide" onRequestClose={closeConfirm}>
          {selFarmer && (
            <View style={[styles.modalContainer, { backgroundColor: bg }]}>
              <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />
              <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) }]}>
                <TouchableOpacity onPress={closeConfirm} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>Confirm Distribution</Text>
                  <Text style={styles.headerSub}>{selFarmer.farmerName}</Text>
                </View>
                <TouchableOpacity style={styles.scanBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <QrCode size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.confirmScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                  {/* Farmer info card */}
                  <ConfirmCard title="Farmer" color="#F5F3FF" border={border} card={card}>
                    <View style={styles.confirmFarmerRow}>
                      <View style={[styles.confirmAvatar, { backgroundColor: avatarColor(selFarmer.id) }]}>
                        <Text style={styles.farmerAvatarText}>{initials(selFarmer.farmerName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.confirmFarmerName, { color: textPrimary }]}>{selFarmer.farmerName}</Text>
                        <Text style={styles.confirmFarmerLfid}>{selFarmer.lfid}</Text>
                        <Text style={[styles.confirmFarmerBarangay, { color: textMuted }]}>{selFarmer.barangay}</Text>
                      </View>
                    </View>
                  </ConfirmCard>

                  {/* Allocation details */}
                  <ConfirmCard title="Allocation Details" color="#EFF6FF" border={border} card={card}>
                    <DetailRow label="Program"    value={selBatch?.title ?? ''} textPrimary={textPrimary} textMuted={textMuted} />
                    <DetailRow label="Commodity"  value={selBatch?.commodity ?? ''} textPrimary={textPrimary} textMuted={textMuted} />
                    <DetailRow label="Allocated"  value={`${selFarmer.allocatedQty} ${selFarmer.unit}`} textPrimary={textPrimary} textMuted={textMuted} />
                    <DetailRow label="Barangay"   value={selFarmer.barangay} textPrimary={textPrimary} textMuted={textMuted} last />
                  </ConfirmCard>

                  {/* Actual quantity */}
                  <ConfirmCard title="Actual Quantity Given *" color="#FFFBEB" border={border} card={card}>
                    <View style={styles.qtyRow}>
                      <TextInput
                        style={[styles.qtyInput, { backgroundColor: card, borderColor: actualQty ? '#6D28D9' : border, color: textPrimary }]}
                        placeholder={`e.g. ${selFarmer.allocatedQty}`}
                        placeholderTextColor="#9CA3AF"
                        value={actualQty}
                        onChangeText={setActualQty}
                        keyboardType="numeric"
                      />
                      <View style={[styles.unitBadge, { backgroundColor: isDark ? '#2D1F45' : '#F5F3FF' }]}>
                        <Text style={[styles.unitText, { color: '#6D28D9' }]}>{selFarmer.unit}</Text>
                      </View>
                    </View>
                    {actualQty && parseFloat(actualQty) < parseFloat(selFarmer.allocatedQty) && (
                      <View style={styles.partialWarning}>
                        <AlertCircle size={13} color="#B45309" />
                        <Text style={styles.partialWarningText}>Partial delivery — this will be marked as partially received.</Text>
                      </View>
                    )}
                  </ConfirmCard>

                  {/* Proof / Acknowledgement */}
                  <ConfirmCard title="Proof of Receipt *" color="#F0FDF4" border={border} card={card}>
                    <Text style={[styles.proofHint, { color: textMuted }]}>At least one form of proof is required to confirm distribution.</Text>

                    {/* Photo */}
                    <TouchableOpacity
                      style={[styles.proofOption, { backgroundColor: hasPhoto ? '#DCFCE7' : (isDark ? '#1A2E1A' : '#F0FDF4'), borderColor: hasPhoto ? '#16A34A' : border }]}
                      onPress={() => setHasPhoto((v) => !v)}
                    >
                      <Camera size={20} color={hasPhoto ? '#16A34A' : '#6B7280'} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.proofOptionTitle, { color: textPrimary }]}>Photo Evidence</Text>
                        <Text style={[styles.proofOptionSub, { color: textMuted }]}>Photo of farmer + goods or signed receipt</Text>
                      </View>
                      {hasPhoto
                        ? <CheckCircle2 size={20} color="#16A34A" />
                        : <View style={[styles.proofEmptyCircle, { borderColor: border }]} />}
                    </TouchableOpacity>

                    {/* Signature */}
                    <View style={[styles.proofOption, { backgroundColor: hasSigned ? '#DBEAFE' : (isDark ? '#1A2E1A' : '#F0F9FF'), borderColor: hasSigned ? '#2563EB' : border, flexDirection: 'column', alignItems: 'stretch', gap: 0 }]}>
                      <View style={styles.proofSignHead}>
                        <PenLine size={20} color={hasSigned ? '#2563EB' : '#6B7280'} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.proofOptionTitle, { color: textPrimary }]}>Digital Signature</Text>
                          <Text style={[styles.proofOptionSub, { color: textMuted }]}>Farmer signs with finger on screen</Text>
                        </View>
                        {hasSigned
                          ? <CheckCircle2 size={20} color="#2563EB" />
                          : <View style={[styles.proofEmptyCircle, { borderColor: border }]} />}
                      </View>

                      {/* Signature pad */}
                      <View
                        style={[styles.sigPad, { backgroundColor: isDark ? '#0D1A2E' : '#FFFFFF', borderColor: hasSigned ? '#93C5FD' : border }]}
                        {...sigPanResponder.panHandlers}
                      >
                        {sigPaths.current.flat().filter((_, i) => i % 2 === 0).map((pt, i) => (
                          <View
                            key={`${sigTick}-${i}`}
                            style={{ position: 'absolute', left: pt.x - 2, top: pt.y - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: '#1D4ED8' }}
                          />
                        ))}
                        {!hasSigned && (
                          <Text style={[styles.sigPlaceholder, { color: textMuted }]}>Sign here →</Text>
                        )}
                      </View>

                      {hasSigned && (
                        <TouchableOpacity style={styles.clearSigBtn} onPress={clearSignature}>
                          <RotateCcw size={13} color="#EF4444" />
                          <Text style={styles.clearSigText}>Clear signature</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ConfirmCard>
                </ScrollView>
              </KeyboardAvoidingView>

              {/* Footer */}
              <View style={[styles.confirmFooter, { backgroundColor: card, borderTopColor: border, paddingBottom: insets.bottom || 16 }]}>
                {!canSubmit && (
                  <View style={styles.validationHint}>
                    <AlertCircle size={13} color="#EF4444" />
                    <Text style={styles.validationText}>
                      {!actualQty ? 'Enter actual quantity given.' : 'Add photo or signature proof.'}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={[styles.footerBtnBack, { borderColor: border }]} onPress={closeConfirm}>
                    <Text style={[styles.footerBtnBackText, { color: textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.footerBtnSubmit, { opacity: canSubmit ? 1 : 0.4 }]}
                    disabled={!canSubmit}
                    onPress={closeConfirm}
                  >
                    <Wifi size={16} color="#FFFFFF" />
                    <Text style={styles.footerBtnSubmitText}>Confirm & Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </>
  );
}

/* ─── Sub-components ─── */
function ConfirmCard({ title, color, border, card, children }: {
  title: string; color: string; border: string; card: string; children: React.ReactNode;
}) {
  return (
    <View style={[styles.confirmCard, { backgroundColor: card, borderColor: border }]}>
      <View style={[styles.confirmCardHead, { backgroundColor: color }]}>
        <Text style={styles.confirmCardTitle}>{title}</Text>
      </View>
      <View style={styles.confirmCardBody}>{children}</View>
    </View>
  );
}
function DetailRow({ label, value, textPrimary, textMuted, last }: {
  label: string; value: string; textPrimary: string; textMuted: string; last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={[styles.detailLabel, { color: textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: textPrimary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  /* Header */
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
  scanBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Progress banner */
  progressBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginTop: 12, marginBottom: 4,
    borderRadius: 18, borderWidth: 1,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  progressLabel: { fontSize: 11, fontWeight: '500' },
  progressCount: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  progressTotal: { fontSize: 16, fontWeight: '500' },
  progressCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6D28D9',
    alignItems: 'center', justifyContent: 'center',
  },
  progressPct: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  progressBarWrap: { borderRadius: 2, backgroundColor: '#EDE9FE', overflow: 'hidden' },
  progressBarFill: { height: 4, backgroundColor: '#6D28D9', borderRadius: 2 },

  /* Search */
  searchWrap: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  /* Filter tabs */
  tabsBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 6 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 9, position: 'relative' },
  tabLabel: { fontSize: 13 },
  tabUnderline: { position: 'absolute', bottom: 0, left: 10, right: 10, height: 2.5, borderRadius: 2 },

  scroll: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 32, gap: 12 },

  /* Batch card */
  batchCard: {
    borderRadius: 20, borderWidth: 1, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  batchTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  batchIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  batchTitle: { fontSize: 15, fontWeight: '700' },
  batchMeta: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  unsyncedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  unsyncedText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  batchInfoRow: { marginBottom: 8 },
  batchInfoText: { fontSize: 12 },
  batchProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  batchProgressLabel: { fontSize: 12 },
  batchProgressPct: { fontSize: 12, fontWeight: '700' },
  batchBar: { height: 5, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  batchBarFill: { height: 5, borderRadius: 3 },
  batchFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchFooterText: { fontSize: 12 },

  /* Modal / farmer list */
  modalContainer: { flex: 1 },
  farmerProgressStrip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  farmerProgressLabel: { fontSize: 18, fontWeight: '800' },
  farmerProgressTotal: { fontSize: 14, fontWeight: '500' },
  filterIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  farmerListContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 32, gap: 10 },

  /* Farmer row */
  farmerRow: {
    borderRadius: 20, borderWidth: 1, padding: 12,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  farmerAvatar: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  farmerAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  farmerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  farmerName: { fontSize: 14, fontWeight: '700', flex: 1 },
  farmerLfid: { fontSize: 12, fontWeight: '600' },
  farmerAllocRow: { flexDirection: 'row', alignItems: 'center' },
  farmerAlloc: { fontSize: 12 },
  timestampRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timestampText: { fontSize: 11 },
  farmerRight: { alignItems: 'flex-end', gap: 6 },
  proofIcons: { flexDirection: 'row', gap: 5 },
  proofIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  distributeBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  distributeBtnText: { fontSize: 12, fontWeight: '700' },

  /* Batch complete footer */
  batchFooterBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1,
  },
  markCompleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14,
  },
  markCompleteText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  /* Confirm screen */
  confirmScroll: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 20 },
  confirmCard: { borderRadius: 20, borderWidth: 1, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  confirmCardHead: { paddingHorizontal: 16, paddingVertical: 10 },
  confirmCardTitle: { fontSize: 13, fontWeight: '700', color: '#3B0764' },
  confirmCardBody: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4 },

  confirmFarmerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  confirmAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmFarmerName: { fontSize: 16, fontWeight: '700' },
  confirmFarmerLfid: { fontSize: 12, fontWeight: '600', color: '#6D28D9', marginTop: 2 },
  confirmFarmerBarangay: { fontSize: 12, marginTop: 1 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#EDE9FE' },
  detailLabel: { fontSize: 12, fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  qtyInput: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  unitBadge: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  unitText: { fontSize: 14, fontWeight: '700' },
  partialWarning: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginTop: 8 },
  partialWarningText: { fontSize: 12, color: '#B45309', flex: 1 },

  proofHint: { fontSize: 12, marginBottom: 10, paddingTop: 2 },
  proofOption: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 12, marginBottom: 10 },
  proofOptionTitle: { fontSize: 14, fontWeight: '600' },
  proofOptionSub: { fontSize: 11, marginTop: 1 },
  proofEmptyCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },

  proofSignHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sigPad: { height: 120, borderRadius: 12, borderWidth: 1.5, overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  sigPlaceholder: { fontSize: 14, fontStyle: 'italic' },
  clearSigBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, alignSelf: 'flex-end' },
  clearSigText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },

  /* Footer */
  confirmFooter: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  validationHint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, marginBottom: 10 },
  validationText: { fontSize: 12, color: '#B91C1C', flex: 1 },
  footerBtnBack: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  footerBtnBackText: { fontSize: 15, fontWeight: '600' },
  footerBtnSubmit: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#6D28D9', borderRadius: 14, paddingVertical: 14 },
  footerBtnSubmitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
