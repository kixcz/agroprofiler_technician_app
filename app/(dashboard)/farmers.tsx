import { useSidebar } from '@/lib/SidebarContext';
import {
  getAllFarmers,
  LocalFarmer,
  subscribeDatabaseChanges,
} from '@/lib/db/database';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  Menu,
  MoreVertical,
  QrCode,
  Search,
  UserPlus,
  WifiOff,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
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

/* ─── Palette ─── */
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
const avatarColor = (idx: number) => AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/* ─── Types ─── */
type RegStatus = 'not_registered' | 'submitted' | 'verified';
type FarmerRow = {
  id: string;
  numericIdx: number;
  name: string;
  lfid: string;
  rsbsa: string;
  barangay: string;
  livelihood: string;
  status: RegStatus;
  flags: { fourPs?: boolean; ip?: boolean; pwd?: boolean };
  synced: boolean;
  syncStatus: string;
};

/* ─── Config ─── */
const STATUS_CFG: Record<RegStatus, { label: string; bg: string; text: string; dot: string }> = {
  not_registered: { label: 'Draft', bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  submitted: { label: 'Pending Sync', bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  verified: { label: 'Verified', bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
};

function mapLocalFarmerToRow(f: LocalFarmer, idx: number): FarmerRow {
  const status: RegStatus =
    f.registration_status === 'verified'
      ? 'verified'
      : f.registration_status === 'pending_review'
      ? 'submitted'
      : 'not_registered';

  return {
    id: f.id,
    numericIdx: idx + 1,
    name: `${f.first_name} ${f.middle_name ? f.middle_name[0] + '. ' : ''}${f.last_name}`.trim(),
    lfid: f.lfid,
    rsbsa: f.rsbsa_number,
    barangay: `Brgy. ${f.barangay}`,
    livelihood: `${f.primary_commodity} Farming`,
    status,
    flags: {
      fourPs: f.is_4ps,
      ip: f.is_ip,
      pwd: f.is_pwd,
    },
    synced: f.sync_status === 'synced',
    syncStatus: f.sync_status,
  };
}

export default function FarmersScreen() {
  const router = useRouter();
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

  const [farmersList, setFarmersList] = useState<FarmerRow[]>([]);
  const [query, setQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | RegStatus>('all');
  const [selBarangay, setSelBarangay] = useState('All');
  const [selLivelihood, setSelLivelihood] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [active, setActive] = useState<FarmerRow | null>(null);

  const loadFarmers = React.useCallback(async () => {
    const rows = await getAllFarmers();
    setFarmersList(rows.map(mapLocalFarmerToRow));
  }, []);

  useEffect(() => {
    loadFarmers();
    return subscribeDatabaseChanges(loadFarmers);
  }, [loadFarmers]);

  const BARANGAYS = ['All', ...Array.from(new Set(farmersList.map((f) => f.barangay)))];
  const LIVELIHOODS = ['All', ...Array.from(new Set(farmersList.map((f) => f.livelihood)))];

  /* Filtered list */
  const filtered = farmersList.filter((f) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.lfid.toLowerCase().includes(q) ||
      f.rsbsa.toLowerCase().includes(q);
    const matchTab = statusTab === 'all' || f.status === statusTab;
    const matchBrgy = selBarangay === 'All' || f.barangay === selBarangay;
    const matchLiv = selLivelihood === 'All' || f.livelihood === selLivelihood;
    return matchQ && matchTab && matchBrgy && matchLiv;
  });

  /* Stats */
  const totalVerified = farmersList.filter((f) => f.status === 'verified').length;
  const totalSubmitted = farmersList.filter((f) => f.status === 'submitted').length;
  const totalUnsynced = farmersList.filter((f) => !f.synced).length;

  const navigateTo = (route: string, params?: Record<string, string>) => {
    setActive(null);
    setTimeout(() => {
      if (params) router.push({ pathname: route as any, params });
      else router.push(route as any);
    }, 180);
  };

  const activeFilters =
    (selBarangay !== 'All' ? 1 : 0) + (selLivelihood !== 'All' ? 1 : 0);

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
            onPress={openSidebar}
            style={styles.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Registered Farmers</Text>
            <Text style={styles.headerSub}>
              {farmersList.length} farmers cached in SQLite
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/(dashboard)/register-farmer' as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <UserPlus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Stats strip ── */}
        <View style={[styles.statsStrip, { backgroundColor: card, borderBottomColor: border }]}>
          <StatPill label="Total" value={farmersList.length} color="#16A34A" />
          <View style={[styles.statDivider, { backgroundColor: border }]} />
          <StatPill label="Verified" value={totalVerified} color="#15803D" />
          <View style={[styles.statDivider, { backgroundColor: border }]} />
          <StatPill label="Submitted" value={totalSubmitted} color="#B45309" />
          <View style={[styles.statDivider, { backgroundColor: border }]} />
          <StatPill label="Pending Sync" value={totalUnsynced} color="#EF4444" />
        </View>

        {/* ── Search + Filter button ── */}
        <View style={[styles.searchRow, { backgroundColor: card, borderBottomColor: border }]}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#1A2E1A' : '#F0FDF4',
                borderColor: border,
                flex: 1,
              },
            ]}
          >
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search by name, LFID, or RSBSA…"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <X size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor:
                  activeFilters > 0 ? '#16A34A' : isDark ? '#1A2E1A' : '#F0FDF4',
                borderColor: activeFilters > 0 ? '#16A34A' : border,
              },
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Filter size={16} color={activeFilters > 0 ? '#FFFFFF' : '#6B7280'} />
            {activeFilters > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Status tab bar ── */}
        <View
          style={[
            styles.tabsBar,
            { backgroundColor: isDark ? '#0F2A1A' : '#F0FDF4', borderBottomColor: border },
          ]}
        >
          {(['all', 'verified', 'submitted', 'not_registered'] as const).map((t) => {
            const isTabActive = statusTab === t;
            const label =
              t === 'all'
                ? 'All'
                : t === 'not_registered'
                ? 'Draft'
                : t === 'submitted'
                ? 'Pending Sync'
                : 'Verified';
            return (
              <TouchableOpacity
                key={t}
                style={styles.tabItem}
                onPress={() => setStatusTab(t)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isTabActive ? '#16A34A' : textMuted,
                      fontWeight: isTabActive ? '700' : '500',
                    },
                  ]}
                >
                  {label}
                </Text>
                {isTabActive && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Results count ── */}
        <View style={[styles.countRow, { borderBottomColor: border }]}>
          <Text style={[styles.countText, { color: textMuted }]}>
            {filtered.length} farmer{filtered.length !== 1 ? 's' : ''}
          </Text>
          {(activeFilters > 0 || statusTab !== 'all') && (
            <TouchableOpacity
              onPress={() => {
                setSelBarangay('All');
                setSelLivelihood('All');
                setStatusTab('all');
              }}
              style={styles.clearFiltersBtn}
            >
              <X size={12} color="#EF4444" />
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Farmer list ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: textMuted }]}>
                No farmers match your search or filters.
              </Text>
            </View>
          ) : (
            filtered.map((farmer) => {
              const sc = STATUS_CFG[farmer.status];
              return (
                <TouchableOpacity
                  key={farmer.id}
                  style={[styles.row, { backgroundColor: card, borderColor: border }]}
                  onPress={() =>
                    router.push({
                      pathname: '/(dashboard)/farmer-profile' as any,
                      params: { id: farmer.id, lfid: farmer.lfid },
                    })
                  }
                  activeOpacity={0.78}
                >
                  {/* Avatar */}
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: avatarColor(farmer.numericIdx) },
                    ]}
                  >
                    <Text style={styles.avatarText}>{getInitials(farmer.name)}</Text>
                  </View>

                  {/* Main info */}
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[styles.farmerName, { color: textPrimary }]}
                        numberOfLines={1}
                      >
                        {farmer.name}
                      </Text>
                      {!farmer.synced && <WifiOff size={12} color="#F59E0B" />}
                    </View>
                    <Text style={styles.farmerLfid}>
                      {farmer.lfid} • RSBSA: {farmer.rsbsa}
                    </Text>
                    <Text
                      style={[styles.farmerMeta, { color: textMuted }]}
                      numberOfLines={1}
                    >
                      {farmer.barangay} · {farmer.livelihood}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                        <Text style={[styles.statusText, { color: sc.text }]}>
                          {sc.label}
                        </Text>
                      </View>
                      {farmer.flags.fourPs && (
                        <FlagBadge label="4Ps" color="#7C3AED" bg="#EDE9FE" />
                      )}
                      {farmer.flags.ip && (
                        <FlagBadge label="IP" color="#0891B2" bg="#CFFAFE" />
                      )}
                      {farmer.flags.pwd && (
                        <FlagBadge label="PWD" color="#B45309" bg="#FEF3C7" />
                      )}
                    </View>
                  </View>

                  {/* Right actions */}
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      style={[
                        styles.rowActionBtn,
                        { backgroundColor: isDark ? '#1A2E1A' : '#F0FDF4' },
                      ]}
                      onPress={() =>
                        navigateTo('/(dashboard)/scan', { lfid: farmer.lfid })
                      }
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <QrCode size={14} color="#16A34A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.rowActionBtn,
                        { backgroundColor: isDark ? '#1A2E1A' : '#F0FDF4' },
                      ]}
                      onPress={() => setActive(farmer)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MoreVertical size={14} color={textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* FILTER MODAL */}
        <Modal
          visible={showFilters}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilters(false)}
        >
          <TouchableOpacity
            style={styles.filterOverlay}
            activeOpacity={1}
            onPress={() => setShowFilters(false)}
          >
            <View
              style={[styles.filterSheet, { backgroundColor: card, borderColor: border }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={[styles.filterSheetHead, { borderBottomColor: border }]}>
                <Text style={[styles.filterSheetTitle, { color: textPrimary }]}>
                  Filter Farmers
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={20} color={textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: textPrimary }]}>
                    Barangay
                  </Text>
                  <View style={styles.filterChipGrid}>
                    {BARANGAYS.map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor:
                              selBarangay === b
                                ? '#16A34A'
                                : isDark
                                ? '#1A2E1A'
                                : '#F0FDF4',
                            borderColor: selBarangay === b ? '#16A34A' : border,
                          },
                        ]}
                        onPress={() => setSelBarangay(b)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: selBarangay === b ? '#FFFFFF' : textMuted },
                          ]}
                        >
                          {b}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: textPrimary }]}>
                    Main Livelihood
                  </Text>
                  <View style={styles.filterChipGrid}>
                    {LIVELIHOODS.map((l) => (
                      <TouchableOpacity
                        key={l}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor:
                              selLivelihood === l
                                ? '#16A34A'
                                : isDark
                                ? '#1A2E1A'
                                : '#F0FDF4',
                            borderColor: selLivelihood === l ? '#16A34A' : border,
                          },
                        ]}
                        onPress={() => setSelLivelihood(l)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: selLivelihood === l ? '#FFFFFF' : textMuted },
                          ]}
                        >
                          {l}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.filterFooter, { borderTopColor: border }]}>
                  <TouchableOpacity
                    style={[styles.filterClearBtn, { borderColor: border }]}
                    onPress={() => {
                      setSelBarangay('All');
                      setSelLivelihood('All');
                    }}
                  >
                    <Text style={[styles.filterClearText, { color: textPrimary }]}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterApplyBtn}
                    onPress={() => setShowFilters(false)}
                  >
                    <Text style={styles.filterApplyText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ACTION SHEET MODAL */}
        <Modal
          visible={active !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActive(null)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setActive(null)}
          >
            <View
              style={[styles.sheet, { backgroundColor: card, borderColor: border }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={[styles.sheetHead, { borderBottomColor: border }]}>
                {active && (
                  <View
                    style={[
                      styles.sheetAvatar,
                      { backgroundColor: avatarColor(active.numericIdx) },
                    ]}
                  >
                    <Text style={styles.avatarText}>{getInitials(active.name)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetName, { color: textPrimary }]}>
                    {active?.name}
                  </Text>
                  <View style={styles.sheetSubRow}>
                    <Text style={styles.sheetLfid}>{active?.lfid}</Text>
                    {active && !active.synced && (
                      <View style={styles.unsyncedBadge}>
                        <WifiOff size={10} color="#EF4444" />
                        <Text style={styles.unsyncedText}>Pending Sync</Text>
                      </View>
                    )}
                  </View>
                </View>
                {active && (
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: STATUS_CFG[active.status].bg },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_CFG[active.status].dot },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_CFG[active.status].text },
                      ]}
                    >
                      {STATUS_CFG[active.status].label}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() =>
                  navigateTo(
                    '/(dashboard)/farmer-profile',
                    active ? { id: active.id, lfid: active.lfid } : undefined
                  )
                }
              >
                <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Eye size={19} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionLabel, { color: textPrimary }]}>
                    View Profile
                  </Text>
                  <Text style={[styles.actionDesc, { color: textMuted }]}>
                    Open farms, parcels & allocations
                  </Text>
                </View>
                <ChevronRight size={16} color={textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() =>
                  navigateTo(
                    '/(dashboard)/add-farm',
                    active
                      ? {
                          farmerId: active.id,
                          farmerName: active.name,
                          farmerLfid: active.lfid,
                        }
                      : undefined
                  )
                }
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FFFBEB' }]}>
                  <Edit3 size={19} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionLabel, { color: textPrimary }]}>
                    Add Farm & Parcel
                  </Text>
                  <Text style={[styles.actionDesc, { color: textMuted }]}>
                    Register geotagged farm parcel offline
                  </Text>
                </View>
                <ChevronRight size={16} color={textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() =>
                  navigateTo(
                    '/(dashboard)/distribute',
                    active ? { lfid: active.lfid } : undefined
                  )
                }
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <QrCode size={19} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionLabel, { color: textPrimary }]}>
                    Distribute Assistance (QR)
                  </Text>
                  <Text style={[styles.actionDesc, { color: textMuted }]}>
                    Verify beneficiary & release allocation
                  </Text>
                </View>
                <ChevronRight size={16} color={textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, { borderTopColor: border }]}
                onPress={() => setActive(null)}
              >
                <Text style={[styles.cancelText, { color: textMuted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </>
  );
}

/* ─── Sub-components ─── */
function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function FlagBadge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.flagBadge, { backgroundColor: bg }]}>
      <Text style={[styles.flagText, { color }]}>{label}</Text>
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
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statPill: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  statDivider: { width: 1, height: 28 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
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
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },

  tabsBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 4 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 9, position: 'relative' },
  tabLabel: { fontSize: 12 },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#16A34A',
  },

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  countText: { fontSize: 12, fontWeight: '500' },
  clearFiltersBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearFiltersText: { fontSize: 11, fontWeight: '600', color: '#EF4444' },

  listContent: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 32, gap: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  farmerName: { fontSize: 14, fontWeight: '700', flex: 1 },
  farmerLfid: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
  farmerMeta: { fontSize: 11 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  flagBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  flagText: { fontSize: 10, fontWeight: '700' },
  rowActions: { gap: 6 },
  rowActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14 },

  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    maxHeight: '75%',
  },
  filterSheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterSheetTitle: { fontSize: 17, fontWeight: '800' },
  filterSection: { paddingHorizontal: 20, paddingTop: 16 },
  filterSectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  filterChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  filterFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
  },
  filterClearBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  filterClearText: { fontSize: 14, fontWeight: '600' },
  filterApplyBtn: {
    flex: 2,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  filterApplyText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingBottom: 20,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetName: { fontSize: 15, fontWeight: '700' },
  sheetSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  sheetLfid: { fontSize: 12, fontWeight: '600', color: '#16A34A' },
  unsyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  unsyncedText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  actionDesc: { fontSize: 12, marginTop: 1 },
  cancelBtn: {
    marginTop: 4,
    marginHorizontal: 20,
    paddingTop: 13,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
